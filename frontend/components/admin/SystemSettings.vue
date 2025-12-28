<template>
  <div class="system-settings">
    <el-form :model="settings" label-width="140px" class="glass-form">
      <el-form-item :label="t('settings.registration')">
        <el-switch v-model="settings.registrationEnabled" />
        <div class="form-tip">{{ t('settings.registrationTip') }}</div>
      </el-form-item>
      <el-form-item :label="t('settings.defaultLevel')">
        <el-select v-model="settings.defaultUserLevel">
          <el-option :label="t('userLevel.user') + ' (1)'" :value="1" />
          <el-option :label="t('userLevel.vip') + ' (2)'" :value="2" />
        </el-select>
        <div class="form-tip">{{ t('settings.defaultLevelTip') }}</div>
      </el-form-item>

      <el-form-item :label="t('settings.homeUrl')">
        <el-input v-model="settings.homeUrl" :placeholder="t('settings.homeUrlPlaceholder')" clearable />
        <div class="form-tip">{{ t('settings.homeUrlTip') }}</div>
      </el-form-item>

      <el-divider />

      <h3 class="section-title">{{ t('settings.siteNameSettings') }}</h3>
      <el-form-item :label="t('settings.siteNameSettings')">
        <el-input v-model="settings.siteName" :placeholder="t('notification.siteName')" />
        <div class="form-tip">{{ t('settings.siteNameTip') }}</div>
      </el-form-item>

      <el-divider />

      <h3 class="section-title">{{ t('settings.footerSettings') }}</h3>
      <el-form-item :label="t('settings.footerHtml')">
        <el-input
          v-model="settings.footerHtml"
          type="textarea"
          :rows="3"
          :placeholder="t('settings.footerPlaceholder')"
        />
        <div class="form-tip">
          {{ t('settings.footerHtmlTip') }}
           <el-button link type="primary" size="small" @click="fillDefaultFooter" style="margin-left: 8px;">
            {{ t('settings.useDefaultTemplate') }}
          </el-button>
        </div>
      </el-form-item>

      <el-divider />

      <el-form-item :label="t('settings.timezone')">
        <el-select v-model="settings.timezone" filterable :placeholder="t('common.tips')">
          <el-option :label="t('timezone.local')" value="" />
          <el-option :label="t('timezone.shanghai')" value="Asia/Shanghai" />
          <el-option :label="t('timezone.tokyo')" value="Asia/Tokyo" />
          <el-option :label="t('timezone.london')" value="Europe/London" />
          <el-option :label="t('timezone.newYork')" value="America/New_York" />
          <el-option :label="t('timezone.losAngeles')" value="America/Los_Angeles" />
          <el-option :label="t('timezone.moscow')" value="Europe/Moscow" />
          <el-option :label="t('timezone.paris')" value="Europe/Paris" />
          <el-option :label="t('timezone.sydney')" value="Australia/Sydney" />
        </el-select>
        <div class="form-tip">{{ t('settings.timezoneTip') }}</div>
      </el-form-item>

      <el-divider>{{ t('settings.bgSettings') }}</el-divider>

      <el-form-item :label="t('settings.bgUrl')">
        <el-input 
          v-model="backgroundUrl" 
          :placeholder="t('settings.bgPlaceholder')"
          clearable
        />
        <div class="form-tip">{{ t('settings.bgUrlTip') }}</div>
      </el-form-item>

      <el-form-item :label="t('settings.upload')">
        <el-upload
          ref="uploadRef"
          action=""
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="handleFileChange"
        >
          <el-button type="success" :loading="uploading">{{ t('settings.uploadBtn') }}</el-button>
        </el-upload>
        <div class="form-tip">{{ t('settings.uploadTip') }}</div>
      </el-form-item>

      <el-form-item v-if="previewUrl" :label="t('settings.preview')">
        <div class="bg-preview" :style="{ backgroundImage: `url(${previewUrl})` }"></div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="saveSettings">{{ t('settings.saveSettings') }}</el-button>
      </el-form-item>

      <!-- 已上传文件列表 -->
      <el-divider>{{ t('settings.uploadedFiles') }}</el-divider>
      
      <el-form-item>
        <el-button size="small" @click="fetchUploadedFiles" :loading="loadingFiles">
          {{ t('settings.refreshList') }}
        </el-button>
      </el-form-item>

      <div v-if="uploadedFiles.length > 0" class="uploaded-files">
        <div v-for="file in uploadedFiles" :key="file.filename" class="file-item">
          <div class="file-preview" :style="{ backgroundImage: `url(${file.url})` }"></div>
          <div class="file-info">
            <div class="file-name">{{ file.filename }}</div>
            <div class="file-meta">{{ formatSize(file.size) }} · {{ formatDate(file.uploadedAt) }}</div>
          </div>
          <div class="file-actions">
            <el-button size="small" type="primary" @click="useAsBackground(file.url)">{{ t('settings.setBg') }}</el-button>
            <el-button size="small" type="danger" @click="deleteFile(file.filename)">{{ t('common.delete') }}</el-button>
          </div>
        </div>
      </div>
      <el-empty v-else-if="!loadingFiles" :description="t('settings.noFiles')" :image-size="60" />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAdminStore } from '@/store/admin';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
}

const props = defineProps<{ initialSettings: any }>();
const emit = defineEmits(['save']);

const adminStore = useAdminStore();
const settings = reactive({ ...props.initialSettings });
const backgroundUrl = ref('');
const uploading = ref(false);
const uploadedFiles = ref<UploadedFile[]>([]);
const loadingFiles = ref(false);

watch(() => props.initialSettings, (val) => {
  Object.assign(settings, val);
  backgroundUrl.value = val.backgroundUrl || '';
}, { deep: true, immediate: true });

const previewUrl = computed(() => backgroundUrl.value || '');

onMounted(() => {
  fetchUploadedFiles();
});

const fetchUploadedFiles = async () => {
  loadingFiles.value = true;
  try {
    const res = await fetch('/api/uploads', {
      headers: { 'Authorization': `Bearer ${adminStore.token}` }
    });
    const data = await res.json();
    uploadedFiles.value = data.files || [];
  } catch (err) {
    console.error('获取上传列表失败', err);
  } finally {
    loadingFiles.value = false;
  }
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

const useAsBackground = async (url: string) => {
  backgroundUrl.value = url;
  await fetch('/api/set-background', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminStore.token}`
    },
    body: JSON.stringify({ url })
  });
  ElMessage.success(t('admin.updateSuccess'));
};

const deleteFile = async (filename: string) => {
  try {
    await ElMessageBox.confirm(t('settings.deleteConfirm'), t('common.confirm'), { type: 'warning' });
    const res = await fetch(`/api/uploads/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminStore.token}` }
    });
    const data = await res.json();
    if (data.success) {
      ElMessage.success(t('admin.deleteSuccess'));
      fetchUploadedFiles();
    } else {
      ElMessage.error(data.error || t('common.fail'));
    }
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(t('common.fail'));
  }
};

const handleFileChange = async (file: any) => {
  if (!file.raw) return;
  
  uploading.value = true;
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64Data = e.target?.result as string;
        const response = await fetch('/api/upload-background', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminStore.token}`
          },
          body: JSON.stringify({ data: base64Data, filename: file.raw.name })
        });
        
        const data = await response.json();
        if (data.success) {
          ElMessage.success(t('admin.addSuccess'));
          fetchUploadedFiles();
        } else {
          ElMessage.error(data.error || t('common.fail'));
        }
      } catch (err) {
        ElMessage.error(t('common.fail'));
      } finally {
        uploading.value = false;
      }
    };
    reader.readAsDataURL(file.raw);
  } catch (err) {
    ElMessage.error('上传失败');
    uploading.value = false;
  }
};

const fillDefaultFooter = () => {
  const currentYear = new Date().getFullYear();
  const siteName = settings.siteName || t('notification.siteName');
  settings.footerHtml = `&copy; ${currentYear} <a href="https://github.com/starwishes/Nav" target="_blank">${siteName}</a>. All Rights Reserved.`;
};

const saveSettings = async () => {
  if (backgroundUrl.value !== (props.initialSettings.backgroundUrl || '')) {
    await fetch('/api/set-background', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminStore.token}`
      },
      body: JSON.stringify({ url: backgroundUrl.value })
    });
  }
  emit('save', settings);
};
</script>

<style scoped lang="scss">
.glass-form {
  padding: 20px;
  border-radius: 12px;
  .form-tip {
    font-size: 12px;
    color: var(--gray-500);
    margin-top: 4px;
    line-height: 1.4;
  }
}

.bg-preview {
  width: 200px;
  height: 120px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  border: 1px solid var(--gray-200);
}

.uploaded-files {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  background: var(--glass-bg, rgba(255, 255, 255, 0.1));
  border: 1px solid var(--gray-200);
  
  .file-preview {
    width: 60px;
    height: 40px;
    border-radius: 4px;
    background-size: cover;
    background-position: center;
    flex-shrink: 0;
  }
  
  .file-info {
    flex: 1;
    min-width: 0;
    
    .file-name {
      font-size: 13px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .file-meta {
      font-size: 11px;
      color: var(--gray-500);
      margin-top: 2px;
    }
  }
  
  .file-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
}
</style>
