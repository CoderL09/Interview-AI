import express from 'express'
import type { Application } from 'express'
import 'dotenv/config'
import cors from 'cors'

import { register, sendCode, passLogin, codeLogin, sendLoginCode, logout } from './middleware/auth'
import { validateSendCode, validateRegister, validPassLogin, validCodeLogin, verifyAccessToken } from './middleware/validators'
import { uploadMiddleware, audioUploadMiddleware } from './middleware/upload'
import { checkDailyLimit } from './middleware/rateLimiter'

import { Getquestion } from './controller/question'

import { startInterviewController, handleUserAnswerController, endInterviewController, getSessionController } from './controller/interview'
import { createInterviewerController, getInterviewersListController } from './controller/market'
import { sttController, ttsController } from './controller/audio'
import { getUserSessions, deleteSession } from './controller/session'







  const app: Application = express()
  const port = process.env.PORT

  const corsOptions = {
  origin: [
    'http://localhost:5173', // 允许本地开发环境访问
    'https://interview-ai-livid-pi.vercel.app' ,
    'https://interview-ai-git-main-qndydxx-8018s-projects.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // 如果你的登录涉及到 Cookie 或 Session，这一步非常重要
};

  app.use(express.urlencoded({ extended: true }))
  app.use(express.json())
app.use(cors(corsOptions));

  // Auth routes
  app.post('/send-code', validateSendCode, sendCode)
  app.post('/register', validateRegister, register)
  app.post('/pass-login', validPassLogin, passLogin)
  app.post('/send-login-code', validateSendCode, sendLoginCode)
  app.post('/code-login', validCodeLogin, codeLogin)
  app.get('/questions', verifyAccessToken, Getquestion)
  app.get('/sessions', verifyAccessToken, getUserSessions)
  app.delete('/sessions/:jti', verifyAccessToken, deleteSession)
  app.post('/logout', verifyAccessToken, logout)

  // Interview routes
  app.post('/api/interview/start', verifyAccessToken, uploadMiddleware.single('resume'), startInterviewController)
  app.get('/api/interview/:id', verifyAccessToken, getSessionController)
  app.post('/api/interview/answer', verifyAccessToken, checkDailyLimit, handleUserAnswerController)
  app.post('/api/interview/end', verifyAccessToken, endInterviewController)

  // Market routes
  app.get('/api/market/list', getInterviewersListController)
  app.post('/api/market/create', verifyAccessToken, createInterviewerController)

  // Audio routes
  app.post('/api/audio/stt', verifyAccessToken, audioUploadMiddleware.single('audio'), sttController)
  app.post('/api/audio/tts', verifyAccessToken, ttsController)

  

  const PORT = process.env.PORT || 5000;

// 关键改动：在这里加上 '0.0.0.0'
app.listen(PORT as number, '0.0.0.0', () => { 
  console.log(`Server is running on port ${PORT}`);
});
