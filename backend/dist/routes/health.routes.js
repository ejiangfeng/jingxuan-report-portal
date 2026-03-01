"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
router.get('/', (req, res) => res.json({ status: 'ok' }));
//# sourceMappingURL=health.routes.js.map