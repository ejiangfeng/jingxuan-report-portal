"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchKeywordRoutes = void 0;
const express_1 = require("express");
const SearchKeywordController_1 = require("../controllers/SearchKeywordController");
const errorHandler_1 = require("../../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.searchKeywordRoutes = router;
router.post('/query', (0, errorHandler_1.asyncHandler)(SearchKeywordController_1.SearchKeywordController.querySearchKeywords));
router.post('/export', (0, errorHandler_1.asyncHandler)(SearchKeywordController_1.SearchKeywordController.exportSearchKeywords));
//# sourceMappingURL=search.routes.js.map