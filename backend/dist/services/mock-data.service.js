"use strict";
/**
 * 模拟数据服务 - 用于开发和测试阶段
 * 在没有真实数据库连接时提供模拟数据
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockDataService = void 0;
const mock_data_generator_1 = require("../utils/mock-data-generator");
const logger_1 = require("../utils/logger");
class MockDataService {
    static instance;
    orders = [];
    constructor() {
        // 生成初始模拟数据
        this.initializeMockData();
    }
    static getInstance() {
        if (!MockDataService.instance) {
            MockDataService.instance = new MockDataService();
        }
        return MockDataService.instance;
    }
    initializeMockData() {
        logger_1.logger.info('初始化模拟数据...');
        this.orders = (0, mock_data_generator_1.generateOrders)(1000); // 生成1000条模拟订单
        logger_1.logger.info(`已生成 ${this.orders.length} 条模拟订单数据`);
    }
    /**
     * 根据查询参数筛选模拟订单数据
     */
    async queryOrders(params) {
        const { startTime, endTime, stationCodes, mobile, status, page = 1, pageSize = 20 } = params;
        let filteredData = [...this.orders];
        // 应用时间筛选
        if (startTime && endTime) {
            filteredData = filteredData.filter(order => {
                const orderTime = new Date(order.下单时间);
                const start = new Date(startTime);
                const end = new Date(endTime);
                return orderTime >= start && orderTime <= end;
            });
        }
        // 应用门店筛选
        if (stationCodes) {
            const stationArray = stationCodes.split(',').map((code) => code.trim());
            filteredData = filteredData.filter(order => stationArray.includes(order.所属门店代码));
        }
        // 应用手机号筛选
        if (mobile) {
            filteredData = filteredData.filter(order => order.下单人手机号.includes(mobile));
        }
        // 应用状态筛选
        if (status) {
            const statusArray = status.split(',').map((s) => s.trim());
            filteredData = filteredData.filter(order => statusArray.includes(order.订单状态));
        }
        // 应用分页
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredData.length);
        const paginatedData = filteredData.slice(startIndex, endIndex);
        // 模拟数据库查询延迟
        await this.simulateQueryDelay();
        return {
            success: true,
            data: paginatedData,
            total: filteredData.length,
            page,
            pageSize,
            totalPages: Math.ceil(filteredData.length / pageSize),
            executionTime: Math.random() * 100 + 50 // 50-150ms的模拟执行时间
        };
    }
    /**
     * 获取订单数量
     */
    async countOrders(params) {
        const result = await this.queryOrders({ ...params, page: 1, pageSize: 1 });
        return {
            success: true,
            data: { count: result.total }
        };
    }
    /**
     * 获取筛选选项
     */
    async getFilterOptions() {
        // 从模拟数据中提取唯一的门店
        const stores = [...new Set(this.orders.map(order => ({
                id: order.所属门店代码,
                name: order.所属门店名称,
                outCode: order.所属门店代码
            })))];
        // 从模拟数据中提取唯一的状态
        const statuses = [...new Set(this.orders.map(order => order.订单状态))]
            .filter(Boolean)
            .map(status => ({
            value: status,
            label: status
        }));
        // 从模拟数据中提取唯一的渠道
        const channels = [...new Set(this.orders.map(order => order.来源渠道))]
            .filter(Boolean)
            .map(channel => ({
            value: channel,
            label: channel
        }));
        await this.simulateQueryDelay(100); // 100ms的延迟
        return {
            success: true,
            data: {
                stores: stores.slice(0, 10), // 只返回前10个门店
                statuses,
                channels,
                types: [
                    { value: '普通订单', label: '普通订单' },
                    { value: '团购订单', label: '团购订单' },
                    { value: '秒杀订单', label: '秒杀订单' },
                    { value: '积分订单', label: '积分订单' }
                ],
                deliveryMethods: [
                    { value: '快递', label: '快递' },
                    { value: '自提', label: '自提' },
                    { value: '无需快递', label: '无需快递' },
                    { value: '同城配送', label: '同城配送' }
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
        };
    }
    /**
     * 获取订单统计信息
     */
    async getOrderStats(params) {
        const { data: filteredOrders } = await this.queryOrders(params);
        // 计算统计信息
        const totalAmount = filteredOrders.reduce((sum, order) => sum + order.客户实付金额, 0);
        const avgAmount = filteredOrders.length > 0 ? totalAmount / filteredOrders.length : 0;
        // 按门店统计
        const storeDistribution = {};
        filteredOrders.forEach(order => {
            const store = order.所属门店名称;
            storeDistribution[store] = (storeDistribution[store] || 0) + 1;
        });
        const topStores = Object.entries(storeDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([storeName, orderCount]) => ({
            storeName,
            storeCode: filteredOrders.find(o => o.所属门店名称 === storeName)?.所属门店代码 || '',
            orderCount,
            amount: filteredOrders
                .filter(o => o.所属门店名称 === storeName)
                .reduce((sum, o) => sum + o.客户实付金额, 0)
        }));
        // 按渠道统计
        const channelDistribution = {};
        filteredOrders.forEach(order => {
            const channel = order.来源渠道;
            channelDistribution[channel] = (channelDistribution[channel] || 0) + 1;
        });
        // 按状态统计
        const statusDistribution = {};
        filteredOrders.forEach(order => {
            const status = order.订单状态;
            statusDistribution[status] = (statusDistribution[status] || 0) + 1;
        });
        // 按小时统计
        const hourDistribution = {};
        filteredOrders.forEach(order => {
            const hour = new Date(order.下单时间).getHours();
            hourDistribution[hour] = (hourDistribution[hour] || 0) + 1;
        });
        await this.simulateQueryDelay();
        return {
            success: true,
            data: {
                totalOrders: filteredOrders.length,
                totalAmount,
                avgAmount,
                successRate: Math.random() * 20 + 80, // 80-100%的成功率
                topStores,
                distributionByChannel: channelDistribution,
                distributionByStatus: statusDistribution,
                distributionByHour: hourDistribution,
                growthRate: {
                    day: Math.random() * 15, // 0-15%的日增长
                    week: Math.random() * 20, // 0-20%的周增长
                    month: Math.random() * 30 // 0-30%的月增长
                }
            }
        };
    }
    /**
     * 获取单个订单详情
     */
    async getOrderDetail(orderNumber) {
        const order = this.orders.find(o => o.订单号 === orderNumber);
        await this.simulateQueryDelay(50);
        if (order) {
            return {
                success: true,
                data: order
            };
        }
        else {
            return {
                success: false,
                error: '订单未找到'
            };
        }
    }
    /**
     * 触发导出任务
     */
    async createExportTask(params) {
        const { count: { count } } = await this.countOrders(params);
        if (count > 50000) {
            return {
                success: false,
                error: `导出数据量(${count})超过限制(50000)，请缩小查询范围`
            };
        }
        const taskId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.simulateQueryDelay(200);
        return {
            success: true,
            data: {
                id: taskId,
                status: 'processing',
                params,
                created_at: new Date(),
                download_url: `/api/v1/exports/download/${taskId}`
            },
            message: count > 1000
                ? '数据量较大，正在后台处理中，请稍后在导出历史中查看'
                : '导出任务已创建'
        };
    }
    /**
     * 模拟数据库查询延迟
     */
    simulateQueryDelay(maxDelay = 300) {
        const delay = Math.random() * maxDelay;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}
exports.MockDataService = MockDataService;
//# sourceMappingURL=mock-data.service.js.map