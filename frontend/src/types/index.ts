// ===== 订单查询相关类型 =====

// 订单记录类型 - 与后端OrderReconciliationRecord保持一致
export interface OrderRecord {
  订单号: string
  来源渠道: string
  下单人手机号: string
  平台订单号: string
  订单类型: string
  订单状态: string
  下单时间: string
  所属门店名称: string
  所属门店代码: string
  配送方式: string
  收货人: string
  收货人手机号: string
  收货地址: string
  商品种类数: number
  商品总数量: number
  商品总金额: number
  优惠总金额: number
  实付商品总金额: number
  原应付运费金额: number
  运费活动优惠金额: number
  优惠后运费: number
  包装费: number
  客户实付金额: number
  优惠券ID?: string
  优惠券名称?: string
  优惠券使用条件?: string
  减免金额?: number
  客户备注?: string
  支付宝支付: number
  支付宝支付单号?: string
  支付宝外部支付单号?: string
  微信支付: number
  微信支付支付单号?: string
  微信支付外部支付单号?: string
  储值卡支付: number
  储值卡支付单号?: string
  储值卡支付外部支付单号?: string
  卡包支付: number
  卡包支付单号?: string
  卡包支付外部支付单号?: string
  微支付: number
  微支付支付单号?: string
  微支付外部支付单号?: string
  硕洋饭卡支付: number
  硕洋饭卡支付支付单号?: string
  硕洋饭卡支付外部支付单号?: string
  津贴支付: number
  津贴支付支付单号?: string
  津贴支付支付外部支付单号?: string
  用户注册日期?: string
}

// 查询参数类型
export interface OrderQueryParams {
  startTime: string
  endTime: string
  stationCodes?: string
  mobile?: string
  status?: string
  page?: number
  pageSize?: number
}

// 导出参数类型
export interface ExportQueryParams extends OrderQueryParams {
  exportFormat?: 'csv' | 'excel'
  filename?: string
  exportLimit?: number
}

// ===== 筛选选项类型 =====

export interface FilterOptionItem {
  value: string | number
  label: string
}

export interface StoreOption {
  id: string
  name: string
  outCode: string
  region?: string
}

export interface FilterOptions {
  // 门店列表
  stores?: StoreOption[]
  
  // 订单状态选项
  statuses?: FilterOptionItem[]
  
  // 订单类型选项
  types?: FilterOptionItem[]
  
  // 来源渠道选项
  channels?: FilterOptionItem[]
  
  // 配送方式选项
  deliveryMethods?: FilterOptionItem[]
  
  // 支付方式选项
  paymentMethods?: FilterOptionItem[]
  
  // 快速日期范围选项
  quickDateRanges?: {
    value: string
    label: string
    days: number | 'month' | 'last-month'
  }[]
}

// ===== API响应类型 =====

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
  warning?: string
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: PaginatedData<T>
}

export interface OrderQueryResponse extends PaginatedResponse<OrderRecord> {
  queryConditions?: OrderQueryParams
  executionTime?: number
}

export interface ExportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  params: ExportQueryParams
  created_at: Date | string
  completed_at?: Date | string
  download_url?: string
  error?: string
}

// ===== 统计数据类型 =====

export interface OrderStats {
  totalOrders: number
  totalAmount: number
  avgAmount: number
  successRate: number
  topStores: Array<{
    storeName: string
    storeCode: string
    orderCount: number
    amount: number
  }>
  distributionByChannel: Record<string, number>
  distributionByStatus: Record<string, number>
  distributionByHour: Record<string, number>
  growthRate: {
    day: number
    week: number
    month: number
  }
}

// ===== 系统配置类型 =====

export interface SystemConfig {
  export: {
    maxRecords: number
    allowedFormats: string[]
    defaultFormat: 'excel' | 'csv'
    fileRetentionDays: number
  }
  
  query: {
    maxDateRange: number // 最大查询天数
    defaultPageSize: number
    maxPageSize: number
    cacheDuration: number
  }
  
  display: {
    dateFormat: string
    currencySymbol: string
    numberFormat: string
  }
}