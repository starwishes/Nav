<template>
  <el-dialog 
    v-model="visible" 
    :title="form.id && isEdit ? t('site.edit') : t('site.add')"
    width="600px"
    class="mobile-dialog"
    @close="$emit('update:modelValue', false)"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item :label="t('site.id')">
        <el-input-number 
          v-model="form.id" 
          :min="1" 
          :disabled="isEdit"
        />
      </el-form-item>

      <el-form-item :label="t('site.name')">
        <el-input v-model="form.name" :placeholder="t('site.placeholderName')" />
      </el-form-item>

      <el-form-item :label="t('site.url')">
        <el-input v-model="form.url" :placeholder="t('site.placeholderUrl')" />
      </el-form-item>

      <el-form-item :label="t('site.description')">
        <el-input 
          v-model="form.description" 
          type="textarea" 
          :rows="3"
          :placeholder="t('site.placeholderDesc')" 
        />
      </el-form-item>

      <el-form-item :label="t('site.category')">
        <el-select v-model="form.categoryId" :placeholder="t('site.placeholderCategory')">
          <el-option 
            v-for="cat in categories" 
            :key="cat.id" 
            :label="cat.name" 
            :value="cat.id" 
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="t('site.private')">
        <el-switch 
          v-model="form.private" 
          :active-text="t('category.private')" 
          :inactive-text="t('category.public')" 
        />
      </el-form-item>

      <el-form-item :label="t('site.permission')">
         <el-select v-model="form.level" :placeholder="t('category.permissionPlaceholder')">
           <el-option :label="t('userLevel.guest') + ' (' + t('category.public') + ')'" :value="0" />
           <el-option :label="t('userLevel.user')" :value="1" />
           <el-option :label="t('userLevel.vip')" :value="2" />
           <el-option :label="t('userLevel.admin')" :value="3" />
         </el-select>
      </el-form-item>

      <el-form-item :label="t('site.tags')">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          default-first-option
          :placeholder="t('site.placeholderTags')"
          style="width: 100%"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
        <div style="margin-top: 5px; font-size: 12px; color: #909399;">
          {{ t('site.tagsTip') }}
        </div>
      </el-form-item>

      <el-form-item :label="t('site.pinned')">
        <el-switch 
          v-model="form.pinned" 
          :active-text="t('site.pinnedText')" 
          :inactive-text="t('site.defaultText')" 
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="$emit('save')">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { Item, Category } from '@/types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  form: Partial<Item>;
  categories: Category[];
  isEdit: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save'): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

// 从所有书签中提取可用标签
const availableTags = computed(() => {
  const tags = new Set<string>();
  if (props.form.tags) {
    props.form.tags.forEach(tag => tags.add(tag));
  }
  return Array.from(tags);
});

// 确保 tags 字段初始化
watch(() => props.form, (newForm) => {
  if (newForm && !newForm.tags) {
    newForm.tags = [];
  }
}, { immediate: true });
</script>