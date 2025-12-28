<template>
  <div class="admin-layout" :class="{ 'is-mobile': isMobile }">
    <!-- 侧边栏组件 -->
    <AdminSidebar 
      :sidebar-visible="sidebarVisible" 
      :is-mobile="isMobile" 
      :menu-items="menuItems" 
      :current-view="currentView"
      @close-sidebar="sidebarVisible = false"
      @menu-click="handleMenuClick"
      @logout="handleLogout"
    />

    <!-- 移动端遮罩 -->
    <div v-if="isMobile && sidebarVisible" class="sidebar-mask" @click="sidebarVisible = false"></div>

    <!-- 主内容区 -->
    <main class="admin-main">
      <!-- 顶部状态栏组件 -->
      <AdminHeader 
        :is-mobile="isMobile" 
        :current-view-label="currentViewLabel" 
        :loading="loading"
        @open-sidebar="sidebarVisible = true"
        @go-home="goToIndex"
        @load-data="loadData"
      />

      <div class="view-content">
        <!-- 数据管理视图组件 -->
        <DataManager 
          v-if="currentView === 'data'"
          v-model:active-tab="activeTab"
          v-model:search-keyword="searchKeyword"
          v-model:filter-category="filterCategory"
          :saving="saving"
          :categories="categories"
          :items="items"
          :filtered-items="filteredItems"
          @save="handleSave"
          @add-category="handleAddCategory"
          @edit-category="handleEditCategory"
          @delete-category="handleDeleteCategory"
          @add-item="handleAddItem"
          @edit-item="handleEditItem"
          @delete-item="handleDeleteItem"
          @batch-delete="handleBatchDelete"
          @batch-move="handleBatchMove"
          @show-bookmark-import="showBookmarkImport = true"
          @json-import="handleJsonImport"
        />

        <!-- 用户管理 (已组件化) -->
        <div v-if="currentView === 'users'" class="users-view fade-in">
           <el-card shadow="never" class="glass-card">
              <template #header><span>{{ t('admin.userManagement') }}</span></template>
              <UserTable 
                :users="users" 
                @update-level="handleUpdateUserLevel" 
                @add-user="handleAddUser"
                @delete-user="handleDeleteUser"
                @update-user="handleUpdateUser"
              />
           </el-card>
        </div>

        <!-- 个人资料 (已组件化) -->
        <div v-if="currentView === 'profile'" class="profile-view fade-in">
           <el-card shadow="never" class="glass-card" style="max-width: 600px;">
              <template #header><span>{{ t('profile.settings') }}</span></template>
              <ProfileSettings :username="adminStore.user?.login || ''" :level="adminStore.user?.level || 0" @update="handleUpdateProfile" />
           </el-card>
        </div>

        <!-- 系统设置 (已组件化) -->
        <div v-if="currentView === 'settings'" class="settings-view fade-in">
           <el-card shadow="never" class="glass-card" style="max-width: 600px;">
              <template #header><span>{{ t('admin.systemConfig') }}</span></template>
              <SystemSettings :initialSettings="systemSettings" @save="handleSaveSettings" />
           </el-card>
        </div>
        
        <!-- 审计日志 -->
        <div v-if="currentView === 'audit'" class="audit-view fade-in">
           <el-card shadow="never" class="glass-card">
              <AuditLog />
           </el-card>
        </div>
        
        <!-- 会话管理 -->
        <div v-if="currentView === 'sessions'" class="sessions-view fade-in">
           <el-card shadow="never" class="glass-card" style="max-width: 800px;">
              <SessionManager />
           </el-card>
        </div>
        
        <!-- 访问统计 -->
        <div v-if="currentView === 'stats'" class="stats-view fade-in">
           <StatsDashboard />
        </div>
      </div>
    </main>

    <!-- 弹窗组件 -->
    <CategoryDialog v-model="categoryDialogVisible" :form="categoryForm" :is-edit="isEdit" @save="saveCategory" />
    <SiteDialog v-model="itemDialogVisible" :form="itemForm" :categories="categories" :is-edit="isEdit" @save="saveItem" />
    <BookmarkImport v-model="showBookmarkImport" @import="handleBookmarkImport" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/store/admin';
import { ElMessage, ElMessageBox } from 'element-plus';
import { DataAnalysis, User, Setting, UserFilled, List, Lock, TrendCharts } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

// Composables
import { useAdminDashboard } from '@/composables/useAdminDashboard';

// Components
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import AdminHeader from '@/components/admin/AdminHeader.vue';
import DataManager from '@/components/admin/DataManager.vue';
import CategoryDialog from '@/components/CategoryDialog.vue';
import SiteDialog from '@/components/SiteDialog.vue';
import UserTable from '@/components/admin/UserTable.vue';
import SystemSettings from '@/components/admin/SystemSettings.vue';
import ProfileSettings from '@/components/admin/ProfileSettings.vue';
import BookmarkImport from '@/components/admin/BookmarkImport.vue';
import AuditLog from '@/components/admin/AuditLog.vue';
import SessionManager from '@/components/admin/SessionManager.vue';
import StatsDashboard from '@/components/admin/StatsDashboard.vue';

const { t } = useI18n();
const router = useRouter();
const adminStore = useAdminStore();
const currentView = ref('data');
const sidebarVisible = ref(false);
const users = ref([]);
const systemSettings = ref({});
const showBookmarkImport = ref(false);

const menuItems = computed(() => {
  const items = [
    { id: 'data', label: t('menu.dataManage'), icon: DataAnalysis },
    { id: 'profile', label: t('menu.profile'), icon: UserFilled },
    { id: 'sessions', label: t('menu.sessions'), icon: Lock },
  ];
  if (adminStore.user?.level === 3) {
    items.push(
      { id: 'users', label: t('menu.users'), icon: User },
      { id: 'stats', label: t('menu.stats'), icon: TrendCharts },
      { id: 'audit', label: t('menu.audit'), icon: List },
      { id: 'settings', label: t('menu.settings'), icon: Setting }
    );
  }
  return items;
});

const currentViewLabel = computed(() => {
  return menuItems.value.find(m => m.id === currentView.value)?.label || t('admin.dashboard');
});

const {
  loading, saving, activeTab, categories, items, filterCategory,
  searchKeyword, categoryDialogVisible, itemDialogVisible, isEdit,
  categoryForm, itemForm, filteredItems, loadData, handleSave,
  handleAddCategory, handleEditCategory, handleDeleteCategory, saveCategory,
  handleAddItem, handleEditItem, handleDeleteItem, saveItem,
  handleBatchDelete, handleBatchMove,
} = useAdminDashboard();

// Sidebar logic
const handleMenuClick = (id: string) => {
  currentView.value = id;
  if (isMobile.value) sidebarVisible.value = false;
  if (id === 'users') fetchUserList();
  if (id === 'settings') fetchSettings();
};

const handleLogout = () => {
  ElMessageBox.confirm(t('admin.confirmLogout'), t('common.warning'), { type: 'warning' }).then(() => {
    adminStore.clearAuth();
    router.push('/');
    ElMessage.success(t('admin.logoutMessage'));
  });
};

const goToIndex = () => router.push('/');

const fetchUserList = async () => {
  users.value = await adminStore.fetchUsers();
};

const fetchSettings = async () => {
  systemSettings.value = await adminStore.getAdminSettings();
};

const handleUpdateUserLevel = async (username: string, level: number) => {
  const res = await adminStore.updateUser(username, { level });
  if (res.success) {
    ElMessage.success(t('admin.updateSuccess'));
    fetchUserList();
  } else {
    ElMessage.error(res.error || t('admin.operationFailed'));
  }
};

const handleAddUser = async (userData: any) => {
  const res = await adminStore.addUser(userData);
  if (res.success) {
    ElMessage.success(t('admin.addSuccess'));
    fetchUserList();
  } else {
    ElMessage.error(res.error || t('admin.operationFailed'));
  }
};

const handleDeleteUser = async (username: string) => {
  const res = await adminStore.deleteUser(username);
  if (res.success) {
    ElMessage.success(t('admin.deleteSuccess'));
    fetchUserList();
  } else {
    ElMessage.error(res.error || t('admin.operationFailed'));
  }
};

const handleUpdateUser = async (oldUsername: string, updateData: any) => {
  const res = await adminStore.updateUser(oldUsername, updateData);
  if (res.success) {
    ElMessage.success(t('admin.updateSuccess'));
    fetchUserList();
  } else {
    ElMessage.error(res.error || t('admin.operationFailed'));
  }
};

const handleSaveSettings = async (newSettings: any) => {
  const res = await adminStore.updateAdminSettings(newSettings);
  if (res.success) ElMessage.success(t('settings.saveSettings') + ' ' + t('common.success'));
};

const handleUpdateProfile = async (profileData: any) => {
  const res = await adminStore.updateProfile(profileData);
  if (res.success) ElMessage.success(t('admin.updateSuccess'));
};

// Responsive
const isMobile = ref(false);
const checkMobile = () => { isMobile.value = window.innerWidth <= 992; };
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  if (!adminStore.isAuthenticated) { router.push('/'); return; }
  loadData();
});
onUnmounted(() => window.removeEventListener('resize', checkMobile));

const handleJsonImport = (content: any) => {
  if (!content.categories || !content.items) {
    ElMessage.error(t('admin.jsonError'));
    return;
  }
  
  let maxCatId = categories.value.reduce((max, cat) => Math.max(max, cat.id), 0);
  let maxItemId = items.value.reduce((max, item) => Math.max(max, item.id), 0);
  
  const catMapping: Record<number, number> = {};
  const currentCatNames: Record<string, number> = {};
  categories.value.forEach(cat => { currentCatNames[cat.name] = cat.id; });
  
  // 1. 合并分类
  content.categories.forEach((cat: any) => {
    if (currentCatNames[cat.name]) {
      catMapping[cat.id] = currentCatNames[cat.name];
    } else {
      maxCatId++;
      const newCat = { ...cat, id: maxCatId };
      categories.value.push(newCat);
      catMapping[cat.id] = maxCatId;
      currentCatNames[cat.name] = maxCatId;
    }
  });
  
  // 2. 合并网站 (按 URL 去重)
  let addedCount = 0;
  content.items.forEach((item: any) => {
    const exists = items.value.some(i => i.url === item.url);
    if (!exists) {
      maxItemId++;
      const newItem = { 
        ...item, 
        id: maxItemId,
        categoryId: catMapping[item.categoryId] || categories.value[0]?.id || 1 
      };
      items.value.push(newItem);
      addedCount++;
    }
  });

  ElMessage.success(t('admin.importSuccess', { count: addedCount }) + '. ' + t('admin.importConfirm'));
};

// 浏览器书签导入处理
const handleBookmarkImport = (data: { categories: string[]; items: any[] }) => {
  let maxCatId = categories.value.reduce((max, cat) => Math.max(max, cat.id), 0);
  let maxItemId = items.value.reduce((max, item) => Math.max(max, item.id), 0);
  
  const catNameToId: Record<string, number> = {};
  categories.value.forEach(cat => { catNameToId[cat.name] = cat.id; });
  
  data.categories.forEach(catName => {
    if (!catNameToId[catName]) {
      maxCatId++;
      categories.value.push({ id: maxCatId, name: catName });
      catNameToId[catName] = maxCatId;
    }
  });
  
  data.items.forEach((item: any) => {
    const exists = items.value.some(i => i.url === item.url);
    if (!exists) {
      maxItemId++;
      items.value.push({
        id: maxItemId,
        name: item.name,
        url: item.url,
        description: item.description || '',
        categoryId: catNameToId[item.categoryName] || categories.value[0]?.id || 1,
        private: false,
        pinned: false,
        level: 0,
        tags: []
      });
    }
  });
  ElMessage.success(`导入成功，请点击"保存并同步"生效`);
};
</script>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: var(--gray-0);
  transition: all 0.3s ease;
}

// 主内容区
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: radial-gradient(circle at top right, rgba(var(--ui-theme-rgb), 0.05), transparent);
  
  .view-content {
    flex: 1;
    .fade-in { animation: fadeIn 0.3s ease-out; }
  }
}

// 移动端适配
.admin-layout.is-mobile {
  .sidebar-mask {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 90;
  }
  .admin-main { padding: 16px; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

