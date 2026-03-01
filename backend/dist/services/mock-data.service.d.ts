/**
 * 模拟数据服务 - 用于开发和测试阶段
 * 在没有真实数据库连接时提供模拟数据
 */
import { OrderRecord } from '../types';
export declare class MockDataService {
    private static instance;
    private orders;
    private constructor();
    static getInstance(): MockDataService;
    private initializeMockData;
    /**
     * 根据查询参数筛选模拟订单数据
     */
    queryOrders(params: any): Promise<{
        success: boolean;
        data: OrderRecord[];
        total: number;
        page: any;
        pageSize: any;
        totalPages: number;
        executionTime: number;
    }>;
    /**
     * 获取订单数量
     */
    countOrders(params: any): Promise<{
        success: boolean;
        data: {
            count: number;
        };
    }>;
    /**
     * 获取筛选选项
     */
    getFilterOptions(): Promise<{
        success: boolean;
        data: {
            stores: {
                id: string;
                name: string;
                outCode: string;
            }[];
            statuses: {
                value: string;
                label: string;
            }[];
            channels: {
                value: string;
                label: string;
            }[];
            types: {
                value: string;
                label: string;
            }[];
            deliveryMethods: {
                value: string;
                label: string;
            }[];
            quickDateRanges: ({
                value: string;
                label: string;
                days: number;
            } | {
                value: string;
                label: string;
                days: string;
            })[];
        };
    }>;
    /**
     * 获取订单统计信息
     */
    getOrderStats(params: any): Promise<{
        success: boolean;
        data: {
            totalOrders: number;
            totalAmount: number;
            avgAmount: number;
            successRate: number;
            topStores: {
                storeName: string;
                storeCode: string;
                orderCount: number;
                amount: number;
            }[];
            distributionByChannel: Record<string, number>;
            distributionByStatus: Record<string, number>;
            distributionByHour: Record<string, number>;
            growthRate: {
                day: number;
                week: number;
                month: number;
            };
        };
    }>;
    /**
     * 获取单个订单详情
     */
    getOrderDetail(orderNumber: string): Promise<{
        success: boolean;
        data: OrderRecord;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        data?: undefined;
    }>;
    /**
     * 触发导出任务
     */
    createExportTask(params: any): Promise<{
        success: boolean;
        error: string;
        data?: undefined;
        message?: undefined;
    } | {
        success: boolean;
        data: {
            id: string;
            status: string;
            params: any;
            created_at: Date;
            download_url: string;
        };
        message: string;
        error?: undefined;
    }>;
    /**
     * 模拟数据库查询延迟
     */
    private simulateQueryDelay;
}
//# sourceMappingURL=mock-data.service.d.ts.map