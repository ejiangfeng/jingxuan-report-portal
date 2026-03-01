declare const router: import("express-serve-static-core").Router;
export { router as orderRoutes };
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
//# sourceMappingURL=order.routes.d.ts.map