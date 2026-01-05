import fs from 'fs';

// 日志级别：0=silent, 1=error, 2=warn, 3=info (默认), 4=debug
const LOG_LEVEL = parseInt(process.env.LOG_LEVEL || '3', 10);

/**
 * 日志工具（支持日志级别控制）
 */
export const logger = {
    debug: (msg, data = {}) => {
        if (LOG_LEVEL >= 4) console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data);
    },
    info: (msg, data = {}) => {
        if (LOG_LEVEL >= 3) console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, data);
    },
    warn: (msg, data = {}) => {
        if (LOG_LEVEL >= 2) console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, data);
    },
    error: (msg, err = {}) => {
        if (LOG_LEVEL >= 1) console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err);
    },
};

/**
 * 文件系统工具
 * 注: read/write 函数已废弃，数据存储已迁移到 SQLite
 */
export const db = {
    /**
     * 确保目录存在
     */
    ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
};
