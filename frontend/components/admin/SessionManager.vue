<template>
  <div class="session-manager">
    <div class="header">
      <h3>会话管理</h3>
      <el-button type="danger" size="small" @click="revokeOthers" :loading="revoking">
        踢出其他设备
      </el-button>
    </div>
    
    <el-table :data="sessions" v-loading="loading" stripe>
      <el-table-column prop="isCurrent" label="" width="60">
        <template #default="{ row }">
          <el-tag v-if="row.isCurrent" type="success" size="small">当前</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP 地址" width="140" />
      <el-table-column prop="userAgent" label="设备" show-overflow-tooltip>
        <template #default="{ row }">
          {{ parseDevice(row.userAgent) }}
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="登录时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="lastActiveAt" label="最后活跃" width="180">
        <template #default="{ row }">
          {{ formatTime(row.lastActiveAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button
            v-if="!row.isCurrent"
            type="danger"
            size="small"
            link
            @click="revokeSession(row.sessionId)"
          >
            踢出
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAdminStore } from '@/store/admin';

interface Session {
  sessionId: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

const adminStore = useAdminStore();
const sessions = ref<Session[]>([]);
const loading = ref(false);
const revoking = ref(false);

const fetchSessions = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/sessions', {
      headers: { 'Authorization': `Bearer ${adminStore.token}` }
    });
    const data = await res.json();
    sessions.value = data.sessions || [];
  } catch (err) {
    console.error('获取会话列表失败', err);
  } finally {
    loading.value = false;
  }
};

const revokeSession = async (sessionId: string) => {
  try {
    await ElMessageBox.confirm('确定要踢出此设备吗？', '确认', { type: 'warning' });
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminStore.token}` }
    });
    if (res.ok) {
      ElMessage.success('已踢出');
      fetchSessions();
    }
  } catch (err) {
    // 取消操作
  }
};

const revokeOthers = async () => {
  try {
    await ElMessageBox.confirm('确定要踢出所有其他设备吗？', '确认', { type: 'warning' });
    revoking.value = true;
    const res = await fetch('/api/sessions/revoke-others', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminStore.token}` }
    });
    const data = await res.json();
    if (data.success) {
      ElMessage.success(`已踢出 ${data.revokedCount} 个设备`);
      fetchSessions();
    }
  } catch (err) {
    // 取消操作
  } finally {
    revoking.value = false;
  }
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

const parseDevice = (ua: string) => {
  if (!ua || ua === 'unknown') return '未知设备';
  if (ua.includes('Windows')) {
    if (ua.includes('Edge')) return 'Windows Edge';
    if (ua.includes('Chrome')) return 'Windows Chrome';
    if (ua.includes('Firefox')) return 'Windows Firefox';
    return 'Windows';
  }
  if (ua.includes('Mac')) {
    if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Mac Safari';
    if (ua.includes('Chrome')) return 'Mac Chrome';
    return 'Mac';
  }
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Linux')) return 'Linux';
  return ua.substring(0, 20) + '...';
};

onMounted(fetchSessions);
</script>

<style scoped lang="scss">
.session-manager {
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
}
</style>
