<template>
  <div class="data-manager fade-in">
    <div class="toolbar-card glass-card">
      <el-tabs v-model="internalActiveTab" class="content-tabs">
        <el-tab-pane label="分类管理" name="categories" />
        <el-tab-pane label="网站管理" name="items" />
      </el-tabs>
      <div class="global-actions">
        <el-button type="success" :loading="saving" @click="$emit('save')" class="hover-scale">
          <el-icon><Upload /></el-icon> 保存并同步
        </el-button>
        <el-button type="info" @click="handleExport" class="hover-scale">导出 JSON</el-button>
        <el-button type="warning" @click="triggerImport" class="hover-scale">导入 JSON</el-button>
        <el-button type="success" @click="$emit('show-bookmark-import')" class="hover-scale">导入浏览器书签</el-button>
        <input type="file" ref="fileInput" style="display: none" accept=".json" @change="handleImport" />
      </div>
    </div>

    <div v-if="internalActiveTab === 'categories'" class="tab-content transition-box">
      <el-card shadow="never" class="glass-card table-wrapper">
        <template #header>
          <div class="card-header">
            <span>分类列表</span>
            <el-button type="primary" :icon="Plus" @click="$emit('add-category')">添加分类</el-button>
          </div>
        </template>
        <CategoryTable 
          :categories="categories" 
          :items="items" 
          @edit="(cat) => $emit('edit-category', cat)" 
          @delete="(id) => $emit('delete-category', id)" 
        />
      </el-card>
    </div>

    <div v-if="internalActiveTab === 'items'" class="tab-content transition-box">
      <el-card shadow="never" class="glass-card table-wrapper">
        <template #header>
          <div class="card-header">
            <span>网站列表（{{ filteredItems.length }})</span>
            <div class="header-filters">
              <el-input 
                v-model="searchKeyword" 
                placeholder="搜索..." 
                clearable 
                style="width: 200px;" 
                @input="updateSearch"
              />
              <el-select 
                v-model="filterCategory" 
                placeholder="全部分类" 
                clearable 
                style="width: 150px;"
                @change="updateFilter"
              >
                <el-option label="全部分类" :value="0" />
                <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
              </el-select>
              <el-button type="primary" :icon="Plus" @click="$emit('add-item')">添加网站</el-button>
            </div>
          </div>
        </template>
        <SiteTable 
          :items="filteredItems" 
          :categories="categories" 
          @edit="(item) => $emit('edit-item', item)" 
          @delete="(id) => $emit('delete-item', id)" 
          @batch-delete="(ids) => $emit('batch-delete', ids)" 
          @batch-move="(data) => $emit('batch-move', data)" 
        />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Upload, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import CategoryTable from '@/components/CategoryTable.vue';
import SiteTable from '@/components/SiteTable.vue';

const props = defineProps<{
  activeTab: string;
  saving: boolean;
  categories: any[];
  items: any[];
  filteredItems: any[];
  filterCategory: number;
  searchKeyword: string;
}>();

const emit = defineEmits([
  'update:activeTab', 'update:searchKeyword', 'update:filterCategory',
  'save', 'add-category', 'edit-category', 'delete-category',
  'add-item', 'edit-item', 'delete-item', 'batch-delete', 'batch-move',
  'show-bookmark-import', 'json-import'
]);

const internalActiveTab = ref(props.activeTab);
const fileInput = ref<HTMLInputElement | null>(null);
const searchKeyword = ref(props.searchKeyword);
const filterCategory = ref(props.filterCategory);

watch(() => props.activeTab, (val) => internalActiveTab.value = val);
watch(internalActiveTab, (val) => emit('update:activeTab', val));

const updateSearch = (val: string) => emit('update:searchKeyword', val);
const updateFilter = (val: number) => emit('update:filterCategory', val);

const handleExport = () => {
  const data = { content: { categories: props.categories, items: props.items } };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `starnav-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success('导出成功');
};

const triggerImport = () => fileInput.value?.click();

const handleImport = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const json = JSON.parse(event.target?.result as string);
      if (json.content?.categories && json.content?.items) {
        emit('json-import', json.content);
        ElMessage.success('导入成功，请点击“保存并同步”');
      }
    } catch (err) { ElMessage.error('导入失败'); }
    finally { target.value = ''; }
  };
  reader.readAsText(file);
};
</script>

<style scoped lang="scss">
.toolbar-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  margin-bottom: 20px;
  .global-actions { display: flex; gap: 8px; flex-wrap: wrap; }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .header-filters { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
}

.fade-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
