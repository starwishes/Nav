import Database from 'better-sqlite3';
import path from 'path';
import { DATA_DIR } from '../config/index.js';
import { logger } from '../utils/logger.js';

// 数据库文件路径
const DB_PATH = path.join(DATA_DIR, 'starnav.db');

// 创建数据库连接（懒加载单例）
let db = null;

/**
 * 获取数据库连接
 * @returns {Database.Database}
 */
export const getDb = () => {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL'); // 启用 WAL 模式提升并发性能
        db.pragma('foreign_keys = ON');
        initSchema();
        logger.info(`SQLite 数据库已连接: ${DB_PATH}`);
    }
    return db;
};

/**
 * 初始化数据库 Schema
 */
const initSchema = () => {
    const db = getDb();

    // 分类表
    db.exec(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            icon TEXT DEFAULT '',
            level INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0
        )
    `);

    // 书签/网站表
    db.exec(`
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            url TEXT NOT NULL,
            description TEXT DEFAULT '',
            icon TEXT DEFAULT '',
            category_id INTEGER,
            pinned INTEGER DEFAULT 0,
            level INTEGER DEFAULT 0,
            tags TEXT DEFAULT '[]',
            click_count INTEGER DEFAULT 0,
            last_visited TEXT,
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
    `);

    // 用户表
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password TEXT NOT NULL,
            level INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            last_login TEXT
        )
    `);

    // 系统设置表 (键值对)
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `);

    // 回收站表
    db.exec(`
        CREATE TABLE IF NOT EXISTS recycle_bin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            data TEXT NOT NULL,
            deleted_at TEXT DEFAULT (datetime('now'))
        )
    `);

    // 审计日志表
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            action TEXT NOT NULL,
            details TEXT,
            ip TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    `);

    // 会话表
    db.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            ip TEXT,
            user_agent TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            last_active_at TEXT DEFAULT (datetime('now')),
            expires_at TEXT
        )
    `);

    // 访问统计表 (按日聚合)
    db.exec(`
        CREATE TABLE IF NOT EXISTS daily_stats (
            date TEXT PRIMARY KEY,
            pv INTEGER DEFAULT 0,
            uv INTEGER DEFAULT 0
        )
    `);

    // 访问日志表 (用于计算 UV)
    db.exec(`
        CREATE TABLE IF NOT EXISTS visit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            ip TEXT NOT NULL,
            os TEXT,
            browser TEXT,
            referrer TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            UNIQUE(date, ip)
        )
    `);

    // 创建索引
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
        CREATE INDEX IF NOT EXISTS idx_items_level ON items(level);
        CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_visit_logs_date ON visit_logs(date);
        CREATE INDEX IF NOT EXISTS idx_recycle_deleted ON recycle_bin(deleted_at);
    `);

    logger.info('数据库 Schema 初始化完成');
};

/**
 * 关闭数据库连接
 */
export const closeDb = () => {
    if (db) {
        db.close();
        db = null;
        logger.info('数据库连接已关闭');
    }
};

/**
 * 获取统计信息
 */
export const getDbStats = () => {
    const db = getDb();
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    const itemCount = db.prepare('SELECT COUNT(*) as count FROM items').get().count;
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    return { categoryCount, itemCount, userCount, dbPath: DB_PATH };
};

export default { getDb, closeDb, getDbStats };
