import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/index.js';
import { logger } from '../services/db.js';

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
