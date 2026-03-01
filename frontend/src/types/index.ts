// 订单记录类型 - 匹配后端返回的英文字段名
export interface OrderRecord {
  order_id: string
  order_number: string
  user_id: string
  下单人手机号?: string
  station_id?: string
  所属门店名称?: string
  所属门店代码?: string
  status: number | string
  订单状态?: string
  create_time?: string
  下单时间?: string
  product_nums?: number
  商品总数量?: number
  total?: number
  商品总金额?: number
  actual_total?: number
  客户实付金额?: number
  reduce_amount?: number
  优惠总金额?: number
  freight_amount?: number
  receiver_name?: string
  receiver_mobile?: string
  dvy_type?: number
  配送方式?: string
  pay_type?: number
  订单类型?: string
  [key: string]: any
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

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp?: string
}

// 订单查询响应
export interface OrderQueryResponse {
  success: boolean
  data?: {
    items: OrderRecord[]
    total: number
    page: number
    pageSize: number
  }
  error?: string
  timestamp?: string
}

// 导出任务
export interface ExportJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// 筛选选项
export interface FilterOptions {
  stores?: Array<{ id: string; name: string; outCode: string }>
  statuses?: Array<{ value: string; label: string }>
  types?: Array<{ value: string; label: string }>
  channels?: Array<{ value: string; label: string }>
  deliveryMethods?: Array<{ value: string; label: string }>
  paymentMethods?: Array<{ value: string; label: string }>
  quickDateRanges?: Array<{ value: string; label: string }>
}
