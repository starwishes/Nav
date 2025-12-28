import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { accountService } from '../services/accountService.js';
import { auditService } from '../services/auditService.js';
import { sessionService } from '../services/sessionService.js';
import { db, logger } from '../services/db.js';
import { JWT_SECRET, SETTINGS_PATH } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/limiter.js';
import { loginSchema, strongPasswordSchema } from '../middleware/validation.js';

const router = express.Router();

// 获取客户端 IP
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.connection?.remoteAddress ||
        req.ip ||
        'unknown';
};

router.post('/login', loginLimiter, (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: '输入格式不正确' });

    const { username, password } = req.body;
    const user = accountService.findByUsername(username);
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    if (user && bcrypt.compareSync(password, user.password)) {
        // 创建会话
        const sessionId = sessionService.create(username, ip, userAgent);

        // 生成包含 sessionId 的 JWT
        const token = jwt.sign(
            { username: user.username, level: user.level, sessionId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 记录审计日志
        auditService.log('login', {
            username,
            ip,
            userAgent,
            success: true
        });

        logger.info(`用户登录成功: ${username}`);
        return res.json({
            token,
            user: { login: username, name: username, level: user.level },
            sessionId
        });
    }

    // 记录登录失败
    auditService.log('login', {
        username,
        ip,
        userAgent,
        success: false
    });

    logger.warn(`登录失败尝试: ${username}`);
    res.status(401).json({ error: '用户名或密码错误' });
});

router.post('/logout', authenticate, (req, res) => {
    const sessionId = req.user.sessionId;
    if (sessionId) {
        sessionService.revoke(sessionId);
        auditService.log('logout', {
            username: req.user.username,
            ip: getClientIP(req)
        });
    }
    res.json({ success: true });
});

router.post('/register', loginLimiter, (req, res) => {
    const settings = db.read(SETTINGS_PATH, {});
    if (!settings.registrationEnabled) return res.status(403).json({ error: '注册功能已关闭' });

    const { error } = strongPasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { username, password } = req.body;
    if (accountService.findByUsername(username)) return res.status(400).json({ error: '该用户名已被注册' });

    accountService.create(username, password);

    auditService.log('register', {
        username,
        ip: getClientIP(req)
    });

    logger.info(`新用户注册: ${username}`);
    res.json({ success: true });
});

router.get('/profile', authenticate, (req, res) => {
    const user = accountService.findByUsername(req.user.username);
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ username: user.username, level: user.level });
});

router.patch('/profile', authenticate, (req, res) => {
    const { username: newUsername, password } = req.body;
    const result = accountService.update(req.user.username, { newUsername, password });
    if (result?.error) return res.status(400).json({ error: result.error });
    if (!result) return res.status(404).json({ error: '更新失败' });

    const newToken = jwt.sign({ username: result.username, level: result.level }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token: newToken, user: { login: result.username, name: result.username, level: result.level } });
});

// 获取当前用户的会话列表
router.get('/sessions', authenticate, (req, res) => {
    const sessions = sessionService.getByUsername(req.user.username);
    const currentSessionId = req.user.sessionId;

    res.json({
        sessions: sessions.map(s => ({
            ...s,
            isCurrent: s.sessionId === currentSessionId
        }))
    });
});

// 踢出其他设备
router.post('/sessions/revoke-others', authenticate, (req, res) => {
    const count = sessionService.revokeOthers(req.user.username, req.user.sessionId);
    auditService.log('revoke_sessions', {
        username: req.user.username,
        revokedCount: count,
        ip: getClientIP(req)
    });
    res.json({ success: true, revokedCount: count });
});

// 踢出指定会话
router.delete('/sessions/:sessionId', authenticate, (req, res) => {
    const { sessionId } = req.params;
    const sessions = sessionService.getByUsername(req.user.username);

    // 只能踢出自己的会话
    if (!sessions.some(s => s.sessionId === sessionId)) {
        return res.status(403).json({ error: '无权操作此会话' });
    }

    sessionService.revoke(sessionId);
    res.json({ success: true });
});

// 管理员获取审计日志
router.get('/admin/audit', authenticate, (req, res) => {
    if (req.user.level < 3) return res.status(403).json({ error: '权限不足' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    res.json(auditService.getAll(page, limit));
});

router.get('/admin/users', authenticate, (req, res) => {
    if (req.user.level < 3) return res.status(403).json({ error: '权限不足' });
    res.json(accountService.getAll());
});

router.post('/admin/users', authenticate, (req, res) => {
    if (req.user.level < 3) return res.status(403).json({ error: '权限不足' });
    const { username, password, level } = req.body;
    if (accountService.findByUsername(username)) return res.status(400).json({ error: '用户已存在' });
    accountService.create(username, password, level);
    res.json({ success: true });
});

router.delete('/admin/users/:username', authenticate, (req, res) => {
    if (req.user.level < 3) return res.status(403).json({ error: '权限不足' });
    if (accountService.delete(req.params.username)) res.json({ success: true });
    else res.status(404).json({ error: '用户不存在' });
});

export default router;
