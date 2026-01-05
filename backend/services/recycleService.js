import { getDb } from './database.js';
import { logger } from './db.js';

/**
 * 回收站服务 (SQLite 版本)
 */
export const recycleService = {
    /**
     * 将书签移入回收站
     * @param {string} username - 用户名
     * @param {object} item - 被删除的书签对象
     * @returns {boolean}
     */
    moveToTrash: (username, item) => {
        try {
            const db = getDb();
            const data = JSON.stringify({
                ...item,
                deletedBy: username
            });

            db.prepare(`
                INSERT INTO recycle_bin (type, data) VALUES ('item', ?)
            `).run(data);

            logger.info(`书签移入回收站: ${item.name}`);
            return true;
        } catch (err) {
            logger.error('移入回收站失败', err);
            return false;
        }
    },

    /**
     * 获取回收站内容
     * @returns {Array}
     */
    getTrash: () => {
        try {
            const db = getDb();
            const rows = db.prepare(`
                SELECT id, type, data, deleted_at as deletedAt FROM recycle_bin 
                ORDER BY deleted_at DESC
            `).all();

            return rows.map(row => ({
                recycleId: row.id,
                ...JSON.parse(row.data),
                deletedAt: row.deletedAt
            }));
        } catch (err) {
            logger.error('获取回收站失败', err);
            return [];
        }
    },

    /**
     * 从回收站恢复书签
     * @param {number} recycleId - 回收站记录ID
     * @returns {object|null} 恢复的书签或null
     */
    restore: (recycleId) => {
        const db = getDb();

        try {
            // 获取回收站记录
            const row = db.prepare('SELECT * FROM recycle_bin WHERE id = ?').get(recycleId);
            if (!row) return null;

            const item = JSON.parse(row.data);
            delete item.deletedBy;

            // 获取新 ID (避免冲突)
            const maxId = db.prepare('SELECT MAX(id) as maxId FROM items').get().maxId || 0;
            const existingItem = db.prepare('SELECT id FROM items WHERE id = ?').get(item.id);
            if (existingItem) {
                item.id = maxId + 1;
            }

            // 恢复到 items 表
            const sortOrder = db.prepare('SELECT COUNT(*) as count FROM items').get().count;
            db.prepare(`
                INSERT INTO items (id, name, url, description, icon, category_id, pinned, level, tags, click_count, last_visited, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                item.id,
                item.name || '',
                item.url || '',
                item.description || '',
                item.icon || '',
                Number(item.categoryId),
                item.pinned ? 1 : 0,
                Number(item.level || 0),
                JSON.stringify(item.tags || []),
                Number(item.clickCount || 0),
                item.lastVisited || null,
                sortOrder
            );

            // 从回收站删除
            db.prepare('DELETE FROM recycle_bin WHERE id = ?').run(recycleId);

            logger.info(`书签已恢复: ${item.name}`);
            return item;
        } catch (err) {
            logger.error('恢复书签失败', err);
            return null;
        }
    },

    /**
     * 永久删除回收站中的单个记录
     * @param {number} recycleId - 回收站记录ID
     * @returns {boolean}
     */
    permanentDelete: (recycleId) => {
        try {
            const db = getDb();
            const result = db.prepare('DELETE FROM recycle_bin WHERE id = ?').run(recycleId);

            if (result.changes > 0) {
                logger.info(`书签永久删除: ID ${recycleId}`);
                return true;
            }
            return false;
        } catch (err) {
            logger.error('永久删除失败', err);
            return false;
        }
    },

    /**
     * 清空回收站
     * @returns {boolean}
     */
    emptyTrash: () => {
        try {
            const db = getDb();
            db.prepare('DELETE FROM recycle_bin').run();
            logger.info('回收站已清空');
            return true;
        } catch (err) {
            logger.error('清空回收站失败', err);
            return false;
        }
    }
};
