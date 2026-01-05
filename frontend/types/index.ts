export interface Category {
    id: number;
    name: string;
    level?: number;
    content?: Item[]; // View Model Only
    isVirtual?: boolean; // Pinned category
}

export interface Item {
    id: number;
    name: string;
    url: string;
    description: string;
    categoryId: number;
    pinned?: boolean;
    level?: number;
    clickCount?: number;      // 访问次数统计
    lastVisited?: string;     // 最后访问时间
    tags?: string[];          // 标签
    icon?: string;            // 自定义图标 URL
}

export interface SiteConfig {
    categories: Category[];
    items: Item[];
}

export interface ImportedBookmarkItem {
    name: string;
    url: string;
    description: string;
    categoryName: string;
}

// User related
export interface User {
    username: string;
    level: number;
    created_at?: string;
}

export interface AuthUser {
    login: string;
    name: string;
    level: number;
    avatar_url?: string;
}

export interface AuthResult {
    success: boolean;
    error?: string;
}
