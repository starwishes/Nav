import fs from 'fs';
import path from 'path';

/**
 * 极简日志工具
 */
export const logger = {
    info: (msg, data = {}) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data),
    error: (msg, err = {}) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err),
    warn: (msg, data = {}) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data),
};

/**
 * 统一数据访问服务
 */
export const db = {
    read(filePath, defaultVal = []) {
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            return defaultVal;
        } catch (err) {
            logger.error(`读取文件失败: ${filePath}`, err);
            return defaultVal;
        }
    },

    write(filePath, data) {
        try {
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
            return true;
        } catch (err) {
            logger.error(`写入文件失败: ${filePath}`, err);
            return false;
        }
    },

    ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
};
