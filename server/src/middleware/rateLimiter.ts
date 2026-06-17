import type { Response,NextFunction } from "express";
import type { AuthRequest } from "../utils/request";
import pool from "../utils/database";
import {redis} from "../utils/redis";

export const checkDailyLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: '未授权，请先登录' });
      return;
    }

    const sql = `SELECT role_id FROM users WHERE id = ?`;
    const [rows]: any = await pool.execute(sql, [userId]);
    
    // 根据角色 ID 分配每日额度 (对应你的 roles 表：1=user, 2=vip, 3=svip)
    let limit = 3; // 默认普通用户每天 3 次
    if (rows && rows.length > 0) {
      const roleId = rows[0].role_id;
      if (roleId === 2) limit = 50;       // VIP
      else if (roleId === 3) limit = 500; // 超级VIP
    }

    // 2. 构造 Redis 的 Key (格式: usage:日期:用户ID)
    // 获取当地时间格式化的日期字符串，比如 "2026-06-11"
    const today = new Date().toISOString().split('T')[0];
    const redisKey = `usage:${today}:${userId}`;

    // 3. 从 Redis 查询今天该用户已经对话了几次
    const currentUsageStr = await redis.get(redisKey);
    const currentUsage = currentUsageStr ? parseInt(currentUsageStr) : 0;

    // 4. 判断是否超出额度
    if (currentUsage >= limit) {
      res.status(403).json({ 
        success: false, 
        message: `今日对话额度已用完（上限 ${limit} 次），请明天再来或升级会员！` 
      });
      return;
    }

    // 5. 如果没超限，将今天的使用次数 +1
    await redis.incr(redisKey);

    //如果是今天第一次调用，设置这个 Key 到今晚 23:59:59 自动销毁
    if (currentUsage === 0) {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const ttlSeconds = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);
      
      await redis.expire(redisKey, ttlSeconds);
    }

    next();

  } catch (error) {
    console.error('防刷限流系统异常:', error);
    res.status(500).json({ success: false, message: '服务器校验异常' });
  }
};