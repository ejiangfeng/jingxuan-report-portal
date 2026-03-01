"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportRoutes = void 0;
const express_1 = require("express");
const SupportController_1 = require("../controllers/SupportController");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.supportRoutes = router;
/**
 * @swagger
 * tags:
 *   name: Support
 *   description: 助力活动查询
 */
/**
 * @swagger
 * /api/v1/reports/support/query:
 *   post:
 *     summary: 查询助力活动
 *     tags: [Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date
 *               endTime:
 *                 type: string
 *                 format: date
 *               activityId:
 *                 type: string
 *               page:
 *                 type: integer
 *                 default: 1
 *               pageSize:
 *                 type: integer
 *                 default: 20
 *     responses:
 *       200:
 *         description: 查询成功
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/query', (0, errorHandler_1.asyncHandler)(SupportController_1.SupportController.querySupportActivities));
/**
 * @swagger
 * /api/v1/reports/support/export:
 *   post:
 *     summary: 导出助力活动数据
 *     tags: [Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date
 *               endTime:
 *                 type: string
 *                 format: date
 *               activityId:
 *                 type: string
 *     responses:
 *       202:
 *         description: 导出任务已创建
 *       400:
 *         description: 请求参数错误
 *       500:
 *         description: 服务器错误
 */
router.post('/export', (0, errorHandler_1.asyncHandler)(SupportController_1.SupportController.exportSupportActivities));
//# sourceMappingURL=support.routes.js.map