import crypto from 'crypto';
import { getDb } from './database.js';
import { logger } from './db.js';

const SESSION_EXPIRE_DAYS = 7;

/**
 * 会话管理服务 (SQLite 版本)
 */
export const sessionService = {
    /**
     * 创建新会话
     */
    create(username, ip, userAgent) {
        const db = getDb();

        // 计算过期时间
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRE_DAYS);

        // 查找是否存在相同用户、IP 和设备且未过期的会话
        const existingSession = db.prepare(`
            SELECT session_id, expires_at FROM sessions 
            WHERE username = ? AND ip = ? AND user_agent = ? AND expires_at > datetime('now')
        `).get(username, ip, userAgent);

        if (existingSession) {
            // 会话仍然有效，更新活跃时间
            db.prepare(`UPDATE sessions SET last_active_at = datetime('now') WHERE session_id = ?`)
                .run(existingSession.session_id);
            logger.info(`复用现有会话: ${username} (${existingSession.session_id.substring(0, 8)}...)`);
            return existingSession.session_id;
        }

        // 创建新会话
        const sessionId = crypto.randomBytes(16).toString('hex');

        db.prepare(`
            INSERT INTO sessions (session_id, username, ip, user_agent, expires_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(sessionId, username, ip, userAgent, expiresAt.toISOString());

        logger.info(`创建新会话: ${username} (${sessionId.substring(0, 8)}...)`);
        return sessionId;
    },

    /**
     * 验证会话有效性
     */
    validate(sessionId) {
        if (!sessionId) return false;

        const db = getDb();
        const session = db.prepare(`
            SELECT * FROM sessions WHERE session_id = ? AND expires_at > datetime('now')
        `).get(sessionId);

        if (!session) {
            // 清理过期会话
            this.revoke(sessionId);
            return false;
        }

        // 更新最后活跃时间
        db.prepare(`UPDATE sessions SET last_active_at = datetime('now') WHERE session_id = ?`)
            .run(sessionId);

        return true;
    },

    /**
     * 撤销会话
     */
    revoke(sessionId) {
        const db = getDb();
        const result = db.prepare('DELETE FROM sessions WHERE session_id = ?').run(sessionId);

        if (result.changes > 0) {
            logger.info(`会话撤销: ${sessionId.substring(0, 8)}...`);
            return true;
        }
        return false;
    },

    /**
     * 获取用户的所有会话
     */
    getByUsername(username) {
        const db = getDb();
        return db.prepare(`
            SELECT session_id as sessionId, ip, user_agent as userAgent, 
                   created_at as createdAt, last_active_at as lastActiveAt
            FROM sessions 
            WHERE username = ? AND expires_at > datetime('now')
            ORDER BY last_active_at DESC
        `).all(username);
    },

    /**
     * 撤销用户的其他会话
     */
    revokeOthers(username, currentSessionId) {
        const db = getDb();
        const result = db.prepare(`
            DELETE FROM sessions WHERE username = ? AND session_id != ?
        `).run(username, currentSessionId);

        if (result.changes > 0) {
            logger.info(`撤销 ${username} 的 ${result.changes} 个其他会话`);
        }
        return result.changes;
    },

    /**
     * 清理过期会话
     */
    cleanup() {
        const db = getDb();
        const result = db.prepare(`DELETE FROM sessions WHERE expires_at <= datetime('now')`).run();
        if (result.changes > 0) {
            logger.info(`清理了 ${result.changes} 个过期会话`);
        }
        return result.changes;
    }
};
