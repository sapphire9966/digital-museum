import axios from 'axios'

// 创建实例
const request = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000
})

// DeepSeek API 配置
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-c67704a9ab1d45e5be940beb933ef922'
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'

// DeepSeek API 实例
const deepseekRequest = axios.create({
  baseURL: DEEPSEEK_BASE_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在请求前做一些处理，比如添加 token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// DeepSeek 请求拦截器
deepseekRequest.interceptors.request.use(
  (config) => {
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'your-api-key-here') {
      console.warn('请在环境变量中配置 VITE_DEEPSEEK_API_KEY')
    }
    return config
  },
  (error) => {
    console.error('DeepSeek 请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 统一处理响应数据
    return response.data
  },
  (error) => {
    // 统一处理错误
    // 忽略浏览器扩展引起的错误
    if (error.message?.includes('message channel closed')) {
      console.warn('检测到浏览器扩展干扰，已忽略:', error.message)
      return Promise.resolve(null)
    }
    
    console.error('响应错误:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// DeepSeek 响应拦截器
deepseekRequest.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('DeepSeek 响应错误:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// API 接口类型定义
interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  max_tokens?: number
  image?: string // base64 encoded image
}

interface ChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: ChatMessage
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// 聊天接口
export const chatWithAI = async (params: ChatRequest): Promise<{ content: string }> => {
  try {
    // 如果有图片，需要特殊处理
    let messages = [...params.messages]
    
    if (params.image) {
      // 添加系统提示，说明这是图像问答
      messages.unshift({
        role: 'system',
        content: '你是一个智能博物馆助手，能够理解和分析用户提供的图像内容。请用中文回答用户的问题。'
      })
      
      // 修改最后一条用户消息，添加图像信息
      const lastUserMessage = messages[messages.length - 1]
      if (lastUserMessage && lastUserMessage.role === 'user') {
        lastUserMessage.content = `${lastUserMessage.content}\n\n[用户上传了一张图片，请根据图片内容进行回答]`
      }
    } else {
      // 添加系统角色设定
      messages.unshift({
        role: 'system',
        content: '你是一个专业的数字博物馆智能助手，熟悉各类文物、艺术品和历史文化知识。请用中文友好地回答用户的问题，提供准确有用的信息。'
      })
    }

    const requestBody = {
      model: params.model || 'deepseek-chat',
      messages: messages,
      temperature: params.temperature || 0.7,
      max_tokens: params.max_tokens || 2048
    }

    const response: ChatResponse = await deepseekRequest.post('/chat/completions', requestBody)
    
    const content = response.choices[0]?.message?.content || '抱歉，我没有理解您的问题。'
    
    return { content }
    
  } catch (error: any) {
    console.error('AI聊天请求失败:', error)
    
    // 根据错误类型返回不同的提示
    if (error.response?.status === 401) {
      throw new Error('API密钥无效，请检查配置')
    } else if (error.response?.status === 429) {
      throw new Error('请求过于频繁，请稍后再试')
    } else if (error.response?.status === 500) {
      throw new Error('服务器内部错误，请稍后再试')
    } else {
      throw new Error('网络连接失败，请检查网络设置')
    }
  }
}

// 获取模型列表
export const getModels = async () => {
  try {
    const response = await deepseekRequest.get('/models')
    return response.data
  } catch (error) {
    console.error('获取模型列表失败:', error)
    throw error
  }
}

// 获取藏品列表接口
export interface CollectionItem {
  id: number
  display_number: string
  name: string
  description: string
  image: {
    url: string
    name: string
  }
  glb_model: {
    url: string
    name: string
  }
  era: string
  main_category: {
    code: string
    name: string
  }
  sub_category: string
}

interface CollectionListResponse {
  code: number
  data: {
    items: CollectionItem[]
    total: number
  }
  message?: string
}

// 获取藏品列表
export const getCollectionList = async (params?: {
  page?: number
  pageSize?: number
  category?: string
  era?: string
}): Promise<CollectionItem[]> => {
  try {
    const response: CollectionListResponse = await request.get('collection/api/', { params })
    
    if (response.code === 200 || response.code === 0) {
      return response.data.items || []
    } else {
      console.warn('获取藏品列表失败:', response.message)
      return []
    }
  } catch (error: any) {
    console.error('获取藏品列表请求失败:', error)
    throw error
  }
}

// 默认导出原有实例
export default request