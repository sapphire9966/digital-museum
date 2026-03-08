<template>
  <div class="ai-assistant-container">
    <!-- 收起状态的按钮 -->
    <transition name="slide-up">
      <div v-if="!isExpanded" class="assistant-toggle" @click="toggleAssistant">
        <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0">
          <el-button type="primary" circle size="large" class="toggle-button">
            <el-icon size="20"><ChatDotRound /></el-icon>
          </el-button>
        </el-badge>
      </div>
    </transition>

    <!-- 展开状态的聊天窗口 -->
    <transition name="slide-right">
      <div 
        v-if="isExpanded" 
        class="assistant-panel"
        :style="getPanelStyle()"
        @mousedown="startDrag"
        @touchstart="startDrag"
      >
        <!-- 头部 -->
        <div class="panel-header" @mousedown="startDrag" @touchstart="startDrag">
          <div class="header-info">
            <div class="avatar-wrapper">
              <el-avatar :size="36" icon="User" class="header-avatar" />
              <div class="online-indicator"></div>
            </div>
            <div class="header-text">
              <h3>智能助手</h3>
              <span class="status">{{ statusText }}</span>
            </div>
          </div>
          <div class="header-actions">
            <el-button @click="toggleAssistant" size="small" plain class="close-button">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>

        <!-- 消息区域 -->
        <div 
          class="messages-container" 
          ref="messagesContainer"
          @paste="handlePaste"
        >
          <div v-if="messages.length === 0" class="welcome-message">
            <div class="welcome-avatar">
              <el-avatar :size="70" icon="User" />
            </div>
            <h3>您好！我是您的智能助手</h3>
            <p>我可以帮您解答关于博物馆展品的问题，支持文字、语音和图像识别</p>
            <div class="quick-actions">
              <el-button @click="sendQuickMessage('介绍一下这个博物馆')" size="small" plain class="quick-btn">
                🏛️ 博物馆介绍
              </el-button>
              <el-button @click="sendQuickMessage('推荐热门展品')" size="small" plain class="quick-btn">
                🔥 热门推荐
              </el-button>
              <el-button @click="sendQuickMessage('如何参观展览')" size="small" plain class="quick-btn">
                🎫 参观指南
              </el-button>
            </div>
          </div>

          <div v-for="(message, index) in messages" :key="index" class="message-item"
               :class="{ 'user-message': message.role === 'user', 'ai-message': message.role === 'assistant' }">
            <div class="message-content">
              <div class="message-avatar">
                <el-avatar :size="36" :icon="message.role === 'user' ? 'User' : 'Avatar'" 
                          :class="{ 'user-avatar': message.role === 'user' }" />
              </div>
              <div class="message-body">
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <div v-if="message.image" class="message-image">
                  <el-image :src="message.image" fit="cover" style="width: 120px; height: 120px;" 
                           :preview-src-list="[message.image]" />
                </div>
                <div class="message-time">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="message-item ai-message">
            <div class="message-content">
              <div class="message-avatar">
                <el-avatar :size="36" icon="Avatar" />
              </div>
              <div class="message-body">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

      <!-- 待完善 -->
        <div class="function-area">
          <div class="action-buttons">
            <el-tooltip content="上传图片" placement="top">
              <el-button @click="triggerImageUpload" size="small" plain class="action-btn">
                <el-icon><Picture /></el-icon>
                图片输入
              </el-button>
            </el-tooltip>
            <el-tooltip content="语音输入" placement="top">
              <el-button @click="toggleVoiceInput" size="small" plain 
                        :type="isListening ? 'danger' : 'default'"
                        class="action-btn">
                <el-icon><Microphone /></el-icon>
                语音输入
              </el-button>
            </el-tooltip>
            <el-tooltip content="清空对话记录" placement="top">
              <el-button @click="clearHistory" size="small" plain class="action-btn">
                <el-icon><Delete /></el-icon>
                清空对话
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <!-- 文本输入框 -->
          <div class="text-input">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="请输入您的问题...支持粘贴图片"
              @keydown.enter.exact.prevent="sendMessage"
              resize="none"
              class="message-input"
            />
          </div>

          <!-- 发送按钮 -->
          <div class="send-button">
            <el-tooltip content="发送消息" placement="top">
              <el-button type="primary" @click="sendMessage" :disabled="isLoading || !inputMessage.trim()"
                        :loading="isLoading" class="send-btn">
                <el-icon><Position /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
        </div>

        <!-- 隐藏的文件上传 -->
        <input 
          ref="imageInput"
          type="file" 
          accept="image/*" 
          @change="handleImageUpload" 
          style="display: none;"
        />
      </div>
    </transition>

    <!-- 语音识别提示 -->
    <div v-if="isListening" class="voice-overlay" @click="stopVoiceInput">
      <div class="voice-indicator">
        <div class="pulse-circle"></div>
        <div class="voice-text">正在聆听... 点击停止</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Close, Delete, Picture, Microphone, Position, Plus, Minus } from '@element-plus/icons-vue'
import { chatWithAI } from '@/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  image?: string
}

// 面板状态
const isExpanded = ref(false)
const inputMessage = ref('')
const messages = ref<Message[]>([])
const isLoading = ref(false)
const unreadCount = ref(0)
const messagesContainer = ref<HTMLDivElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)

// 拖拽相关
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const panelX = ref(0)
const panelY = ref(0)
const startX = ref(0)
const startY = ref(0)
let animationFrameId: number | null = null

// 语音相关
const isListening = ref(false)
let recognition: any = null

// 获取面板样式
const getPanelStyle = () => ({
  transform: `translate(${panelX.value}px, ${panelY.value}px)`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
  transition: isDragging.value ? 'none' : 'transform 0.2s ease'
})

// 状态文本
const statusText = computed(() => {
  if (isLoading.value) return '正在思考...'
  if (isListening.value) return '语音输入中'
  return '在线为您服务'
})

// 拖拽功能
const startDrag = (event: MouseEvent | TouchEvent) => {
  // 更精确地避免在输入框内触发拖拽
  const target = event.target as HTMLElement
  const closestInput = target.closest('.el-textarea__inner, .el-input__inner, .message-input, .text-input')
  const closestButton = target.closest('.el-button, .action-btn, .close-button')
  
  // 如果点击的是输入框区域或按钮区域，则不触发拖拽
  if (closestInput || closestButton) {
    return
  }

  isDragging.value = true
  
  let clientX: number, clientY: number
  if ('touches' in event) {
    const touchEvent = event as TouchEvent
    if (touchEvent.touches && touchEvent.touches.length > 0 && touchEvent.touches[0]) {
      const touch = touchEvent.touches[0]
      clientX = touch.clientX
      clientY = touch.clientY
    } else {
      return // 没有触摸点
    }
  } else {
    const mouseEvent = event as MouseEvent
    clientX = mouseEvent.clientX
    clientY = mouseEvent.clientY
  }
  
  dragStartX.value = clientX - panelX.value
  dragStartY.value = clientY - panelY.value
  startX.value = panelX.value
  startY.value = panelY.value
  
  // 添加全局事件监听器
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('touchmove', handleDrag, { passive: false })
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchend', stopDrag)
  
  event.preventDefault()
}

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  
  animationFrameId = requestAnimationFrame(() => {
    let clientX: number, clientY: number
    if ('touches' in event) {
      const touchEvent = event as TouchEvent
      if (touchEvent.touches && touchEvent.touches.length > 0 && touchEvent.touches[0]) {
        const touch = touchEvent.touches[0]
        clientX = touch.clientX
        clientY = touch.clientY
      } else {
        return
      }
    } else {
      const mouseEvent = event as MouseEvent
      clientX = mouseEvent.clientX
      clientY = mouseEvent.clientY
    }
    
    panelX.value = clientX - dragStartX.value
    panelY.value = clientY - dragStartY.value
  })
  
  event.preventDefault()
}

const stopDrag = () => {
  isDragging.value = false
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  
  // 移除全局事件监听器
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchend', stopDrag)
}


// 切换助手显示状态
const toggleAssistant = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    unreadCount.value = 0
    scrollToBottom()
  }
}

// 发送消息
const sendMessage = async () => {
  const content = inputMessage.value.trim()
  if (!content && !currentImage.value) return

  // 添加用户消息
  const userMessage: Message = {
    role: 'user',
    content: content,
    timestamp: new Date(),
    image: currentImage.value
  }
  
  messages.value.push(userMessage)
  inputMessage.value = ''
  currentImage.value = ''
  isLoading.value = true
  scrollToBottom()

  try {
    // 调用AI API
    const response = await chatWithAI({
      messages: messages.value.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      image: userMessage.image
    })
    
    // 添加AI回复
    const aiMessage: Message = {
      role: 'assistant',
      content: response.content,
      timestamp: new Date()
    }
    messages.value.push(aiMessage)
    
  } catch (error) {
    console.error('AI请求失败:', error)
    ElMessage.error('抱歉，暂时无法连接到智能助手')
    
    // 添加错误回复
    const errorMessage: Message = {
      role: 'assistant',
      content: '抱歉，我现在无法回答您的问题。请稍后再试。',
      timestamp: new Date()
    }
    messages.value.push(errorMessage)
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

// 快速消息
const sendQuickMessage = (message: string) => {
  inputMessage.value = message
  sendMessage()
}

// 图片上传
const currentImage = ref('')
const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      currentImage.value = e.target?.result as string
      ElMessage.success('图片已添加')
    }
    reader.readAsDataURL(file)
  }
}

// 粘贴图片处理
const handlePaste = (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item && item.type?.indexOf('image') !== -1) {
      const blob = item.getAsFile()
      if (blob) {
        const reader = new FileReader()
        reader.onload = (e) => {
          currentImage.value = e.target?.result as string
          ElMessage.success('图片已粘贴')
        }
        reader.readAsDataURL(blob)
        break
      }
    }
  }
}

// 语音输入
const toggleVoiceInput = async () => {
  if (isListening.value) {
    stopVoiceInput()
  } else {
    startVoiceInput()
  }
}

const startVoiceInput = async () => {
  try {
    // 初始化语音识别
    if (!('webkitSpeechRecognition' in window)) {
      ElMessage.warning('您的浏览器不支持语音识别功能')
      return
    }

    recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'zh-CN'

    recognition.onstart = () => {
      isListening.value = true
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      inputMessage.value = transcript
      stopVoiceInput()
    }

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      if (event.error !== 'no-speech') {
        ElMessage.error('语音识别失败，请重试')
      }
      stopVoiceInput()
    }

    recognition.onend = () => {
      isListening.value = false
    }

    recognition.start()
    
  } catch (error) {
    console.error('语音输入初始化失败:', error)
    ElMessage.error('语音输入功能初始化失败')
  }
}

const stopVoiceInput = () => {
  if (recognition) {
    recognition.stop()
  }
  isListening.value = false
}

const simulateVoiceLevel = () => {
  const interval = setInterval(() => {
    if (!isListening.value) {
      clearInterval(interval)
      return
    }
    voiceLevel.value = Math.floor(Math.random() * 30) + 70
  }, 100)
}

// 清除历史记录
const clearHistory = () => {
  messages.value = []
  currentImage.value = ''
  ElMessage.success('聊天记录已清除')
}

// 移除 simulateVoiceLevel 函数
// const simulateVoiceLevel = () => {
//   const interval = setInterval(() => {
//     if (!isListening.value) {
//       clearInterval(interval)
//       return
//     }
//     voiceLevel.value = Math.floor(Math.random() * 30) + 70
//   }, 100)
// }

// 格式化消息内容
const formatMessage = (content: string) => {
  // 简单的文本格式化
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 页面可见性变化处理
const handleVisibilityChange = () => {
  if (!document.hidden && !isExpanded.value) {
    unreadCount.value = 0
  }
}

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (recognition) {
    recognition.stop()
  }
  // 清理可能残留的事件监听器
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('touchmove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchend', stopDrag)
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<style scoped>
.ai-assistant-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  /* 只在非输入区域禁用用户选择 */
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 收起状态 */
.assistant-toggle {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-button {
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
}

.toggle-button:hover {
  transform: scale(1.15) rotate(5deg);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.4);
}

/* 展开面板 */
.assistant-panel {
  width: 400px;
  height: 560px;
  background: linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%);
  border-radius: 20px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: none;
  transform-origin: bottom right;
  backdrop-filter: blur(10px);
  will-change: transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(228, 231, 237, 0.6);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  cursor: move;
  position: relative;
  overflow: hidden;
  touch-action: none;
}

/* .panel-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff9a9e, #fad0c4, #a1c4fd, #c2e9fb);
  animation: gradientShift 3s ease-in-out infinite;
} */

@keyframes gradientShift {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-wrapper {
  position: relative;
}

.header-avatar {
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #13ce66;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(19, 206, 102, 0.3);
  animation: pulse-green 2s infinite;
}

@keyframes pulse-green {
  0% { transform: scale(0.8); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0.7; }
}

.header-text h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.status {
  font-size: 13px;
  opacity: 0.9;
  font-weight: 300;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.close-button {
  color: white;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

/* 功能按钮区域 */
.function-area {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  position: relative;
}

.function-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #c7d2fe, transparent);
}

.action-buttons {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-btn {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-size: 13px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.action-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.action-btn:active {
  transform: translateY(0);
}


/* 消息区域 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%);
  cursor: default;
  position: relative;
}

.messages-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e0e7ff, transparent);
}

.welcome-message {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.welcome-avatar {
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.welcome-message h3 {
  margin: 20px 0 12px 0;
  color: #1e293b;
  font-size: 22px;
  font-weight: 600;
}

.quick-actions {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.quick-btn {
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.quick-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.message-item {
  margin-bottom: 20px;
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.user-message .message-content {
  flex-direction: row-reverse;
}

.user-message .message-body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px 6px 20px 20px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  position: relative;
}

.user-message .message-body::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -8px;
  width: 0;
  height: 0;
  border-left: 8px solid #667eea;
  border-top: 8px solid transparent;
}

.ai-message .message-body {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px 20px 20px 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  position: relative;
}

.ai-message .message-body::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -8px;
  width: 0;
  height: 0;
  border-right: 8px solid white;
  border-top: 8px solid transparent;
  filter: drop-shadow(-2px 0px 1px #e2e8f0);
}

.message-body {
  max-width: 75%;
  padding: 16px 20px;
  position: relative;
}

.user-avatar {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.message-text {
  line-height: 1.6;
  word-wrap: break-word;
  font-size: 15px;
}

.message-image {
  margin-top: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 8px;
  text-align: right;
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

/* 打字动画 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
}

.typing-indicator span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  animation: typing 1.4s infinite ease-in-out;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.5); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* 输入区域 */
.input-area {
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  gap: 16px;
  align-items: flex-end;
  position: relative;
  /* 确保输入区域可以正常使用 */
  user-select: auto;
  -webkit-user-select: auto;
  -moz-user-select: auto;
  -ms-user-select: auto;
  pointer-events: auto;
}

.input-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #c7d2fe, transparent);
}

.text-input {
  flex: 1;
  /* 确保输入框区域可以接收焦点和鼠标事件 */
  pointer-events: auto;
  user-select: auto;
  -webkit-user-select: auto;
  -moz-user-select: auto;
  -ms-user-select: auto;
}

.message-input :deep(.el-textarea__inner) {
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  /* 确保输入框可以正常选择和输入文本 */
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  /* 确保输入框可以接收鼠标事件 */
  pointer-events: auto;
  cursor: text;
}

.message-input :deep(.el-textarea__inner):focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.send-button {
  align-self: flex-end;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
}

.send-btn:disabled {
  opacity: 0.6;
  transform: none;
}


/* 语音覆盖层 */
.voice-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.9) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
  backdrop-filter: blur(5px);
}

.voice-indicator {
  text-align: center;
  color: white;
  animation: fadeIn 0.3s ease-out;
  /* 缩小整体尺寸 */
  transform: scale(0.8);
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(0.8); }
}

.pulse-circle {
  width: 80px; /* 从100px缩小到80px */
  height: 80px;
  border: 4px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  margin: 0 auto 20px; /* 从25px减少到20px */
  position: relative;
  animation: pulse 1.5s infinite;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
}

.pulse-circle::before {
  content: '';
  position: absolute;
  top: -12px; /* 从-15px调整到-12px */
  left: -12px;
  right: -12px;
  bottom: -12px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse 1.5s infinite 0.5s;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.voice-text {
  font-size: 18px; /* 从20px缩小到18px */
  margin-bottom: 12px; /* 从16px减少到12px */
  font-weight: 300;
  letter-spacing: 1px;
}

/* 动画效果 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.8);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.9);
}

/* 滚动条样式 */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
  margin: 10px 0;
}

.messages-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #c7d2fe, #a5b4fc);
  border-radius: 4px;
  transition: all 0.3s ease;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #a5b4fc, #818cf8);
  transform: scaleX(1.2);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .assistant-panel {
    width: 340px;
    height: 500px;
  }
  
  .panel-header {
    padding: 16px 20px;
  }
  
  .function-area {
    padding: 12px 20px;
  }
  
  .messages-container {
    padding: 16px 20px;
  }
  
  .input-area {
    padding: 12px 20px 16px;
  }
  
  .header-text h3 {
    font-size: 16px;
  }
  
  .welcome-message h3 {
    font-size: 20px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .assistant-panel {
    background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  .messages-container {
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  }
  
  .input-area {
    background: linear-gradient(180deg, #1e293b 0%, #334155 100%);
    border-top-color: #334155;
  }
  
  .bottom-actions {
    background: linear-gradient(180deg, #334155 0%, #475569 100%);
    border-top-color: #475569;
  }
}
</style>