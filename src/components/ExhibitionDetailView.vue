<template>
  <el-container class="exhibition-detail-page" direction="vertical">
    <el-main class="detail-main">
      <div class="detail-inner">
        <div class="detail-breadcrumb" @click="goHome">
          <span class="crumb-home">首页</span>
          <span class="crumb-sep">/</span>
          <span class="crumb-current">服装 360° 漫游</span>
        </div>

        <section class="section section-exhibition-detail">
          <div class="section-head">
            <span class="section-label">EXHIBITION DETAIL</span>
            <h2 class="section-title">服装数字展览 · 360° 漫游</h2>
            <p class="section-subtitle">
              在三维空间中自由旋转、缩放展品，从多个角度欣赏传统服饰的纹样与工艺细节。
            </p>
          </div>
          <el-row :gutter="32" class="exhibition-detail-layout">
            <el-col :xs="24" :md="16">
              <!-- three.js 360° 服装模型容器 -->
              <div ref="threeContainer" class="exhibition-three-wrapper"></div>
            </el-col>
            <el-col :xs="24" :md="8">
              <div class="exhibition-detail-content">
                <h3 class="detail-side-title">展品信息</h3>
                <p class="exhibition-detail-desc">
                  按住拖拽可以 360° 旋转服装模型，滚轮缩放查看细节。你可以将真实的 GLTF/GLB
                  服装模型接入到当前三维场景中，构建沉浸式数字展览体验。
                </p>
                <div class="exhibition-detail-meta">
                  <p><span class="meta-label">展品类型：</span>服饰 / 织绣</p>
                  <p><span class="meta-label">展厅：</span>数字服饰展厅</p>
                </div>
                <el-button type="primary" size="large" class="exhibition-detail-btn" @click="goHome">
                  返回首页
                </el-button>
              </div>
            </el-col>
          </el-row>
        </section>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const router = useRouter()
const threeContainer = ref<HTMLDivElement | null>(null)

let renderer: any = null
let scene: any = null
let camera: any = null
let controls: any = null
let animationId = 0

function goHome() {
  router.push({ path: '/' })
}

function initThree() {
  const container = threeContainer.value
  if (!container) return

  const width = container.clientWidth || 400
  const height = container.clientHeight || 320

  // 场景
  scene = new Scene()
  scene.background = new Color('#12100e')

  // 相机
  camera = new PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(0, 1.2, 3)

  // 渲染器
  renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  container.innerHTML = ''
  container.appendChild(renderer.domElement)

  // 光照
  const ambient = new AmbientLight(0xffffff, 0.6)
  const dirLight = new DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(2, 4, 3)
  scene.add(ambient, dirLight)

  // 简单服装模型占位（球体 + 材质），后续可替换为 GLTF 模型
  const clothGeo = new SphereGeometry(0.9, 48, 48)
  const clothMat = new MeshStandardMaterial({
    color: new Color('#c9a962'),
    roughness: 0.35,
    metalness: 0.15,
  })
  const clothMesh = new Mesh(clothGeo, clothMat)
  clothMesh.position.set(0, 1, 0)
  scene.add(clothMesh)

  // 轨道控制，实现 360° 旋转 & 缩放
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.target.set(0, 1, 0)
  controls.minDistance = 1.5
  controls.maxDistance = 5

  const animate = () => {
    animationId = requestAnimationFrame(animate)
    controls?.update()
    if (scene && camera && renderer) {
      renderer.render(scene, camera)
    }
  }
  animate()

  const handleResize = () => {
    const c = threeContainer.value
    if (!c || !camera || !renderer) return
    const w = c.clientWidth || width
    const h = c.clientHeight || height
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }

  window.addEventListener('resize', handleResize)

  // 在组件卸载时移除监听
  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
}

onMounted(() => {
  initThree()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  controls?.dispose()
  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
  controls = null
})
</script>

<style scoped>
.exhibition-detail-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 0% 0%, rgba(201, 169, 98, 0.16), transparent 55%),
    radial-gradient(circle at 100% 100%, rgba(40, 36, 30, 0.9), #12100e 60%);
}

.detail-main {
  padding: 96px 24px 72px;
  display: flex;
  justify-content: center;
}

.detail-inner {
  width: 100%;
  max-width: 1180px;
}

.detail-breadcrumb {
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 240, 232, 0.8);
  margin-bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.detail-breadcrumb:hover {
  color: #f5f0e8;
}

.crumb-home {
  opacity: 0.9;
}

.crumb-current {
  opacity: 0.6;
}

.section-exhibition-detail {
  background: rgba(20, 18, 15, 0.9);
  border-radius: 24px;
  padding: 28px 28px 32px;
  border: 1px solid rgba(201, 169, 98, 0.28);
  box-shadow:
    0 24px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.02) inset;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.section-head {
  margin-bottom: 24px;
}

.section-label {
  display: block;
  font-size: 0.7rem;
  letter-spacing: 0.28em;
  color: #c9a962;
  margin-bottom: 10px;
}

.section-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 1.7rem;
  letter-spacing: 0.12em;
  color: #f5f0e8;
  margin: 0 0 8px;
}

.section-subtitle {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(245, 240, 232, 0.78);
}

.exhibition-detail-layout {
  align-items: stretch;
}

.exhibition-three-wrapper {
  border-radius: 18px;
  background: radial-gradient(circle at 30% 20%, rgba(201, 169, 98, 0.2), transparent 60%),
    #060607;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.75);
}

.exhibition-detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #f5f0e8;
}

.detail-side-title {
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 240, 232, 0.9);
  margin: 4px 0;
}

.exhibition-detail-desc {
  font-size: 0.96rem;
  line-height: 1.9;
  color: rgba(245, 240, 232, 0.82);
}

.exhibition-detail-meta {
  font-size: 0.9rem;
  color: rgba(245, 240, 232, 0.7);
}

.exhibition-detail-meta p {
  margin: 4px 0;
}

.meta-label {
  color: #c9a962;
}

.exhibition-detail-btn {
  margin-top: 16px;
  align-self: flex-start;
}

@media (max-width: 768px) {
  .detail-main {
    padding: 80px 16px 56px;
  }

  .section-exhibition-detail {
    padding: 20px 18px 24px;
    border-radius: 18px;
  }

  .exhibition-three-wrapper {
    aspect-ratio: 4 / 5;
    margin-bottom: 16px;
  }
}
</style>

