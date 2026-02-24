/**
 * 模拟数据生成器
 * 生成用于开发和测试的模拟订单数据
 */

import { OrderRecord } from '../types'

// 配置选项
const STORES = [
  { code: '1101', name: '北京朝阳门店' },
  { code: '2001', name: '上海浦东门店' },
  { code: '3101', name: '深圳南山门店' },
  { code: '3301', name: '杭州西湖门店' },
  { code: '4401', name: '广州天河门店' },
  { code: '5101', name: '成都锦江门店' },
  { code: '3201', name: '南京玄武门店' },
  { code: '4201', name: '武汉江汉门店' }
]

const ORDER_STATUS = [
  '待付款',
  '待发货', 
  '待收货',
  '待评价',
  '交易成功',
  '交易失败',
  '待成团',
  '待接单',
  '待拣货'
]

const ORDER_TYPES = [
  '普通订单',
  '团购订单',
  '秒杀订单',
  '积分订单'
]

const SOURCE_CHANNELS = [
  '鲸选微信小程序',
  '微信公众号',
  '鲸选支付宝小程序',
  'PC',
  'H5',
  '新鲸选APP',
  '支付宝H5',
  '字节宝小程序'
]

const DELIVERY_TYPES = [
  '快递',
  '自提',
  '无需快递',
  '同城配送'
]

const PAYMENT_METHODS = [
  { name: '微信支付', code: 'wx' },
  { name: '支付宝支付', code: 'alipay' },
  { name: '银行卡支付', code: 'bank' },
  { name: '积分支付', code: 'points' }
]

// 模拟数据池
const FIRST_NAMES = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗']
const LAST_NAMES = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英']
const CITIES = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '武汉市', '成都市', '重庆市', '西安市', '天津市', '青岛市']
const STREETS = ['中山路', '人民路', '解放路', '建设路', '和平路', '胜利路', '新华路', '文化路', '青年路', '东风路']
const REMARKS = ['尽快发货', '不要打电话', '放在门口', '包装好点', '易碎品小心', '周末配送', '送货前联系', '放入快递柜']
const COUPON_NAMES = ['新人优惠券', '满减券', '折扣券', '运费券', '会员专享券', '积分兑换券']

// 生成随机手机号
function generatePhoneNumber(): string {
  const prefix = ['13', '15', '16', '17', '18', '19']
  const prefixIndex = Math.floor(Math.random() * prefix.length)
  let number = prefix[prefixIndex]
  
  for (let i = 0; i < 9; i++) {
    number += Math.floor(Math.random() * 10)
  }
  
  return number
}

// 生成随机姓名
function generateName(): string {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  return firstName + lastName
}

// 生成随机地址
function generateAddress(): string {
  const city = CITIES[Math.floor(Math.random() * CITIES.length)]
  const street = STREETS[Math.floor(Math.random() * STREETS.length)]
  const number = Math.floor(Math.random() * 200) + 1
  return `${city}${street}${number}号`
}

/**
 * 生成模拟订单数据
 * @param count 需要生成的订单数量
 * @returns 订单记录数组
 */
export function generateOrders(count: number): OrderRecord[] {
  const orders: OrderRecord[] = []
  
  const baseDate = new Date()
  baseDate.setMonth(baseDate.getMonth() - 3) // 从3个月前开始生成
  
  for (let i = 0; i < count; i++) {
    const orderDate = new Date(baseDate.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000)
    const store = STORES[Math.floor(Math.random() * STORES.length)]
    const status = ORDER_STATUS[Math.floor(Math.random() * ORDER_STATUS.length)]
    const orderType = ORDER_TYPES[Math.floor(Math.random() * ORDER_TYPES.length)]
    const sourceChannel = SOURCE_CHANNELS[Math.floor(Math.random() * SOURCE_CHANNELS.length)]
    const deliveryType = DELIVERY_TYPES[Math.floor(Math.random() * DELIVERY_TYPES.length)]
    
    // 生成商品金额（50-5000元）
    const productAmount = Math.floor(Math.random() * 4950) + 50
    const discountAmount = Math.floor(Math.random() * productAmount * 0.3) // 0-30%的折扣
    const shippingFee = deliveryType === '快递' ? Math.floor(Math.random() * 50) + 10 : 0
    const shippingDiscount = Math.floor(Math.random() * shippingFee * 0.5) // 0-50%的运费优惠
    const packagingFee = Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : 0
    
    const totalAmount = productAmount + shippingFee - discountAmount - shippingDiscount + packagingFee
    const actualPaid = totalAmount
    
    // 生成各支付方式的金额分配
    const paymentMethod = PAYMENT_METHODS[Math.floor(Math.random() * PAYMENT_METHODS.length)]
    let alipayAmount = 0
    let wechatAmount = 0
    let storedCardAmount = 0
    
    switch (paymentMethod.code) {
      case 'alipay':
        alipayAmount = actualPaid
        break
      case 'wx':
        wechatAmount = actualPaid
        break
      default:
        storedCardAmount = actualPaid
    }
    
    const buyerPhone = generatePhoneNumber()
    const receiverPhone = generatePhoneNumber()
    
    const order: OrderRecord = {
      订单号: `ORD${String(1000000 + i).substring(1)}`,
      来源渠道: sourceChannel,
      下单人手机号: buyerPhone,
      平台订单号: `PLAT${String(1000000 + i).substring(1)}`,
      订单类型: orderType,
      订单状态: status,
      下单时间: orderDate.toISOString(),
      所属门店名称: store.name,
      所属门店代码: store.code,
      配送方式: deliveryType,
      收货人: generateName(),
      收货人手机号: receiverPhone,
      收货地址: generateAddress(),
      商品种类数: Math.floor(Math.random() * 10) + 1,
      商品总数量: Math.floor(Math.random() * 100) + 1,
      商品总金额: productAmount,
      优惠总金额: discountAmount,
      实付商品总金额: productAmount - discountAmount,
      原应付运费金额: shippingFee,
      运费活动优惠金额: shippingDiscount,
      优惠后运费: shippingFee - shippingDiscount,
      包装费: packagingFee,
      客户实付金额: actualPaid,
      支付宝支付: alipayAmount,
      微信支付: wechatAmount,
      储值卡支付: storedCardAmount,
      卡包支付: Math.random() > 0.8 ? Math.floor(Math.random() * 500) : 0,
      微支付: Math.random() > 0.9 ? Math.floor(Math.random() * 300) : 0,
      硕洋饭卡支付: Math.random() > 0.7 ? Math.floor(Math.random() * 200) : 0,
      津贴支付: Math.random() > 0.6 ? Math.floor(Math.random() * 100) : 0
    }
    
    // 可选字段，随机生成
    if (Math.random() > 0.5) {
      const couponIndex = Math.floor(Math.random() * COUPON_NAMES.length)
      order.优惠券ID = `COUPON${String(10000 + i).substring(1)}`
      order.优惠券名称 = COUPON_NAMES[couponIndex]
      order.优惠券使用条件 = `满${Math.floor(Math.random() * 200) + 50}元可用`
      order.减免金额 = Math.floor(Math.random() * 50) + 10
    }
    
    if (Math.random() > 0.3) {
      const remarkIndex = Math.floor(Math.random() * REMARKS.length)
      order.客户备注 = REMARKS[remarkIndex]
    }
    
    if (Math.random() > 0.8) {
      order.用户注册日期 = new Date(orderDate.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }
    
    // 生成支付单号（如果有支付）
    if (alipayAmount > 0) {
      order.支付宝支付单号 = `ALIPAY${String(1000000 + i).substring(1)}`
      order.支付宝外部支付单号 = `EXT${String(1000000 + i).substring(1)}`
    }
    
    if (wechatAmount > 0) {
      order.微信支付支付单号 = `WECHAT${String(1000000 + i).substring(1)}`
      order.微信支付外部支付单号 = `WXEXT${String(1000000 + i).substring(1)}`
    }
    
    if (storedCardAmount > 0) {
      order.储值卡支付单号 = `STORED${String(1000000 + i).substring(1)}`
      order.储值卡支付外部支付单号 = `STEXT${String(1000000 + i).substring(1)}`
    }
    
    orders.push(order)
  }
  
  // 按时间排序
  orders.sort((a, b) => new Date(b.下单时间).getTime() - new Date(a.下单时间).getTime())
  
  return orders
}

/**
 * 生成指定日期范围内的订单
 */
export function generateOrdersInRange(startDate: Date, endDate: Date, count: number): OrderRecord[] {
  const orders = generateOrders(count)
  
  const timeRange = endDate.getTime() - startDate.getTime()
  
  return orders.map(order => {
    const randomTime = startDate.getTime() + Math.random() * timeRange
    return {
      ...order,
      下单时间: new Date(randomTime).toISOString()
    }
  })
}

/**
 * 生成指定日期范围内的订单
 */
export function generateOrdersInRange(startDate: Date, endDate: Date, count: number): OrderRecord[] {
  const orders = generateOrders(count)
  
  const timeRange = endDate.getTime() - startDate.getTime()
  
  return orders.map(order => {
    const randomTime = startDate.getTime() + Math.random() * timeRange
    return {
      ...order,
      下单时间: new Date(randomTime).toISOString()
    }
  })
}