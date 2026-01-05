import fs from 'fs';
import path from 'path';
import { accountService } from '../services/accountService.js';
// import { db } from '../services/db.js'; // Deprecated
import { logger } from '../utils/logger.js';
import { settingsService } from '../services/settingsService.js';
import { UPLOADS_DIR } from '../config/index.js';

export const systemController = {
    getHealth: (req, res) => {
        res.json({
            status: 'ok',
            version: '1.6.1',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    },

    getPublicSettings: (req, res) => {
        res.json(settingsService.getPublic());
    },

    getAdminSettings: (req, res) => {
        res.json(settingsService.getAll());
    },

    updateAdminSettings: (req, res) => {
        if (settingsService.updateAll(req.body)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: '保存失败' });
        }
    },

    setBackground: (req, res) => {
        const { url } = req.body;
        settingsService.set('backgroundUrl', url || '');
        res.json({ success: true });
    },

    uploadBackground: (req, res) => {
        try {
            const { data } = req.body;
            const matches = data?.match(/^data:image\/(\w+);base64,(.+)$/);
            if (!matches) return res.status(400).json({ error: '格式不正确' });

            const buffer = Buffer.from(matches[2], 'base64');
            const filename = `bg_${Date.now()}.${matches[1] === 'jpeg' ? 'jpg' : matches[1]}`;
            if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

            const url = `/uploads/${filename}`;
            settingsService.set('backgroundUrl', url);
            res.json({ success: true, url });
        } catch (err) {
            logger.error('上传失败', err);
            res.status(500).json({ error: '保存失败' });
        }
    },

    uploadIcon: (req, res) => {
        try {
            const { data } = req.body;
            const matches = data?.match(/^data:image\/(\w+);base64,(.+)$/);
            if (!matches) return res.status(400).json({ error: '格式不正确' });

            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const cleanExt = ext.replace('+xml', '');

            const buffer = Buffer.from(matches[2], 'base64');
            const filename = `icon_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${cleanExt}`;

            if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);

            res.json({ success: true, url: `/uploads/${filename}` });
        } catch (err) {
            logger.error('图标上传失败', err);
            res.status(500).json({ error: '上传失败' });
        }
    },

    getUploads: (req, res) => {
        try {
            if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            const files = fs.readdirSync(UPLOADS_DIR)
                .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
                .map(filename => {
                    const stat = fs.statSync(path.join(UPLOADS_DIR, filename));
                    return {
                        filename,
                        url: `/uploads/${filename}`,
                        size: stat.size,
                        uploadedAt: stat.mtime.toISOString()
                    };
                })
                .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
            res.json({ files });
        } catch (err) {
            logger.error('获取上传列表失败', err);
            res.json({ files: [] });
        }
    },

    deleteUpload: (req, res) => {
        const { filename } = req.params;
        const filePath = path.join(UPLOADS_DIR, filename);

        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ error: '无效的文件名' });
        }

        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);

                // 如果删除的是当前背景图，清除设置
                const currentBg = settingsService.get('backgroundUrl', '');
                if (currentBg === `/uploads/${filename}`) {
                    settingsService.set('backgroundUrl', '');
                }

                logger.info(`文件已删除: ${filename}`);
                res.json({ success: true });
            } else {
                res.status(404).json({ error: '文件不存在' });
            }
        } catch (err) {
            logger.error('删除文件失败', err);
            res.status(500).json({ error: '删除失败' });
        }
    }
};
