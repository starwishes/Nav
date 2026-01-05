import bcrypt from 'bcryptjs';
import { getDb } from './database.js';
import { logger } from './db.js';
import { USER_LEVEL } from '../../common/constants.js';

/**
 * 账户管理服务 (SQLite 版本)
 */
class AccountService {
    /**
     * 获取所有用户（不含密码）
     */
    getAll() {
        const db = getDb();
        const users = db.prepare(`
            SELECT username, level, created_at as createdAt, last_login as lastLogin
            FROM users
            ORDER BY created_at DESC
        `).all();
        return users;
    }

    /**
     * 根据用户名查找用户
     */
    findByUsername(username) {
        const db = getDb();
        const user = db.prepare(`
            SELECT username, password, level, created_at as createdAt, last_login as lastLogin
            FROM users WHERE username = ?
        `).get(username);
        return user || null;
    }

    /**
     * 创建用户
     */
    create(username, password, level) {
        const db = getDb();
        const hashedPassword = bcrypt.hashSync(password, 10);

        // 获取默认用户级别
        const settingRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('defaultUserLevel');
        const defaultLevel = settingRow ? JSON.parse(settingRow.value) : USER_LEVEL.USER;

        try {
            db.prepare(`
                INSERT INTO users (username, password, level, created_at)
                VALUES (?, ?, ?, datetime('now'))
            `).run(username, hashedPassword, level || defaultLevel);

            logger.info(`用户创建成功: ${username}`);
            return this.findByUsername(username);
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
                logger.warn(`用户已存在: ${username}`);
                return null;
            }
            logger.error('用户创建失败', err);
            return null;
        }
    }

    /**
     * 更新用户
     */
    update(oldUsername, { newUsername, password, level }) {
        const db = getDb();
        const user = this.findByUsername(oldUsername);
        if (!user) return null;

        try {
            // 如果要改用户名，先检查新用户名是否存在
            if (newUsername && newUsername !== oldUsername) {
                if (this.findByUsername(newUsername)) {
                    return { error: '用户名已占用' };
                }
            }

            // 构建更新语句
            const updates = [];
            const params = [];

            if (level !== undefined) {
                updates.push('level = ?');
                params.push(level);
            }
            if (password) {
                updates.push('password = ?');
                params.push(bcrypt.hashSync(password, 10));
            }
            if (newUsername && newUsername !== oldUsername) {
                updates.push('username = ?');
                params.push(newUsername);
            }

            if (updates.length > 0) {
                params.push(oldUsername);
                db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`).run(...params);
            }

            logger.info(`用户更新成功: ${oldUsername}`);
            return this.findByUsername(newUsername || oldUsername);
        } catch (err) {
            logger.error('用户更新失败', err);
            return null;
        }
    }

    /**
     * 删除用户
     */
    delete(username) {
        const db = getDb();

        try {
            const result = db.prepare('DELETE FROM users WHERE username = ?').run(username);
            if (result.changes > 0) {
                logger.info(`用户删除成功: ${username}`);
                return true;
            }
            return false;
        } catch (err) {
            logger.error('用户删除失败', err);
            return false;
        }
    }

    /**
     * 更新最后登录时间
     */
    updateLastLogin(username) {
        const db = getDb();
        try {
            db.prepare(`UPDATE users SET last_login = datetime('now') WHERE username = ?`).run(username);
        } catch (err) {
            logger.error('更新登录时间失败', err);
        }
    }

    /**
     * 验证密码
     */
    verifyPassword(username, password) {
        const user = this.findByUsername(username);
        if (!user) return false;
        return bcrypt.compareSync(password, user.password);
    }
}

export const accountService = new AccountService();
