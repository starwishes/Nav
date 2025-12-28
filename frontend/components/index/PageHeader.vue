<template>
  <div class="head" :class="{headsp: change}">
    <div class="drawer-trigger" @click="showDrawer">
      <i class="iconfont icon-md-menu"></i>
    </div>
    <ul class="menu">
      <li @click="handleHomeClick">
        <div class="menu-item">
          <i class="iconfont icon-md-home"></i>
          {{ t('nav.home') }}
        </div>
      </li>
    </ul>
    <Clock class="clock-component"></Clock>
    <div class="flex-grow" />
    
    <template v-if="adminStore.isAuthenticated">
      <div class="admin-menu-item" @click="goToAdmin">
        <i class="iconfont icon-md-lock"></i>
        <span class="admin-text">{{ t('nav.admin') }}</span>
      </div>
      <div class="admin-menu-item logout-btn" @click="handleLogout">
        <i class="iconfont icon-md-log-out"></i>
        <span class="admin-text">{{ t('nav.logout') }}</span>
      </div>
    </template>
    <template v-else>
      <div class="admin-menu-item" @click="showLoginDialog = true">
        <i class="iconfont icon-md-contact"></i>
        <span class="admin-text">{{ t('nav.login') }}</span>
      </div>
    </template>

    <div class="lang-toggle admin-menu-item" style="margin-right: 16px;" @click="toggleLang">
      <span class="translate-icon" v-html="langIcon"></span>
    </div>
  </div>
  <LeftDrawer></LeftDrawer>
  <LoginDialog v-model="showLoginDialog" />
</template>
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getLocale, setLocale } from '@/plugins/i18n';
import Clock from './Clock.vue';
import LeftDrawer from './LeftDrawer.vue';
import LoginDialog from '@/components/admin/LoginDialog.vue';
import { useMainStore } from '@/store';
import { useAdminStore } from '@/store/admin';
import { ElMessage } from 'element-plus';
import { Moon, Sunny, ArrowDown } from '@element-plus/icons-vue';

const { t } = useI18n();

const change = ref(false)
const store = useMainStore()
const router = useRouter()
const adminStore = useAdminStore()
const scrollHeight = ref(0);
const showLoginDialog = ref(false);
const themeMode = ref('light');

const langIcon = computed(() => {
  return getLocale() === 'zh-CN' ? '文<sub>A</sub>' : 'A<sub>文</sub>';
});

const toggleLang = () => {
  const newLang = getLocale() === 'zh-CN' ? 'en-US' : 'zh-CN';
  setLocale(newLang);
  ElMessage.success(newLang === 'zh-CN' ? '已切换至中文' : 'Switched to English');
};

const toggleTheme = () => {
  themeMode.value = themeMode.value === 'light' ? 'dark' : 'light';
  applyTheme();
};

const applyTheme = () => {
  document.documentElement.setAttribute('theme-mode', themeMode.value);
  localStorage.setItem('theme-mode', themeMode.value);
  // Also toggle element-plus dark mode if needed
  if (themeMode.value === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const showDrawer = () => {
  store.$state.isShowDrawer = true
}

const goToAdmin = () => {
  router.push('/admin/dashboard')
}

const handleHomeClick = () => {
  const homeUrl = store.settings?.homeUrl;
  if (homeUrl && (homeUrl.startsWith('http') || homeUrl.startsWith('//'))) {
    window.location.href = homeUrl;
  } else if (homeUrl) {
    router.push(homeUrl);
  } else {
    // 默认行为：如果是首页则刷新，否则跳到首页
    if (router.currentRoute.value.path === '/') {
      window.location.reload();
    } else {
      router.push('/');
    }
  }
};

const handleLogout = () => {
  adminStore.clearAuth()
  ElMessage.success(t('auth.logoutSuccess'))
}
const handleScroll = () => {
  scrollHeight.value = window.scrollY;

  if (scrollHeight.value > 30) {
    change.value = true;
  } else {
    change.value = false;
  }
};

const fetchSettings = async () => {
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    store.settings = data;
  } catch (err) {
    console.error('获取系统设置失败', err);
  }
};

onMounted(() => {
  fetchSettings();
  window.addEventListener('scroll', handleScroll);
  const savedTheme = localStorage.getItem('theme-mode') || 'light';
  themeMode.value = savedTheme;
  applyTheme();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

</script>
<style lang="scss" scoped>
.head {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  height: 75px;
  line-height: 75px;
  padding: 0 30px 0 24px;
  background-color: transparent;
  z-index: 999;
  color: #fff;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;

  .drawer-trigger {
    cursor: pointer;
    margin-right: 20px;
    display: flex;
    align-items: center;
    .iconfont {
      font-size: 24px;
    }
  }

  .menu {
    display: flex;
    .menu-item {
      margin-right: 20px;
      display: flex;
      align-items: center;
      .iconfont {
        margin-right: 5px;
      }
    }
  }

  .admin-menu-item {
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0 8px;
    border-radius: 8px;
    transition: all 0.3s ease;
    white-space: nowrap;
    
    .iconfont {
      font-size: 18px;
    }
    
    .admin-text {
      margin-left: 6px;
      font-size: 14px;
      font-weight: 500;
    }
    
    &.logout-btn {
      margin-left: 8px;
      &:hover {
        background-color: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
      }
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }
  }

  .flex-grow {
    flex-grow: 1;
  }

  @media screen and (max-width: 768px) {
    padding: 0 20px;
    height: 60px;
    line-height: 60px;
    
    .drawer-trigger {
      margin-right: 15px;
    }
  }

  @media screen and (max-width: 480px) {
    padding: 0 15px;
    
    .admin-menu-item {
      // padding: 0 10px;
      .admin-text {
        display: none;
      }
    }
  }
}

.headsp {
  background-color: var(--gray-o8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--gray-900);
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.2);
  height: 64px;
  line-height: 64px;
  
  .admin-menu-item {
    &:hover {
      background-color: var(--gray-o1);
    }
  }
}

.translate-icon {
  font-size: 16px;
  font-weight: 500;
  color: inherit;
  sub {
    font-size: 12px;
    margin-left: 1px;
  }
}

.dropdown-arrow {
  font-size: 12px;
  margin-left: 2px;
  opacity: 0.7;
}
</style>
