<template>
  <el-table :data="categories" border stripe>
    <el-table-column prop="id" :label="t('table.id')" width="80" align="center" />
    <el-table-column prop="name" :label="t('table.name')" align="center" />
    <el-table-column :label="t('table.visibility')" width="100" align="center">
      <template #default="{ row }">
        <el-tag :type="row.private ? 'danger' : 'success'" effect="plain">
          {{ row.private ? t('table.private') : t('table.public') }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column :label="t('table.siteCount')" width="120" align="center">
      <template #default="{ row }">
        <el-tag size="small">{{ getItemCount(row.id) }}</el-tag>
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
</template>

<script setup lang="ts">
import { Edit, Delete } from '@element-plus/icons-vue';
import { Category, Item } from '@/types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const EditIcon = Edit;
const DeleteIcon = Delete;

const props = defineProps<{
  categories: Category[];
  items: Item[];
}>();

const emit = defineEmits<{
  (e: 'edit', category: Category): void;
  (e: 'delete', category: Category): void;
}>();

const getItemCount = (categoryId: number) => {
  return props.items.filter(item => item.categoryId === categoryId).length;
};
</script>
