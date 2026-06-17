
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// 确保 uploads 目录存在，如果不存在则自动创建
//process.cwd()在哪执行node命令，哪就是当前目录。__dirname是本文件所在的目录（编译后可能在dist里）
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

// 配置 multer 的存储引擎
const storage = multer.diskStorage({
  // 指定文件保存在哪里
  destination: function (req, file, cb) {
    cb(null, uploadDir) 
  },
  // 指定保存后的文件名（这里加个时间戳防止重名覆盖）
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // 例如：resume-163234234.pdf
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// 创建 multer 实例，限制只能上传 PDF 文件，且大小不超过 5MB
export const uploadMiddleware = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('只允许上传 PDF 格式的简历！'))
    }
  }
})

// 音频专用的 multer 实例，接受常见音频格式，大小限制 10MB
export const audioUploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传音频文件！'))
    }
  }
})