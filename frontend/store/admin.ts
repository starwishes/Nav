import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SiteConfig } from '@/types';
import type { SystemSettings, User, ProfileUpdateData } from '@/api';

interface AuthUser {
  login: string;
  name: string;
  level: number;
  avatar_url?: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

export const useAdminStore = defineStore('admin', () => {
  const token = ref<string | null>(localStorage.getItem('admin_token'));
  const user = ref<AuthUser | null>(
    localStorage.getItem('admin_user')
      ? JSON.parse(localStorage.getItem('admin_user')!)
      : null
  );
  const isAuthenticated = ref<boolean>(!!token.value);

  // 设置认证信息
  const setAuth = (newToken: string, newUser: AuthUser) => {
    token.value = newToken;
    user.value = newUser;
    isAuthenticated.value = true;
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_user', JSON.stringify(newUser));
  };

  // 清除认证信息
  const clearAuth = () => {
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  // 登录
  const login = async (username: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || '登录失败');

      setAuth(data.token, data.user);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '登录失败';
      return { success: false, error: message };
    }
  };

  // 注册
  const register = async (username: string, password: string): Promise<AuthResult> => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '注册失败');
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败';
      return { success: false, error: message };
    }
  };

  // 获取文件内容
  const getFileContent = async (username?: string) => {
    try {
      const targetUser = username || user.value?.login;
      const headers: Record<string, string> = {};
      if (token.value) headers['Authorization'] = `Bearer ${token.value}`;

      const url = targetUser ? `/api/data?user=${targetUser}` : '/api/data';
      const response = await fetch(url, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '获取文件失败');
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取文件失败';
      throw new Error(message);
    }
  };

  // 更新文件内容
  const updateFileContent = async (content: SiteConfig) => {
    if (!token.value) throw new Error('未授权');

    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`,
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '更新文件失败');
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新文件失败';
      throw new Error(message);
    }
  };

  // 管理员获取设置
  const getAdminSettings = async (): Promise<SystemSettings> => {
    const response = await fetch('/api/admin/settings', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    });
    return await response.json();
  };

  // 管理员更新设置
  const updateAdminSettings = async (settings: Partial<SystemSettings>) => {
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(settings)
    });
    return await response.json();
  };

  // 管理员获取用户列表
  const fetchUsers = async (): Promise<User[]> => {
    const response = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token.value}` }
    });
    return await response.json();
  };

  // 管理员添加用户
  const addUser = async (userData: { username: string; password: string; level?: number }) => {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(userData)
    });
    return await response.json();
  };

  // 管理员删除用户
  const deleteUser = async (username: string) => {
    const response = await fetch(`/api/admin/users/${username}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token.value}` }
    });
    return await response.json();
  };

  // 管理员更新用户 (等级、用户名、密码)
  const updateUser = async (oldUsername: string, updateData: Partial<User & { password?: string; newUsername?: string }>) => {
    const response = await fetch(`/api/admin/users/${oldUsername}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(updateData)
    });
    return await response.json();
  };

  // 用户修改个人信息/密码/用户名
  const updateProfile = async (profileData: ProfileUpdateData) => {
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(profileData)
    });
    const data = await response.json();
    if (data.success && data.token && data.user) {
      // 如果修改了用户名，后端会返回新 Token 和 User
      setAuth(data.token, data.user);
    }
    return data;
  };

  return {
    token,
    user,
    isAuthenticated,
    setAuth,
    clearAuth,
    login,
    register,
    getFileContent,
    updateFileContent,
    getAdminSettings,
    updateAdminSettings,
    fetchUsers,
    addUser,
    deleteUser,
    updateUser,
    updateProfile
  };
});
