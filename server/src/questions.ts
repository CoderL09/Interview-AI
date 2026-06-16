import type { Response } from "express"
import pool from "./db"
import type { RowDataPacket } from "mysql2"
import type { AuthRequest } from "./middlewares/validators"

export const Getquestion = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.userId
        if (!userId) {
            res.status(401).json({ success: false, message: '未授权' })
            return
        }

       let tags = req.query.tags || null
       let page = parseInt(req.query.page as string, 10) || 1;
let limit = parseInt(req.query.limit as string, 10) || 10;
       let offset = (page-1) * limit

       let tagList:any[] = []
       if(Array.isArray(tags)){
        tagList = tags
       }else if(typeof tags === 'string'){
        let part = tags.split(',')
        if(part.length == 1 && tags.includes(' ')){
            part = tags.split(' ')
        }
          tagList = part.map(t => t.trim()).filter(t => t !== '')
       }

       let countSql = `SELECT COUNT(*) AS total FROM questions `
       let dataSql = `SELECT id,title,answer,tags FROM questions `
       let params:any[] = []

       if(tagList.length > 0){
        const conditions = tagList.map(() => 'LOWER(tags) LIKE ?').join(' AND ')
        const whereClause = `WHERE ${conditions}`
        countSql += ` ${whereClause}`
        dataSql += ` ${whereClause}`
        tagList.forEach(tag=>params.push(`%${tag.toLowerCase()}%`))
       }

       const [countRows] = await pool.execute<RowDataPacket[]>(countSql,params)
       const totalItems = (countRows[0] as RowDataPacket).total
       const totalPages = Math.ceil(totalItems / limit)

       //  修改后
        dataSql += ` ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}` // 直接拼接数字
        const [rows] = await pool.execute(dataSql, params) 


      

        res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit,
            },
            userId,
            welcomeMesg: `你好，用户${userId}，欢迎回来！`
        })
    } catch (err: any) {
        console.error('数据库查询详细错误:', err)
    
        res.status(500).json({
            success: false,
            message: err.message, 
        })
    }
}