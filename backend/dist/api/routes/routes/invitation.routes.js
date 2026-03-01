"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invitationRoutes = void 0;
const express_1 = require("express");
const InvitationController_1 = require("../controllers/InvitationController");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.invitationRoutes = router;
router.post('/query', (0, errorHandler_1.asyncHandler)(InvitationController_1.InvitationController.queryInvitations));
router.post('/export', (0, errorHandler_1.asyncHandler)(InvitationController_1.InvitationController.exportInvitations));
//# sourceMappingURL=invitation.routes.js.map