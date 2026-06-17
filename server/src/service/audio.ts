// src/service/audio.ts
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
  try {
    await convertToPCM(audioFilePath, pcmPath);
    const audioBuffer = fs.readFileSync(pcmPath);

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
              status: isFirst ? 0 : (isLast ? 2 : 1),
              format: "audio/L16;rate=16000",
              encoding: "raw",
              audio: chunk.toString('base64')
            }
          };

          if (isFirst) {
            payload.common = { app_id: process.env.XUNFEI_APP_ID };
            payload.business = { domain: "iat", language: "zh_cn", accent: "mandarin", vad_eos: 5000 };
          }

          ws.send(JSON.stringify(payload));
          offset += chunkSize;
        }, 40);
      });

      ws.on('message', (data: WebSocket.Data) => {
        const res = JSON.parse(data.toString());
        if (res.code !== 0) {
          ws.close();
          return reject(new Error(`讯飞STT报错: ${res.message}`));
        }

        if (res.data && res.data.result && res.data.result.ws) {
          res.data.result.ws.forEach((w: any) => {
            w.cw.forEach((cw: any) => { fullText += cw.w; });
          });
        }

        if (res.data && res.data.status === 2) {
          ws.close();
          resolve(fullText);
        }
      });

      ws.on('error', (err) => reject(err));
    });
  } finally {
    try { if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath); } catch {}
    try { if (fs.existsSync(pcmPath)) fs.unlinkSync(pcmPath); } catch {}
  }
}




// src/services/audioService.ts (追加代码)

/**
 * 文字转语音 (TTS) 核心逻辑
 * 接收纯文本，返回完整的 MP3 格式音频 Buffer
 */
const TTS_MAX_LENGTH = 800

export async function textToSpeech(text: string): Promise<Buffer> {
  const safeText = text.length > TTS_MAX_LENGTH ? text.slice(0, TTS_MAX_LENGTH) : text

  return new Promise((resolve, reject) => {
    const url = getXfAuthUrl(
      'tts-api.xfyun.cn', 
      '/v2/tts', 
      process.env.XUNFEI_API_KEY!, 
      process.env.XUNFEI_API_SECRET!
    );

    const ws = new WebSocket(url);
    let audioChunks: Buffer[] = [];

    ws.on('open', () => {
      const payload = {
        common: { app_id: process.env.XUNFEI_APP_ID },
        business: {
          aue: "lame",
          sfl: 1,
          vcn: "xiaoyan",
          speed: 50,
          volume: 50,
          pitch: 50,
          bgs: 0,
          tte: "UTF8"
        },
        data: {
          status: 2,
          text: Buffer.from(safeText).toString('base64')
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