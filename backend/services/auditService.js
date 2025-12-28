import { db, logger } from './db.js';
import { AUDIT_LOG_PATH } from '../config/index.js';

const MAX_LOG_ENTRIES = 500; // 最大保留日志条数

/**
 * 审计日志服务
 */
export const auditService = {
    /**
     * 记录审计事件
     */
    log(action, data) {
        try {
            const logs = db.read(AUDIT_LOG_PATH, []);
            const entry = {
                id: Date.now(),
                action,
                ...data,
                timestamp: new Date().toISOString()
            };

            logs.unshift(entry); // 新日志插入头部

            // 保持日志数量在限制内
            if (logs.length > MAX_LOG_ENTRIES) {
                logs.length = MAX_LOG_ENTRIES;
            }

            db.write(AUDIT_LOG_PATH, logs);
            return entry;
        } catch (err) {
            logger.error('审计日志写入失败', err);
            return null;
        }
    },

    /**
     * 获取审计日志（分页）
     */
    getAll(page = 1, limit = 50) {
        const logs = db.read(AUDIT_LOG_PATH, []);
        const start = (page - 1) * limit;
        return {
            logs: logs.slice(start, start + limit),
            total: logs.length,
            page,
            limit
        };
    },

    /**
     * 按用户名筛选日志
     */
    getByUsername(username) {
        const logs = db.read(AUDIT_LOG_PATH, []);
        return logs.filter(log => log.username === username);
    }
};
