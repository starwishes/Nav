<template>
  <div id="js-home-site" class="home-site">
    <!-- 标签筛选栏 -->
    <TagFilterBar 
      v-if="!loading" 
      :all-tags="allTags" 
      :selected-tags="selectedTags"
      @toggle-tag="toggleTag"
      @clear-tags="clearTags"
    />

    <!-- Loading State -->
    <div v-if="loading" class="site-container loading-state">
      <div class="category-section">
        <div class="site-item glass-panel">
          <header class="category-header" style="opacity: 0.6">
            <el-skeleton-item variant="rect" style="width: 24px; height: 24px; border-radius: 4px" />
            <el-skeleton-item variant="text" style="width: 150px; height: 24px" />
          </header>
          <ul>
            <li v-for="i in 12" :key="i" class="site-wrapper">
              <div class="site-card glass-card skeleton-card">
                <el-skeleton animated style="width: 100%">
                  <template #template>
                    <div style="display: flex; gap: 12px; align-items: center; padding: 4px 0;">
                      <el-skeleton-item variant="image" style="width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0" />
                      <div style="flex: 1; display: flex; flex-direction: column; gap: 8px; overflow: hidden">
                        <el-skeleton-item variant="text" style="width: 60%; height: 16px" />
                        <el-skeleton-item variant="text" style="width: 90%; height: 12px" />
                      </div>
                    </div>
                  </template>
                </el-skeleton>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <div v-else-if="dataValue.length === 0" class="site-container">
      <el-empty description="暂无数据" />
    </div>

    <!-- 列表主渲染区 -->
    <template v-else>
      <section 
        v-for="(category, catIndex) in dataValue" 
        :key="category.id" 
        class="category-section"
        :data-cat-index="catIndex" 
        :id="`site-anchor-${category.name}`"
      >
        <SiteCategory
          :category="category"
          :cat-index="catIndex"
          :move-state="moveState"
          :show-add="adminStore.isAuthenticated"
          @header-click="(e) => handleCategoryClick(catIndex, e)"
          @header-contextmenu="(e) => showCategoryContextMenu(e, category, catIndex)"
          @add-item="handleAddItem"
          @item-mouseenter="(itemIndex) => handleMouseEnter(catIndex, itemIndex)"
          @item-click="({ item, event }) => handleItemClick(item, event)"
          @item-contextmenu="({ item, itemIndex, event }) => showContextMenu(event, item, catIndex, itemIndex)"
          @item-touchstart="({ item, itemIndex, event }) => handleTouchStart(event, item, catIndex, itemIndex)"
        />
      </section>
    </template>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <template v-if="contextMenu.item">
        <div class="menu-item" @click="togglePin">
          <el-icon v-if="contextMenu.item?.pinned"><Bottom /></el-icon>
          <el-icon v-else><Top /></el-icon>
          {{ contextMenu.item?.pinned ? t('context.unpin') : t('context.pin') }}
        </div>
        <div class="menu-item" @click="startMove"><el-icon><Rank /></el-icon> {{ t('context.move') }}</div>
        <div class="menu-item" @click="handleEdit"><el-icon><Edit /></el-icon> {{ t('common.edit') }}</div>
        <div class="menu-item delete" @click="handleDelete"><el-icon><Delete /></el-icon> {{ t('common.delete') }}</div>
      </template>
      <template v-else-if="contextMenu.category">
        <div class="menu-item" :class="{ disabled: isFirstCategory }" @click="!isFirstCategory && moveCategory(-1)">
          <el-icon><SortUp /></el-icon> {{ t('context.moveUp') }}
        </div>
        <div class="menu-item" :class="{ disabled: isLastCategory }" @click="!isLastCategory && moveCategory(1)">
          <el-icon><SortDown /></el-icon> {{ t('context.moveDown') }}
        </div>
      </template>
    </div>

    <!-- 编辑对话框 -->
    <SiteDialog
      v-model="showEditDialog"
      :form="editForm"
      :categories="availableCategories"
      :is-edit="isEditMode"
      @save="saveSite"
    />

    <!-- 拖拽随动幻影素 -->
    <div
      v-if="moveState.active && moveState.item"
      class="ghost-element"
      :style="{ top: moveState.y + 'px', left: moveState.x + 'px' }"
    >
      <SiteCard 
        :item="moveState.item" 
        :favicon-url="`${Favicon}${moveState.item.url}`" 
      />
      <div class="move-tip">点击目标位置放置</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Rank, Edit, Delete, Top, Bottom, 
  View, Hide, SortUp, SortDown 
} from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useDataStore } from '@/store/data';
import { useMainStore } from '@/store';
import { useAdminStore } from '@/store/admin';
import { storeToRefs } from 'pinia';
import { Favicon } from '@/config';
import { openUrl as utilsOpenUrl } from '@/utils';

// Composables
import { useSiteMenu, useSiteDrag, useSiteFilter } from '@/composables'; // Ensure index.ts exists

import TagFilterBar from './TagFilterBar.vue';
import SiteCard from './SiteCard.vue';
import SiteCategory from './SiteCategory.vue';
import SiteDialog from '@/components/SiteDialog.vue';

const { t } = useI18n()
const adminStore = useAdminStore();
const mainStore = useMainStore();
const dataStore = useDataStore();
const { loading } = storeToRefs(dataStore);

const emit = defineEmits(['loaded']);

// 1. Menu Logic
const { contextMenu, showContextMenu, showCategoryContextMenu, closeContextMenu } = useSiteMenu();

// 2. Drag Logic
// Pass a getter to resolve circular dependency with filteredData
const { 
    moveState, 
    startMove, 
    handleMouseEnter, 
    handleTouchStart, 
    handleMouseDragUp 
} = useSiteDrag(() => filteredData.value);

// 3. Filter Logic
const { 
    selectedTags, 
    allTags, 
    filteredData, 
    toggleTag, 
    clearTags 
} = useSiteFilter(moveState);

// Alias for template compatibility
const dataValue = filteredData;

// --- Dialog & Actions ---
const showEditDialog = ref(false)
const isEditMode = ref(false)
const editForm = ref({})
const availableCategories = computed(() => dataStore.categories.map(c => ({ id: c.id, name: c.name })));

const handleItemClick = async (item, e) => {
  if (moveState.active) { 
      await handleMouseDragUp(); 
      return; 
  }
  utilsOpenUrl(item.url);
};

const handleCategoryClick = (catIndex, event) => {}

// Wrapper for startMove to bridge contextMenu and drag logic
const onStartMove = () => {
    const { item, catIndex, itemIndex, x, y } = contextMenu;
    // Pass callback to close menu
    startMove(item, catIndex, itemIndex, x, y, closeContextMenu);
};

// --- Context Menu Actions ---
const togglePin = async () => {
    if (!contextMenu.item) return;
    try { await dataStore.updateItem({ id: contextMenu.item.id, pinned: !contextMenu.item.pinned }); closeContextMenu(); } catch (e) {}
};

const moveCategory = async (dir) => {
    if (!contextMenu.category) return;
    const catId = contextMenu.category.id;
    const currentRealIndex = dataStore.categories.findIndex(c => c.id === catId);
    if (currentRealIndex === -1) return;
    await dataStore.moveCategory(currentRealIndex, currentRealIndex + dir);
    closeContextMenu();
};

const isFirstCategory = computed(() => {
    if (!contextMenu.category) return false;
    const idx = dataStore.categories.findIndex(c => c.id === contextMenu.category.id);
    return idx <= 0;
});

const isLastCategory = computed(() => {
    if (!contextMenu.category) return false;
    const idx = dataStore.categories.findIndex(c => c.id === contextMenu.category.id);
    return idx >= dataStore.categories.length - 1;
});

const handleAddItem = (categoryId) => {
    const finalCatId = categoryId || (dataStore.categories.length > 0 ? dataStore.categories[0].id : 0);
    editForm.value = {
        name: '',
        url: '',
        description: '',
        categoryId: finalCatId,
        level: 0,
        tags: []
    };
    isEditMode.value = false;
    showEditDialog.value = true;
};

const handleEdit = () => { 
    editForm.value = { ...contextMenu.item }; 
    isEditMode.value = true; 
    showEditDialog.value = true; 
    closeContextMenu(); 
};

const saveSite = async (formData) => {
    try { 
        if (isEditMode.value) {
            await dataStore.updateItem(formData); 
            ElMessage.success('更新成功'); 
        } else {
            await dataStore.addItem(formData);
            ElMessage.success('添加成功');
        }
        showEditDialog.value = false; 
    } catch (e) { ElMessage.error('操作失败'); }
};

const handleDelete = async () => {
    try { 
        await ElMessageBox.confirm('确定删除吗？', '提示', { type: 'warning' }); 
        await dataStore.deleteItem(contextMenu.item.id); 
        closeContextMenu(); 
        ElMessage.success('删除成功'); 
    } catch (e) {}
};

const handleDeleteCategory = async () => {
   // Logic for deleting category if needed in context menu?
   // The original Site.vue didn't have delete category in menu shown in snippet.
};

onMounted(async () => {
    await dataStore.loadData();
    emit('loaded');
});

defineExpose({
    handleAddItem
});
</script>

<style scoped lang="scss">
.home-site {
  padding: 20px;
  min-height: calc(100vh - 120px);
  user-select: none;
}
.category-section { margin-bottom: 40px; }
.context-menu {
  position: fixed; z-index: 1000; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px; padding: 6px; min-width: 140px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  .menu-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px; font-size: 13px; color: var(--gray-700); cursor: pointer; border-radius: 6px; transition: all 0.2s;
    &:hover { background: rgba(var(--ui-theme-rgb), 0.1); color: var(--ui-theme); }
    &.delete:hover { background: #fee2e2; color: #dc2626; }
    &.disabled { opacity: 0.4; cursor: not-allowed; }
    .el-icon { font-size: 16px; }
  }
}
.ghost-element {
  position: fixed; pointer-events: none; z-index: 9999; width: 200px; opacity: 0.9; transform: rotate(3deg);
  .move-tip { margin-top: 8px; text-align: center; font-size: 12px; color: var(--ui-theme); background: rgba(255,255,255,0.8); padding: 4px; border-radius: 4px; }
}
.skeleton-card {
  padding: 12px; height: 100%; display: flex !important; align-items: center;
  :deep(.el-skeleton) { height: auto; }
}
:root[theme-mode='dark'] {
  .context-menu { background: rgba(30, 30, 30, 0.9); border-color: rgba(255, 255, 255, 0.1); .menu-item { color: #ccc; } }
}
</style>
