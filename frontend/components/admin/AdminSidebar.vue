<template>
  <aside class="admin-sidebar glass-effect" :class="{ 'mobile-visible': sidebarVisible }">
    <div class="sidebar-header">
      <div class="logo-group">
        <div class="logo-icon gradient-bg">N</div>
        <h1 class="gradient-text">{{ SITE_NAME }}</h1>
      </div>
      <el-button v-if="isMobile" circle :icon="Close" @click="$emit('close-sidebar')" />
    </div>

    <nav class="sidebar-menu">
      <div 
        v-for="item in menuItems" 
        :key="item.id"
        class="menu-item hover-scale"
        :class="{ active: currentView === item.id }"
        @click="$emit('menu-click', item.id)"
      >
        <el-icon><component :is="item.icon" /></el-icon>
        <span class="menu-label">{{ item.label }}</span>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="user-block glass-card">
        <el-avatar :size="32" :src="adminStore.user?.avatar_url">{{ adminStore.user?.login?.charAt(0).toUpperCase() }}</el-avatar>
        <div class="user-info">
          <span class="username">{{ adminStore.user?.login }}</span>
          <el-tag size="small" :type="getLevelTag(adminStore.user?.level || 0)">{{ getLevelName(adminStore.user?.level || 0) }}</el-tag>
        </div>
      </div>
      <el-button class="logout-btn" plain @click="$emit('logout')">
        <el-icon><SwitchButton /></el-icon> 退出
      </el-button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { SITE_NAME } from '@/config';
import { useAdminStore } from '@/store/admin';
import { Close, SwitchButton } from '@element-plus/icons-vue';

defineProps<{
  sidebarVisible: boolean;
  isMobile: boolean;
  menuItems: any[];
  currentView: string;
}>();

defineEmits(['close-sidebar', 'menu-click', 'logout']);

const adminStore = useAdminStore();

const getLevelName = (level: number) => ['游客', '注册用户', 'VIP用户', '管理员'][level] || '未知';
const getLevelTag = (level: number) => ['info', '', 'warning', 'danger'][level] || 'info';
</script>

<style scoped lang="scss">
.admin-sidebar {
  width: 260px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 24px;
  position: sticky;
  top: 0;
  z-index: 100;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  
  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 40px;
    
    .logo-group {
      display: flex;
      align-items: center;
      gap: 12px;
      .logo-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
      }
      h1 {
        font-size: 1.2rem;
        font-weight: 700;
      }
    }
  }
  
  .sidebar-menu {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      cursor: pointer;
      color: var(--gray-700);
      transition: all 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: var(--ui-theme);
      }
      &.active {
        background: var(--ui-theme);
        color: white;
        box-shadow: 0 4px 12px rgba(var(--ui-theme-rgb), 0.3);
      }
      .el-icon { font-size: 1.2rem; }
    }
  }
  
  .sidebar-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    
    .user-block {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      .user-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        .username { font-weight: 600; font-size: 14px; }
      }
    }
    .logout-btn { width: 100%; border-radius: 10px; }
  }
}

:root[theme-mode='dark'] {
  .admin-sidebar { background: rgba(0, 0, 0, 0.2); }
  .menu-item { color: #a3a3a3; }
  .menu-item:hover { background: rgba(255, 255, 255, 0.05); }
}

// 移动端展示逻辑
@media screen and (max-width: 992px) {
  .admin-sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    bottom: 0;
    &.mobile-visible {
      left: 0;
    }
  }
}
</style>
