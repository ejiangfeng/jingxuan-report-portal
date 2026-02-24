/**
 * 数据转换工具 - 将数据库原始数据转换为应用层数据类型
 */
import {
  OrderSourceChannel,
  OrderType,
  OrderStatus,
  DeliveryType,
  OrderRecord
} from '../types';

/**
 * 将数据库原始行数据转换为订单记录
 * @param rawRow 数据库查询返回的原始行数据
 * @returns 格式化后的订单记录
 */
export function convertToOrderRecord(rawRow: any): OrderRecord {
  // 确保原始数据存在
  if (!rawRow) {
    throw new Error('原始数据为空，无法转换');
  }

  // 构建订单记录对象
  const record: OrderRecord = {
    订单号: rawRow['订单号'] || '',
    来源渠道: rawRow['来源渠道'] || '',
    下单人手机号: rawRow['下单人手机号'] || '',
    平台订单号: rawRow['平台订单号'] || '',
    订单类型: rawRow['订单类型'] || '',
    订单状态: rawRow['订单状态'] || '',
    下单时间: formatDate(rawRow['下单时间']),
    所属门店名称: rawRow['所属门店名称'] || '',
    所属门店代码: rawRow['所属门店代码'] || '',
    配送方式: rawRow['配送方式'] || '',
    收货人: rawRow['收货人'] || '',
    收货人手机号: rawRow['收货人手机号'] || '',
    收货地址: rawRow['收货地址'] || '',
    商品种类数: parseNumber(rawRow['商品种类数']),
    商品总数量: parseNumber(rawRow['商品总数量']),
    商品总金额: parseNumber(rawRow['商品总金额']),
    优惠总金额: parseNumber(rawRow['优惠总金额']),
    实付商品总金额: parseNumber(rawRow['实付商品总金额']),
    原应付运费金额: parseNumber(rawRow['原应付运费金额']),
    运费活动优惠金额: parseNumber(rawRow['运费活动优惠金额']),
    优惠后运费: parseNumber(rawRow['优惠后运费']),
    包装费: parseNumber(rawRow['包装费']),
    客户实付金额: parseNumber(rawRow['客户实付金额']),
    支付宝支付: parseNumber(rawRow['支付宝支付']),
    微信支付: parseNumber(rawRow['微信支付']),
    储值卡支付: parseNumber(rawRow['储值卡支付']),
    卡包支付: parseNumber(rawRow['卡包支付']),
    微支付: parseNumber(rawRow['微支付']),
    硕洋饭卡支付: parseNumber(rawRow['硕洋饭卡支付']),
    津贴支付: parseNumber(rawRow['津贴支付']),
  };

  // 可选字段
  if (rawRow['优惠券ID'] !== undefined && rawRow['优惠券ID'] !== null) {
    record.优惠券ID = String(rawRow['优惠券ID']);
  }
  if (rawRow['优惠券名称'] !== undefined) {
    record.优惠券名称 = rawRow['优惠券名称'];
  }
  if (rawRow['优惠券使用条件'] !== undefined) {
    record.优惠券使用条件 = rawRow['优惠券使用条件'];
  }
  if (rawRow['减免金额'] !== undefined && rawRow['减免金额'] !== null) {
    record.减免金额 = parseNumber(rawRow['减免金额']);
  }
  if (rawRow['客户备注'] !== undefined) {
    record.客户备注 = rawRow['客户备注'];
  }
  if (rawRow['支付宝支付单号'] !== undefined) {
    record.支付宝支付单号 = rawRow['支付宝支付单号'];
  }
  if (rawRow['支付宝外部支付单号'] !== undefined) {
    record.支付宝外部支付单号 = rawRow['支付宝外部支付单号'];
  }
  if (rawRow['微信支付支付单号'] !== undefined) {
    record.微信支付支付单号 = rawRow['微信支付支付单号'];
  }
  if (rawRow['微信支付外部支付单号'] !== undefined) {
    record.微信支付外部支付单号 = rawRow['微信支付外部支付单号'];
  }
  if (rawRow['储值卡支付单号'] !== undefined) {
    record.储值卡支付单号 = rawRow['储值卡支付单号'];
  }
  if (rawRow['储值卡支付外部支付单号'] !== undefined) {
    record.储值卡支付外部支付单号 = rawRow['储值卡支付外部支付单号'];
  }
  if (rawRow['卡包支付单号'] !== undefined) {
    record.卡包支付单号 = rawRow['卡包支付单号'];
  }
  if (rawRow['卡包支付外部支付单号'] !== undefined) {
    record.卡包支付外部支付单号 = rawRow['卡包支付外部支付单号'];
  }
  if (rawRow['微支付支付单号'] !== undefined) {
    record.微支付支付单号 = rawRow['微支付支付单号'];
  }
  if (rawRow['微支付外部支付单号'] !== undefined) {
    record.微支付外部支付单号 = rawRow['微支付外部支付单号'];
  }
  if (rawRow['硕洋饭卡支付支付单号'] !== undefined) {
    record.硕洋饭卡支付支付单号 = rawRow['硕洋饭卡支付支付单号'];
  }
  if (rawRow['硕洋饭卡支付外部支付单号'] !== undefined) {
    record.硕洋饭卡支付外部支付单号 = rawRow['硕洋饭卡支付外部支付单号'];
  }
  if (rawRow['津贴支付支付单号'] !== undefined) {
    record.津贴支付支付单号 = rawRow['津贴支付支付单号'];
  }
  if (rawRow['津贴支付支付外部支付单号'] !== undefined) {
    record.津贴支付支付外部支付单号 = rawRow['津贴支付支付外部支付单号'];
  }
  if (rawRow['用户注册日期'] !== undefined) {
    record.用户注册日期 = formatDate(rawRow['用户注册日期']);
  }

  return record;
}

/**
 * 批量转换数据库行数据为订单记录
 * @param rawRows 数据库查询返回的原始行数据数组
 * @returns 格式化后的订单记录数组
 */
export function convertToOrderRecords(rawRows: any[]): OrderRecord[] {
  if (!rawRows || !Array.isArray(rawRows)) {
    return [];
  }

  return rawRows.map(row => {
    try {
      return convertToOrderRecord(row);
    } catch (error) {
      console.error('转换订单记录失败:', error);
      // 返回一个空记录占位符，避免中断整个转换过程
      return createEmptyOrderRecord(row?.订单号 || 'unknown');
    }
  });
}

/**
 * 创建空的订单记录（用于错误处理）
 */
function createEmptyOrderRecord(orderNumber: string): OrderRecord {
  return {
    订单号: orderNumber,
    来源渠道: '',
    下单人手机号: '',
    平台订单号: '',
    订单类型: '',
    订单状态: '',
    下单时间: '',
    所属门店名称: '',
    所属门店代码: '',
    配送方式: '',
    收货人: '',
    收货人手机号: '',
    收货地址: '',
    商品种类数: 0,
    商品总数量: 0,
    商品总金额: 0,
    优惠总金额: 0,
    实付商品总金额: 0,
    原应付运费金额: 0,
    运费活动优惠金额: 0,
    优惠后运费: 0,
    包装费: 0,
    客户实付金额: 0,
    支付宝支付: 0,
    微信支付: 0,
    储值卡支付: 0,
    卡包支付: 0,
    微支付: 0,
    硕洋饭卡支付: 0,
    津贴支付: 0,
  };
}

/**
 * 格式化日期
 */
function formatDate(date: any): string {
  if (!date) return '';
  
  try {
    if (date instanceof Date) {
      return date.toISOString();
    }
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return String(date);
    }
    
    return dateObj.toISOString();
  } catch {
    return String(date);
  }
}

/**
 * 解析数字，处理空值和字符串
 */
function parseNumber(value: any): number {
  if (value === undefined || value === null) {
    return 0;
  }
  
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * 将数字类型的订单状态转换为中文描述
 */
export function getOrderStatusText(statusCode: number | string): string {
  const code = String(statusCode);
  return OrderStatus[code as keyof typeof OrderStatus] || '未知状态';
}

/**
 * 将数字类型的订单类型转换为中文描述
 */
export function getOrderTypeText(typeCode: number | string): string {
  const code = String(typeCode);
  return OrderType[code as keyof typeof OrderType] || '未知类型';
}

/**
 * 将数字类型的来源渠道转换为中文描述
 */
export function getSourceChannelText(channelCode: number | string): string {
  const code = String(channelCode);
  return OrderSourceChannel[code as keyof typeof OrderSourceChannel] || '未知渠道';
}

/**
 * 将数字类型的配送方式转换为中文描述
 */
export function getDeliveryTypeText(deliveryCode: number | string): string {
  const code = String(deliveryCode);
  return DeliveryType[code as keyof typeof DeliveryType] || '未知方式';
}

/**
 * 将支付类型代码转换为中文描述
 */
export function getPaymentTypeText(paymentCode: string): string {
  return PaymentType[paymentCode as keyof typeof PaymentType] || '未知支付';
}

/**
 * 验证订单记录是否有效（基本验证）
 */
export function validateOrderRecord(record: OrderRecord): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!record.订单号 || record.订单号.trim() === '') {
    errors.push('订单号不能为空');
  }

  if (!record.下单时间 || record.下单时间.trim() === '') {
    errors.push('下单时间不能为空');
  }

  // 验证金额字段是否为正数
  const amountFields = [
    '商品总金额', '客户实付金额', '实付商品总金额'
  ];

  for (const field of amountFields) {
    const value = record[field as keyof OrderRecord];
    if (typeof value === 'number' && value < 0) {
      errors.push(`${field}不能为负数`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}