import type{Request,Response} from 'express'
import {v4 as uuidv4} from 'uuid'
import pool from '../db'
import type { AuthRequest } from '../middlewares/validators'

export const getInterviewersListController = async(req:Request,res:Response):Promise<void>=>{
    try{
        const sql = `SELECT id,name,description,usageCount,creatorId FROM custom_interviewers ORDER by usageCount DESC`

        const [rows] = await pool.execute(sql)
        res.status(200).json({
            success:true,
            data:rows
        })
    }catch(err){
        console.error(err)
        res.status(500).json({success:false})
    }
}

export const createInterviewerController = async(req:AuthRequest,res:Response):Promise<void>=>{
    try{
        const {name,description,promptTemplate} = req.body
        const userId = req.userId
        if(!userId){
            res.status(401).json({success:false,msg:'未登录'})
            return 
        }

        if(!name || !description || !promptTemplate){
            res.status(400).json({success:false})
            return
        }
        const newId = uuidv4()

        const sql = `INSERT INTO custom_interviewers (id,creatorId,name,description,promptTemplate,usageCount) VALUES (?,?,?,?,?,0)`
        await pool.execute(sql,[newId,userId,name,description,promptTemplate])

        res.status(200).json({
            success:true,
            data:{id:newId}
        })
    }catch(err){
        console.error(err)
    }
}
