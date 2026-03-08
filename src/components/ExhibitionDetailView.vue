<template>
  <el-container class="exhibition-detail-page" direction="vertical">
    <el-main class="detail-main">
      <div class="detail-inner">
        <section class="section section-exhibition-detail">
          <div class="section-head-with-back">
            <el-button class="back-btn" @click="goHome" :icon="ArrowLeft">
              返回
            </el-button>
            <div class="section-head">
              <span class="section-label">EXHIBITION DETAIL</span>
              <h2 class="section-title">服装数字展览 · 360° 漫游</h2>
              <p class="section-subtitle">
                在三维空间中自由旋转、缩放展品，从多个角度欣赏传统服饰的纹样与工艺细节。
              </p>
            </div>
          </div>
          <el-row :gutter="32" class="exhibition-detail-layout">
            <el-col :xs="24" :md="16">
              <!-- three.js 360° 服装模型容器 -->
              <div ref="threeContainer" class="exhibition-three-wrapper">
                <!-- 独立画布容器，避免 innerHTML 清空与 Vue v-if 冲突 -->
                <div ref="canvasContainer" class="canvas-container"></div>
                <!-- 加载指示器 -->
                <div v-if="isLoading" class="loading-overlay">
                  <div class="loading-spinner"></div>
                  <p class="loading-text">正在加载3D模型...</p>
                </div>
                <!-- 错误提示 -->
                <div v-if="loadError" class="error-overlay">
                  <p class="error-text">{{ loadError }}</p>
                </div>
              </div>
            </el-col>
            <el-col :xs="24" :md="8">
              <div class="exhibition-detail-content">
                <h3 class="detail-side-title">{{ collectionData?.name || '展品信息' }}</h3>
                <p class="exhibition-detail-desc">
                  {{ collectionData?.description || '按住拖拽可以 360° 旋转服装模型，滚轮缩放查看细节。当前展示预设的 3D 服装模型。' }}
                </p>
                <div class="exhibition-detail-meta">
                  <p><span class="meta-label">展品类型：</span>{{ collectionData?.main_category?.name || '服饰' }}{{ collectionData?.sub_category ? ' / ' + collectionData.sub_category : '' }}</p>
                  <p><span class="meta-label">年代：</span>{{ collectionData?.era || '未知' }}</p>
                  <p><span class="meta-label">藏品编号：</span>{{ collectionData?.display_number || currentModelName }}</p>
                </div>
               
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
import { ElButton } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import axios from 'axios'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const router = useRouter()
const threeContainer = ref<HTMLDivElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)

let renderer: any = null
let scene: any = null
let camera: any = null
let controls: any = null
let animationId = 0
let currentModel: any = null
let gltfLoader: any = null

// 状态管理
const isLoading = ref(false)
const loadError = ref('')
const currentModelName = ref('加载中...')
const collectionData = ref<any>(null)
const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  url: {
    type: String,
    default: ''
  }
})
function goHome() {
  router.push({ path: '/collections' })
}

function initThree() {
  const container = canvasContainer.value
  const wrapper = threeContainer.value
  if (!container || !wrapper) return

  const width = wrapper.clientWidth || 400
  const height = wrapper.clientHeight || 320

  // 场景
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#12100e')

  // 相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(0, 1.2, 3)

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  container.appendChild(renderer.domElement)

  // 光照
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(2, 4, 3)
  scene.add(ambient, dirLight)

  // 初始化加载器
  initLoaders()

  // 轨道控制，实现 360° 旋转 & 缩放
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.target.set(0, 0, 0)
  controls.minDistance = 1.5
  controls.maxDistance = 5

  // 加载模型（放在 controls 初始化之后，避免 controls 为空时报错）
  createDefaultModel()

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

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
}

function initLoaders() {
  gltfLoader = new GLTFLoader()
}

// 走 Vite 同源路径，由 vite proxy 转发到后端，避免 CORS
const MODEL_API_URL = '/model/api/'
const BACKEND_ORIGIN = 'http://127.0.0.1:8000'

function normalizeModelUrl(url: string) {
  // 如果后端返回的是同一后端域名的绝对地址，转成相对路径，交给 vite proxy
  if (url.startsWith(BACKEND_ORIGIN)) {
    const path = url.slice(BACKEND_ORIGIN.length)
    return path.startsWith('/') ? path : '/' + path
  }
  // 其他绝对地址（不同域名）保持不变（需要后端自己处理 CORS）
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  // 相对路径：确保以 / 开头，这样会命中 vite proxy（/media/...）
  return url.startsWith('/') ? url : '/' + url
}


async function createDefaultModel() {
  try {
    const { data } = await axios.post(MODEL_API_URL, { id: String(props.id) })
    
    // 保存藏品数据
    collectionData.value = data?.data || null
    
    const modelUrlRaw = data?.data?.glb_model?.url
    if (!modelUrlRaw) throw new Error('API 未返回有效的 GLB 模型地址')
    await loadPredefinedModel(normalizeModelUrl(modelUrlRaw))
  } catch (error) {
    console.error('获取模型地址失败:', error)
    loadError.value = `获取模型失败：${(error as Error).message}`
    isLoading.value = false
  }
}


async function loadPredefinedModel(modelPath: string) {
  if (!gltfLoader || !scene) return
  
  isLoading.value = true
  loadError.value = ''
  
  try {
    const gltf: any = await new Promise((resolve, reject) => {
      gltfLoader.load(
        modelPath,
        resolve,
        undefined,
        reject
      )
    })
    
    // 移除当前模型
    if (currentModel) {
      scene.remove(currentModel)
    }
    
    // 添加新模型到场景
    currentModel = gltf.scene
    scene.add(currentModel)
    
    // 调整模型位置和缩放
    const box = new THREE.Box3().setFromObject(currentModel)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    
    // 将模型中心移到原点
    currentModel.position.sub(center)
    
    // 计算合适的缩放比例
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 2 / maxDim
    currentModel.scale.setScalar(scale)
    
    // 更新控制器目标点
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.update()
    }
    
    // 更新状态
    currentModelName.value = collectionData.value?.display_number || (modelPath.split('/').pop() || '3D 模型')
    isLoading.value = false
    
  } catch (error) {
    console.error('模型加载失败:', error)
    loadError.value = `模型加载失败: ${(error as Error).message}`
    isLoading.value = false
   
  }
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
  currentModel = null
  gltfLoader = null
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
  padding: 32px 24px 72px; /* 减少顶部padding，避免与App.vue中的margin-top叠加 */
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
  margin-bottom: 0;
}

.back-btn {
  background: transparent;
  border: 1px solid rgba(201, 169, 98, 0.5);
  color: #c9a962;
  padding: 8px 16px;
  font-size: 0.9rem;
  letter-spacing: 0.1em;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
  margin-top: 10px;
  margin-left: 10px;
  border-radius: 10px 10px 10px 10px;
}

.back-btn:hover {
  background: rgba(201, 169, 98, 0.15);
  border-color: #c9a962;
  color: #f5f0e8;
}

.section-head-with-back {
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
  position: relative;
  border-radius: 18px;
  background: radial-gradient(circle at 30% 20%, rgba(201, 169, 98, 0.2), transparent 60%),
    #060607;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.75);
}

.canvas-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(6, 6, 7, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(201, 169, 98, 0.3);
  border-top: 3px solid #c9a962;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #c9a962;
  font-size: 0.9rem;
  margin: 0;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(6, 6, 7, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.error-text {
  color: #ff6b6b;
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
  padding: 0 20px;
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
  margin: 12px 0;
}

.meta-label {
  color: #c9a962;
}



@media (max-width: 768px) {
  .detail-main {
    padding: 16px 16px 56px; /* 移动端也相应调整 */
  }

  .section-exhibition-detail {
    padding: 20px 18px 24px;
    border-radius: 18px;
  }
  
  .back-btn {
    left: 0;
    top: 0;
  }

  .exhibition-three-wrapper {
    aspect-ratio: 4 / 5;
    margin-bottom: 16px;
  }
}
</style>