<template>
  <header class="main-header glass-effect">
    <div class="header-left">
      <el-button v-if="isMobile" circle :icon="MenuIcon" @click="$emit('open-sidebar')" />
      <h2 class="view-title">{{ currentViewLabel }}</h2>
    </div>
    <div class="header-actions">
      <el-button plain class="hover-scale lang-btn" @click="toggleLang">
        <span v-html="langIcon"></span>
      </el-button>

      <el-button @click="$emit('go-home')" plain class="hover-scale">
        <el-icon><HomeFilled /></el-icon> {{ t('nav.home') }}
      </el-button>
      <el-button type="primary" :loading="loading" @click="$emit('load-data')" class="hover-scale">
        <el-icon><Refresh /></el-icon> {{ t('common.refresh') }}
      </el-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu as MenuIcon, HomeFilled, Refresh } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getLocale, setLocale } from '@/plugins/i18n';
import { ElMessage } from 'element-plus';
import { computed } from 'vue';

const { t } = useI18n();

const langIcon = computed(() => {
  return getLocale() === 'zh-CN' ? '文<sub>A</sub>' : 'A<sub>文</sub>';
});

const toggleLang = () => {
  const newLang = getLocale() === 'zh-CN' ? 'en-US' : 'zh-CN';
  setLocale(newLang);
  ElMessage.success(newLang === 'zh-CN' ? '已切换至中文' : 'Switched to English');
};

defineProps<{
  isMobile: boolean;
  currentViewLabel: string;
  loading: boolean;
}>();

defineEmits(['open-sidebar', 'go-home', 'load-data']);
</script>

<style scoped lang="scss">
.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-radius: 16px;
  margin-bottom: 24px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    .view-title { font-size: 1.4rem; font-weight: 600; margin: 0; }
  }
  .header-actions { display: flex; gap: 12px; }
}
</style>
