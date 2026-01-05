import { getDb } from '../services/database.js';
import { logger } from '../utils/logger.js';

/**
 * 访问统计模型 (SQLite 版本)
 */
export const Stats = {
    /**
     * 获取所有统计数据
     */
    getAll() {
        const db = getDb();

        // 获取总量
        const totals = db.prepare(`
            SELECT 
                COALESCE(SUM(pv), 0) as total_pv,
                COALESCE(SUM(uv), 0) as total_uv
            FROM daily_stats
        `).get();

        // 获取每日数据
        const dailyRows = db.prepare(`
            SELECT date, pv, uv FROM daily_stats ORDER BY date DESC LIMIT 60
        `).all();

        const daily = {};
        dailyRows.forEach(row => {
            daily[row.date] = { pv: row.pv, uv: row.uv };
        });

        return {
            total_pv: totals.total_pv,
            total_uv: totals.total_uv,
            daily
        };
    },

    /**
     * 获取概览数据（用于前端展示）
     */
    getSummary() {
        const db = getDb();
        const today = new Date().toISOString().split('T')[0];

        // 获取总量
        const totals = db.prepare(`
            SELECT 
                COALESCE(SUM(pv), 0) as total_pv,
                COALESCE(SUM(uv), 0) as total_uv
            FROM daily_stats
        `).get();

        // 获取今日数据
        const todayStats = db.prepare(`
            SELECT pv, uv FROM daily_stats WHERE date = ?
        `).get(today) || { pv: 0, uv: 0 };

        // 获取最近 7 天趋势
        const trend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            const dayData = db.prepare('SELECT pv, uv FROM daily_stats WHERE date = ?').get(dayStr);
            trend.push({
                date: dayStr,
                pv: dayData?.pv || 0,
                uv: dayData?.uv || 0
            });
        }

        // 聚合 OS 和 Browser 数据（最近 30 天）
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

        const osStats = db.prepare(`
            SELECT os as name, COUNT(*) as value 
            FROM visit_logs 
            WHERE date >= ? AND os IS NOT NULL
            GROUP BY os
            ORDER BY value DESC
        `).all(thirtyDaysStr);

        const browserStats = db.prepare(`
            SELECT browser as name, COUNT(*) as value 
            FROM visit_logs 
            WHERE date >= ? AND browser IS NOT NULL
            GROUP BY browser
            ORDER BY value DESC
        `).all(thirtyDaysStr);

        return {
            total_pv: totals.total_pv,
            total_uv: totals.total_uv,
            today_pv: todayStats.pv,
            today_uv: todayStats.uv,
            trend,
            distribution: {
                os: osStats,
                browser: browserStats
            }
        };
    },

    /**
     * 记录访问
     */
    recordVisit({ ip, os, browser, referrer }) {
        const db = getDb();
        const today = new Date().toISOString().split('T')[0];

        try {
            // 尝试插入 IP 记录（如果是新 UV）
            let isNewUv = false;
            try {
                db.prepare(`
                    INSERT INTO visit_logs (date, ip, os, browser, referrer)
                    VALUES (?, ?, ?, ?, ?)
                `).run(today, ip, os || null, browser || null, referrer || null);
                isNewUv = true;
            } catch (e) {
                // UNIQUE 约束冲突，说明今天这个 IP 已经访问过
                isNewUv = false;
            }

            // 更新 daily_stats
            const existing = db.prepare('SELECT * FROM daily_stats WHERE date = ?').get(today);
            if (existing) {
                db.prepare(`
                    UPDATE daily_stats SET pv = pv + 1, uv = uv + ? WHERE date = ?
                `).run(isNewUv ? 1 : 0, today);
            } else {
                db.prepare(`
                    INSERT INTO daily_stats (date, pv, uv) VALUES (?, 1, ?)
                `).run(today, isNewUv ? 1 : 0);
            }

            // 清理 60 天前的数据
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            const oldDate = sixtyDaysAgo.toISOString().split('T')[0];

            db.prepare('DELETE FROM visit_logs WHERE date < ?').run(oldDate);
            db.prepare('DELETE FROM daily_stats WHERE date < ?').run(oldDate);

        } catch (err) {
            logger.error('记录访问失败', err);
        }
    }
};
