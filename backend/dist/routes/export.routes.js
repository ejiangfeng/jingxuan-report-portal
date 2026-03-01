"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportRoutes = void 0;
const express_1 = require("express");
const ExportController_1 = require("../controllers/ExportController");
const router = (0, express_1.Router)();
exports.exportRoutes = router;
router.get('/', ExportController_1.ExportController.getExportTasks);
router.get('/download/:taskId', ExportController_1.ExportController.downloadExport);
//# sourceMappingURL=export.routes.js.map