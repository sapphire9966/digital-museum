<template>
  <el-container class="museum-home" direction="vertical">
    <!-- 顶部导航 -->
    <el-header class="site-header" height="64px">
      <div class="header-inner">
        <span class="logo">数字博物馆</span>
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          class="nav-menu"
          background-color="transparent"
          text-color="rgba(255,255,255,0.88)"
          active-text-color="var(--museum-gold)"
          @select="onMenuSelect"
        >
          <el-menu-item index="/">首页</el-menu-item>
          <el-menu-item index="#exhibitions">展览</el-menu-item>
          <el-menu-item index="#collections">藏品</el-menu-item>
          <el-menu-item index="#about">关于我们</el-menu-item>
        </el-menu>
      </div>
    </el-header>

    <!-- 主内容 -->
    <el-main class="main-content">
      <!-- 主视觉区 -->
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <p class="hero-label">探索 · 传承 · 共享</p>
          <h1 class="hero-title">数字博物馆</h1>
          <p class="hero-subtitle">将珍贵文物与展览搬上云端，足不出户畅游千年文明</p>
          <el-button
            type="primary"
            size="large"
            class="hero-btn"
            @click="scrollTo('#exhibitions')"
          >
            开始探索
          </el-button>
        </div>
      </section>

      <!-- 当前展览 -->
      <section id="exhibitions" class="section section-exhibitions">
        <div class="section-head">
          <span class="section-label">EXHIBITIONS</span>
          <h2 class="section-title">当前展览</h2>
        </div>
        <el-row :gutter="28" class="exhibition-row">
          <el-col
            v-for="(item, i) in exhibitions"
            :key="item.id"
            :xs="24"
            :sm="24"
            :md="8"
            :lg="8"
          >
            <el-card shadow="hover" class="exhibition-card" :style="{ '--delay': i }">
              <div class="card-image">
                <span class="placeholder-text">{{ item.title.charAt(0) }}</span>
              </div>
              <template #header>
                <span class="card-title">{{ item.title }}</span>
              </template>
              <p class="card-desc">{{ item.desc }}</p>
              <el-button type="primary" link class="card-link-btn">查看详情</el-button>
            </el-card>
          </el-col>
        </el-row>
      </section>

      <!-- 精选藏品 -->
      <section id="collections" class="section section-collections">
        <div class="section-head">
          <span class="section-label">COLLECTIONS</span>
          <h2 class="section-title">精选藏品</h2>
        </div>
        <el-row :gutter="24" class="collection-row">
          <el-col
            v-for="(item, i) in collections"
            :key="item.id"
            :xs="12"
            :sm="8"
            :md="8"
            :lg="4"
          >
            <el-card shadow="hover" class="collection-card" :style="{ '--delay': i }">
              <div class="collection-thumb">
                <span class="placeholder-text">{{ item.name.charAt(0) }}</span>
              </div>
              <div class="collection-info">
                <div class="collection-name">{{ item.name }}</div>
                <div class="collection-era">{{ item.era }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </section>

      <!-- 关于我们 -->
      <section id="about" class="section section-about">
        <div class="section-head">
          <span class="section-label">ABOUT</span>
          <h2 class="section-title">关于我们</h2>
        </div>
        <el-card class="about-card" shadow="never">
          <p class="about-text">
            数字博物馆致力于将珍贵文物与展览搬上云端，让更多人足不出户即可欣赏馆藏、参与虚拟展览，
            实现文化资源的开放共享与永久保存。
          </p>
        </el-card>
      </section>
    </el-main>

    <!-- 页脚 -->
    <el-footer class="site-footer" height="auto">
      <div class="footer-inner">
        <p class="copyright">© {{ new Date().getFullYear() }} 数字博物馆 版权所有</p>
        <div class="footer-links">
          <el-link type="info" :underline="false" href="#">联系我们</el-link>
          <el-link type="info" :underline="false" href="#">使用说明</el-link>
          <el-link type="info" :underline="false" href="#">隐私政策</el-link>
        </div>
      </div>
    </el-footer>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const activeMenu = ref('/')

const exhibitions = [
  { id: 1, title: '古代青铜器专题', desc: '从夏商周到秦汉，领略青铜文明的辉煌。' },
  { id: 2, title: '丝绸之路文物展', desc: '沿丝路追溯东西方文化交流的足迹。' },
  { id: 3, title: '明清书画精品', desc: '名家真迹与馆藏书画精选。' },
]

const collections = [
  { id: 1, name: '青铜鼎', era: '商代' },
  { id: 2, name: '青花瓷瓶', era: '明代' },
  { id: 3, name: '玉璧', era: '战国' },
  { id: 4, name: '书法长卷', era: '清代' },
  { id: 5, name: '陶俑', era: '唐代' },
  { id: 6, name: '漆器', era: '汉代' },
]

function scrollTo(selector: string) {
  const el = document.querySelector(selector)
  el?.scrollIntoView({ behavior: 'smooth' })
}

function onMenuSelect(index: string) {
  activeMenu.value = index
  if (index.startsWith('#')) {
    scrollTo(index)
  }
}

onMounted(() => {
  const hash = window.location.hash
  if (hash) {
    activeMenu.value = hash
  }
})
</script>

<style scoped>
/* ---------- 设计变量 ---------- */
.museum-home {
  --museum-dark: #1a1814;
  --museum-darker: #12100e;
  --museum-cream: #f5f0e8;
  --museum-gold: #c9a962;
  --museum-gold-light: #e0d4a8;
  --museum-border: rgba(201, 169, 98, 0.2);
  --font-serif: 'Noto Serif SC', serif;
  --font-sans: system-ui, -apple-system, 'Segoe UI', sans-serif;
  min-height: 100vh;
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

.logo {
  font-family: var(--font-serif);
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--museum-cream);
  letter-spacing: 0.12em;
}

.nav-menu {
  border-bottom: none !important;
}

.nav-menu.el-menu--horizontal > .el-menu-item {
  border-bottom: none !important;
  font-size: 0.95rem;
  letter-spacing: 0.06em;
}

.nav-menu.el-menu--horizontal > .el-menu-item:hover {
  color: var(--museum-gold-light) !important;
}

/* ---------- 主内容 ---------- */
.main-content {
  padding: 0;
  margin-top: 64px;
  min-height: calc(100vh - 140px);
}

/* ---------- 主视觉 ---------- */
.hero {
  position: relative;
  padding: 100px 24px 120px;
  text-align: center;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(160deg, var(--museum-darker) 0%, var(--museum-dark) 40%, #252019 100%),
    radial-gradient(ellipse 90% 60% at 50% 0%, rgba(201, 169, 98, 0.12) 0%, transparent 55%);
}

.hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 640px;
  margin: 0 auto;
}

.hero-label {
  font-size: 0.8rem;
  letter-spacing: 0.35em;
  color: var(--museum-gold);
  margin: 0 0 16px;
  text-transform: uppercase;
}

.hero-title {
  font-family: var(--font-serif);
  font-size: clamp(2.25rem, 6vw, 3.75rem);
  font-weight: 600;
  color: var(--museum-cream);
  letter-spacing: 0.2em;
  margin: 0 0 16px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1rem;
  color: rgba(245, 240, 232, 0.78);
  letter-spacing: 0.08em;
  line-height: 1.7;
  margin: 0 0 36px;
}

.hero-btn {
  font-size: 0.95rem;
  letter-spacing: 0.12em;
  padding: 14px 36px;
  border-radius: 4px;
  background: linear-gradient(135deg, var(--museum-gold) 0%, #b8984a 100%) !important;
  border: none !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease !important;
}

.hero-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(201, 169, 98, 0.35) !important;
}

/* ---------- 区块通用 ---------- */
.section {
  padding: 72px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-head {
  text-align: center;
  margin-bottom: 40px;
}

.section-label {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.35em;
  color: var(--museum-gold);
  margin-bottom: 8px;
  text-transform: uppercase;
}

.section-title {
  font-family: var(--font-serif);
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.15em;
  margin: 0;
}

.section-exhibitions {
  background: #fff;
}

.section-collections {
  background: linear-gradient(180deg, #faf8f5 0%, #f5f0e8 100%);
}

.section-about {
  background: #fff;
}

.exhibition-row,
.collection-row {
  margin-top: 0;
}

/* ---------- 展览卡片 ---------- */
.exhibition-card {
  margin-bottom: 0;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.3s ease;
  animation: fadeUp 0.6s ease backwards;
  animation-delay: calc(0.1s * var(--delay, 0));
}

.exhibition-card:hover {
  transform: translateY(-6px);
  border-color: var(--museum-border);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
}

.exhibition-card :deep(.el-card__header) {
  padding: 18px 20px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 600;
  font-size: 1.08rem;
}

.exhibition-card :deep(.el-card__body) {
  padding: 0 20px 20px;
}

.card-title {
  font-family: var(--font-serif);
  letter-spacing: 0.05em;
}

.card-image {
  aspect-ratio: 16 / 10;
  background: linear-gradient(145deg, #ebe6dc 0%, #e0d9cc 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 -1px; /* 与卡片圆角对齐 */
}

.placeholder-text {
  font-family: var(--font-serif);
  font-size: 2.8rem;
  font-weight: 300;
  color: rgba(201, 169, 98, 0.4);
}

.collection-thumb .placeholder-text {
  font-size: 2rem;
}

.card-desc {
  color: var(--el-text-color-regular);
  font-size: 0.9rem;
  line-height: 1.7;
  margin: 14px 0 12px;
}

.card-link-btn {
  font-size: 0.9rem;
  letter-spacing: 0.05em;
}

.card-link-btn:hover {
  color: var(--museum-gold) !important;
}

/* ---------- 藏品卡片 ---------- */
.collection-card {
  text-align: center;
  margin-bottom: 0;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.3s ease;
  animation: fadeUp 0.6s ease backwards;
  animation-delay: calc(0.08s * var(--delay, 0));
}

.collection-card:hover {
  transform: translateY(-4px);
  border-color: var(--museum-border);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
}

.collection-card :deep(.el-card__body) {
  padding: 20px 16px;
}

.collection-thumb {
  aspect-ratio: 1;
  background: linear-gradient(145deg, #ebe6dc 0%, #e0d9cc 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.collection-info {
  padding: 0 4px;
}

.collection-name {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 1rem;
  color: var(--el-text-color-primary);
  letter-spacing: 0.04em;
}

.collection-era {
  font-size: 0.8rem;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  letter-spacing: 0.02em;
}

/* ---------- 关于 ---------- */
.about-card {
  max-width: 640px;
  margin: 0 auto;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.about-card :deep(.el-card__body) {
  padding: 44px 40px;
}

.about-text {
  text-align: center;
  color: var(--el-text-color-regular);
  line-height: 2;
  font-size: 0.98rem;
  margin: 0;
  letter-spacing: 0.03em;
}

/* ---------- 页脚 ---------- */
.site-footer {
  background: var(--museum-darker);
  border-top: 1px solid var(--museum-border);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
}

.footer-inner {
  text-align: center;
}

.copyright {
  font-size: 0.85rem;
  color: rgba(245, 240, 232, 0.6);
  margin: 0 0 10px;
  letter-spacing: 0.02em;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 24px;
}

.footer-links .el-link {
  color: rgba(245, 240, 232, 0.6) !important;
  font-size: 0.85rem;
  letter-spacing: 0.03em;
}

.footer-links .el-link:hover {
  color: var(--museum-gold-light) !important;
}

/* ---------- 动效 ---------- */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
