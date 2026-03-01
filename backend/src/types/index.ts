// ===== 数据库连接配置 =====
export interface DatabaseConnection {
  host: string
  port: number
  user: string
  password: string
  database: string
  connectionLimit?: number
  waitForConnections?: boolean
  multipleStatements?: boolean
}

export interface DataWorksConfig {
  endpoint: string
  accessKeyId: string
  accessKeySecret: string
  projectId: string
}

// ===== 数据库表模型 =====

// 订单表 (tz_order)
export interface TzOrderTable {
  order_number: string;
  social_type: number;
  order_type: number;
  status: number;
  create_time: Date;
  station_id: number;
  user_id: string;
  dvy_type: number;
  receiver_name: string;
  receiver_mobile: string;
  total: number;
  reduce_amount: number;
  actual_total: number;
  freight_amount: number;
  platform_free_freight_amount: number;
  packing: number;
  is_payed: number;
  remarks: string;
  addr_order_id?: number;
}

// 门店表 (tz_station)
export interface TzStationTable {
  station_id: number;
  station_name: string;
  out_code: string;
}

// 用户表 (tz_user)
export interface TzUserTable {
  user_id: string;
  user_mobile: string;
  user_regtime: Date;
}

// 用户订单地址表 (tz_user_addr_order)
export interface TzUserAddrOrderTable {
  addr_order_id: number;
  province: string;
  city: string;
  area: string;
  addr: string;
}

// 订单项表 (tz_order_item)
export interface TzOrderItemTable {
  order_number: string;
  sku_id: string;
  prod_count: number;
}

// 支付信息表 (tz_pay_info)
export interface TzPayInfoTable {
  order_numbers: string;
  pay_lh_type: string;
  pay_lh_actual_amount: number;
  pay_no: string;
  biz_pay_no: string;
  pay_status: number;
}

// 优惠券使用记录表 (tz_coupon_use_record)
export interface TzCouponUseRecordTable {
  order_number: string;
  coupon_user_id: number;
}

// 用户优惠券表 (tz_coupon_user)
export interface TzCouponUserTable {
  coupon_user_id: number;
  coupon_id: number;
}

// 优惠券表 (tz_coupon)
export interface TzCouponTable {
  coupon_id: number;
  coupon_name: string;
  cash_condition: string;
  reduce_amount: number;
}

// ===== 请求参数类型定义 =====

export interface OrderQueryParams {
  startTime: string;
  endTime: string;
  stationCodes?: string;
  mobile?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface ExportQueryParams extends OrderQueryParams {
  format?: 'xlsx' | 'csv';
  filename?: string;
  exportLimit?: number;
}

// 与控制器一致的接口定义
export interface QueryParams {
  filters: {
    dateRange: {
      start: string;
      end: string;
    };
    storeIds?: string;
    mobile?: string;
    statuses?: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}

export interface ExportParams extends QueryParams {
  format?: 'xlsx' | 'csv';
  filename?: string;
  exportLimit?: number;
}

export interface DatabaseConnection {
  host: string
  port: number
  user: string
  password: string
  database: string
}

export interface DataWorksConfig {
  endpoint: string
  accessKeyId: string
  accessKeySecret: string
  projectId: string
}

export interface QueryResult {
  success: boolean
  data?: any[]
  error?: string
  queryTime?: number
  affectedRows?: number
}

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

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: {
    items: T[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// ===== 枚举类型定义 =====

// 订单来源渠道枚举
export const OrderSourceChannel = {
  1: '鲸选微信小程序',
  2: '微信公众号',
  6: '鲸选支付宝小程序',
  7: 'PC',
  8: 'H5',
  9: '新鲸选APP',
  10: '新鲸选APP',
  11: '支付宝H5',
  12: '字节宝小程序'
} as const;

// 订单类型枚举
export const OrderType = {
  0: '普通订单',
  1: '团购订单',
  2: '秒杀订单',
  3: '积分订单'
} as const;

// 订单状态枚举
export const OrderStatus = {
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '待评价',
  5: '交易成功',
  6: '交易失败',
  7: '待成团',
  10: '待接单',
  15: '待拣货',
  50: '部分支付',
  60: '整单的撤销中'
} as const;

// 配送方式枚举
export const DeliveryType = {
  1: '快递',
  2: '自提',
  3: '无需快递',
  4: '同城配送'
} as const;

// 支付类型枚举
export const PaymentType = {
  '2001': '微信支付',
  '2002': '支付宝支付',
  '1001': '硕洋饭卡支付',
  '1002': '津贴支付',
  '1003': '储值卡支付',
  '1004': '微支付',
  '1005': '卡包支付'
} as const;

// ===== 导出任务类型 =====

export interface ExportTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  exportFormat: 'xlsx' | 'csv';
  queryParams: ExportQueryParams;
  fileUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  totalRecords?: number;
  exportedRecords?: number;
}

// ===== 数据库查询响应 =====

export interface DatabaseQueryResponse {
  success: boolean;
  data?: OrderRecord[];
  total?: number;
  queryTime?: number;
  sql?: string;
  error?: string;
}

export interface OrderQueryResponse extends PaginatedResponse<OrderRecord> {
  queryConditions?: OrderQueryParams;
  executionTime?: number;
}