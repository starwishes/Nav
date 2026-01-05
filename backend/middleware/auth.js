import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';
import { logger } from '../services/db.js';
import { USER_LEVEL } from '../../common/constants.js';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('未授权访问尝试', { path: req.path });
        return res.status(401).json({ error: '未授权' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        logger.error('无效令牌', { error: err.message });
        res.status(401).json({ error: '无效令牌' });
    }
};

/**
 * 可选认证中间件
 * 如果有有效 token 则解析用户信息，否则跳过（允许游客访问）
 */
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch (err) {
            // Token 无效，当作游客处理
            logger.warn('可选认证: token 无效，按游客处理', { error: err.message });
        }
    }
    next();
};

export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.level < USER_LEVEL.ADMIN) {
        return res.status(403).json({ error: '权限不足' });
    }
    next();
};
