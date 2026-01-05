import { api, ApiResponse } from './client';
import { SiteConfig, Item } from '@/types';

// API 响应类型定义
export interface LoginResponse {
    token: string;
    user: { login: string; name: string; level: number };
    sessionId: string;
}

export interface ProfileResponse {
    username: string;
    level: number;
}

export interface User {
    username: string;
    level: number;
    createdAt?: string;
    lastLogin?: string;
}

export interface SystemSettings {
    registrationEnabled?: boolean;
    backgroundUrl?: string;
    timezone?: string;
    homeUrl?: string;
    footerHtml?: string;
    siteName?: string;
    defaultUserLevel?: number;
}

export interface ProfileUpdateData {
    username?: string;
    password?: string;
}

// 数据相关 API
export const dataApi = {
    // 获取全量数据 (支持指定用户，管理员用)
    getContent: (username?: string) => {
        const url = username ? `/data?user=${username}` : '/data';
        return api.get<ApiResponse<SiteConfig>>(url);
    },

    // 更新全量数据
    saveContent: (content: SiteConfig) => {
        return api.post<ApiResponse>('/data', content);
    },

    // 记录点击
    trackClick: (itemId: number, username: string) => {
        return api.post<ApiResponse<Item>>(`/sites/${itemId}/click?user=${username}`, {});
    }
};

// 认证相关 API
export const authApi = {
    login: (credentials: { username: string; password: string }) => {
        return api.post<ApiResponse<LoginResponse>>('/login', credentials);
    },

    register: (credentials: { username: string; password: string }) => {
        return api.post<ApiResponse>('/register', credentials);
    },

    updateProfile: (profile: ProfileUpdateData) => {
        return api.patch<ApiResponse<LoginResponse>>('/profile', profile);
    },

    // 管理员接口
    admin: {
        getSettings: () => api.get<SystemSettings>('/admin/settings'),
        updateSettings: (settings: Partial<SystemSettings>) => api.post<ApiResponse>('/admin/settings', settings),
        getUsers: () => api.get<User[]>('/admin/users'),
        addUser: (user: { username: string; password: string; level?: number }) => api.post<ApiResponse>('/admin/users', user),
        deleteUser: (username: string) => api.del<ApiResponse>(`/admin/users/${username}`),
        updateUser: (username: string, data: Partial<User & { password?: string; newUsername?: string }>) =>
            api.patch<ApiResponse>(`/admin/users/${username}`, data),
    }
};

