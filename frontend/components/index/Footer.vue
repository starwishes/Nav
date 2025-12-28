<template>
  <footer class="footer">
    <div class="footer-content">
      <div v-if="store.settings.footerHtml" class="custom-footer" v-html="store.settings.footerHtml"></div>
      <div v-else class="copyright">
        &copy; {{ currentYear }} <a href="https://github.com/starwishes/Nav" target="_blank">{{ store.settings.siteName || t('notification.siteName') }}</a>. All Rights Reserved.
      </div>
      <div class="icp" v-if="ICP_NUMBER">
        <a href="https://beian.miit.gov.cn/" target="_blank">{{ ICP_NUMBER }}</a>
      </div>
      <div class="powered">
        Powered by <a href="https://github.com/xia-66/nav" target="_blank">黑羽</a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICP_NUMBER } from '@/config'
import { useI18n } from 'vue-i18n'
import { useMainStore } from '@/store'

const store = useMainStore()
const { t } = useI18n()
const currentYear = computed(() => new Date().getFullYear())
</script>

<style lang="scss" scoped>
.footer {
  width: 100%;
  padding: 20px 0;
  background-color: transparent;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  margin-top: auto;
  
  .footer-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--gray-500);
    font-size: 14px;
    transition: color 0.3s ease;
    
    a {
      color: var(--gray-500);
      text-decoration: none;
      transition: color 0.3s;
      
      &:hover {
        color: var(--ui-theme);
      }
    }

    .powered {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .custom-footer {
      text-align: center;
      line-height: 1.5;
      
      :deep(a) {
        color: var(--gray-500);
        margin: 0 5px;
        text-decoration: none;
        transition: color 0.3s;
        
        &:hover {
          color: var(--ui-theme);
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
