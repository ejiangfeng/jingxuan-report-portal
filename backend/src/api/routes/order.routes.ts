import { Router } from 'express'
import { OrderController } from '../controllers/OrderController'
import { asyncHandler } from '../../middleware/errorHandler'
import { validateQueryParams, validateExportParams } from '../validators/orderValidators'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: 订单查询和管理
 */

/**
 * @swagger
 * /api/v1/orders/query:
 *   post:
 *     summary: 查询订单列表
 *     tags: [Orders]
 *     description: 根据筛选条件查询订单列表，支持分页
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filters
 *             properties:
 *               filters:
 *                 type: object
 *                 required:
 *                   - dateRange
 *                 properties:
 *                   dateRange:
 *                     type: object
 *                     required:
 *                       - start
 *                       - end
 *                     properties:
 *                       start:
 *                         type: string
 *                         format: date
 *                         example: "2026-01-01"
 *                       end:
 *                         type: string
 *                         format: date
 *                         example: "2026-01-31"
 *                   storeIds:
 *                     type: string
 *                     description: 门店代码，多个用逗号分隔
 *                     example: "1101,2001"
 *                   mobile:
 *                     type: string
 *                     pattern: '^1[3-9]\d{9}$'
 *                     description: 11位手机号
 *                     example: "13800138000"
 *                   statuses:
 *                     type: array
 *                     items:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 60
 *                     description: 订单状态代码数组
 *                     example: [1, 2, 5]
 *               pagination:
 *                 type: object
 *                 properties:
 *                   page:
 *                     type: integer
 *                     minimum: 1
 *                     default: 1
 *                   pageSize:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 1000
 *                     default: 50
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     total:
 *                       type: integer
 *                       example: 1500
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 30
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器内部错误
 */
router.post('/query', validateQueryParams, OrderController.queryOrders)

/**
 * @swagger
 * /api/v1/orders/count:
 *   post:
 *     summary: 获取符合筛选条件的订单数量
 *     tags: [Orders]
 *     description: 用于导出前验证数据量
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QueryParams'
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 1500
 *                 timestamp:
 *                   type: string
 */
router.post('/count', validateQueryParams, OrderController.getOrderCount)

/**
 * @swagger
 * /api/v1/orders/export:
 *   post:
 *     summary: 导出订单数据
 *     tags: [Orders]
 *     description: 根据筛选条件导出订单数据为Excel文件
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filters:
 *                 $ref: '#/components/schemas/Filters'
 *               format:
 *                 type: string
 *                 enum: [xlsx, csv]
 *                 default: xlsx
 *               filename:
 *                 type: string
 *                 description: 自定义文件名（可选）
 *     responses:
 *       202:
 *         description: 导出任务已接受
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                       example: "export_1234567890_abc123"
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed]
 *                       example: "pending"
 *                     download_url:
 *                       type: string
 *                       example: "/api/v1/exports/download/export_1234567890_abc123"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 数据量超过限制
 *       500:
 *         description: 服务器内部错误
 */
router.post('/export', validateExportParams, OrderController.exportOrders)

/**
 * @swagger
 * /api/v1/orders/stats:
 *   post:
 *     summary: 获取订单统计信息
 *     tags: [Orders]
 *     description: 获取订单的统计信息，如总额、平均数、分布等
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QueryParams'
 *     responses:
 *       200:
 *         description: 统计查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrders:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     avgAmount:
 *                       type: number
 *                     successRate:
 *                       type: number
 *                 timestamp:
 *                   type: string
 */
router.post('/stats', validateQueryParams, OrderController.getOrderStats)

/**
 * @swagger
 * /api/v1/orders/{orderNumber}:
 *   get:
 *     summary: 获取单个订单详情
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: 订单号
 *     responses:
 *       200:
 *         description: 订单详情查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OrderDetail'
 *                 timestamp:
 *                   type: string
 *       404:
 *         description: 订单未找到
 */
router.get('/:orderNumber', OrderController.getOrderDetail)

/**
 * @swagger
 * /api/v1/orders/filter-options:
 *   get:
 *     summary: 获取筛选选项
 *     tags: [Orders]
 *     description: 获取可用于筛选的数据选项，如门店列表、状态选项等
 *     responses:
 *       200:
 *         description: 获取成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stores:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                     orderStatuses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: integer
 *                           label:
 *                             type: string
 *                     quickDateRanges:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                 timestamp:
 *                   type: string
 */
router.get('/filter-options', OrderController.getFilterOptions)

// 导出相关路由
/**
 * @swagger
 * /api/v1/orders/export/{jobId}/status:
 *   get:
 *     summary: 获取导出任务状态
 *     tags: [Export]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: 导出任务ID
 *     responses:
 *       200:
 *         description: 查询成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExportJob'
 *                 timestamp:
 *                   type: string
 *       404:
 *         description: 导出任务未找到
 */
/**
 * @swagger
 * /api/v1/orders/export/{jobId}/download:
 *   get:
 *     summary: 下载导出文件
 *     tags: [Export]
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: 导出任务ID
 *     responses:
 *       200:
 *         description: 文件下载
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             description: 文件下载头
 *           Content-Type:
 *             schema:
 *               type: string
 *             description: MIME类型
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: 文件未找到
 *       410:
 *         description: 文件已过期或删除
 */
router.get('/export/:jobId/status', OrderController.getExportStatus)
router.get('/export/:jobId/download', OrderController.downloadExport)

export { router as orderRoutes }

/**
 * @swagger
 * components:
 *   schemas:
 *     QueryParams:
 *       type: object
 *       properties:
 *         filters:
 *           $ref: '#/components/schemas/Filters'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               minimum: 1
 *             pageSize:
 *               type: integer
 *               minimum: 1
 *               maximum: 1000
 *   
 *     Filters:
 *       type: object
 *       properties:
 *         dateRange:
 *           type: object
 *           required:
 *             - start
 *             - end
 *           properties:
 *             start:
 *               type: string
 *               format: date
 *             end:
 *               type: string
 *               format: date
 *         storeIds:
 *           type: string
 *         mobile:
 *           type: string
 *         statuses:
 *           type: array
 *           items:
 *             type: integer
 *   
 *     Order:
 *       type: object
 *       properties:
 *         订单号:
 *           type: string
 *           example: "202601010001"
 *         来源渠道:
 *           type: string
 *           example: "鲸选微信小程序"
 *         下单人手机号:
 *           type: string
 *           example: "138****5678"
 *         订单类型:
 *           type: string
 *           example: "普通订单"
 *         订单状态:
 *           type: string
 *           example: "交易成功"
 *         下单时间:
 *           type: string
 *           format: date-time
 *         所属门店名称:
 *           type: string
 *           example: "北京朝阳门店"
 *         客户实付金额:
 *           type: number
 *           format: float
 *           example: 199.99
 *   
 *     OrderDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/Order'
 *         - type: object
 *           properties:
 *             收货人:
 *               type: string
 *               example: "张先生"
 *             收货地址:
 *               type: string
 *               example: "北京市朝阳区建国路"
 *             商品种类数:
 *               type: integer
 *               example: 2
 *             商品总数量:
 *               type: integer
 *               example: 3
 *             优惠总金额:
 *               type: number
 *               format: float
 *               example: 20.00
 *             支付宝支付:
 *               type: number
 *               format: float
 *               example: 179.99
 *             微信支付:
 *               type: number
 *               format: float
 *               example: 0.00
 *             优惠券名称:
 *               type: string
 *               example: "新人优惠券"
 *   
 *     ExportJob:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "export_1234567890_abc123"
 *         status:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *         params:
 *           $ref: '#/components/schemas/QueryParams'
 *         created_at:
 *           type: string
 *           format: date-time
 *         completed_at:
 *           type: string
 *           format: date-time
 *         download_url:
 *           type: string
 *         error:
 *           type: string
 */