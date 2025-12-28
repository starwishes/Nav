<template>
  <div class="site-table-container">
    <el-table 
      :data="items" 
      border 
      stripe 
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="id" :label="t('table.id')" width="80" align="center" />
      <el-table-column prop="name" :label="t('table.siteName')" width="150" align="center" />
      <el-table-column prop="url" :label="t('table.siteUrl')" min-width="200">
        <template #default="{ row }">
          <div style="display: flex; align-items: center; gap: 8px;">
            <el-link :href="row.url" target="_blank" type="primary">{{ row.url }}</el-link>
            <el-tag v-if="linkStatus[row.url] === 'ok'" type="success" size="small">✓</el-tag>
            <el-tag v-else-if="linkStatus[row.url] === 'error'" type="danger" size="small">✗</el-tag>
            <el-icon v-else-if="linkStatus[row.url] === 'checking'" class="is-loading"><Loading /></el-icon>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="t('table.category')" width="120" align="center">
        <template #default="{ row }">
          <el-tag>{{ getCategoryName(row.categoryId) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('table.visibility')" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.private ? 'danger' : 'success'" effect="plain">
            {{ row.private ? t('table.private') : t('table.public') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('table.clickCount')" prop="clickCount" sortable width="110" align="center">
        <template #default="{ row }">
          <el-tag type="info" effect="plain">{{ row.clickCount || 0 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('table.lastVisited')" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.lastVisited" style="font-size: 12px; color: #909399;">
            {{ formatDate(row.lastVisited) }}
          </span>
          <span v-else style="color: #c0c4cc;">-</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('table.tags')" width="200" align="center">
        <template #default="{ row }">
          <el-tag
            v-for="tag in (row.tags || [])"
            :key="tag"
            size="small"
            type="info"
            style="margin-right: 5px; margin-bottom: 3px;"
          >
            {{ tag }}
          </el-tag>
          <span v-if="!row.tags || row.tags.length === 0" style="color: #c0c4cc;">-</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('table.action')" width="200" align="center" fixed="right">
        <template #default="{ row }">
          <el-button 
            type="primary" 
            size="small" 
            :icon="EditIcon"
            @click="$emit('edit', row)"
          >
            {{ t('table.edit') }}
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            :icon="DeleteIcon"
            @click="$emit('delete', row)"
          >
            {{ t('table.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Batch Actions Footer -->
    <div v-if="selectedItems.length > 0" class="batch-actions-footer glass-effect">
      <span class="selected-count">{{ t('table.selectedCount', { count: selectedItems.length }) }}</span>
      <div class="actions">
        <el-dropdown @command="handleBatchMove">
          <el-button type="primary" size="small">
            {{ t('table.batchMove') }} <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item 
                v-for="cat in categories" 
                :key="cat.id" 
                :command="cat.id"
              >
                {{ cat.name }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="danger" size="small" :icon="DeleteIcon" @click="handleBatchDelete">{{ t('table.batchDelete') }}</el-button>
        <el-button type="warning" size="small" :loading="checking" @click="handleCheckLinks">{{ t('table.checkLinks') }}</el-button>
        <el-button size="small" @click="clearSelection">{{ t('table.cancel') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Edit, Delete, ArrowDown, Loading } from '@element-plus/icons-vue';
import { Category, Item } from '@/types';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useAdminStore } from '@/store/admin';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const EditIcon = Edit;
const DeleteIcon = Delete;

const props = defineProps<{
  items: Item[];
  categories: Category[];
}>();

const emit = defineEmits<{
  (e: 'edit', item: Item): void;
  (e: 'delete', item: Item): void;
  (e: 'batch-delete', ids: number[]): void;
  (e: 'batch-move', ids: number[], categoryId: number): void;
}>();

const adminStore = useAdminStore();
const linkStatus = reactive<Record<string, string>>({});
const checking = ref(false);

const selectedItems = ref<Item[]>([]);

const handleSelectionChange = (val: Item[]) => {
  selectedItems.value = val;
};

const clearSelection = () => {
  selectedItems.value = [];
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(t('table.deleteConfirm', { count: selectedItems.value.length }), t('common.warning'), {
    type: 'warning',
    confirmButtonText: t('table.confirm'),
    cancelButtonText: t('table.cancel')
  }).then(() => {
    emit('batch-delete', selectedItems.value.map(i => i.id));
    selectedItems.value = [];
  });
};

const handleBatchMove = (categoryId: number) => {
  emit('batch-move', selectedItems.value.map(i => i.id), categoryId);
  ElMessage.success(t('table.moveSuccess'));
  selectedItems.value = [];
};

// 批量检查链接健康状态
const handleCheckLinks = async () => {
  if (selectedItems.value.length === 0) return;
  
  checking.value = true;
  const urls = selectedItems.value.map(item => item.url);
  
  // 先设置为 checking 状态
  urls.forEach(url => { linkStatus[url] = 'checking'; });
  
  try {
    const response = await fetch('/api/check-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminStore.token}`
      },
      body: JSON.stringify({ urls })
    });
    
    const data = await response.json();
    
    if (data.results) {
      data.results.forEach((result: { url: string; status: string }) => {
        linkStatus[result.url] = result.status;
      });
      
      const errorCount = data.results.filter((r: { status: string }) => r.status === 'error').length;
      if (errorCount === 0) {
        ElMessage.success(t('table.checkSuccess'));
      } else {
        ElMessage.warning(t('table.checkInvalid', { count: errorCount }));
      }
    }
  } catch (err) {
    ElMessage.error(t('table.checkFail'));
    urls.forEach(url => { delete linkStatus[url]; });
  } finally {
    checking.value = false;
  }
};

const getCategoryName = (categoryId: number) => {
  if (categoryId === 0) return '无分类';
  return props.categories.find((cat: Category) => cat.id === categoryId)?.name || t('userLevel.unknown');
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return t('time.justNow');
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return t('time.minutesAgo', { n: minutes });
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return t('time.hoursAgo', { n: hours });
  }
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return t('time.daysAgo', { n: days });
  }
  return date.toLocaleDateString();
};
</script>

<style scoped lang="scss">
.site-table-container {
  position: relative;
}

.batch-actions-footer {
  position: sticky;
  bottom: 0px;
  left: 0;
  right: 0;
  z-index: 10;
  margin-top: 10px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);

  .selected-count {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .actions {
    display: flex;
    gap: 12px;
  }
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}
</style>
