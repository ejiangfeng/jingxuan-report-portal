"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mallUserRoutes = void 0;
const express_1 = require("express");
const MallUserController_1 = require("../controllers/MallUserController");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.mallUserRoutes = router;
router.post('/query', (0, errorHandler_1.asyncHandler)(MallUserController_1.MallUserController.queryMallUsers));
router.post('/export', (0, errorHandler_1.asyncHandler)(MallUserController_1.MallUserController.exportMallUsers));
//# sourceMappingURL=mall-user.routes.js.map