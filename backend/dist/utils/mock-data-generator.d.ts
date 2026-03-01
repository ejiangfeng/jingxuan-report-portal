/**
 * 模拟数据生成器
 * 生成用于开发和测试的模拟订单数据
 */
import { OrderRecord } from '../types';
/**
 * 生成模拟订单数据
 * @param count 需要生成的订单数量
 * @returns 订单记录数组
 */
export declare function generateOrders(count: number): OrderRecord[];
/**
 * 生成指定日期范围内的订单
 */
export declare function generateOrdersInRange(startDate: Date, endDate: Date, count: number): OrderRecord[];
//# sourceMappingURL=mock-data-generator.d.ts.map