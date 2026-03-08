<template>
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
</template>

<script setup lang="ts">
// 页脚组件不需要额外的逻辑，保持简洁
</script>

<style scoped>
/* ---------- 设计变量 ---------- */
.site-footer {
  --museum-darker: #12100e;
  --museum-cream: #f5f0e8;
  --museum-gold-light: #e0d4a8;
  --museum-border: rgba(201, 169, 98, 0.2);
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
</style>