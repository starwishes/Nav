import { getDb } from './database.js';
import { logger } from './db.js';

/**
 * 系统设置服务 (SQLite 版本)
 */
export const settingsService = {
    /**
     * 获取单个设置值
     */
    get(key, defaultValue = null) {
        const db = getDb();
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        if (row) {
            try {
                return JSON.parse(row.value);
            } catch {
                return row.value;
            }
        }
        return defaultValue;
    },

    /**
     * 设置单个值
     */
    set(key, value) {
        const db = getDb();
        try {
            db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
                key,
                JSON.stringify(value)
            );
            return true;
        } catch (err) {
            logger.error(`设置保存失败: ${key}`, err);
            return false;
        }
    },

    /**
     * 获取所有设置
     */
    getAll() {
        const db = getDb();
        const rows = db.prepare('SELECT key, value FROM settings').all();
        const settings = {};
        rows.forEach(row => {
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch {
                settings[row.key] = row.value;
            }
        });
        return settings;
    },

    /**
     * 批量更新设置
     */
    updateAll(newSettings) {
        const db = getDb();
        const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

        const transaction = db.transaction(() => {
            Object.entries(newSettings).forEach(([key, value]) => {
                insert.run(key, JSON.stringify(value));
            });
        });

        try {
            transaction();
            return true;
        } catch (err) {
            logger.error('批量设置保存失败', err);
            return false;
        }
    },

    /**
     * 获取公开设置（前端可访问）
     */
    getPublic() {
        const all = this.getAll();
        return {
            registrationEnabled: all.registrationEnabled || false,
            backgroundUrl: all.backgroundUrl || '',
            timezone: all.timezone || '',
            homeUrl: all.homeUrl || '',
            footerHtml: all.footerHtml || '',
            siteName: all.siteName || ''
        };
    }
};
