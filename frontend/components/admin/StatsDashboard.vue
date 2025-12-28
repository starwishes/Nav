<template>
  <div class="stats-dashboard">
    <el-row :gutter="16">
      <!-- 总访问量 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ totalClicks }}</div>
          <div class="stat-label">{{ t('stats.totalClicks') }}</div>
        </el-card>
      </el-col>
      
      <!-- 书签总数 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ totalBookmarks }}</div>
          <div class="stat-label">{{ t('stats.totalBookmarks') }}</div>
        </el-card>
      </el-col>
      
      <!-- 分类总数 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ totalCategories }}</div>
          <div class="stat-label">{{ t('stats.totalCategories') }}</div>
        </el-card>
      </el-col>
      
      <!-- 用户总数 -->
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="never" class="stat-card">
          <div class="stat-value">{{ totalUsers }}</div>
          <div class="stat-label">{{ t('stats.totalUsers') }}</div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 热门书签排行 -->
    <el-card shadow="never" class="glass-card" style="margin-top: 16px;">
      <template #header>
        <span>🔥 {{ t('stats.topBookmarks') }}</span>
      </template>
      
      <el-table :data="topBookmarks" stripe>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="name" :label="t('stats.name')" />
        <el-table-column prop="clickCount" :label="t('stats.clickCount')" width="100" sortable>
          <template #default="{ row }">
            <el-tag type="primary">{{ row.clickCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" :label="t('stats.category')" width="120" />
        <el-table-column prop="lastVisited" :label="t('stats.lastVisited')" width="180">
          <template #default="{ row }">
            {{ row.lastVisited ? formatTime(row.lastVisited) : '-' }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 分类统计 -->
    <el-card shadow="never" class="glass-card" style="margin-top: 16px;">
      <template #header>
        <span>📊 {{ t('stats.catStats') }}</span>
      </template>
      
      <el-table :data="categoryStats" stripe>
        <el-table-column prop="name" :label="t('stats.name')" />
        <el-table-column prop="itemCount" :label="t('stats.bookmarkCount')" width="100" />
        <el-table-column prop="totalClicks" :label="t('stats.totalClicks')" width="100" />
        <el-table-column :label="t('stats.percentage')" width="200">
          <template #default="{ row }">
            <el-progress 
              :percentage="totalClicks ? Math.round(row.totalClicks / totalClicks * 100) : 0" 
              :stroke-width="10"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminStore } from '@/store/admin';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface Bookmark {
  id: number;
  name: string;
  url: string;
  categoryId: number;
  clickCount?: number;
  lastVisited?: string;
}

interface Category {
  id: number;
  name: string;
}

const adminStore = useAdminStore();
const items = ref<Bookmark[]>([]);
const categories = ref<Category[]>([]);
const totalUsers = ref(0);

const totalClicks = computed(() => 
  items.value.reduce((sum, item) => sum + (item.clickCount || 0), 0)
);

const totalBookmarks = computed(() => items.value.length);
const totalCategories = computed(() => categories.value.length);

const topBookmarks = computed(() => {
  const catMap = new Map(categories.value.map(c => [c.id, c.name]));
  return [...items.value]
    .sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0))
    .slice(0, 10)
    .map(item => ({
      ...item,
      categoryName: catMap.get(item.categoryId) || '未分类'
    }));
});

const categoryStats = computed(() => {
  const stats = new Map<number, { name: string; itemCount: number; totalClicks: number }>();
  
  categories.value.forEach(cat => {
    stats.set(cat.id, { name: cat.name, itemCount: 0, totalClicks: 0 });
  });
  
  items.value.forEach(item => {
    const stat = stats.get(item.categoryId);
    if (stat) {
      stat.itemCount++;
      stat.totalClicks += item.clickCount || 0;
    }
  });
  
  return Array.from(stats.values()).sort((a, b) => b.totalClicks - a.totalClicks);
});

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const fetchData = async () => {
  try {
    const data = await adminStore.getFileContent();
    if (data?.content) {
      items.value = data.content.items || [];
      categories.value = data.content.categories || [];
    }
    
    // 获取用户数量（仅管理员）
    if (adminStore.user?.level === 3) {
      const users = await adminStore.fetchUsers();
      totalUsers.value = users.length;
    }
  } catch (err) {
    console.error('获取统计数据失败', err);
  }
};

onMounted(fetchData);
</script>

<style scoped lang="scss">
.stats-dashboard {
  .stat-card {
    text-align: center;
    padding: 20px 0;
    
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--el-color-primary);
    }
    
    .stat-label {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-top: 8px;
    }
  }
}
</style>
