"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const helmet_1 = tslib_1.__importDefault(require("helmet"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const express_rate_limit_1 = require("express-rate-limit");
// 配置加载
dotenv_1.default.config();
// 导入配置
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
// 导入路由
const order_routes_1 = require("./api/routes/order.routes");
const export_routes_1 = require("./routes/export.routes");
const health_routes_1 = require("./routes/health.routes");
const search_routes_1 = require("./api/routes/search.routes");
const support_routes_1 = require("./api/routes/support.routes");
const penetration_routes_1 = require("./api/routes/penetration.routes");
const coupon_routes_1 = require("./api/routes/coupon.routes");
const invitation_routes_1 = require("./api/routes/invitation.routes");
const mall_user_routes_1 = require("./api/routes/mall-user.routes");
// 初始化Express应用
const app = (0, express_1.default)();
const port = config_1.config.app.port;
// =========== 中间件配置 ===========
// 安全相关的中间件
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.app.corsOrigin,
    credentials: true,
}));
// 请求大小限制
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// 压缩响应
app.use((0, compression_1.default)());
// 请求频率限制
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: config_1.config.app.rateLimit || 100, // 每个IP最多100个请求
    message: '请求过于频繁，请稍后再试',
});
app.use('/api/', limiter);
// 请求日志
app.use(requestLogger_1.requestLogger);
// =========== 健康检查 ===========
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
    });
});
// =========== 路由配置 ===========
app.use('/api/v1/orders', order_routes_1.orderRoutes);
app.use('/api/v1/exports', export_routes_1.exportRoutes);
app.use('/api/v1/health', health_routes_1.healthRoutes);
app.use('/api/v1/reports/search-keyword', search_routes_1.searchKeywordRoutes);
app.use('/api/v1/reports/support', support_routes_1.supportRoutes);
app.use('/api/v1/reports/penetration', penetration_routes_1.penetrationRoutes);
app.use('/api/v1/reports/coupon', coupon_routes_1.couponRoutes);
app.use('/api/v1/reports/invitation', invitation_routes_1.invitationRoutes);
app.use('/api/v1/reports/mall-user', mall_user_routes_1.mallUserRoutes);
// =========== 根路径 ===========
app.get('/', (req, res) => {
    res.json({
        name: '鲸选报表平台 API',
        version: '1.0.0',
        description: '订单查询和导出服务',
        endpoints: {
            orders: '/api/v1/orders',
            exports: '/api/v1/exports',
            health: '/api/v1/health',
        },
    });
});
// =========== 错误处理 ===========
app.use(errorHandler_1.errorHandler);
// =========== 404处理 ===========
app.use('*', (req, res) => {
    res.status(404).json({
        error: '找不到请求的资源',
        path: req.originalUrl,
        method: req.method,
    });
});
// =========== 启动服务 ===========
const startServer = async () => {
    try {
        // 测试数据库连接
        // await testDatabaseConnection()
        app.listen(port, () => {
            logger_1.logger.info(`🚀 服务器启动成功`);
            logger_1.logger.info(`📊 环境: ${config_1.config.app.env}`);
            logger_1.logger.info(`🌐 地址: http://localhost:${port}`);
            logger_1.logger.info(`📁 API文档: http://localhost:${port}`);
            if (config_1.config.app.env === 'development') {
                logger_1.logger.warn('⚠️  当前为开发环境，请注意安全配置');
            }
        });
    }
    catch (error) {
        logger_1.logger.error('启动服务器失败:', error);
        process.exit(1);
    }
};
// 优雅关闭
process.on('SIGINT', () => {
    logger_1.logger.info('收到 SIGINT 信号，正在关闭服务器...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('收到 SIGTERM 信号，正在关闭服务器...');
    process.exit(0);
});
// 未捕获异常处理
process.on('uncaughtException', (error) => {
    logger_1.logger.error('未捕获的异常:', error);
    // 在实际应用中可能需要重启服务器
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('未处理的Promise拒绝:', { reason, promise });
});
// 启动服务器
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map