<template>
  <div class="audit-log">
    <div class="header">
      <h3>登录审计日志</h3>
      <el-button size="small" @click="fetchLogs" :loading="loading">刷新</el-button>
    </div>
    
    <el-table :data="logs" v-loading="loading" stripe>
      <el-table-column prop="timestamp" label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.timestamp) }}
        </template>
      </el-table-column>
      <el-table-column prop="action" label="操作" width="100">
        <template #default="{ row }">
          <el-tag :type="getActionType(row.action)" size="small">
            {{ getActionLabel(row.action) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="ip" label="IP 地址" width="140" />
      <el-table-column prop="success" label="状态" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.success !== undefined" :type="row.success ? 'success' : 'danger'" size="small">
            {{ row.success ? '成功' : '失败' }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="userAgent" label="设备信息" show-overflow-tooltip>
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
    login: '登录',
    logout: '登出',
    register: '注册',
    revoke_sessions: '踢出设备'
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
