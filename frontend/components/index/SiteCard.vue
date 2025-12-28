<template>
  <div class="site-card-wrapper" @contextmenu.prevent="$emit('contextmenu', $event)">
    <a
      class="inherit-text"
      target="_blank"
      @click.prevent="$emit('click', $event)"
      @touchstart="$emit('touchstart', $event)"
    >
      <div class="site-card glass-card" :class="{ 'is-pinned': item.pinned }">
        <div class="img-group">
          <img v-if="faviconUrl" :src="faviconUrl" class="site-icon" loading="lazy" />
          <div v-else class="site-icon-placeholder">{{ item.name.charAt(0) }}</div>
        </div>
        <div class="text-group">
          <div class="site-name text">{{ item.name }}</div>
          <div class="site-desc text">{{ item.description }}</div>
          <div class="site-tags" v-if="item.tags && item.tags.length > 0">
            <el-tag
              v-for="tag in item.tags"
              :key="tag"
              size="small"
              type="info"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        <div class="hover-glow"></div>
        <div v-if="item.pinned" class="pin-badge">📌</div>
      </div>
    </a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  item: any;
  faviconUrl: string;
}>();

defineEmits<{
  (e: 'click', event: MouseEvent): void;
  (e: 'contextmenu', event: MouseEvent): void;
  (e: 'touchstart', event: TouchEvent): void;
}>();
</script>

<style scoped lang="scss">
.site-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
  height: 100%;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;

  &:hover {
    transform: translateY(-4px);
    border-color: var(--ui-theme) !important;
    box-shadow: 0 8px 24px rgba(var(--ui-theme-rgb), 0.15);

    .hover-glow {
      opacity: 1;
    }
  }

  &.is-pinned {
    border-left: 3px solid var(--ui-theme) !important;
  }

  .img-group {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    overflow: hidden;

    .site-icon {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
    .site-icon-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ui-theme);
      color: white;
      font-weight: bold;
      font-size: 18px;
    }
  }

  .text-group {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

    .site-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-800);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .site-desc {
      font-size: 11px;
      color: var(--gray-500);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.4;
    }

    .site-tags {
      margin-top: 4px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      .el-tag { height: 18px; padding: 0 4px; font-size: 10px; }
    }
  }

  .hover-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(var(--ui-theme-rgb), 0.1), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }

  .pin-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    font-size: 10px;
    opacity: 0.8;
  }
}

.glass-card {
  background: rgba(30, 30, 30, 0.6); // Much darker base for better contrast
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}



// Global overrides to ensure contrast on dark glass background
.site-card {
  .site-name { 
    color: #ffffff !important; 
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }
  .site-desc { 
    color: #dddddd !important; 
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }
}

.glass-card {
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.15);
}

.inherit-text {
  text-decoration: none;
  color: inherit;
}
</style>
