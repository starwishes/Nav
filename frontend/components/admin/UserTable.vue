<template>
  <div class="user-table">
    <div class="table-toolbar">
      <el-button type="primary" :icon="Plus" @click="showAddDialog = true">{{ t('users.addUser') }}</el-button>
    </div>

    <el-table :data="users" style="width: 100%" class="glass-table">
      <el-table-column prop="username" :label="t('common.username')" />
      <el-table-column prop="level" :label="t('users.level')">
        <template #default="{ row }">
          <el-tag :type="getLevelTag(row.level)">{{ getLevelName(row.level) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" :label="t('users.regTime')">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column :label="t('common.action')" width="280">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-dropdown trigger="click" @command="(val: number) => $emit('update-level', row.username, val)">
              <el-button type="primary" size="small" link :disabled="row.username === 'admin'">
                {{ t('users.level') }} <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="1">{{ t('userLevel.user') }} (1)</el-dropdown-item>
                  <el-dropdown-item :command="2">{{ t('userLevel.vip') }} (2)</el-dropdown-item>
                  <el-dropdown-item :command="3">{{ t('userLevel.admin') }} (3)</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            
            <el-button 
              type="primary" 
              size="small" 
              link 
              @click="handleEdit(row)"
              :disabled="row.username === 'admin' && adminStore.user?.login !== 'admin'"
            >
              {{ t('common.edit') }}
            </el-button>

            <el-popconfirm
              :title="t('users.deleteConfirm')"
              @confirm="$emit('delete-user', row.username)"
            >
              <template #reference>
                <el-button 
                  type="danger" 
                  size="small" 
                  link 
                  :disabled="row.username === 'admin' || row.username === adminStore.user?.login"
                >
                  {{ t('common.delete') }}
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加用户对话框 -->
    <el-dialog v-model="showAddDialog" :title="t('users.addUser')" width="400px" append-to-body>
      <el-form :model="addForm" label-width="80px">
        <el-form-item :label="t('common.username')">
          <el-input v-model="addForm.username" :placeholder="t('users.inputUsername')" />
        </el-form-item>
        <el-form-item :label="t('users.password')">
          <el-input v-model="addForm.password" type="password" :placeholder="t('users.inputPassword')" show-password />
        </el-form-item>
        <el-form-item :label="t('users.level')">
          <el-select v-model="addForm.level" style="width: 100%">
            <el-option :label="t('userLevel.user') + ' (1)'" :value="1" />
            <el-option :label="t('userLevel.vip') + ' (2)'" :value="2" />
            <el-option :label="t('userLevel.admin') + ' (3)'" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmAdd">{{ t('users.confirmAdd') }}</el-button>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="showEditDialog" :title="t('users.editUser')" width="400px" append-to-body>
      <el-form :model="editForm" label-width="80px">
        <el-form-item :label="t('common.username')">
          <el-input v-model="editForm.newUsername" :placeholder="t('users.inputUsername')" />
        </el-form-item>
        <el-form-item :label="t('users.resetPassword')">
          <el-input v-model="editForm.password" type="password" :placeholder="t('users.resetPasswordPlaceholder')" show-password />
        </el-form-item>
      </el-form>
      <div class="form-tip" style="margin-left: 80px; font-size: 12px; color: var(--gray-500);">
        {{ t('users.usernameParams') }}
      </div>
      <template #footer>
        <el-button @click="showEditDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="confirmEdit">{{ t('users.saveEdit') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ArrowDown, Plus } from '@element-plus/icons-vue';
import { useAdminStore } from '@/store/admin';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{ users: any[] }>();
const emit = defineEmits(['update-level', 'delete-user', 'add-user', 'update-user']);

const adminStore = useAdminStore();

// 添加逻辑
const showAddDialog = ref(false);
const addForm = reactive({
  username: '',
  password: '',
  level: 1
});

const confirmAdd = () => {
  if (!addForm.username || !addForm.password) {
    return ElMessage.warning('请填写完整的用户信息');
  }
  emit('add-user', { ...addForm });
  showAddDialog.value = false;
  addForm.username = '';
  addForm.password = '';
};

// 编辑逻辑
const showEditDialog = ref(false);
const currentEditUser = ref('');
const editForm = reactive({
  newUsername: '',
  password: ''
});

const handleEdit = (row: any) => {
  currentEditUser.value = row.username;
  editForm.newUsername = row.username;
  editForm.password = '';
  showEditDialog.value = true;
};

const confirmEdit = () => {
  emit('update-user', currentEditUser.value, {
    username: editForm.newUsername,
    password: editForm.password || undefined
  });
  showEditDialog.value = false;
};

const getLevelName = (level: number) => {
  const keys = ['guest', 'user', 'vip', 'admin'];
  return t(`userLevel.${keys[level] || 'unknown'}`);
};

const getLevelTag = (level: number) => {
  const tags = ['info', '', 'warning', 'danger'];
  return tags[level] || 'info';
};
</script>

<style scoped lang="scss">
.user-table {
  .table-toolbar {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.glass-table {
  background: transparent !important;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.1);
  --el-table-tr-bg-color: transparent;
  --el-table-border-color: rgba(255, 255, 255, 0.1);
}
</style>
