<template>
  <div class="collections-page">
    <div class="page-header">
      <h1 class="page-title">珍贵藏品</h1>
      <p class="page-subtitle">探索博物馆珍藏的历史文物与艺术品</p>
    </div>
    
    <div class="collections-content">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载藏品数据...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button @click="loadCollections" class="retry-button">重新加载</button>
      </div>
      
      <!-- 藏品列表 -->
      <div v-else class="collections-grid">
        <div 
          v-for="item in collections" 
          :key="item.id"
          class="collection-card"
          @click="viewCollectionDetail(item.id, item.glb_model.url)"
        >
          <div class="card-image">
            <img :src="'http://localhost:8000' + item.image.url" :alt="item.image.url" style="height: 300px;"/>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ item.name }}</h3>
            <p class="card-description">{{ item.description }}</p>
            <div class="card-meta">
              <span class="card-era">{{ item.era }}</span>
              <span class="card-category">{{ item.main_category.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCollectionList, type CollectionItem } from '../api/index'

const router = useRouter()

const collections = ref<CollectionItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 加载藏品列表
async function loadCollections() {
  loading.value = true
  error.value = null
  
  try {
    const data = await getCollectionList()
    collections.value = data
  } catch (err: any) {
    console.error('加载藏品列表失败:', err)
    error.value = err.message || '加载失败，请稍后重试'
    
    // 如果后端接口未就绪，使用模拟数据用于开发调试
    if (err.message?.includes('Failed to fetch') || err.code === 'ERR_NETWORK') {
      console.warn('后端接口不可用，使用模拟数据')
      collections.value = [
        {
          id: 1,
          name: '青花瓷瓶',
          description: '明代永乐年间精品青花瓷器，釉色清雅，纹饰精美',
          image: 'https://images.unsplash.com/photo-1618609335154-89d7b6e1c1a8?w=400&h=300&fit=crop',
          era: '明代',
          main_category: '陶瓷',
          sub_category: '',
          display_number: '001',
          glb_model: ''
        },
        {
          id: 2,
          name: '青铜鼎',
          description: '商代晚期青铜礼器，造型庄重，工艺精湛',
          image: 'https://images.unsplash.com/photo-1587245862022-33bcd6ed6f52?w=400&h=300&fit=crop',
          era: '商代',
          main_category: '青铜器',
          sub_category: '',
          display_number: '002',
          glb_model: ''
        },
        {
          id: 3,
          name: '书画卷轴',
          description: '清代名家山水画作，笔墨精妙，意境深远',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          era: '清代',
          main_category: '书画',
          sub_category: '',
          display_number: '003',
          glb_model: ''
        },
        {
          id: 4,
          name: '玉雕摆件',
          description: '汉代和田玉雕作品，温润如玉，雕工细腻',
          image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&h=300&fit=crop',
          era: '汉代',
          main_category: '玉石',
          sub_category: '',
          display_number: '004',
          glb_model: ''
        }
      ]
    }
  } finally {
    loading.value = false
  }
}

function viewCollectionDetail(id: number, url: string) {
  router.push(`/collections/${id}`)
  router.push({ 
  name: 'exhibition-detail', 
  params: { id: id,
    url:url
   } 
})
}

// 组件挂载时加载数据
onMounted(() => {
  loadCollections()
})
</script>

<style scoped>
.collections-page {
  min-height: 100vh;
  padding-top: 0; /* 移除重复的padding-top，让App.vue统一控制 */
  background: linear-gradient(135deg, #f5f0e8 0%, #e8e1d4 100%);
}

.page-header {
  text-align: center;
  padding: 60px 20px;
  background: rgba(26, 24, 20, 0.95);
  color: white;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  letter-spacing: 0.1em;
}

.page-subtitle {
  font-size: 1.1rem;
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto;
}

.collections-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #c9a962;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 1rem;
}

/* 错误状态样式 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
  text-align: center;
}

.error-icon {
  font-size: 3rem;
}

.error-message {
  color: #d32f2f;
  font-size: 1.1rem;
  max-width: 400px;
}

.retry-button {
  padding: 10px 24px;
  background-color: #c9a962;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.retry-button:hover {
  background-color: #b89650;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
}

.collection-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.collection-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.card-image {
  height: 200px;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.collection-card:hover .card-image img {
  transform: scale(1.05);
}

.card-content {
  padding: 20px;
}

.card-title {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1a1814;
}

.card-description {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
  white-space: nowrap;      /* 强制不换行 */
  overflow: hidden;         /* 隐藏超出内容 */
  text-overflow: ellipsis;  /* 超出显示省略号 */
}

.card-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.card-era,
.card-category {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.card-era {
  background: #c9a962;
  color: white;
}

.card-category {
  background: #f0f0f0;
  color: #333;
}

@media (max-width: 768px) {
  .collections-grid {
    grid-template-columns: 1fr;
  }
  
  .page-title {
    font-size: 2rem;
  }
}
</style>