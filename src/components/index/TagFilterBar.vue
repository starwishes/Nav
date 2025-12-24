<template>
  <div v-if="allTags.length > 0" class="tag-filter-bar">
    <div class="tag-filter-label">🏷️ 标签筛选：</div>
    <div class="tag-filter-list">
      <el-tag
        v-for="tag in allTags"
        :key="tag"
        :type="selectedTags.includes(tag) ? '' : 'info'"
        :effect="selectedTags.includes(tag) ? 'dark' : 'plain'"
        class="tag-filter-item"
        @click="$emit('toggle-tag', tag)"
      >
        {{ tag }}
      </el-tag>
      <el-button
        v-if="selectedTags.length > 0"
        size="small"
        type="danger"
        plain
        @click="$emit('clear-tags')"
      >
        清除筛选
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  allTags: string[];
  selectedTags: string[];
}>();

defineEmits<{
  (e: 'toggle-tag', tag: string): void;
  (e: 'clear-tags'): void;
}>();
</script>

<style scoped lang="scss">
.tag-filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .tag-filter-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--gray-700);
    white-space: nowrap;
  }

  .tag-filter-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .tag-filter-item {
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

:root[theme-mode='dark'] {
  .tag-filter-bar {
    background: rgba(0, 0, 0, 0.2);
    .tag-filter-label {
      color: #a3a3a3;
    }
  }
}
</style>
