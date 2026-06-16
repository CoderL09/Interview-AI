import express from 'express'
import type{Application}  from 'express'
import 'dotenv/config'
import { register,sendCode,passLogin,codeLogin,sendLoginCode, logout} from './middlewares/auth'
import { validateSendCode,validateRegister,validPassLogin,validCodeLogin, verifyAccessToken } from './middlewares/validators'
import { Getquestion } from './questions'
import cors from 'cors'
import { uploadMiddleware } from './upload'


import { startInterviewController, handleUserAnswerController, endInterviewController  } from './controller/interview'
import { createInterviewerController, getInterviewersListController } from './controller/market'
import { checkDailyLimit } from './middlewares/rateLimiter'

import { sttController,ttsController } from './controller/audio'










const app:Application = express()
const port = process.env.PORT

app.use(express.urlencoded({extended:true}))         /**用form提交数据时，自动转成req.body */

app.use(express.json())                              /**用 fetch/axios 发送 JSON 数据（application/json）时，自动解析成 req.body 对象。 */
app.use(cors())

app.post('/send-code',validateSendCode,sendCode)
app.post('/register',validateRegister,register)
app.post('/pass-login',validPassLogin,passLogin)
app.post('/send-login-code', validateSendCode, sendLoginCode)
app.post('/code-login',validCodeLogin,codeLogin)
app.get('/questions', verifyAccessToken, Getquestion)
app.post('/logout',verifyAccessToken,logout)
app.post('/api/interview/start', verifyAccessToken,uploadMiddleware.single('resume'),  startInterviewController)
app.post('/api/interview/answer', verifyAccessToken, checkDailyLimit, handleUserAnswerController)
app.post('/api/interview/end', verifyAccessToken,endInterviewController)
app.get('/api/market/list',getInterviewersListController)
app.post('/api/market/create',verifyAccessToken,createInterviewerController)

app.post('/api/audio/stt', verifyAccessToken, uploadMiddleware.single('audio'), sttController)
app.post('/api/audio/tts', verifyAccessToken, ttsController);




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})


