<template>
  <div id="app">
    <Header 
      ref="headerRef"
      @menu-select="handleMenuSelect"
      @user-click="handleUserClick"
    />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
    <!-- AI智能助手 -->
    <AIAssistant />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from './components/layout/Header.vue'
import Footer from './components/layout/Footer.vue'
import AIAssistant from './components/AIAssistant.vue'

const router = useRouter()
const route = useRoute()
const headerRef = ref()

function handleMenuSelect(index: string) {
  if (index.startsWith('#')) {
    // 处理锚点链接
    const element = document.querySelector(index)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  } else {
    // 处理路由跳转
    router.push(index)
  }
}

function handleUserClick() {
  // 可以在这里处理用户登录逻辑
}

// 监听路由变化，更新头部菜单激活状态
watch(() => route.path, (newPath) => {
  if (headerRef.value) {
    const menuIndex = newPath === '/' ? '/' : newPath
    headerRef.value.setActiveMenu(menuIndex)
  }
}, { immediate: true })
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  margin-top: 64px; /* 为固定头部留出空间 */
  padding-top: 0; /* 移除默认的顶部内边距 */
}
</style>