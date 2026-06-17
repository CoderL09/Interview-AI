import emailjs from '@emailjs/nodejs';

export const sendVerificationCode = async (to: string, code: string): Promise<boolean> => {
  try {
    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      { 
        to_email: to,
        code: code
      },
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY!,
        privateKey: process.env.EMAILJS_PRIVATE_KEY!,
      }
    );
    console.log("邮件已发送成功:", result.status);
    return true;
  } catch (error) {
    console.error("邮件发送失败:", error);
    return false;
  }
};