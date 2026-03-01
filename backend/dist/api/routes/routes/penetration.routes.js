"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.penetrationRoutes = void 0;
const express_1 = require("express");
const PenetrationController_1 = require("../controllers/PenetrationController");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.penetrationRoutes = router;
router.post('/query', (0, errorHandler_1.asyncHandler)(PenetrationController_1.PenetrationController.queryPenetration));
router.post('/export', (0, errorHandler_1.asyncHandler)(PenetrationController_1.PenetrationController.exportPenetration));
//# sourceMappingURL=penetration.routes.js.map