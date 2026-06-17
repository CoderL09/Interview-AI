import nodemailer from 'nodemailer'
import 'dotenv/config'


const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, // 读取环境变量
    pass: process.env.EMAIL_PASS  // 读取环境变量
  }
});

export const sendVerificationCode = async (to: string, code: string): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"qqnd" <${process.env.SEND_EMAIL}>`,
      to,
      subject: '验证码',
      html: `<p>您的验证码是：<strong>${code}</strong>，有效期5分钟。</p>`,
    })
    return true
  } catch (error) {
    console.error('发送邮件失败:', error)
    return false
  }
}
