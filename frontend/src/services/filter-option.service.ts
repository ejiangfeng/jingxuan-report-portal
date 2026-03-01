import { FilterOptions, ApiResponse } from '../types'

// API基础配置（与order-query.service一致）
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'

// 请求封装（简化版）
async function fetchApi<T>(endpoint: string): Promise<T> {
  const url = `/api/v1${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data as T
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

// 筛选选项服务
export const filterOptionService = {
  // 获取筛选选项
  async getFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await fetchApi<ApiResponse<FilterOptions>>('/orders/filter-options')
      
      if (response.success && response.data) {
        return response.data
      } else {
        throw new Error(response.error || '获取筛选选项失败')
      }
    } catch (error) {
      console.error('获取筛选选项失败，返回默认选项:', error)
      return this.getDefaultOptions()
    }
  },

  // 获取默认筛选选项（当API不可用时使用）
  getDefaultOptions(): FilterOptions {
    return {
      stores: [
        { id: '1101', name: '北京朝阳门店', outCode: '1101' },
        { id: '2001', name: '上海浦东门店', outCode: '2001' },
        { id: '3101', name: '深圳南山门店', outCode: '3101' },
        { id: '3301', name: '杭州西湖门店', outCode: '3301' },
        { id: '4401', name: '广州天河门店', outCode: '4401' }
      ],
      statuses: [
        { value: '1', label: '待付款' },
        { value: '2', label: '待发货' },
        { value: '3', label: '待收货' },
        { value: '4', label: '待评价' },
        { value: '5', label: '交易成功' },
        { value: '6', label: '交易失败' },
        { value: '7', label: '待成团' },
        { value: '10', label: '待接单' },
        { value: '15', label: '待拣货' },
        { value: '50', label: '部分支付' },
        { value: '60', label: '整单的撤销中' }
      ],
      types: [
        { value: '0', label: '普通订单' },
        { value: '1', label: '团购订单' },
        { value: '2', label: '秒杀订单' },
        { value: '3', label: '积分订单' }
      ],
      channels: [
        { value: '1', label: '鲸选微信小程序' },
        { value: '2', label: '微信公众号' },
        { value: '6', label: '鲸选支付宝小程序' },
        { value: '7', label: 'PC' },
        { value: '8', label: 'H5' },
        { value: '9', label: '新鲸选APP' },
        { value: '10', label: '新鲸选APP' },
        { value: '11', label: '支付宝H5' },
        { value: '12', label: '字节宝小程序' }
      ],
      deliveryMethods: [
        { value: '1', label: '快递' },
        { value: '2', label: '自提' },
        { value: '3', label: '无需快递' },
        { value: '4', label: '同城配送' }
      ],
      paymentMethods: [
        { value: 'wx', label: '微信支付' },
        { value: 'alipay', label: '支付宝支付' },
        { value: 'bank', label: '银行卡支付' },
        { value: 'points', label: '积分支付' },
        { value: 'stored', label: '储值卡支付' },
        { value: 'coupon', label: '优惠券支付' }
      ],
      quickDateRanges: [
        { value: 'today', label: '今天', days: 0 },
        { value: 'yesterday', label: '昨天', days: 1 },
        { value: 'last7days', label: '近7天', days: 7 },
        { value: 'last30days', label: '近30天', days: 30 },
        { value: 'thismonth', label: '本月', days: 'month' },
        { value: 'lastmonth', label: '上月', days: 'last-month' }
      ]
    }
  },

  // 获取门店列表
  async getStores(): Promise<Array<{ id: string; name: string; outCode: string }>> {
    const options = await this.getFilterOptions()
    return options.stores || []
  },

  // 获取订单状态选项
  async getStatusOptions(): Promise<Array<{ value: string; label: string }>> {
    const options = await this.getFilterOptions()
    return options.statuses || []
  },

  // 获取订单类型选项
  async getTypeOptions(): Promise<Array<{ value: string; label: string }>> {
    const options = await this.getFilterOptions()
    return options.types || []
  },

  // 获取来源渠道选项
  async getChannelOptions(): Promise<Array<{ value: string; label: string }>> {
    const options = await this.getFilterOptions()
    return options.channels || []
  },

  // 获取配送方式选项
  async getDeliveryOptions(): Promise<Array<{ value: string; label: string }>> {
    const options = await this.getFilterOptions()
    return options.deliveryMethods || []
  },

  // 搜索门店（模拟搜索）
  async searchStores(keyword: string): Promise<Array<{ value: string; label: string }>> {
    try {
      const stores = await this.getStores()
      const filtered = stores.filter(store => 
        store.name.includes(keyword) || 
        store.outCode.includes(keyword) ||
        store.id.includes(keyword)
      )
      
      return filtered.map(store => ({
        value: store.outCode,
        label: `${store.name} (${store.outCode})`
      }))
    } catch (error) {
      console.error('搜索门店失败:', error)
      return []
    }
  },

  // 获取智能推荐筛选组合
  getRecommendedFilters(): Record<string, any> {
    // 这里可以根据历史数据或业务规则返回智能推荐的筛选组合
    return {
      // 示例：近期最常用的筛选组合
      standard: {
        name: '标准查询',
        filters: {
          statuses: ['5'], // 交易成功
          dateRange: 'last7days'
        }
      },
      // 示例：运营常用的高级查询
      operations: {
        name: '运营分析',
        filters: {
          statuses: ['5', '4'], // 交易成功和待评价
          dateRange: 'thismonth',
          channels: ['1', '9'] // 微信小程序和APP
        }
      },
      // 示例：财务需要的查询
      finance: {
        name: '财务对账',
        filters: {
          statuses: ['5'], // 交易成功
          dateRange: 'yesterday',
          stores: ['1101', '2001'] // 重点门店
        }
      }
    }
  }
}