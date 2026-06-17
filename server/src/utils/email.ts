import nodemailer from 'nodemailer'
import 'dotenv/config'

const transporter = nodemailer.createTransport({
  service:'QQ',
  auth: {
    user: process.env.SEND_EMAIL,
    pass: process.env.SEND_PASS,
  },
})

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
