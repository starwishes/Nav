import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { accountService } from '../services/accountService.js';
import { db, logger } from '../services/db.js';
import { JWT_SECRET, SETTINGS_PATH } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/limiter.js';
import { loginSchema } from '../middleware/validation.js';

const router = express.Router();

router.post('/login', loginLimiter, (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: '输入格式不正确' });

    const { username, password } = req.body;
    const user = accountService.findByUsername(username);

    if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ username: user.username, level: user.level }, JWT_SECRET, { expiresIn: '7d' });
        logger.info(`用户登录成功: ${username}`);
        return res.json({ token, user: { login: username, name: username, level: user.level } });
    }

    logger.warn(`登录失败尝试: ${username}`);
    res.status(401).json({ error: '用户名或密码错误' });
});

router.post('/register', loginLimiter, (req, res) => {
    const settings = db.read(SETTINGS_PATH, {});
    if (!settings.registrationEnabled) return res.status(403).json({ error: '注册功能已关闭' });

    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: '输入格式不正确' });

    const { username, password } = req.body;
    if (accountService.findByUsername(username)) return res.status(400).json({ error: '该用户名已被注册' });

    accountService.create(username, password);
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
