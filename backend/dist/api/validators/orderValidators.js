"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchemas = exports.validateExportStatusParams = exports.validateOrderDetailParams = exports.validateExportParams = exports.validateQueryParams = void 0;
exports.validateWithSchema = validateWithSchema;
exports.isValidDateString = isValidDateString;
exports.isValidMobile = isValidMobile;
exports.isValidStoreIds = isValidStoreIds;
exports.isValidOrderStatuses = isValidOrderStatuses;
exports.cleanStoreIds = cleanStoreIds;
exports.cleanQueryParams = cleanQueryParams;
const celebrate_1 = require("celebrate");
const errorHandler_1 = require("../../middleware/errorHandler");
// 日期范围验证模式
const dateRangeSchema = celebrate_1.Joi.object({
    start: celebrate_1.Joi.string()
        .required()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .message('开始日期格式应为 YYYY-MM-DD'),
    end: celebrate_1.Joi.string()
        .required()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .message('结束日期格式应为 YYYY-MM-DD')
        .custom((value, helpers) => {
        const { start } = helpers.state.ancestors[0];
        if (start && value < start) {
            return helpers.error('any.custom', {
                message: '结束日期不能早于开始日期'
            });
        }
        return value;
    })
});
// 筛选条件验证模式
const filtersSchema = celebrate_1.Joi.object({
    dateRange: dateRangeSchema.required(),
    storeIds: celebrate_1.Joi.string()
        .optional()
        .pattern(/^[\d,\s，]+$/)
        .message('门店代码应为数字，多个用逗号分隔'),
    mobile: celebrate_1.Joi.string()
        .optional()
        .pattern(/^1[3-9]\d{9}$/)
        .message('请输入正确的11位手机号'),
    statuses: celebrate_1.Joi.array()
        .optional()
        .items(celebrate_1.Joi.number()
        .integer()
        .valid(1, 2, 3, 4, 5, 6, 7, 10, 15, 50, 60))
        .max(11)
        .message('订单状态值无效')
});
// 分页参数验证模式
const paginationSchema = celebrate_1.Joi.object({
    page: celebrate_1.Joi.number()
        .integer()
        .min(1)
        .default(1),
    pageSize: celebrate_1.Joi.number()
        .integer()
        .min(1)
        .max(1000)
        .default(50)
});
// 导出参数验证模式
const exportSchema = celebrate_1.Joi.object({
    format: celebrate_1.Joi.string()
        .valid('xlsx', 'csv')
        .default('xlsx'),
    filename: celebrate_1.Joi.string()
        .optional()
        .max(200)
        .pattern(/^[\w\s\-_\.]+$/)
        .message('文件名仅支持字母、数字、下划线、中划线、点和空格')
});
// 查询参数验证中间件
const validateQueryParams = async (req, res, next) => {
    try {
        // 使用Celebrate进行基础验证
        const { error } = (0, celebrate_1.celebrate)({
            [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
                filters: filtersSchema.required(),
                pagination: paginationSchema.optional()
            })
        })(req, res, (err) => {
            if (err)
                throw err;
        });
        if (error) {
            throw error;
        }
        // 进行额外的业务逻辑验证
        await validateBusinessLogic(req.body);
        next();
    }
    catch (error) {
        next(new errorHandler_1.ValidationError(error.message));
    }
};
exports.validateQueryParams = validateQueryParams;
// 导出参数验证中间件
const validateExportParams = async (req, res, next) => {
    try {
        // 使用Celebrate进行基础验证
        const { error } = (0, celebrate_1.celebrate)({
            [celebrate_1.Segments.BODY]: celebrate_1.Joi.object({
                filters: filtersSchema.required(),
                ...exportSchema
            })
        })(req, res, (err) => {
            if (err)
                throw err;
        });
        if (error) {
            throw error;
        }
        // 进行额外的业务逻辑验证
        await validateBusinessLogic(req.body);
        next();
    }
    catch (error) {
        next(new errorHandler_1.ValidationError(error.message));
    }
};
exports.validateExportParams = validateExportParams;
// 订单详情参数验证中间件
const validateOrderDetailParams = (req, res, next) => {
    (0, celebrate_1.celebrate)({
        [celebrate_1.Segments.PARAMS]: celebrate_1.Joi.object({
            orderNumber: celebrate_1.Joi.string()
                .required()
                .pattern(/^\d+$/)
                .message('订单号应为数字')
        })
    })(req, res, next);
};
exports.validateOrderDetailParams = validateOrderDetailParams;
// 导出任务状态参数验证中间件
const validateExportStatusParams = (req, res, next) => {
    (0, celebrate_1.celebrate)({
        [celebrate_1.Segments.PARAMS]: celebrate_1.Joi.object({
            jobId: celebrate_1.Joi.string()
                .required()
                .pattern(/^export_\d+_\w+$/)
                .message('任务ID格式无效')
        })
    })(req, res, next);
};
exports.validateExportStatusParams = validateExportStatusParams;
// 业务逻辑验证
async function validateBusinessLogic(data) {
    const { filters } = data;
    // 验证时间范围（最多31天）
    if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const timeDiff = endDate.getTime() - startDate.getTime();
        const dayDiff = timeDiff / (1000 * 3600 * 24);
        if (dayDiff > 31) {
            throw new Error('查询时间范围不能超过31天');
        }
        if (startDate > new Date() || endDate > new Date()) {
            throw new Error('不能查询未来的日期');
        }
    }
    // 验证门店数量（最多50个）
    if (filters.storeIds && filters.storeIds.trim()) {
        const storeCount = filters.storeIds.split(',').length;
        if (storeCount > 50) {
            throw new Error('一次最多查询50个门店');
        }
    }
    // 验证状态数量（最多11个，因为总共只有11种状态）
    if (filters.statuses && filters.statuses.length > 11) {
        throw new Error('订单状态选择过多');
    }
    // 验证日期格式和有效性
    if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('日期格式无效');
        }
        // 确保结束日期比开始日期晚
        if (endDate < startDate) {
            throw new Error('结束日期不能早于开始日期');
        }
        // 限制查询过去的时间范围（最多2年）
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        if (startDate < twoYearsAgo) {
            throw new Error('只能查询过去2年内的数据');
        }
    }
    // 验证导出数据量（在导出时检查）
    if (data.count !== undefined && data.count > 50000) {
        throw new Error(`导出数据量(${data.count})超过限制(50000)`);
    }
}
// 导出验证模式供其他地方使用
exports.validationSchemas = {
    dateRange: dateRangeSchema,
    filters: filtersSchema,
    pagination: paginationSchema,
    export: exportSchema
};
// 快速验证方法（用于不通过中间件的场景）
function validateWithSchema(schema, data) {
    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        throw new errorHandler_1.ValidationError(error.details.map(detail => detail.message).join('; '));
    }
    return value;
}
// 验证日期字符串
function isValidDateString(dateString) {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString) && !isNaN(new Date(dateString).getTime());
}
// 验证手机号
function isValidMobile(mobile) {
    return /^1[3-9]\d{9}$/.test(mobile);
}
// 验证门店代码（逗号分隔）
function isValidStoreIds(storeIds) {
    if (!storeIds.trim())
        return true;
    const ids = storeIds.split(',');
    return ids.every(id => /^\d+$/.test(id.trim()));
}
// 验证订单状态数组
function isValidOrderStatuses(statuses) {
    const validStatuses = [1, 2, 3, 4, 5, 6, 7, 10, 15, 50, 60];
    return statuses.every(status => validStatuses.includes(status));
}
// 清理门店ID字符串（去除空格，转换中文逗号）
function cleanStoreIds(storeIds) {
    return storeIds
        .replace(/，/g, ',')
        .replace(/\s+/g, '')
        .split(',')
        .map(id => id.trim())
        .filter(id => id)
        .join(',');
}
// 清理查询参数（移除空格，验证格式）
function cleanQueryParams(params) {
    const cleaned = { ...params };
    if (cleaned.filters) {
        if (cleaned.filters.storeIds) {
            cleaned.filters.storeIds = cleanStoreIds(cleaned.filters.storeIds);
        }
        if (cleaned.filters.mobile) {
            cleaned.filters.mobile = cleaned.filters.mobile.trim();
        }
        if (cleaned.filters.dateRange) {
            cleaned.filters.dateRange.start = cleaned.filters.dateRange.start.trim();
            cleaned.filters.dateRange.end = cleaned.filters.dateRange.end.trim();
        }
    }
    return cleaned;
}
// 导出默认验证器
exports.default = {
    validateQueryParams: exports.validateQueryParams,
    validateExportParams: exports.validateExportParams,
    validateOrderDetailParams: exports.validateOrderDetailParams,
    validateExportStatusParams: exports.validateExportStatusParams,
    validateWithSchema,
    validationSchemas: exports.validationSchemas,
    isValidDateString,
    isValidMobile,
    isValidStoreIds,
    isValidOrderStatuses,
    cleanStoreIds,
    cleanQueryParams
};
//# sourceMappingURL=orderValidators.js.map