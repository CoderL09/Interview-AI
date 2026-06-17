import {openai} from '../utils/openai'


export async function StartInterviewSession(systemPrompt: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V4-Pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请开始面试，向我提出第一个问题。' }
      ],
      temperature: 0.5
    })

    const msg = response.choices[0]?.message
    const aiFirstQuestion = (msg?.content || (msg as any)?.reasoning_content) ?? ''

    return {
      systemPrompt,
      firstQuestion: aiFirstQuestion
    }
  } catch (err) {
    console.error(err)
    throw new Error("生成第一道面试题失败")
  }
}

export async function StartInterviewSessionStream(systemPrompt: string) {
  try {
    const stream = await openai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V4-Pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: '请开始面试，向我提出第一个问题。' }
      ],
      temperature: 0.5,
      stream: true
    })
    return stream
  } catch (err) {
    console.error(err)
    throw new Error("生成第一道面试题失败")
  }
}

export async function continueInterviewSession(chatHistory: any[]) {
  try {
    const stream = await openai.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V4-Pro", 
      messages: chatHistory,   
      temperature: 0.7,
      stream:true
    })
    return stream

  } catch (error) {
    console.error("OpenAI 续写对话失败:", error)
    throw new Error('续写对话失败')
  }
}

export async function generateInterviewReport(chatHistory: any[]) {
  const conversation = chatHistory.filter(msg => msg.role !== 'system')
  const reportPrompt = `
    你现在是一位资深的技术面试官。刚才你和一位候选人完成了一场面试。
    以下是你们的完整对话记录（assistant代表你，user代表候选人）：
    """
    ${JSON.stringify(conversation)}
    """
    
    请根据上述对话，对候选人的表现进行全面评估，并严格按照以下 JSON 格式返回结果（不要输出任何多余的文本，必须是合法的 JSON 字符串）：
    {
      "score": 85,
      "evaluation": "对候选人整体表现的简短总结...",
      "weaknesses": ["薄弱点1", "薄弱点2"],
      "suggestions": ["建议1", "建议2"],
      "resources": ["推荐书籍/课程1", "推荐资料2"]
    }
  `
  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V4-Pro", 
      messages: [{ role: "user", content: reportPrompt }],
      temperature: 0.5, 
    })

    let resultText = response.choices[0]?.message.content || "{}"

    resultText = resultText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()

    let reportData: any
    try {
      reportData = JSON.parse(resultText)
    } catch {
      const match = resultText.match(/\{[\s\S]*\}/)
      reportData = match ? JSON.parse(match[0]) : { score: 0, evaluation: '报告生成异常', weaknesses: [], suggestions: [], resources: [] }
    }
    return reportData
  } catch (error) {
    console.error("生成面试报告失败:", error)
    throw new Error("生成报告失败，请稍后再试。")
  }
}

