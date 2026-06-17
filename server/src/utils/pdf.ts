import fs from 'fs';
import { PDFParse } from 'pdf-parse';

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  } catch (error) {
    console.error("解析 PDF 简历失败:", error);
    throw new Error("无法读取简历内容，请确保上传的是有效的 PDF 文件。");
  }
}
