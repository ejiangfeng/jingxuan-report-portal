"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentType = exports.DeliveryType = exports.OrderStatus = exports.OrderType = exports.OrderSourceChannel = void 0;
// ===== 枚举类型定义 =====
// 订单来源渠道枚举
exports.OrderSourceChannel = {
    1: '鲸选微信小程序',
    2: '微信公众号',
    6: '鲸选支付宝小程序',
    7: 'PC',
    8: 'H5',
    9: '新鲸选APP',
    10: '新鲸选APP',
    11: '支付宝H5',
    12: '字节宝小程序'
};
// 订单类型枚举
exports.OrderType = {
    0: '普通订单',
    1: '团购订单',
    2: '秒杀订单',
    3: '积分订单'
};
// 订单状态枚举
exports.OrderStatus = {
    1: '待付款',
    2: '待发货',
    3: '待收货',
    4: '待评价',
    5: '交易成功',
    6: '交易失败',
    7: '待成团',
    10: '待接单',
    15: '待拣货',
    50: '部分支付',
    60: '整单的撤销中'
};
// 配送方式枚举
exports.DeliveryType = {
    1: '快递',
    2: '自提',
    3: '无需快递',
    4: '同城配送'
};
// 支付类型枚举
exports.PaymentType = {
    '2001': '微信支付',
    '2002': '支付宝支付',
    '1001': '硕洋饭卡支付',
    '1002': '津贴支付',
    '1003': '储值卡支付',
    '1004': '微支付',
    '1005': '卡包支付'
};
//# sourceMappingURL=index.js.map