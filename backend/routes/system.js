import express from 'express';
import fs from 'fs';
import path from 'path';
import { db, logger } from '../services/db.js';
import { SETTINGS_PATH, UPLOADS_DIR } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const faviconCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

router.get('/settings', (req, res) => {
    const settings = db.read(SETTINGS_PATH, {});
    res.json({
        registrationEnabled: settings.registrationEnabled,
        backgroundUrl: settings.backgroundUrl || '',
        timezone: settings.timezone || ''
    });
});

router.get('/admin/settings', authenticate, (req, res) => {
    if (req.user.level < 3) return res.status(403).json({ error: '权限不足' });
    res.json(db.read(SETTINGS_PATH, {}));
});

router.post('/admin/settings', authenticate, (req, res) => {
    if (req.user.level < 3) return res.status(403).json({ error: '权限不足' });
    const oldSettings = db.read(SETTINGS_PATH, {});
    db.write(SETTINGS_PATH, { ...oldSettings, ...req.body });
    res.json({ success: true });
});

router.post('/upload-background', authenticate, (req, res) => {
    try {
        const { data } = req.body;
        const matches = data?.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) return res.status(400).json({ error: '格式不正确' });

        const buffer = Buffer.from(matches[2], 'base64');
        const filename = `bg_${Date.now()}.${matches[1] === 'jpeg' ? 'jpg' : matches[1]}`;
        db.ensureDir(UPLOADS_DIR);
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

        const settings = db.read(SETTINGS_PATH, {});
        settings.backgroundUrl = `/uploads/${filename}`;
        db.write(SETTINGS_PATH, settings);
        res.json({ success: true, url: settings.backgroundUrl });
    } catch (err) {
        logger.error('上传失败', err);
        res.status(500).json({ error: '保存失败' });
    }
});

router.get('/favicon', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: '缺少 URL' });
    try {
        const hostname = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`).hostname;
        const cached = faviconCache.get(hostname);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            res.set('Content-Type', cached.contentType);
            return res.send(cached.data);
        }
        const services = [`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`, `https://icons.duckduckgo.com/ip3/${hostname}.ico`];
        const result = await Promise.any(services.map(async (url) => {
            const resp = await fetch(url, { signal: AbortSignal.timeout(2000) });
            if (resp.ok) {
                const buffer = Buffer.from(await resp.arrayBuffer());
                if (buffer.length > 100) return { data: buffer, type: resp.headers.get('content-type') };
            }
            throw new Error('Failed');
        }));
        faviconCache.set(hostname, { data: result.data, contentType: result.type, timestamp: Date.now() });
        res.set('Content-Type', result.type);
        res.send(result.data);
    } catch (err) { res.status(404).json({ error: 'Not found' }); }
});

router.post('/check-links', authenticate, async (req, res) => {
    const { urls } = req.body;
    if (!Array.isArray(urls)) return res.status(400).json({ error: 'Invalid URLs' });
    const results = await Promise.all(urls.map(async (url) => {
        try {
            const resp = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
            return { url, status: resp.ok ? 'ok' : 'error' };
        } catch (e) { return { url, status: 'error' }; }
    }));
    res.json({ results });
});

router.get('/suggest', async (req, res) => {
    const { keyword, type = 'baidu' } = req.query;
    if (!keyword) return res.json([]);
    try {
        const url = type === 'baidu' ? `https://suggestion.baidu.com/su?wd=${encodeURIComponent(keyword)}&cb=` : `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(keyword)}`;
        const resp = await fetch(url);
        if (type === 'baidu') {
            const text = await resp.text();
            const match = text.match(/s:\[(.*)\]/);
            return res.json(match ? JSON.parse(`[${match[1]}]`) : []);
        }
        const data = await resp.json();
        res.json(data[1] || []);
    } catch (e) { res.json([]); }
});

export default router;
