import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAdminStore } from '@/store/admin';
import { Category, Item } from '@/types';
import { useI18n } from 'vue-i18n';

export function useAdminDashboard() {
  const adminStore = useAdminStore();
  const { t } = useI18n();

  const loading = ref(false);
  const saving = ref(false);
  const activeTab = ref('categories');

  // 数据
  const categories = ref<Category[]>([]);
  const items = ref<Item[]>([]);

  // 筛选
  const filterCategory = ref(0);
  const searchKeyword = ref('');

  // 对话框
  const categoryDialogVisible = ref(false);
  const itemDialogVisible = ref(false);
  const isEdit = ref(false);

  // 表单
  const categoryForm = ref<Partial<Category>>({});
  const itemForm = ref<Partial<Item>>({});

  // 计算属性
  const filteredItems = computed(() => {
    let result = items.value;

    // 按分类筛选
    if (filterCategory.value !== 0) {
      result = result.filter((item: Item) => item.categoryId === filterCategory.value);
    }

    // 按关键词搜索
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.toLowerCase().trim();
      result = result.filter((item: Item) =>
        item.name.toLowerCase().includes(keyword) ||
        item.url.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
      );
    }

    return result;
  });

  // 加载数据
  const loadData = async () => {
    loading.value = true;
    try {
      const data = await adminStore.getFileContent();
      if (data && data.content) {
        categories.value = data.content.categories;

        // 数据去重：防止重复 ID 导致后台页面显示异常
        const seenIds = new Set();
        items.value = (data.content.items || []).filter((item: Item) => {
          if (!item.id || seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });
        ElMessage.success(t('notification.dataLoaded'));
      }
    } catch (error: any) {
      ElMessage.error(error.message || t('common.error'));
    } finally {
      loading.value = false;
    }
  };

  // 保存数据
  const handleSave = async () => {
    try {
      await ElMessageBox.confirm(
        t('common.confirm'),
        t('common.warning'),
        {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning',
        }
      );

      saving.value = true;

      const content = {
        categories: categories.value,
        items: items.value,
      };

      await adminStore.updateFileContent(content);

      ElMessage.success(t('common.success'));

      // 重新加载数据
      await loadData();
    } catch (error: any) {
      if (error !== 'cancel') {
        ElMessage.error(error.message || t('common.fail'));
      }
    } finally {
      saving.value = false;
    }
  };

  // 分类操作
  const handleAddCategory = () => {
    isEdit.value = false;
    categoryForm.value = {
      id: Math.max(...categories.value.map((c: Category) => c.id), 0) + 1,
      name: '',
      private: false,
    };
    categoryDialogVisible.value = true;
  };

  const handleEditCategory = (row: Category) => {
    isEdit.value = true;
    categoryForm.value = { ...row };
    categoryDialogVisible.value = true;
  };

  const getItemCountByCategory = (categoryId: number) => {
    return items.value.filter((item: Item) => item.categoryId === categoryId).length;
  };

  const handleDeleteCategory = async (row: Category) => {
    try {
      const count = getItemCountByCategory(row.id);
      if (count > 0) {
        ElMessage.warning(`该分类下还有 ${count} 个网站，请先删除网站`);
        return;
      }

      await ElMessageBox.confirm(
        t('category.deleteConfirm'),
        t('common.delete'),
        {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning',
        }
      );

      categories.value = categories.value.filter((cat: Category) => cat.id !== row.id);
      ElMessage.success(t('category.deleteSuccess'));
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error(t('common.fail'));
      }
    }
  };

  const saveCategory = () => {
    if (!categoryForm.value.name) {
      ElMessage.warning(t('category.placeholderName'));
      return;
    }

    if (isEdit.value) {
      const index = categories.value.findIndex((cat: Category) => cat.id === categoryForm.value.id);
      if (index !== -1) {
        categories.value[index] = categoryForm.value as Category;
      }
    } else {
      categories.value.push(categoryForm.value as Category);
    }

    categoryDialogVisible.value = false;
    ElMessage.success(isEdit.value ? t('category.updateSuccess') : t('category.addSuccess'));
  };

  // 网站操作
  const handleAddItem = () => {
    isEdit.value = false;
    itemForm.value = {
      id: Math.max(...items.value.map((i: Item) => i.id), 0) + 1,
      name: '',
      url: '',
      description: '',
      categoryId: categories.value[0]?.id || 1,
      private: false,
    };
    itemDialogVisible.value = true;
  };

  const handleEditItem = (row: Item) => {
    isEdit.value = true;
    itemForm.value = { ...row };
    itemDialogVisible.value = true;
  };

  const handleDeleteItem = async (row: Item) => {
    try {
      await ElMessageBox.confirm(
        t('table.deleteConfirm', { count: 1 }),
        t('common.delete'),
        {
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          type: 'warning',
        }
      );

      items.value = items.value.filter((item: Item) => item.id !== row.id);
      ElMessage.success(t('table.deleteSuccess'));
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error(t('common.fail'));
      }
    }
  };

  const saveItem = () => {
    if (!itemForm.value.name || !itemForm.value.url || !itemForm.value.categoryId) {
      ElMessage.warning(t('common.tips'));
      return;
    }

    if (isEdit.value) {
      const index = items.value.findIndex((item: Item) => item.id === itemForm.value.id);
      if (index !== -1) {
        items.value[index] = itemForm.value as Item;
      }
    } else {
      items.value.push(itemForm.value as Item);
    }

    itemDialogVisible.value = false;
    ElMessage.success(isEdit.value ? t('category.updateSuccess') : t('category.addSuccess'));
  };

  // 批量操作
  const handleBatchDelete = (ids: number[]) => {
    items.value = items.value.filter((item: Item) => !ids.includes(item.id));
    ElMessage.success(t('table.deleteSuccess'));
  };

  const handleBatchMove = (ids: number[], categoryId: number) => {
    items.value = items.value.map((item: Item) => {
      if (ids.includes(item.id)) {
        return { ...item, categoryId };
      }
      return item;
    });
    ElMessage.success(t('table.moveSuccess'));
  };

  return {
    loading,
    saving,
    activeTab,
    categories,
    items,
    filterCategory,
    searchKeyword,
    categoryDialogVisible,
    itemDialogVisible,
    isEdit,
    categoryForm,
    itemForm,
    filteredItems,
    loadData,
    handleSave,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
    saveCategory,
    handleAddItem,
    handleEditItem,
    handleDeleteItem,
    saveItem,
    handleBatchDelete,
    handleBatchMove,
  };
}
