// src/utils/xfyun.ts
import * as crypto from 'crypto';


export function getXfAuthUrl(host: string, path: string, apiKey: string, apiSecret: string): string {
  // 1. 获取当前 UTC 时间的标准格式 (RFC1123)
  const date = new Date().toUTCString();

  // 2. 拼接参与签名的原始字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

  // 3. 使用 hmac-sha256 算法和 API_SECRET 对原始字符串进行加密
  const signatureSha = crypto
    .createHmac('sha256', apiSecret)
    .update(signatureOrigin)
    .digest('base64');

  // 4. 组装 authorization 参数
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
  
  // 5. 对 authorization 进行 base64 编码
  const authorization = Buffer.from(authorizationOrigin).toString('base64');

  // 6. 最终拼装成完整的 URL
  const url = `wss://${host}${path}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
  
  return url;
}