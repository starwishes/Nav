<template>
  <div id="js-home-nav" class="home-nav">
    <header></header>
    <main id="js-home-nav__main">
      <ul id="js-home-nav__main-ul">
        <li class="record-item pointer text" v-for="category in store.$state.site" :key="category.id" @click="changeAnchorPosition(category.name)">
          <div style="width: 100%; height: 100%; text-align: center">{{ category.name }}</div>
        </li>
        <i style="width: 100px" v-for="i in 6" :key="i"></i>
      </ul>
    </main>
  </div>
</template>
<script setup>
import { useMainStore } from '@/store'
import { ref } from 'vue'

const store = useMainStore()
const changeAnchorPosition = name => {
  let target = document.getElementById(`site-anchor-${name}`)
  if (!target) return
  // 计算目标元素距离视口顶部的距离
  let targetTop = target.getBoundingClientRect().top + window.scrollY

  // 设置额外的滚动偏移量
  let additionalOffset = 75

  // 计算最终的滚动位置
  let finalScrollPosition = targetTop - additionalOffset

  // 滚动到最终位置
  window.scroll({
    top: finalScrollPosition,
    left: 0,
    behavior: 'smooth'
  })
}
</script>

<style lang="scss" scoped>
.home-nav {
  position: sticky;
  top: 15px;
  z-index: 100;
  width: calc(100% - 40px);
  max-width: 1200px;
  margin: 280px auto 30px auto;
  padding: 10px 24px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 100px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  main {
    width: 100%;
    
    ul {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0;
      margin: 0;
      list-style: none;
      flex-wrap: nowrap;
      overflow-x: auto;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }

      .record-item {
        cursor: pointer;
        padding: 8px 20px;
        border-radius: 40px;
        font-size: 14px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.85);
        transition: all 0.2s ease;
        background: transparent;
        white-space: nowrap;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          transform: scale(1.05);
        }

        &.active {
          background: var(--ui-theme);
          color: white;
          box-shadow: 0 4px 12px rgba(var(--ui-theme-rgb), 0.3);
        }
      }
    }
  }
}

:root[theme-mode='dark'] {
  .home-nav {
    background: rgba(0, 0, 0, 0.2);
    .record-item {
      color: #aaa;
      &:hover { color: var(--ui-theme); }
    }
  }
}
</style>
