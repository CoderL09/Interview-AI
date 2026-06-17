import type { Response } from 'express'
import pool from '../utils/database'
import type { RowDataPacket } from 'mysql2'
import type { AuthRequest } from '../middleware/validators'

export const getUserSessions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId
    if (!userId) {
      res.status(401).json({ success: false, message: '未授权' })
      return
    }

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT jti, device, ip, createdAt, expiresAt FROM sessions WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    )

    res.json({ success: true, data: rows })
  } catch (err) {
    console.error('获取会话列表失败:', err)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
}

export const deleteSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId
    const { jti } = req.params

    if (!userId || !jti) {
      res.status(400).json({ success: false, message: '参数不完整' })
      return
    }

    const [result]: any = await pool.execute(
      `DELETE FROM sessions WHERE jti = ? AND userId = ?`,
      [jti, userId]
    )

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, message: '会话不存在' })
      return
    }

    res.json({ success: true, message: '会话已删除' })
  } catch (err) {
    console.error('删除会话失败:', err)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
}
