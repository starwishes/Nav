import { getDb } from './database.js';
import { logger } from './db.js';

// 内存缓存：{ categories: [], items: [] } (Raw Data of all levels)
let globalCache = null;

const invalidateCache = () => {
    globalCache = null;
    logger.debug('Cache invalidated');
};

/**
 * 书签/导航数据服务 (SQLite 版本)
 */
export const bookmarkService = {
    /**
     * 获取并格式化导航数据
     * @param {string} username - 目标用户名 (暂时忽略，因为数据是全局的)
     * @param {number} visitorLevel - 访问者权限级别
     * @returns {object} { categories: [], items: [] }
     */
    getData: (username = null, visitorLevel = 0) => {
        // 1. 尝试从缓存获取全量数据
        if (!globalCache) {
            const db = getDb();
            // 获取所有分类
            const allCategories = db.prepare(`
                SELECT id, name, icon, level, sort_order 
                FROM categories 
                ORDER BY sort_order, id
            `).all();

            // 获取所有书签
            let allItems = db.prepare(`
                SELECT id, name, url, description, icon, category_id as categoryId, 
                       pinned, level, tags, click_count as clickCount, last_visited as lastVisited, sort_order
                FROM items 
                ORDER BY sort_order, id
            `).all();

            // 解析 tags
            allItems = allItems.map(item => ({
                ...item,
                pinned: !!item.pinned,
                tags: JSON.parse(item.tags || '[]')
            }));

            globalCache = { categories: allCategories, items: allItems };
            logger.debug('Cache miss - Loaded data from DB');
        }

        // 2. 内存过滤 (按权限)
        const categories = globalCache.categories.filter(c => c.level <= visitorLevel);
        const validCategoryIds = new Set(categories.map(c => c.id));

        const items = globalCache.items.filter(i =>
            i.level <= visitorLevel && validCategoryIds.has(i.categoryId)
        );

        return { categories, items };
    },



    /**
     * 保存导航数据（全量覆盖）
     * @param {string} username - 用户名
     * @param {object} content - { categories: [], items: [] }
     * @returns {boolean}
     */
    saveData: (username, content) => {
        const db = getDb();
        const { categories = [], items = [] } = content;

        const transaction = db.transaction(() => {
            // 清空现有数据
            db.prepare('DELETE FROM items').run();
            db.prepare('DELETE FROM categories').run();

            // 插入分类
            const insertCategory = db.prepare(`
                INSERT INTO categories (id, name, icon, level, sort_order)
                VALUES (?, ?, ?, ?, ?)
            `);
            categories.forEach((cat, index) => {
                insertCategory.run(
                    Number(cat.id),
                    cat.name || '',
                    cat.icon || '',
                    Number(cat.level || 0),
                    index
                );
            });

            // 插入书签
            const insertItem = db.prepare(`
                INSERT INTO items (id, name, url, description, icon, category_id, pinned, level, tags, click_count, last_visited, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            items.forEach((item, index) => {
                insertItem.run(
                    Number(item.id),
                    item.name || '',
                    item.url || '',
                    item.description || '',
                    item.icon || '',
                    Number(item.categoryId),
                    item.pinned ? 1 : 0,
                    Number(item.level || 0),
                    JSON.stringify(item.tags || []),
                    Number(item.clickCount || 0),
                    item.lastVisited || null,
                    index
                );
            });
        });

        try {
            transaction();
            invalidateCache(); // 清除缓存
            logger.info(`数据保存成功: ${categories.length} 分类, ${items.length} 书签`);
            return true;
        } catch (err) {
            logger.error('数据保存失败', err);
            return false;
        }
    },

    /**
     * 增加点击统计
     * @param {number} itemId 
     * @param {string} username 
     * @returns {object|null}
     */
    trackClick: (itemId, username = null) => {
        const db = getDb();
        const id = Number(itemId);

        try {
            const result = db.prepare(`
                UPDATE items 
                SET click_count = click_count + 1, last_visited = datetime('now')
                WHERE id = ?
            `).run(id);

            if (result.changes > 0) {
                invalidateCache(); // 点击会更新计数，需清除缓存 (或考虑仅更新缓存中的计数以优化性能)
                // 返回更新后的 item
                const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
                return item ? {
                    ...item,
                    categoryId: item.category_id,
                    clickCount: item.click_count,
                    lastVisited: item.last_visited,
                    tags: JSON.parse(item.tags || '[]')
                } : null;
            }
            return null;
        } catch (err) {
            logger.error(`点击统计失败: ${itemId}`, err);
            return null;
        }
    },

    /**
     * 添加单个书签
     * @param {string} username 
     * @param {object} itemData 
     * @returns {object|null}
     */
    addItem: (username, itemData) => {
        const db = getDb();

        try {
            // 获取最大 ID
            const maxId = db.prepare('SELECT MAX(id) as maxId FROM items').get().maxId || 0;
            const newId = maxId + 1;
            const sortOrder = db.prepare('SELECT COUNT(*) as count FROM items').get().count;

            db.prepare(`
                INSERT INTO items (id, name, url, description, icon, category_id, pinned, level, tags, click_count, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, 0, ?, '[]', 0, ?)
            `).run(
                newId,
                itemData.name || 'Untitled',
                itemData.url,
                itemData.description || '',
                itemData.icon || '',
                Number(itemData.categoryId),
                Number(itemData.minLevel || 0),
                sortOrder
            );

            const newItem = {
                id: newId,
                name: itemData.name,
                url: itemData.url,
                description: itemData.description || '',
                categoryId: Number(itemData.categoryId),
                pinned: false,
                level: itemData.minLevel || 0,
                tags: itemData.tags || [],
                clickCount: 0
            };

            logger.info(`书签添加成功: ${newItem.name}`);
            invalidateCache();
            return newItem;
        } catch (err) {
            logger.error('书签添加失败', err);
            return null;
        }
    },

    /**
     * 添加分类
     * @param {string} username 
     * @param {object} categoryData 
     * @returns {object|null}
     */
    addCategory: (username, categoryData) => {
        const db = getDb();

        try {
            const maxId = db.prepare('SELECT MAX(id) as maxId FROM categories').get().maxId || 0;
            const newId = maxId + 1;
            const sortOrder = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;

            db.prepare(`
                INSERT INTO categories (id, name, icon, level, sort_order)
                VALUES (?, ?, ?, ?, ?)
            `).run(
                newId,
                categoryData.name || 'New Category',
                categoryData.icon || '',
                Number(categoryData.minLevel || 0),
                sortOrder
            );

            const newCategory = {
                id: newId,
                name: categoryData.name,
                icon: categoryData.icon || '',
                level: categoryData.minLevel || 0
            };

            logger.info(`分类创建成功: ${newCategory.name}`);
            invalidateCache();
            return newCategory;
        } catch (err) {
            logger.error('分类创建失败', err);
            return null;
        }
    },

    /**
     * 检查 URL 是否已存在
     */
    checkUrlItem: (username, url) => {
        const db = getDb();
        const targetUrl = url.trim().toLowerCase();

        const item = db.prepare(`
            SELECT * FROM items WHERE LOWER(TRIM(url)) = ?
        `).get(targetUrl);

        if (item) {
            return {
                ...item,
                categoryId: item.category_id,
                clickCount: item.click_count,
                tags: JSON.parse(item.tags || '[]')
            };
        }
        return null;
    },

    /**
     * 搜索书签
     */
    searchItems: (username, keyword, limit = 10) => {
        const db = getDb();
        const lowerKeyword = (keyword || '').toLowerCase();

        // 获取分类名称映射
        const categories = db.prepare('SELECT id, name FROM categories').all();
        const categoryMap = new Map(categories.map(c => [c.id, c.name]));

        let items;
        if (!lowerKeyword) {
            // 返回最近访问的书签
            items = db.prepare(`
                SELECT * FROM items 
                ORDER BY last_visited DESC NULLS LAST
                LIMIT ?
            `).all(limit);
        } else {
            // 搜索匹配
            items = db.prepare(`
                SELECT * FROM items 
                WHERE LOWER(name) LIKE ? OR LOWER(url) LIKE ? OR LOWER(description) LIKE ?
                LIMIT ?
            `).all(`%${lowerKeyword}%`, `%${lowerKeyword}%`, `%${lowerKeyword}%`, limit);
        }

        return items.map(item => ({
            id: item.id,
            name: item.name,
            url: item.url,
            description: item.description,
            categoryId: item.category_id,
            categoryName: categoryMap.get(item.category_id) || '未分类',
            tags: JSON.parse(item.tags || '[]')
        }));
    },

    /**
     * 获取分类列表（简化版）
     */
    getCategories: (username = null) => {
        const db = getDb();
        return db.prepare('SELECT id, name FROM categories ORDER BY sort_order, id').all();
    }
};
