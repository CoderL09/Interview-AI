
import type{ Request,Response,NextFunction } from "express"
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import type { AuthRequest } from '../utils/request'
export type { AuthRequest }


export const isValidEmail = (email: any): boolean => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}


export const isValidPass = (password: any): boolean => {
  if (!password || typeof password !== 'string') return false
  const strongPasswordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{}':"\\|,.<>/?]).{8,}$/
  return strongPasswordRegex.test(password)
}

//发送验证码前检查邮箱格式
export const validateSendCode = (req:Request,res:Response,next:NextFunction)=>{
    const {email} = req.body
    if(!isValidEmail(email)){
          return res.status(400).json({ message: '邮箱格式不正确' })
    }
    next()
}

//注册接口的中间件(检查password。code)

export const validateRegister = (req:Request,res:Response,next:NextFunction)=>{
    const {email,password,code} = req.body

    if(!isValidEmail(email)){
          return res.status(400).json({ message: '邮箱格式不正确' })
    }
    if(!isValidPass(password)){
        return res.status(400).json({ message: '密码必须至少8位，且包含数字、大小写字母和!@%等符号' })
    }
    
    if(!code || typeof code !== 'string'){
        return res.status(400).json({ message: '验证码不能为空' })
    }
    if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: '验证码必须为6位数字' })
    } 
    next()

}


//验证码登录的中间件
export const validCodeLogin = (req:Request,res:Response,next:NextFunction)=>{
    const {code,email} = req.body
     if(!isValidEmail(email)){
          return res.status(400).json({ message: '邮箱格式不正确' })
    }
     if(!code || typeof code !== 'string'){
        return res.status(400).json({ message: '验证码不能为空' })
    }
    if (!/^\d{6}$/.test(code)) {
        return res.status(400).json({ message: '验证码必须为6位数字' })
    } 
    next()
}

//密码登录接口的中间件
export const validPassLogin = (req:Request,res:Response,next:NextFunction)=>{
    const {email,password} = req.body

    if(!isValidEmail(email)){
        return res.status(400).json({ message: '邮箱格式不正确' })
    }
    if(!isValidPass(password)){
        return res.status(400).json({ message: '密码必须至少8位，且包含数字、大小写字母和!@%等符号' })
    }

    next()
}
export const verifyAccessToken = (req:AuthRequest,res:Response,next:NextFunction)=>{
    const authHeader = req.headers.authorization
    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({message:'未提供认证令牌'})
    }

    const token = authHeader.split(' ')[1]!

    try{
        const decode = jwt.verify(token,process.env.JWT_SECRET!)as { userId: string,jti: string }
        req.userId = decode.userId
        req.jti = decode.jti
        next()
    }catch(err:any){
         if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '令牌已过期', code: 'TOKEN_EXPIRED' })
    }
    return res.status(403).json({ message: '无效的令牌' })
    }
}



