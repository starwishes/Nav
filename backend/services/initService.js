import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db, logger } from './db.js';
import { getDb } from './database.js';
import { runMigration } from './migrate.js';
import { DATA_DIR, DEFAULT_ADMIN_NAME } from '../config/index.js';

/**
 * 系统初始化服务 (SQLite 版本)
 */
export const initService = {
    init() {
        logger.info('正在初始化系统...');

        // 确保目录存在
        db.ensureDir(DATA_DIR);
        db.ensureDir(path.join(DATA_DIR, 'uploads'));

        // 初始化数据库 (会自动创建 schema)
        getDb();
        logger.info('SQLite 数据库初始化完成');

        // 执行 JSON -> SQLite 迁移（如果有旧数据）
        runMigration();

        // 初始化管理员账户
        this.initAdminAccount();

        // 初始化默认设置
        this.initSettings();

        // 初始化默认数据（如果数据库为空）
        this.initDefaultData();

        logger.info('系统初始化完成');
    },

    initAdminAccount() {
        const db = getDb();
        const adminUsername = DEFAULT_ADMIN_NAME;
        const rawAdminPassword = process.env.ADMIN_PASSWORD;

        // 查找管理员账户
        let adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get(adminUsername);

        let shouldReset = false;
        let isDefault = false;
        let isNew = false;

        // 优先级 1: 账号缺失 -> 必须新建
        if (!adminUser) {
            isNew = true;
            shouldReset = true;
        }

        // 优先级 2: 环境变量被显式设为危险值 'admin123' -> 强制拦截并随机化
        if (rawAdminPassword === 'admin123') {
            shouldReset = true;
            isDefault = true;
        }

        // 优先级 3: 库内密码经哈希校验仍为 'admin123' -> 强制补救
        if (!shouldReset && adminUser && bcrypt.compareSync('admin123', adminUser.password)) {
            shouldReset = true;
            isDefault = true;
        }

        if (shouldReset) {
            let finalPassword = rawAdminPassword;
            let isRandom = false;

            // 如果密码是默认值，强制随机
            if (isDefault || !finalPassword || finalPassword === 'admin123') {
                const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                finalPassword = '';
                for (let i = 0; i < 12; i++) {
                    finalPassword += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                isRandom = true;
            }

            const hashed = bcrypt.hashSync(finalPassword, 10);

            if (isNew) {
                db.prepare(`
                    INSERT INTO users (username, password, level, created_at)
                    VALUES (?, ?, 3, datetime('now'))
                `).run(adminUsername, hashed);
                logger.info(`管理员账户 [${adminUsername}] 初始化成功`);
            } else {
                db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashed, adminUsername);
                logger.warn(`安全预警：检测到管理员账户 [${adminUsername}] 使用危险默认密码，系统已执行强制重置`);
            }

            if (isRandom) {
                console.log('\n' + '★'.repeat(50));
                console.log('🛡️  StarNav 安全初始化/强制重置');
                console.log('='.repeat(50));
                console.log('检测到当前管理员密码为默认值 "admin123"');
                console.log('出于安全理由，系统已为您生成了高强度密码：');
                console.log('');
                console.log(`管理员账户: ${adminUsername}`);
                console.log(`新的初始密码: ${finalPassword}`);
                console.log('');
                console.log('请务必妥善记录并在首次登录后通过后台再次修改！');
                console.log('★'.repeat(50) + '\n');
            }
        } else {
            // 用户通过环境变量主动申请修改密码 (非 admin123)
            if (rawAdminPassword && !bcrypt.compareSync(rawAdminPassword, adminUser.password)) {
                const hashed = bcrypt.hashSync(rawAdminPassword, 10);
                db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hashed, adminUsername);
                logger.info(`管理员账户 [${adminUsername}] 密码已通过环境变量成功强制更新`);
            } else {
                logger.info(`管理员账户 [${adminUsername}] 验证状态：OK`);
            }
        }
    },

    initSettings() {
        const db = getDb();

        // 检查是否已有设置
        const count = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;
        if (count === 0) {
            const defaults = {
                registrationEnabled: false,
                defaultUserLevel: 1,
                backgroundUrl: ''
            };

            const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
            Object.entries(defaults).forEach(([key, value]) => {
                insert.run(key, JSON.stringify(value));
            });

            logger.info('已初始化默认系统设置');
        }
    },

    initDefaultData() {
        const db = getDb();

        // 检查是否已有分类
        const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
        if (categoryCount === 0) {
            // 插入默认分类
            db.prepare(`
                INSERT INTO categories (id, name, icon, level, sort_order)
                VALUES (1, '常用推荐', '', 0, 0)
            `).run();

            // 插入默认书签
            db.prepare(`
                INSERT INTO items (id, name, url, description, category_id, pinned, level, tags, sort_order)
                VALUES (1, 'Google', 'https://www.google.com', '全球最大搜索引擎', 1, 1, 0, '[]', 0)
            `).run();

            logger.info('已创建默认分类和书签');
        }
    }
};
