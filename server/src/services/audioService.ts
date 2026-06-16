// src/services/audioService.ts
import WebSocket from 'ws';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { getXfAuthUrl } from '../utils/xfyun'; 

// 自动设置 FFmpeg 的底层路径，完美跨平台
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * 将任意音频文件转换为讯飞所需的 16kHz PCM 格式
 */
function convertToPCM(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-acodec pcm_s16le', // 编码格式：16-bit
        '-ar 16000',         // 采样率：16kHz
        '-ac 1'              // 单声道
      ])
      .format('s16le') // 输出原生 PCM 无头文件
      .save(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err));
  });
}

/**
 * 语音转文字 (STT) 核心逻辑
 */
export async function speechToText(audioFilePath: string): Promise<string> {
  const pcmPath = audioFilePath + '.pcm';
  
  // 1. 先把浏览器传来的音频转成 PCM
  await convertToPCM(audioFilePath, pcmPath);
  const audioBuffer = fs.readFileSync(pcmPath);

  // 2. 连接科大讯飞的 WebSocket
  return new Promise((resolve, reject) => {
    const url = getXfAuthUrl(
      'iat-api.xfyun.cn', 
      '/v2/iat', 
      process.env.XUNFEI_API_KEY!, 
      process.env.XUNFEI_API_SECRET!
    );
    
    const ws = new WebSocket(url);
    let fullText = '';

    ws.on('open', () => {
      // 🌟 核心：模拟真实人说话的语速，每 40ms 发送 1280 字节的数据流
      const chunkSize = 1280;
      let offset = 0;

      const interval = setInterval(() => {
        if (offset >= audioBuffer.length) {
          clearInterval(interval);
          return;
        }

        const isFirst = offset === 0;
        const isLast = offset + chunkSize >= audioBuffer.length;
        const chunk = audioBuffer.subarray(offset, offset + chunkSize);

        const payload: any = {
          data: {
            status: isFirst ? 0 : (isLast ? 2 : 1), // 0:第一帧, 1:中间帧, 2:最后一帧
            format: "audio/L16;rate=16000",
            encoding: "raw",
            audio: chunk.toString('base64')
          }
        };

        // 只有第一帧需要带上应用身份信息
        if (isFirst) {
          payload.common = { app_id: process.env.XUNFEI_APP_ID };
          payload.business = { domain: "iat", language: "zh_cn", accent: "mandarin", vad_eos: 5000 };
        }

        ws.send(JSON.stringify(payload));
        offset += chunkSize;
      }, 40); // 40毫秒发一次
    });

    ws.on('message', (data: WebSocket.Data) => {
      const res = JSON.parse(data.toString());
      if (res.code !== 0) {
        ws.close();
        return reject(new Error(`讯飞STT报错: ${res.message}`));
      }
      
      // 提取解析出的文字碎片并拼装
      if (res.data && res.data.result && res.data.result.ws) {
        res.data.result.ws.forEach((w: any) => {
          w.cw.forEach((cw: any) => { fullText += cw.w; });
        });
      }
      
      // 讯飞说它翻译完了，关闭连接，返回完整文字，并清理硬盘上的临时音频
      if (res.data && res.data.status === 2) {
        ws.close();
        fs.unlinkSync(audioFilePath); // 删除原始文件
        fs.unlinkSync(pcmPath);       // 删除 PCM 转换文件
        resolve(fullText);
      }
    });

    ws.on('error', (err) => reject(err));
  });
}




// src/services/audioService.ts (追加代码)

/**
 * 文字转语音 (TTS) 核心逻辑
 * 接收纯文本，返回完整的 MP3 格式音频 Buffer
 */
export async function textToSpeech(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // 获取 TTS 接口的鉴权 URL
    const url = getXfAuthUrl(
      'tts-api.xfyun.cn', 
      '/v2/tts', 
      process.env.XUNFEI_API_KEY!, 
      process.env.XUNFEI_API_SECRET!
    );

    const ws = new WebSocket(url);
    let audioChunks: Buffer[] = []; // 用来收集音频碎片

    ws.on('open', () => {
      const payload = {
        common: { app_id: process.env.XUNFEI_APP_ID },
        business: {
          aue: "lame", // 🌟 核心：指定返回 MP3 格式，方便浏览器直接播放
          sfl: 1,      // 开启 lame 格式必须传 1
          vcn: "xiaoyan", // 发音人：xiaoyan(标准女声)。如果你开通了超拟人，可以换成专属的拟人音色代号
          speed: 50,   // 语速 0-100
          volume: 50,  // 音量 0-100
          pitch: 50,   // 语调 0-100
          bgs: 0,      // 是否有背景音
          tte: "UTF8"
        },
        data: {
          status: 2, // 文本是一次性发送完毕的，传 2
          text: Buffer.from(text).toString('base64') // 文本必须 base64 编码
        }
      };
      ws.send(JSON.stringify(payload));
    });

    ws.on('message', (data: WebSocket.Data) => {
      const res = JSON.parse(data.toString());
      
      if (res.code !== 0) {
        ws.close();
        return reject(new Error(`讯飞TTS报错: ${res.message}`));
      }

      // 如果有音频数据，把它从 base64 转回 Buffer 存起来
      if (res.data && res.data.audio) {
        const chunk = Buffer.from(res.data.audio, 'base64');
        audioChunks.push(chunk);
      }

      // status 为 2 说明音频已经全部合成完毕
      if (res.data && res.data.status === 2) {
        ws.close();
        // 把所有的音频碎片拼成一个完整的 MP3 文件并返回
        resolve(Buffer.concat(audioChunks));
      }
    });

    ws.on('error', (err) => reject(err));
  });
}