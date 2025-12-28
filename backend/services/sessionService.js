import crypto from 'crypto';
import { db, logger } from './db.js';
import { SESSIONS_PATH } from '../config/index.js';

const SESSION_EXPIRE_DAYS = 7; // 会话过期天数

/**
 * 会话管理服务
 */
export const sessionService = {
    /**
     * 创建新会话
     */
    create(username, ip, userAgent) {
        const sessions = db.read(SESSIONS_PATH, []);
        const sessionId = crypto.randomBytes(16).toString('hex');

        const session = {
            sessionId,
            username,
            ip,
            userAgent,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
        };

        sessions.push(session);
        db.write(SESSIONS_PATH, sessions);
        logger.info(`会话创建: ${username} (${sessionId.substring(0, 8)}...)`);

        return sessionId;
    },

    /**
     * 验证会话有效性
     */
    validate(sessionId) {
        if (!sessionId) return false;

        const sessions = db.read(SESSIONS_PATH, []);
        const session = sessions.find(s => s.sessionId === sessionId);

        if (!session) return false;

        // 检查是否过期
        const expireTime = new Date(session.createdAt);
        expireTime.setDate(expireTime.getDate() + SESSION_EXPIRE_DAYS);

        if (new Date() > expireTime) {
            this.revoke(sessionId);
            return false;
        }

        // 更新最后活跃时间
        session.lastActiveAt = new Date().toISOString();
        db.write(SESSIONS_PATH, sessions);

        return true;
    },

    /**
     * 撤销会话
     */
    revoke(sessionId) {
        const sessions = db.read(SESSIONS_PATH, []);
        const index = sessions.findIndex(s => s.sessionId === sessionId);

        if (index > -1) {
            const removed = sessions.splice(index, 1)[0];
            db.write(SESSIONS_PATH, sessions);
            logger.info(`会话撤销: ${removed.username} (${sessionId.substring(0, 8)}...)`);
            return true;
        }
        return false;
    },

    /**
     * 获取用户的所有会话
     */
    getByUsername(username) {
        const sessions = db.read(SESSIONS_PATH, []);
        return sessions
            .filter(s => s.username === username)
            .map(s => ({
                sessionId: s.sessionId,
                ip: s.ip,
                userAgent: s.userAgent,
                createdAt: s.createdAt,
                lastActiveAt: s.lastActiveAt
            }));
    },

    /**
     * 撤销用户的其他会话
     */
    revokeOthers(username, currentSessionId) {
        const sessions = db.read(SESSIONS_PATH, []);
        const newSessions = sessions.filter(
            s => !(s.username === username && s.sessionId !== currentSessionId)
        );

        const revokedCount = sessions.length - newSessions.length;
        db.write(SESSIONS_PATH, newSessions);

        if (revokedCount > 0) {
            logger.info(`撤销 ${username} 的 ${revokedCount} 个其他会话`);
        }
        return revokedCount;
    }
};
