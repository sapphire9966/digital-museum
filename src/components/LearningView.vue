<template>
  <div class="learning-page">
    <!-- 装饰性背景纹理 -->
    <div class="bg-pattern"></div>
    
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">探索发现</h1>
        <p class="page-subtitle">沉浸式学习体验 · 丝绸服饰文化脉络</p>
        <div class="header-decoration">
          <span class="dec-line"></span>
          <span class="dec-circle"></span>
          <span class="dec-line"></span>
        </div>
      </div>
    </div>
    
    <div class="learning-content">
      <!-- 丝绸服饰文化知识图谱卡片 -->
      <div class="knowledge-graph-section">
        <div class="section-header">
          <h2 class="section-title">丝绸服饰文化知识图谱</h2>
          <p class="section-description">点击节点，探索传承与发展的细节</p>
        </div>
        
        <!-- 图谱容器 + 右侧弹窗 -->
        <div class="graph-wrapper">
          <div class="graph-container" ref="graphContainerRef">
            <RelationGraph
              ref="relationGraphRef"
              :options="graphOptions"
              :json-data="graphData"
              @node-click="onNodeClick"
            />
            
            <!-- 信息浮层卡片 (移到graph-container内部) -->
            <transition name="slide-fade">
              <div 
                v-if="selectedNode" 
                class="info-panel" 
                :style="panelStyle"
                @mousedown="startDrag"
                @touchstart="startDrag"
              >
                <div class="drag-handle">
                  <span class="drag-icon">⋮⋮</span>
                </div>
                <button class="close-btn" @click="closeInfoPanel">✕</button>
                <div class="info-header">
                  <span class="info-icon" :style="{ backgroundColor: nodeColor(selectedNode) }">📌</span>
                  <h3>{{ selectedNode.text }}</h3>
                </div>
                <div class="info-body">
                  <p>{{ getNodeDescription(selectedNode.id) }}</p>
                </div>
                <div class="info-footer">
                  <span class="tag">{{ relatedCount(selectedNode) }} 个关联</span>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- 微说明：节点颜色图例 -->
        <div class="graph-legend">
          <div class="legend-item"><span class="legend-dot" style="background:#c9a962;"></span> 根主题</div>
          <div class="legend-item"><span class="legend-dot" style="background:#f5f0e8; border:1px solid #c9a962;"></span> 主要分支</div>
          <div class="legend-item"><span class="legend-dot" style="background:#e8e1d4;"></span> 具体节点</div>
          <div class="legend-item"><span class="legend-dot" style="background:#b19055;"></span> 选中高亮</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import RelationGraph from 'relation-graph-vue3'

// 类型定义
interface GraphNode {
  id: string
  text: string
  color: string
  fontColor: string
  borderColor?: string
  borderWidth?: number
  borderWidthOriginal?: number
  fontSize?: number
  description?: string
  relatedNodes?: string[]
}

interface GraphLine {
  from: string
  to: string
  animation?: number
}

interface GraphData {
  rootId?: string
  nodes: GraphNode[]
  lines: GraphLine[]
}

const relationGraphRef = ref<any>(null)
const graphContainerRef = ref<HTMLElement | null>(null)
const selectedNode = ref<GraphNode | null>(null)
const panelStyle = ref({
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)'
})

// 拖拽相关状态
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const panelStartX = ref(0)
const panelStartY = ref(0)
let animationFrameId: number | null = null
const dragThreshold = 5 // 拖拽阈值，防止轻微移动就触发拖拽
let clickTimer: number | null = null

// 图谱配置
const graphOptions = ref({
  allowSwitchLineShape: true,
  allowSwitchJunctionPoint: true,
  defaultJunctionPoint: 'border',
  defaultLineShape: 1,        // 曲线
  defaultNodeColor: '#f5f0e8',
  defaultNodeFontColor: '#1a1814',
  defaultLineColor: '#b19055',
  defaultLineWidth: 2.5,
  defaultNodeBorderColor: '#c9a962',
  defaultNodeBorderWidth: 1,
  defaultNodeWidth: 120,
  defaultNodeHeight: 120,
  defaultNodeShape: 0,        // 圆形
  defaultNodeFontSize: 18,
  zoomToFitWhenRefresh: true,
  toolBarDirection: 'vertical',
  defaultExpandHolderPosition: 'right',
  allowNodeDrag: true,
  nodeHoverEffect: true,
  defaultBackgrounColor: '#fafafa',
  defaultZoom: 100,
})

// 节点描述映射
const nodeDescriptions: Record<string, string> = {
  root: '丝绸服饰是华夏文明的重要载体，集纺织、艺术与礼制于一身。从“黄帝垂裳”到丝绸之路，承载千年美学。',
  history: '历经商周、汉唐、宋元明清，丝绸服饰从贵族礼服走向民间，纹样与形制不断演变，见证民族融合。',
  craft: '包括养蚕、缫丝、织造、染整、刺绣等数十道工序。2009年，中国传统桑蚕丝织技艺入选人类非遗。',
  origin: '距今约5000年的仰韶文化遗址出土了丝织品残片；商代甲骨文已有“蚕、桑、丝”等字，起源极为古老。',
  development: '战国秦汉时期，绢、绮、锦大量出现；唐代织锦纹样富丽，吸收异域风格；宋代缂丝、明清云锦达到技艺高峰。',
  sericulture: '养蚕采桑、煮茧抽丝。自古以来，女红采桑是田园诗的主题；蚕丝纤细柔韧，一根丝可达千米以上。',
  weaving: '传统织机有腰机、斜织机、提花机。汉代已能织出复杂纹样；宋锦、蜀锦、云锦并称三大名锦。',
  embroidery: '刺绣以针引彩线，在绸缎上绣出图案。苏绣、湘绣、粤绣、蜀绣四大名绣各具特色，被誉为“东方艺术明珠”。',
  dyeing: '传统染整使用植物染料如靛蓝、茜草、红花。蜡染、扎染、夹缬等技艺创造出丰富的色彩与纹样。',
  patterns: '纹样蕴含吉祥寓意：云纹代表高升，龙纹象征权威，牡丹寓意富贵，蝙蝠谐音“福”，鱼纹象征富裕。'
}

// 图谱数据
const graphData = ref<GraphData>({
  rootId: 'root',
  nodes: [
    { 
      id: 'root', 
      text: '丝绸服饰文化', 
      color: '#c9a962', 
      fontColor: '#ffffff', 
      borderColor: '#a08143', 
      borderWidth: 3,
      fontSize: 20
    },
    { 
      id: 'history', 
      text: '历史发展', 
      color: '#f5f0e8', 
      fontColor: '#1a1814',
      borderColor: '#c9a962', 
      borderWidth: 2,
      fontSize: 18
    },
    { 
      id: 'craft', 
      text: '制作工艺', 
      color: '#f5f0e8', 
      fontColor: '#1a1814',
      borderColor: '#c9a962', 
      borderWidth: 2,
      fontSize: 18
    },
    { 
      id: 'origin', 
      text: '起源时期', 
      color: '#e8e1d4', 
      fontColor: '#1a1814',
      borderColor: '#b19055',
      fontSize: 16
    },
    { 
      id: 'development', 
      text: '发展期', 
      color: '#e8e1d4', 
      fontColor: '#1a1814',
      borderColor: '#b19055',
      fontSize: 16
    },
    { 
      id: 'sericulture', 
      text: '养蚕缫丝', 
      color: '#e8e1d4', 
      fontColor: '#1a1814',
      borderColor: '#b19055',
      fontSize: 16
    },
    { 
      id: 'weaving', 
      text: '织造技术', 
      color: '#e8e1d4', 
      fontColor: '#1a1814',
      borderColor: '#b19055',
      fontSize: 16
    },
    { 
      id: 'embroidery', 
      text: '刺绣技艺', 
      color: '#e8e1d4', 
      fontColor: '#1a1814',
      borderColor: '#b19055',
      fontSize: 16
    },
    { 
      id: 'dyeing', 
      text: '染整技艺', 
      color: '#e8e1d4', 
      fontColor: '#1a1814',
      borderColor: '#b19055',
      fontSize: 16
    },
    { 
      id: 'patterns', 
      text: '纹样寓意', 
      color: '#e8e1d4', 
      fontColor: '#1a1814',
      borderColor: '#b19055',
      fontSize: 16
    }
  ],
  lines: [
    { from: 'root', to: 'history', animation: 1 },
    { from: 'root', to: 'craft' },
    { from: 'history', to: 'origin' },
    { from: 'history', to: 'development' },
    { from: 'craft', to: 'sericulture' },
    { from: 'craft', to: 'weaving' },
    { from: 'craft', to: 'embroidery' },
    { from: 'craft', to: 'dyeing' },
    { from: 'history', to: 'patterns' },
    { from: 'patterns', to: 'root' }
  ]
})

// 计算与某节点相连的个数
const relatedCount = (node: GraphNode): number => {
  if (!node) return 0
  return graphData.value.lines.filter(l => l.from === node.id || l.to === node.id).length
}

// 获取节点颜色 (用于弹窗图标)
const nodeColor = (node: GraphNode): string => {
  return node.color || '#f5f0e8'
}

// 获取节点描述
const getNodeDescription = (nodeId: string): string => {
  return nodeDescriptions[nodeId] || '点击节点，解锁丝绸故事……'
}

// 关闭信息面板
const closeInfoPanel = () => {
  selectedNode.value = null
  resetNodeBorders()
}

// 重置节点边框
const resetNodeBorders = () => {
  graphData.value.nodes.forEach((n: GraphNode) => {
    n.borderWidth = n.borderWidthOriginal || (n.id === 'root' ? 3 : 2)
    n.borderColor = n.id === 'root' ? '#a08143' : '#c9a962'
    
    if (relationGraphRef.value && typeof relationGraphRef.value.updateNodeStyle === 'function') {
      relationGraphRef.value.updateNodeStyle(n)
    }
  })
}

// 拖拽开始
const startDrag = (event: MouseEvent | TouchEvent) => {
  event.preventDefault()
  event.stopPropagation() // 阻止事件冒泡，避免干扰节点点击
  
  isDragging.value = true
  
  const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY
  
  dragStartX.value = clientX
  dragStartY.value = clientY
  
  // 获取当前弹窗的实际位置（从DOM读取，而不是从panelStyle）
  const panelElement = document.querySelector('.info-panel') as HTMLElement
  if (panelElement) {
    const rect = panelElement.getBoundingClientRect()
    const containerRect = graphContainerRef.value?.getBoundingClientRect()
    
    if (containerRect) {
      // 计算相对于容器的位置
      panelStartX.value = rect.left - containerRect.left
      panelStartY.value = rect.top - containerRect.top
      
      // 更新panelStyle为实际位置
      panelStyle.value = {
        top: panelStartY.value + 'px',
        left: panelStartX.value + 'px',
        transform: 'none'
      }
    }
    
    panelElement.classList.add('dragging')
  }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchend', stopDrag)
}

// 拖拽中
const onDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  
  event.preventDefault()
  event.stopPropagation() // 阻止事件冒泡
  
  const clientX = 'touches' in event ? event.touches[0].clientX : (event as MouseEvent).clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : (event as MouseEvent).clientY
  
  const deltaX = clientX - dragStartX.value
  const deltaY = clientY - dragStartY.value
  
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  if (distance < dragThreshold) {
    return
  }
  
  let newLeft = panelStartX.value + deltaX
  let newTop = panelStartY.value + deltaY
  
  // 边界检查
  if (graphContainerRef.value) {
    const containerRect = graphContainerRef.value.getBoundingClientRect()
    const panelElement = document.querySelector('.info-panel') as HTMLElement
    if (panelElement) {
      const panelWidth = panelElement.offsetWidth
      const panelHeight = panelElement.offsetHeight
      
      const margin = 10
      newLeft = Math.max(margin, Math.min(newLeft, containerRect.width - panelWidth - margin))
      newTop = Math.max(margin, Math.min(newTop, containerRect.height - panelHeight - margin))
    }
  }
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  
  animationFrameId = requestAnimationFrame(() => {
    panelStyle.value = {
      top: newTop + 'px',
      left: newLeft + 'px',
      transform: 'none'
    }
  })
}

// 拖拽结束
const stopDrag = () => {
  isDragging.value = false
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  const panelElement = document.querySelector('.info-panel') as HTMLElement
  if (panelElement) {
    panelElement.classList.remove('dragging')
  }
  
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchend', stopDrag)
}

// 节点点击事件
const onNodeClick = (nodeObject: any, $event: MouseEvent) => {
  // 如果正在拖拽中，不处理点击事件
  if (isDragging.value) return
  
  // 简单的防抖，避免快速连续点击
  if (clickTimer) {
    clearTimeout(clickTimer)
  }
  
  clickTimer = window.setTimeout(() => {
    console.log('点击节点:', nodeObject)
    if (!nodeObject || !nodeObject.id) return
    
    selectedNode.value = {
      id: nodeObject.id,
      text: nodeObject.text || '',
      color: nodeObject.color || '#f5f0e8',
      fontColor: nodeObject.fontColor || '#1a1814',
      borderColor: nodeObject.borderColor,
      borderWidth: nodeObject.borderWidth,
      borderWidthOriginal: nodeObject.borderWidthOriginal,
      fontSize: nodeObject.fontSize
    }

    // 高亮选中节点
    const targetNode = graphData.value.nodes.find(n => n.id === nodeObject.id)
    if (targetNode) {
      targetNode.borderWidth = 5
      targetNode.borderColor = '#b19055'
      targetNode.borderWidthOriginal = targetNode.borderWidthOriginal || (targetNode.id === 'root' ? 3 : 2)
      
      graphData.value.nodes.forEach(n => {
        if (n.id !== nodeObject.id) {
          n.borderWidth = n.borderWidthOriginal || (n.id === 'root' ? 3 : 2)
          n.borderColor = n.id === 'root' ? '#a08143' : '#c9a962'
        }
      })
      
      // 更新节点样式
      if (relationGraphRef.value && typeof relationGraphRef.value.updateNodeStyle === 'function') {
        relationGraphRef.value.updateNodeStyle(targetNode)
      }
    }

    // 计算弹窗位置
    if (graphContainerRef.value) {
      const containerRect = graphContainerRef.value.getBoundingClientRect()
      const nodeElement = ($event.target as HTMLElement).closest('.relation-graph-node')
      
      if (nodeElement) {
        const nodeRect = nodeElement.getBoundingClientRect()
        
        let left = nodeRect.right - containerRect.left + 20
        let top = nodeRect.top - containerRect.top - 50
        
        const panelWidth = 300
        const panelHeight = 300
        
        if (left + panelWidth > containerRect.width - 20) {
          left = nodeRect.left - containerRect.left - panelWidth - 20
        }
        
        if (top < 10) {
          top = 10
        }
        
        if (top + panelHeight > containerRect.height - 10) {
          top = containerRect.height - panelHeight - 10
        }
        
        panelStyle.value = {
          top: top + 'px',
          left: left + 'px',
          transform: 'none'
        }
        
        // 记录初始位置
        panelStartX.value = left
        panelStartY.value = top
      }
    }
    
    clickTimer = null
  }, 50) // 50ms的防抖延迟
}

// 刷新图谱
const refreshGraph = () => {
  if (relationGraphRef.value) {
    relationGraphRef.value.setJsonData(graphData.value)
  }
}

// 初始化图谱
onMounted(async () => {
  await nextTick()
  
  // 为每个节点添加原始边框宽度
  graphData.value.nodes = graphData.value.nodes.map((n: GraphNode) => ({
    ...n,
    borderWidthOriginal: n.borderWidth || (n.id === 'root' ? 3 : 2)
  }))
  
  // 稍微延迟一下确保组件已挂载
  setTimeout(() => {
    if (relationGraphRef.value) {
      relationGraphRef.value.setJsonData(graphData.value)
        .then(() => {
          console.log('图谱加载成功')
        })
        .catch((error: Error) => {
          console.error('图谱加载失败:', error)
        })
    }
  }, 100)
})
</script>

<style scoped>
.learning-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(145deg, #f9f5f0 0%, #ece4d9 100%);
  font-family: 'Noto Serif SC', 'Times New Roman', serif;
}

.bg-pattern {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('data:image/svg+xml;utf8,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><path d="M30 5 L55 30 L30 55 L5 30 Z" fill="none" stroke="%23e0d6c8" stroke-width="0.6" opacity="0.3"/><circle cx="30" cy="30" r="4" fill="%23dacbb8" opacity="0.2"/></svg>');
  pointer-events: none;
  z-index: 0;
}

.page-header {
  position: relative;
  background: rgba(38, 33, 28, 0.92);
  backdrop-filter: blur(8px);
  color: white;
  padding: 40px 20px 30px;
  text-align: center;
  border-bottom: 1px solid rgba(201, 169, 98, 0.3);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.3);
  z-index: 2;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  letter-spacing: 0.15em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.page-subtitle {
  font-size: 1.3rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto 30px;
  line-height: 1.6;
}

.header-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.dec-line {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #c9a962, transparent);
}

.dec-circle {
  width: 8px;
  height: 8px;
  background: #c9a962;
  border-radius: 50%;
  box-shadow: 0 0 10px #e6b87e;
}

.learning-content {
  position: relative;
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 20px 20px;
  z-index: 3;
}

.knowledge-graph-section {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(4px);
  border-radius: 32px;
  /* padding: 30px 25px; */
  box-shadow: 0 25px 45px -12px rgba(78, 54, 30, 0.3);
  border: 1px solid rgba(201, 169, 98, 0.4);
}

.section-header {
  text-align: left;
  margin-bottom: 25px;
  padding-left: 15px;
  border-left: 6px solid #c9a962;
}

.section-header .section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1814;
  margin-bottom: 15px;
  letter-spacing: 0.05em;
}

.section-description {
  font-size: 1.2rem;
  color: #666;
  line-height: 1.6;
}

.graph-wrapper {
  position: relative;
  display: flex;
  gap: 20px;
}

.graph-container {
  position: relative;
  flex: 1;
  height: 750px;
  background: #fefefc;
  border-radius: 24px;
  border: 1px solid #dacbb8;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.02), 0 10px 20px rgba(87, 67, 41, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  /* 性能优化 */
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 信息卡片 - 改为相对于graph-container定位 */
.info-panel {
  position: absolute;
  width: 300px;
  background: rgba(255, 252, 245, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 28px;
  padding: 20px;
  box-shadow: 0 30px 50px rgba(59, 45, 25, 0.4), 0 0 0 2px rgba(201, 169, 98, 0.5);
  border: 1px solid #fff9ed;
  z-index: 1000;
  transition: all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.2);
  color: #2b241c;
  pointer-events: auto;  /* 确保可以点击弹窗内的按钮 */
  max-width: calc(100% - 40px);  /* 防止弹窗超出容器宽度 */
  user-select: none; /* 防止拖拽时选中文本 */
  cursor: move; /* 显示拖拽光标 */
  touch-action: none; /* 防止触摸时页面滚动 */
  
  /* 性能优化 */
  will-change: transform;
  transform: translateZ(0); /* 启用硬件加速 */
  -webkit-transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* 拖拽时的优化样式 */
.info-panel.dragging {
  transition: none; /* 拖拽时禁用过渡动画 */
  box-shadow: 0 15px 25px rgba(59, 45, 25, 0.3), 0 0 0 2px rgba(201, 169, 98, 0.5);
  user-select: none !important;
  -webkit-user-select: none !important;
  cursor: grabbing;
}

/* 拖拽手柄 */
.drag-handle {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 24px;
  height: 24px;
  background: rgba(201, 169, 98, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  transition: all 0.2s ease;
  z-index: 1001; /* 确保手柄在最上层 */
  pointer-events: auto;
}

.drag-handle:hover {
  background: rgba(201, 169, 98, 0.4);
  transform: scale(1.1);
}

.drag-icon {
  font-size: 14px;
  color: #c9a962;
  font-weight: bold;
  line-height: 1;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.25s, transform 0.3s;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #9b8b76;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.03);
  transition: 0.2s;
  pointer-events: auto;
  z-index: 1002;
}

.close-btn:hover {
  background: rgba(201, 169, 98, 0.2);
  color: #b19055;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-right: 25px;
}

.info-icon {
  width: 42px;
  height: 42px;
  border-radius: 40% 60% 40% 60%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.info-header h3 {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  color: #3e3023;
}

.info-body {
  margin: 15px 0;
  line-height: 1.7;
  font-size: 1rem;
  color: #4d4237;
  background: rgba(201, 169, 98, 0.05);
  padding: 16px;
  border-radius: 18px;
  border-left: 4px solid #c9a962;
}

.info-footer {
  display: flex;
  justify-content: flex-end;
}

.tag {
  background: #eae1d2;
  padding: 6px 18px;
  border-radius: 40px;
  font-size: 0.9rem;
  color: #5b4a36;
  font-weight: 500;
}

/* 图例 */
.graph-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 25px;
  justify-content: center;
  padding: 15px 20px 5px;
  background: #f3ede5;
  border-radius: 60px;
  border: 1px solid #dccdb9;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: #3e3329;
}

.legend-dot {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: #c9a962;
}

/* relation-graph 内部样式微调 */
:deep(.relation-graph-node) {
  transition: filter 0.2s, stroke-width 0.2s, stroke 0.2s;
  cursor: pointer;
}

:deep(.relation-graph-node.selected) {
  filter: drop-shadow(0 0 10px #c9a962);
}

/* 确保图谱容器内的canvas或svg不会遮挡弹窗 */
:deep(.relation-graph) {
  position: relative;
  z-index: 1;
}

/* 滚动条样式（可选） */
.graph-container::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.graph-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.graph-container::-webkit-scrollbar-thumb {
  background: #c9a962;
  border-radius: 10px;
}

.graph-container::-webkit-scrollbar-thumb:hover {
  background: #b19055;
}
</style>