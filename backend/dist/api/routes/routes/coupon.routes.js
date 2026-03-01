"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponRoutes = void 0;
const express_1 = require("express");
const CouponController_1 = require("../controllers/CouponController");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.couponRoutes = router;
router.post('/query', (0, errorHandler_1.asyncHandler)(CouponController_1.CouponController.queryCoupons));
router.post('/export', (0, errorHandler_1.asyncHandler)(CouponController_1.CouponController.exportCoupons));
//# sourceMappingURL=coupon.routes.js.map