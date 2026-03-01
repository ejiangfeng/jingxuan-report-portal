/**
 * 数据转换工具 - 将数据库原始数据转换为应用层数据类型
 */
import { OrderRecord } from '../types';
/**
 * 将数据库原始行数据转换为订单记录
 * @param rawRow 数据库查询返回的原始行数据
 * @returns 格式化后的订单记录
 */
export declare function convertToOrderRecord(rawRow: any): OrderRecord;
/**
 * 批量转换数据库行数据为订单记录
 * @param rawRows 数据库查询返回的原始行数据数组
 * @returns 格式化后的订单记录数组
 */
export declare function convertToOrderRecords(rawRows: any[]): OrderRecord[];
/**
 * 将数字类型的订单状态转换为中文描述
 */
export declare function getOrderStatusText(statusCode: number | string): string;
/**
 * 将数字类型的订单类型转换为中文描述
 */
export declare function getOrderTypeText(typeCode: number | string): string;
/**
 * 将数字类型的来源渠道转换为中文描述
 */
export declare function getSourceChannelText(channelCode: number | string): string;
/**
 * 将数字类型的配送方式转换为中文描述
 */
export declare function getDeliveryTypeText(deliveryCode: number | string): string;
/**
 * 将支付类型代码转换为中文描述
 */
export declare function getPaymentTypeText(paymentCode: string): string;
/**
 * 验证订单记录是否有效（基本验证）
 */
export declare function validateOrderRecord(record: OrderRecord): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=dataConverters.d.ts.map