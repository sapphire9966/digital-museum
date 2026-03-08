<template>
  <el-header class="site-header" height="64px">
    <div class="header-inner">
      <span class="logo">数字博物馆</span>
      <div class="header-nav-wrap">
        <el-menu
          mode="horizontal"
          :ellipsis="false"
          :default-active="activeMenu"
          class="nav-menu"
          background-color="transparent"
          text-color="rgba(255,255,255,0.88)"
          active-text-color="var(--museum-gold)"
          @select="onMenuSelect"
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="/collections">藏品</el-menu-item>
          <el-menu-item index="/learning">探索</el-menu-item>
        </el-menu>
        <div class="header-user" @click="onUserClick">
          <el-avatar v-if="isLoggedIn" :src="userAvatar" :size="36">
            {{ userAvatar ? '' : (userName || '用').charAt(0) }}
          </el-avatar>
          <div v-else class="user-icon-default" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeMenu = ref('/')
const isLoggedIn = ref(false)
const userAvatar = ref('')
const userName = ref('')

const emit = defineEmits<{
  (e: 'menu-select', index: string): void
  (e: 'user-click'): void
}>()

function onUserClick() {
  if (isLoggedIn.value) {
    // 已登入可展开用户菜单（后续可做下拉）
    return
  }
  emit('user-click')
}

function onMenuSelect(index: string) {
  activeMenu.value = index
  emit('menu-select', index)
}

function setActiveMenu(index: string) {
  activeMenu.value = index
}

// 暴露给父组件的方法
defineExpose({
  setActiveMenu
})
</script>

<style scoped>
/* ---------- 设计变量 ---------- */
.site-header {
  --museum-dark: #1a1814;
  --museum-darker: #12100e;
  --museum-cream: #f5f0e8;
  --museum-gold: #c9a962;
  --museum-gold-light: #e0d4a8;
  --museum-border: rgba(201, 169, 98, 0.4);
  --font-serif: 'Noto Serif SC', serif;
  --font-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

/* ---------- 头部 ---------- */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(18, 16, 14, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--museum-border);
  display: flex;
  align-items: center;
  transition: background 0.3s ease;
  margin-bottom: 0; /* 确保没有底部外边距 */
  padding-bottom: 0; /* 确保没有底部内边距 */
}

.header-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-nav-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--museum-cream);
  letter-spacing: 0.12em;
}

.nav-menu {
  border-bottom: none !important;
  margin-bottom: 0; /* 移除菜单底部边距 */
}

.nav-menu.el-menu--horizontal > .el-menu-item {
  border-bottom: none !important;
  font-size: 0.95rem;
  letter-spacing: 0.06em;
  margin-bottom: 0; /* 确保菜单项没有底部边距 */
}

.nav-menu.el-menu--horizontal > .el-menu-item:hover {
  color: var(--museum-gold-light) !important;
}

.header-user {
  margin-left: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.88);
  margin-bottom: 0; /* 确保用户区域没有底部边距 */
}
.header-user:hover {
  color: var(--museum-gold-light);
}
.user-icon-default {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.88);
  margin-bottom: 0; /* 确保图标没有底部边距 */
}
.header-user:hover .user-icon-default {
  background: rgba(201, 169, 98, 0.25);
  color: var(--museum-gold-light);
}
</style>