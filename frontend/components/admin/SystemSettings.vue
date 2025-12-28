<template>
  <div class="system-settings">
    <el-form :model="settings" label-width="140px" class="glass-form">
      <el-form-item label="开放用户注册">
        <el-switch v-model="settings.registrationEnabled" />
        <div class="form-tip">关闭后，新用户将无法通过注册页面创建账户。</div>
      </el-form-item>
      <el-form-item label="新用户初始等级">
        <el-select v-model="settings.defaultUserLevel">
          <el-option label="注册用户 (1)" :value="1" />
          <el-option label="VIP用户 (2)" :value="2" />
        </el-select>
        <div class="form-tip">新注册账户默认获得的等级。</div>
      </el-form-item>

      <el-form-item label="显示时区">
        <el-select v-model="settings.timezone" filterable placeholder="选择时区">
          <el-option label="本地时间 (跟随浏览器)" value="" />
          <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
          <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo" />
          <el-option label="伦敦时间 (UTC+0)" value="Europe/London" />
          <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
          <el-option label="洛杉矶时间 (UTC-8)" value="America/Los_Angeles" />
          <el-option label="莫斯科时间 (UTC+3)" value="Europe/Moscow" />
          <el-option label="巴黎时间 (UTC+1)" value="Europe/Paris" />
          <el-option label="悉尼时间 (UTC+11)" value="Australia/Sydney" />
        </el-select>
        <div class="form-tip">首页时钟将根据此处设置的时区显示。</div>
      </el-form-item>

      <el-divider>背景图设置</el-divider>

      <el-form-item label="背景图 URL">
        <el-input 
          v-model="backgroundUrl" 
          placeholder="输入图片 URL，留空使用默认背景"
          clearable
        />
        <div class="form-tip">支持 https:// 开头的图片链接</div>
      </el-form-item>

      <el-form-item label="或上传图片">
        <el-upload
          ref="uploadRef"
          action=""
          :auto-upload="false"
          :show-file-list="false"
          accept="image/*"
          :on-change="handleFileChange"
        >
          <el-button type="success" :loading="uploading">选择图片上传</el-button>
        </el-upload>
        <div class="form-tip">支持 JPG/PNG/GIF，最大 5MB</div>
      </el-form-item>

      <el-form-item v-if="previewUrl" label="预览">
        <div class="bg-preview" :style="{ backgroundImage: `url(${previewUrl})` }"></div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="saveSettings">保存全局设置</el-button>
      </el-form-item>

      <!-- 已上传文件列表 -->
      <el-divider>已上传的图片</el-divider>
      
      <el-form-item>
        <el-button size="small" @click="fetchUploadedFiles" :loading="loadingFiles">
          刷新列表
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
            <el-button size="small" type="primary" @click="useAsBackground(file.url)">设为背景</el-button>
            <el-button size="small" type="danger" @click="deleteFile(file.filename)">删除</el-button>
          </div>
        </div>
      </div>
      <el-empty v-else-if="!loadingFiles" description="暂无上传的图片" :image-size="60" />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAdminStore } from '@/store/admin';

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
  ElMessage.success('背景图已设置');
};

const deleteFile = async (filename: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个图片吗？', '确认删除', { type: 'warning' });
    const res = await fetch(`/api/uploads/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminStore.token}` }
    });
    const data = await res.json();
    if (data.success) {
      ElMessage.success('删除成功');
      fetchUploadedFiles();
    } else {
      ElMessage.error(data.error || '删除失败');
    }
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败');
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
          ElMessage.success('图片上传成功！');
          fetchUploadedFiles();
        } else {
          ElMessage.error(data.error || '上传失败');
        }
      } catch (err) {
        ElMessage.error('上传失败');
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
