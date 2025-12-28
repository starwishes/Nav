import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db, logger } from './db.js';
import {
    DATA_DIR,
    ACCOUNTS_PATH,
    SETTINGS_PATH,
    DEFAULT_ADMIN_NAME
} from '../config/index.js';

/**
 * 系统初始化服务
 */
export const initService = {
    init() {
        logger.info('正在初始化系统...');

        db.ensureDir(DATA_DIR);
        db.ensureDir(path.join(DATA_DIR, 'users'));
        db.ensureDir(path.join(DATA_DIR, 'uploads'));

        const dataPath = path.join(DATA_DIR, 'data.json');
        const oldAdminDataPath = path.join(DATA_DIR, 'users', `${DEFAULT_ADMIN_NAME}.json`);

        if (!fs.existsSync(dataPath)) {
            if (fs.existsSync(oldAdminDataPath)) {
                // 执行迁移：从 users/{name}.json 搬迁到 data.json
                try {
                    fs.copyFileSync(oldAdminDataPath, dataPath);
                    // 备份旧文件，但不立即删除，确保安全
                    fs.renameSync(oldAdminDataPath, oldAdminDataPath + '.bak');
                    logger.info(`[Migration] 成功将主管理员旧数据从 ${oldAdminDataPath} 迁移至 ${dataPath}`);
                } catch (err) {
                    logger.error(`[Migration] 数据迁移失败: ${err.message}`);
                }
            } else {
                // 真正的数据缺失，创建默认值
                const defaultData = {
                    categories: [{ id: 1, name: '常用推荐', private: false, level: 0 }],
                    items: [{ id: 1, name: 'Google', url: 'https://www.google.com', categoryId: 1, pinned: true }]
                };
                db.write(dataPath, defaultData);
                logger.info('已创建默认数据文件 data.json');
            }
        }

        if (!fs.existsSync(SETTINGS_PATH)) {
            const defaultSettings = { registrationEnabled: false, defaultUserLevel: 1, backgroundUrl: '' };
            db.write(SETTINGS_PATH, defaultSettings);
            logger.info('已创建默认设置文件 settings.json');
        }

        this.initAdminAccount();
    },

    initAdminAccount() {
        const adminUsername = DEFAULT_ADMIN_NAME;
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        let accounts = db.read(ACCOUNTS_PATH, []);

        if (!accounts.some(u => u.username === adminUsername)) {
            accounts.push({
                username: adminUsername,
                password: bcrypt.hashSync(adminPassword, 10),
                level: 3,
                createdAt: new Date().toISOString()
            });
            db.write(ACCOUNTS_PATH, accounts);
            logger.info(`管理员账户已初始化: ${adminUsername}`);
        }
    }
};
