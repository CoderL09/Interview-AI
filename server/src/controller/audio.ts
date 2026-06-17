
import { Response } from 'express';
import { AuthRequest } from '../middleware/validators';
import { speechToText } from '../service/audio';

export const sttController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 这里我们复用之前传 PDF 时使用的 multer 中间件
    if (!req.file) {
      res.status(400).json({ success: false, message: '未接收到音频文件' });
      return;
    }

    const filePath = req.file.path;
    
    // 把音频丢进刚才写的引擎，等待文字输出
    const text = await speechToText(filePath);

    res.status(200).json({
      success: true,
      message: '语音识别成功',
      data: { text }
    });

  } catch (error: any) {
    console.error('STT识别失败:', error);
    res.status(500).json({ success: false, message: '语音识别失败，请检查服务' });
  }
};

// src/controllers/audio.ts (追加代码)
import { textToSpeech } from '../service/audio';

export const ttsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;
    
    if (!text) {
      res.status(400).json({ success: false, message: '缺少文本参数' });
      return;
    }

    // 调用引擎，把文字变成 MP3 Buffer
    const audioBuffer = await textToSpeech(text);

    // 🌟 核心：直接把音频流作为响应体发给前端
    res.setHeader('Content-Type', 'audio/mpeg'); // 告诉浏览器这是 MP3
    res.setHeader('Content-Length', audioBuffer.length);
    res.status(200).send(audioBuffer);

  } catch (error: any) {
    console.error('TTS合成失败:', error);
    res.status(500).json({ success: false, message: '语音合成失败' });
  }
};