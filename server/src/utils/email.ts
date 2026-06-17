// @ts-ignore
import emailjs from '@emailjs/nodejs';
// email.ts
export const sendVerificationCode = async (to: string, code: string): Promise<boolean> => {
  try {
    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      { 
        to_email: to, // 对应模板里逻辑所需的地址
        code: code    // 对应模板里的 {{code}}
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY!,
        privateKey: process.env.EMAILJS_PRIVATE_KEY!,
      }
    );
    return true;
  } catch (error: any) {
    console.error("邮件发送失败:", error.message);
    return false;
  }
};