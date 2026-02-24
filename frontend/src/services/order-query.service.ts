import { 
  OrderQueryParams, 
  ExportQueryParams, 
  OrderQueryResponse,
  ExportJob,
  OrderStats,
  ApiResponse,
  PaginatedResponse
} from '../types'

// API基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1'
const API_TIMEOUT = 30000 // 30秒超时

// 请求封装
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
  }

  const combinedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)
  combinedOptions.signal = controller.signal

  try {
    const response = await fetch(url, combinedOptions)
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查网络连接')
      }
      throw new Error(`请求失败: ${error.message}`)
    }
    throw new Error('未知的网络错误')
  }
}

// 订单查询服务
export const orderQueryService = {
  // 查询订单列表
  async queryOrders(params: OrderQueryParams): Promise<OrderQueryResponse> {
    try {
      return await fetchApi<OrderQueryResponse>('/orders/query', {
        method: 'POST',
        body: JSON.stringify(params),
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '查询失败',
        timestamp: new Date().toISOString(),
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0
        }
      }
    }
  },

  // 导出订单数据
  async exportOrders(params: ExportQueryParams): Promise<ApiResponse<ExportJob>> {
    try {
      return await fetchApi<ApiResponse<ExportJob>>('/orders/export', {
        method: 'POST',
        body: JSON.stringify(params),
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '导出失败',
        timestamp: new Date().toISOString(),
      }
    }
  },

  // 获取订单统计信息
  async getOrderStats(params: OrderQueryParams): Promise<ApiResponse<OrderStats>> {
    try {
      return await fetchApi<ApiResponse<OrderStats>>('/orders/stats', {
        method: 'POST',
        body: JSON.stringify(params),
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取统计信息失败',
        timestamp: new Date().toISOString(),
      }
    }
  },

  // 获取订单详情
  async getOrderDetail(orderNumber: string): Promise<ApiResponse> {
    try {
      return await fetchApi<ApiResponse>(`/orders/${orderNumber}`, {
        method: 'GET',
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取订单详情失败',
        timestamp: new Date().toISOString(),
      }
    }
  },

  // 检查订单数量（用于导出验证）
  async checkOrderCount(params: OrderQueryParams): Promise<ApiResponse<{ count: number }>> {
    try {
      return await fetchApi<ApiResponse<{ count: number }>>('/orders/count', {
        method: 'POST',
        body: JSON.stringify(params),
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查数量失败',
        timestamp: new Date().toISOString(),
      }
    }
  },

  // 批量获取订单详情
  async getBatchOrderDetails(orderNumbers: string[]): Promise<ApiResponse> {
    try {
      return await fetchApi<ApiResponse>('/orders/batch', {
        method: 'POST',
        body: JSON.stringify({ orderNumbers }),
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '批量获取详情失败',
        timestamp: new Date().toISOString(),
      }
    }
  },

  // 实时订阅订单更新（WebSocket）
  subscribeToOrderUpdates(callback: (update: any) => void): () => void {
    // WebSocket实现（简化版）
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/orders/ws`
    // const ws = new WebSocket(wsUrl)
    
    // ws.onmessage = (event) => {
    //   try {
    //     const data = JSON.parse(event.data)
    //     callback(data)
    //   } catch (error) {
    //     console.error('WebSocket消息解析失败:', error)
    //   }
    // }
    
    // return () => ws.close()
    
    // 临时返回空函数，实际使用时实现WebSocket
    return () => {}
  }
}