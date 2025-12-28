<template>
  <div class="audit-log">
    <div class="header">
      <h3>{{ t('audit.title') }}</h3>
      <div>
        <el-button type="danger" size="small" @click="clearLogs" :disabled="loading" style="margin-right: 8px;">
          {{ t('audit.actionClear') }}
        </el-button>
        <el-button size="small" @click="fetchLogs" :loading="loading">{{ t('common.refresh') }}</el-button>
      </div>
    </div>
    
    <el-table :data="logs" v-loading="loading" stripe>
      <el-table-column prop="timestamp" :label="t('common.time')" width="180">
        <template #default="{ row }">
          {{ formatTime(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column prop="action" :label="t('common.action')" width="100">
        <template #default="{ row }">
          <el-tag :type="getActionType(row.action)" size="small">
            {{ getActionLabel(row.action) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="username" :label="t('common.username')" width="120" />
      <el-table-column prop="ip" :label="t('common.ip')" width="140" />
      <el-table-column prop="success" :label="t('common.status')" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.success !== undefined" :type="row.success ? 'success' : 'danger'" size="small">
            {{ row.success ? t('common.success') : t('common.fail') }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="userAgent" :label="t('common.device')" show-overflow-tooltip>
        <template #default="{ row }">
          {{ parseUserAgent(row.userAgent) }}
        </template>
      </el-table-column>
    </el-table>
    
    <el-pagination
      v-if="total > limit"
      class="pagination"
      :current-page="page"
      :page-size="limit"
      :total="total"
      layout="prev, pager, next"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAdminStore } from '@/store/admin';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox } from 'element-plus';

const { t } = useI18n();

interface AuditLog {
  id: number;
  action: string;
  username: string;
  ip: string;
  userAgent: string;
  success?: boolean;
  timestamp: string;
}

const adminStore = useAdminStore();
const logs = ref<AuditLog[]>([]);
const loading = ref(false);
const page = ref(1);
const limit = ref(50);
const total = ref(0);

const fetchLogs = async () => {
  loading.value = true;
  try {
    const res = await fetch(`/api/admin/audit?page=${page.value}&limit=${limit.value}`, {
      headers: { 'Authorization': `Bearer ${adminStore.token}` }
    });
    const data = await res.json();
    logs.value = data.logs || [];
    total.value = data.total || 0;
  } catch (err) {
    console.error('获取审计日志失败', err);
  } finally {
    loading.value = false;
  }
};

const clearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      t('audit.clearConfirm'),
      t('common.warning'),
      { type: 'warning', confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel') }
    );
    
    const res = await fetch('/api/admin/audit', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminStore.token}` }
    });
    
    const data = await res.json();
    if (data.success) {
      ElMessage.success(t('audit.clearSuccess'));
      fetchLogs();
    } else {
      ElMessage.error(data.error || t('common.fail'));
    }
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(t('common.fail'));
  }
};

const handlePageChange = (newPage: number) => {
  page.value = newPage;
  fetchLogs();
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const getActionType = (action: string) => {
  const types: Record<string, string> = {
    login: 'primary',
    logout: 'info',
    register: 'success',
    revoke_sessions: 'warning'
  };
  return types[action] || 'default';
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    login: t('audit.actionLogin'),
    logout: t('audit.actionLogout'),
    register: t('audit.actionRegister'),
    revoke_sessions: t('audit.actionRevoke')
  };
  return labels[action] || action;
};

const parseUserAgent = (ua: string) => {
  if (!ua || ua === 'unknown') return '-';
  // 简单解析 User-Agent
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return ua.substring(0, 30) + '...';
};

onMounted(fetchLogs);
</script>

<style scoped lang="scss">
.audit-log {
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 16px;
    }
  }
  
  .pagination {
    margin-top: 16px;
    justify-content: center;
  }
}
</style>
