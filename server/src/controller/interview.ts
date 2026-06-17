import type{ Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid' 
import fs from 'fs'
import { extractTextFromPDF } from '../utils/pdf'
import { StartInterviewSessionStream,continueInterviewSession,generateInterviewReport   } from '../service/interview'
import pool from '../utils/database'
import type { AuthRequest } from '../middleware/validators'


export const getSessionController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const [rows]: any = await pool.execute(
      `SELECT id, roleName, interviewStyle, status, chatHistory, score, report FROM interview_sessions WHERE id = ? AND userId = ?`,
      [id, userId]
    );

    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: '会话不存在' });
      return;
    }

    const session = rows[0];
    const chatHistory = typeof session.chatHistory === 'string'
      ? JSON.parse(session.chatHistory)
      : session.chatHistory;

    res.json({
      success: true,
      data: {
        id: session.id,
        roleName: session.roleName,
        interviewStyle: session.interviewStyle,
        status: session.status,
        chatHistory,
        score: session.score,
        report: session.report ? (typeof session.report === 'string' ? JSON.parse(session.report) : session.report) : null,
      }
    });
  } catch (err) {
    console.error('获取会话失败:', err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const startInterviewController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: '请上传 PDF 简历文件' });
      return;
    }

    let { interviewStyle, roleName } = req.body;
    const { interviewerId } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: '未授权，请先登录' });
      return;
    }

    // 确保是字符串
    if (Array.isArray(interviewStyle)) interviewStyle = interviewStyle[0];
    if (Array.isArray(roleName)) roleName = roleName[0];

    if (!interviewStyle || !roleName) {
      res.status(400).json({ success: false, message: '缺少岗位或风格参数' });
      return;
    }

    const filePath = req.file.path;
    let resumeText = '';
    try {
      resumeText = await extractTextFromPDF(filePath);
    } finally {
      try { fs.unlinkSync(filePath); } catch {}
    }

    let finalSystemPrompt = '';
    let finalRoleName = roleName;
    let finalInterviewStyle = interviewStyle;

    if (interviewerId) {
      const sql = `SELECT name, promptTemplate FROM custom_interviewers WHERE id = ?`;
      const [rows]: any = await pool.execute(sql, [interviewerId]);

      if (!rows || rows.length === 0) {
        res.status(404).json({ success: false, message: '未找到该自定义面试官' });
        return;
      }

      const interviewer = rows[0];
      finalRoleName = interviewer.name;

      finalSystemPrompt = `
        ${interviewer.promptTemplate}
        
        以下是候选人的简历/自我介绍信息：
        """
        ${resumeText}
        """
        你的任务：
        1. 根据你的设定和候选人的简历，提出**第一个**最相关的面试问题。
        2. 第一句话简短打个招呼，然后抛出问题。每次只问一个问题。
        3. 返回格式必须是纯文本。
      `;

      await pool.execute(`UPDATE custom_interviewers SET usageCount = usageCount + 1 WHERE id = ?`, [interviewerId]);
    } else {
      finalSystemPrompt = `
        你现在是一位专业的面试官，正在面试候选人。
        面试岗位：${roleName}
        你的面试风格是：${interviewStyle}。请务必在整个交流中保持这种风格的语气。
        
        以下是候选人的简历/自我介绍信息：
        """
        ${resumeText}
        """
        
        你的任务：
        1. 根据候选人的简历和应聘岗位，提出**第一个**最相关的面试问题。
        2. 第一句话可以简短地打个招呼，然后直接抛出问题。每次只问一个问题。
        3. 返回格式必须是纯文本，直接就是你作为面试官要说的话。
      `;
    }

    const sessionId = uuidv4();

    const initialChatHistory = [
      { role: 'system', content: finalSystemPrompt }
    ];

    const insertSql = `
      INSERT INTO interview_sessions (id, userId, roleName, interviewStyle, status, chatHistory) 
      VALUES (?, ?, ?, ?, 'ongoing', ?)
    `;
    await pool.execute(insertSql, [sessionId, userId, finalRoleName, finalInterviewStyle, JSON.stringify(initialChatHistory)]);

    // SSE 流式推送
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ sessionId })}\n\n`);

    const stream = await StartInterviewSessionStream(finalSystemPrompt);
    let firstQuestion = '';

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const text = delta?.content || "";
      if (text) {
        firstQuestion += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

    initialChatHistory.push({ role: 'assistant', content: firstQuestion });
    await pool.execute(
      `UPDATE interview_sessions SET chatHistory = ? WHERE id = ?`,
      [JSON.stringify(initialChatHistory), sessionId]
    );

  } catch (error: any) {
    console.error('启动面试失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message || '服务器内部错误' });
    } else {
      try { res.write(`data: ${JSON.stringify({ error: error.message || '服务器错误' })}\n\n`); } catch {}
      res.end();
    }
  }
};



export const handleUserAnswerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId, userAnswer } = req.body;
    
    if (!sessionId || !userAnswer) {
      res.status(400).json({ success: false, message: '缺少必要参数(sessionId 或 userAnswer)' });
      return;
    }

    // 1. 从数据库中查询当前的面试会话信息
    const selectSql = `SELECT chatHistory, status FROM interview_sessions WHERE id = ?`;
    const [rows]: any = await pool.execute(selectSql, [sessionId]); 
    
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: '未找到对应的面试会话记录' });
      return;
    }

    const sessionRecord = rows[0];

    // 2. 检查面试是否已经结束
    if (sessionRecord.status === 'completed') {
      res.status(400).json({ success: false, message: '该面试已结束，无法继续回答' });
      return;
    }

    // 3. 解析数据库中的聊天历史
    let currentHistory = typeof sessionRecord.chatHistory === 'string' 
      ? JSON.parse(sessionRecord.chatHistory) 
      : sessionRecord.chatHistory;

    // 4. 将用户刚刚输入的回答追加到历史记录中
    currentHistory.push({ role: 'user', content: userAnswer });

    // ================== 核心修改区：开始流式推送 ==================

    // 5. 设置 SSE 必备的响应头，告诉前端“我要开始推流了”
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 6. 调用返回流的 Service
    const stream = await continueInterviewSession(currentHistory);
    let fullAiAnswer = ''; // 用于默默攒起完整的回答存数据库

    // 7. 循环读取大模型吐出来的每一个碎片 (chunk)
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      const text = delta?.content || "";
      const thinking = (delta as any)?.reasoning_content || "";

      if (thinking) {
        res.write(`data: ${JSON.stringify({ thinking })}\n\n`);
      }
      if (text) {
        fullAiAnswer += text; 
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // 8. 大模型全说完了，发送结束信号并断开连接
    res.write('data: [DONE]\n\n');
    res.end(); 

    // ================== 流推送结束，保存数据 ==================

    // 9. 默默将 AI 完整的回答追加到历史记录中，并保存回 MySQL
    currentHistory.push({ role: 'assistant', content: fullAiAnswer });
    const updateSql = `UPDATE interview_sessions SET chatHistory = ? WHERE id = ?`;
    await pool.execute(updateSql, [JSON.stringify(currentHistory), sessionId]);

  } catch (error: any) {
    console.error('处理用户回答失败:', error);
    
    // 错误处理也需要分情况：如果还没开始推流，正常返回 500 JSON；如果已经在推流中报错了，只能结束流
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message || '服务器内部错误' });
    } else {
      res.end(); 
    }
  }
};


export const endInterviewController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sessionId } = req.body
    if (!sessionId) {
      res.status(400).json({ success: false, message: '缺少必要参数(sessionId)' })
      return
    }    // 1. 查询当前面试的完整历史
    const selectSql = `SELECT chatHistory, status FROM interview_sessions WHERE id = ?`
    const [rows]: any = await pool.execute(selectSql, [sessionId])
    
    if (!rows || rows.length === 0) {
      res.status(404).json({ success: false, message: '未找到对应的面试记录' })
      return
    }

    const sessionRecord = rows[0]
    if (sessionRecord.status === 'completed') {
      res.status(400).json({ success: false, message: '面试已经结束，请勿重复生成报告' })
      return
    }
        const currentHistory = typeof sessionRecord.chatHistory === 'string' 
      ? JSON.parse(sessionRecord.chatHistory) 
      : sessionRecord.chatHistory

    // 2. 调用 AI 生成结构化报告
    const reportData = await generateInterviewReport(currentHistory)
        // 3. 将状态改为 completed，并把评分和报告 JSON 存入数据库
    const updateSql = `UPDATE interview_sessions SET status = 'completed', score = ?, report = ? WHERE id = ?`
    await pool.execute(updateSql, [reportData.score, JSON.stringify(reportData), sessionId])
        // 4. 返回报告给前端
    res.status(200).json({
      success: true,
      message: '面试已结束，报告已生成',
      data: reportData
    })
      } catch (error: any) {
    console.error('结束面试失败:', error)
    res.status(500).json({ success: false, message: error.message || '服务器内部错误' })
  }
}