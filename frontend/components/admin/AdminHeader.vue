<template>
  <header class="main-header glass-effect">
    <div class="header-left">
      <el-button v-if="isMobile" circle :icon="MenuIcon" @click="$emit('open-sidebar')" />
      <h2 class="view-title">{{ currentViewLabel }}</h2>
    </div>
    <div class="header-actions">
      <el-dropdown trigger="click" @command="handleLangCommand" class="lang-dropdown">
        <el-button plain class="hover-scale">
          <i class="iconfont icon-md-globe" style="margin-right: 4px;"></i> {{ currentLang }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="zh-CN">简体中文</el-dropdown-item>
            <el-dropdown-item command="en-US">English</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

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

const currentLang = computed(() => {
  return getLocale() === 'zh-CN' ? '简体中文' : 'English';
});

const handleLangCommand = (command: string | number | object) => {
  const lang = command as 'zh-CN' | 'en-US';
  if (lang === getLocale()) return;
  setLocale(lang);
  ElMessage.success(lang === 'zh-CN' ? '已切换至中文' : 'Switched to English');
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
