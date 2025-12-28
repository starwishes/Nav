<template>
  <el-dialog 
    v-model="visible" 
    :title="form.id && isEdit ? t('category.editCategory') : t('category.addCategory')"
    width="500px"
    class="mobile-dialog"
    @close="$emit('update:modelValue', false)"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item :label="t('category.id')">
        <el-input-number 
          v-model="form.id" 
          :min="1" 
          :disabled="isEdit"
        />
      </el-form-item>
      <el-form-item :label="t('category.name')">
        <el-input v-model="form.name" :placeholder="t('category.placeholderName')" />
      </el-form-item>
      <el-form-item :label="t('category.hide')">
        <el-switch v-model="form.private" :active-text="t('category.private')" :inactive-text="t('category.public')" />
      </el-form-item>
      <el-form-item :label="t('category.permission')">
        <el-select v-model="form.level" :placeholder="t('category.permissionPlaceholder')">
           <el-option :label="t('userLevel.guest') + ' (' + t('category.public') + ')'" :value="0" />
           <el-option :label="t('userLevel.user')" :value="1" />
           <el-option :label="t('userLevel.vip')" :value="2" />
           <el-option :label="t('userLevel.admin')" :value="3" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="$emit('save')">{{ t('common.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Category } from '@/types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  modelValue: boolean;
  form: Partial<Category>;
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
</script>
