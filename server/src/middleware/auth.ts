import type{ Request,Response } from "express"
import bcrypt from "bcryptjs"
import {v4 as uuidv4} from 'uuid'
import pool from "../utils/database"
import type { RowDataPacket } from "mysql2"
import {redis} from "../utils/redis"
import { sendVerificationCode } from "../utils/email"
import jwt from 'jsonwebtoken'
import type { AuthRequest } from "../utils/request"

interface SessionInterface{
    id:number
    userId:string              // 用户 ID
    jti: string               // 会话唯一标识
    refreshToken: string      // refresh token 哈希值
    device: string | null     // 设备信息
    ip: string | null         // IP 地址
    createdAt: Date
    expiresAt: Date
}

const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const saveCode = async(email:string,code:string):Promise<void>=>{
    const key = `verify:code:${email}`
    const rateKey = `rate:code:${email}`
    await redis.set(key, code, { ex: 300 })
await redis.set(rateKey, '1', { ex: 60 })
}

const saveLoginCode= async(email:string,code:string):Promise<void>=>{
    const key = `verify:login:${email}`
    const rateKey = `login:rate:${email}`
    await redis.set(key,code,{ ex: 300 })
    await redis.set(rateKey,'1',{ ex: 60 })
}


const verifyCode = async (email: string, code: string): Promise<boolean> => {
    const key = `verify:code:${email}`
    const stored = await redis.get(key)
    if (stored === code) {
        await redis.del(key)
        return true
    }
    return false
}

const verifyLoginCode = async (email: string, code: string): Promise<boolean> => {
    const key = `verify:login:${email}`
    const stored = await redis.get(key)
    if (stored === code) {
        await redis.del(key)
        return true
    }
    return false
}

async function isEmailExists(email: string): Promise<boolean> {
  const sql = 'SELECT id FROM users WHERE email = ?'
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [email])
  return rows.length > 0
}

function generateAccessToken(userId:string,jti:string):string{
    return jwt.sign(
        {userId,jti},
        process.env.JWT_SECRET!,
        {expiresIn:'1d'}
    )
}

function generateRefreshToken(userId:string,jti:string):string{
    return jwt.sign(
        {userId,jti},
        process.env.JWT_REFRESH_SECRET!,
        {expiresIn:'7d'}
    )
}


export const sendCode = async (req:Request,res:Response)=>{
   try{
     const {email} = req.body

     //检查是否已经被注册
     if(await isEmailExists(email)){
        return res.status(409).json({ message: '邮箱已被注册' })
     }

     //同一个邮箱60秒内只能发一次
     const ratekey = `rate:code:${email}`  
     const existingCode = await redis.get(ratekey)
     if(existingCode){
        return res.status(429).json({ message: '验证码已发送，请稍后再试' })
     }

     const code = generateCode()
     await saveCode(email,code)

     const sent = await sendVerificationCode(email,code)
     if(!sent){
        return res.status(500).json({ message: '验证码发送失败，请稍后重试' })
     }
     res.status(200).json({ message: '验证码已发送，请查收邮件' })


   }catch(err:any){
    console.error(err)
    res.status(500).json({ message: '服务器错误，请稍后重试' })
   }
}

export const register = async (req:Request,res:Response)=>{
    try{
        const {email,password,username,code} = req.body

        if(await isEmailExists(email)){
        return res.status(409).json({ message: '邮箱已被注册' })
     }
        let sql = 'SELECT id from users WHERE username = ?'
        const [nameRows] = await pool.execute<RowDataPacket[]>(sql,[username])
         if(nameRows.length > 0){
            return res.status(400).json({
                message:'用户名已被注册',
                success:false
            })
        }

        const isValid = await verifyCode(email,code)
        if(!isValid){
            return res.status(400).json({
                message: '验证码错误'
            })
        }
        
        const salt = bcrypt.genSaltSync(10)
        const hashedPassword =  bcrypt.hashSync(password,salt)

        sql = `INSERT INTO users(email,password_hash,username) VALUES(?, ?, ?)`
        await pool.execute(sql,[email,hashedPassword,username])

        res.status(201).json(({
            success:true,
            message:'注册成功',
        }))



    }catch(err:any){
        console.error(err)
        res.status(403).json({
            success:false
        })
    }
}

export const sendLoginCode = async(req:Request,res:Response)=>{
    try{
        const {email} = req.body
        if(! await isEmailExists(email)){
            return res.status(404).json({message:'邮箱未注册'})
        }

        const rateKey = `login:rate:${email}`
        const existingRate = await redis.get(rateKey)
        if (existingRate) {
            return res.status(429).json({ message: '操作过于频繁，请60秒后再试' })
        }

        const code = generateCode()
        await saveLoginCode(email,code)

        const sent = await sendVerificationCode(email,code)
        if(!sent){
            return res.status(500).json({ message: '验证码发送失败，请稍后重试' })
        }
        res.status(200).json({ message: '验证码已发送，请查收邮件' })

    }catch(err:any){
        console.error(err)
    }
}

export const codeLogin = async (req:Request,res:Response)=>{
    try{
        const {email,code} = req.body

    if(! await isEmailExists(email)){
           return res.status(404).json({message:'邮箱未注册'})
    }

    const isValid = await verifyLoginCode(email,code)
    if(!isValid){
            return res.status(400).json({
                message: '验证码错误'
            })
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )
    const user = rows[0]!
    const jti = uuidv4()
    const accessToken = generateAccessToken(user.id, jti)
    const refreshToken = generateRefreshToken(user.id, jti)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const device = req.headers['user-agent'] || null
    const ip = req.ip || req.socket.remoteAddress || null
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10)
    await pool.execute(
      `INSERT INTO sessions (userId, jti, refreshToken, device, ip, createdAt, expiresAt)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [user.id, jti, refreshTokenHash, device, ip, expiresAt]
    )

    res.json({
      success: true,
      accessToken,
      refreshToken,
      userId: user.id
    })
    }catch(err:any){
        console.error(err)
        res.status(500).json({ message: '服务器错误，请稍后重试' })
    }


}

export const passLogin = async (req:Request,res:Response)=>{
    try{
        const {password,email} = req.body

    if(!await isEmailExists(email)){
        return res.status(401).json({message:"用户不存在"})
    }

    const [rows] = await pool.execute<RowDataPacket[]>(`SELECT id,password_hash from users WHERE email = ?`,[email])
    const user = rows[0]!
    const isMatch  = bcrypt.compareSync(password,user.password_hash)

    if(!isMatch){
        return res.status(401).json({message:'密码错误'})
    }

    //生成会话标识jti
    const jti = uuidv4()

    //生成accessToken,refreshToken
    const accessToken = generateAccessToken(user.id, jti)
    const refreshToken = generateRefreshToken(user.id, jti)

    //计算refreshToken的过期时间
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const device = req.headers['user-agent'] || null
    const ip = req.ip || req.socket.remoteAddress || null

    const salt = bcrypt.genSaltSync(10)
    const refreshTokenHash = bcrypt.hashSync(refreshToken,salt)

    await pool.execute(
    `INSERT INTO sessions (userId, jti, refreshToken, device, ip, createdAt, expiresAt)
     VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
    [user.id, jti, refreshTokenHash, device, ip, expiresAt]
)

    res.json({
        success:true,
        accessToken,
        refreshToken,
        userId:user.id
    })
    }catch(err:any){
        console.error('登陆失败',err)
        res.status(500).json({message:'错误'})
    }
}


export const logout = async(req:AuthRequest,res:Response)=>{
    try{
        const jti = req.jti
        if (!jti) {
            return res.status(400).json({ success: false, message: '缺少会话标识' })
        }
        await pool.execute(`DELETE FROM sessions WHERE jti = ?`,[jti])

        res.json({
            success:true,
        })
    }catch(err:any){
        console.error(err)
        res.status(500).json({success:false})
    }
}