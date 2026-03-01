/* 订单综合对账查询SQL模板 - 完全参数化 */
/* 注意：查询包含结束日期当天数据 */

/*+ QUERY_TIMEOUT(1000000000) */
SELECT
	o.order_number AS '订单号',
	CASE o.social_type 
		WHEN 1 THEN '鲸选微信小程序' 
		WHEN 2 THEN '微信公众号' 
		WHEN 6 THEN '鲸选支付宝小程序' 
		WHEN 7 THEN 'PC' 
		WHEN 8 THEN 'H5' 
		WHEN 9 THEN '新鲸选APP' 
		WHEN 10 THEN '新鲸选APP' 
		WHEN 11 THEN '支付宝H5' 
		WHEN 12 THEN '字节宝小程序' 
		ELSE '' 
	END AS '来源渠道',
	tu.user_mobile AS '下单人手机号',
	o.order_number AS '平台订单号',
	CASE o.order_type 
		WHEN 0 THEN '普通订单' 
		WHEN 1 THEN '团购订单' 
		WHEN 2 THEN '秒杀订单' 
		WHEN 3 THEN '积分订单' 
		ELSE '' 
	END AS '订单类型',
	CASE o.STATUS 
		WHEN 1 THEN '待付款' 
		WHEN 2 THEN '待发货' 
		WHEN 3 THEN '待收货' 
		WHEN 4 THEN '待评价' 
		WHEN 5 THEN '交易成功' 
		WHEN 6 THEN '交易失败' 
		WHEN 7 THEN '待成团' 
		WHEN 10 THEN '待接单' 
		WHEN 15 THEN '待拣货' 
		WHEN 50 THEN '部分支付' 
		WHEN 60 THEN '整单的撤销中' 
		ELSE '' 
	END AS '订单状态',
	o.create_time AS '下单时间',
	ts.station_name AS '所属门店名称',
	ts.out_code AS '所属门店代码',
	CASE o.dvy_type 
		WHEN 1 THEN '快递' 
		WHEN 2 THEN '自提' 
		WHEN 3 THEN '无需快递' 
		WHEN 4 THEN '同城配送' 
		ELSE '' 
	END AS '配送方式',
	o.receiver_name AS '收货人',
	o.receiver_mobile AS '收货人手机号',
	CASE WHEN o.dvy_type = 2 THEN '自提订单' ELSE CONCAT(uao.province, uao.city, uao.area, uao.addr) END AS '收货地址',
	count(DISTINCT (toi.sku_id)) AS '商品种类数',
	sum(toi.prod_count) AS '商品总数量',
	o.total AS '商品总金额',
	o.reduce_amount AS '优惠总金额',
	o.actual_total - (o.freight_amount - o.platform_free_freight_amount) - ifnull(o.packing, 0) AS '实付商品总金额',
	o.freight_amount AS '原应付运费金额',
	o.platform_free_freight_amount AS '运费活动优惠金额',
	o.freight_amount - o.platform_free_freight_amount AS '优惠后运费',
	ifnull(o.packing, 0) AS '包装费',
	o.actual_total AS '客户实付金额',
	tc.coupon_id AS '优惠券ID',
	tc.coupon_name AS '优惠券名称',
	tc.cash_condition AS '优惠券使用条件',
	tc.reduce_amount AS '减免金额',
	o.remarks AS '客户备注',
	ifnull(alipay.pay_lh_amount, 0) AS '支付宝支付',
	alipay.pay_no AS '支付宝支付单号',
	alipay.biz_pay_no AS '支付宝外部支付单号',
	ifnull(wxpay.pay_lh_amount, 0) AS '微信支付',
	wxpay.pay_no AS '微信支付支付单号',
	wxpay.biz_pay_no AS '微信支付外部支付单号',
	ifnull(czkpay.pay_lh_amount, 0) AS '储值卡支付',
	czkpay.pay_no AS '储值卡支付单号',
	czkpay.biz_pay_no AS '储值卡支付外部支付单号',
	ifnull(kbpay.pay_lh_amount, 0) AS '卡包支付',
	kbpay.pay_no AS '卡包支付单号',
	kbpay.biz_pay_no AS '卡包支付外部支付单号',
	ifnull(wzfpay.pay_lh_amount, 0) AS '微支付',
	wzfpay.pay_no AS '微支付支付单号',
	wzfpay.biz_pay_no AS '微支付外部支付单号',
	ifnull(fkpay.pay_lh_amount, 0) AS '硕洋饭卡支付',
	fkpay.pay_no AS '硕洋饭卡支付支付单号',
	fkpay.biz_pay_no AS '硕洋饭卡支付外部支付单号',
	ifnull(jtpay.pay_lh_amount, 0) AS '津贴支付',
	jtpay.pay_no AS '津贴支付支付单号',
	jtpay.biz_pay_no AS '津贴支付支付外部支付单号',
	tu.user_regtime AS '用户注册日期'
FROM
	tz_order o
	LEFT JOIN tz_station ts ON o.station_id = ts.station_id
	LEFT JOIN tz_user tu ON o.user_id = tu.user_id
	LEFT JOIN tz_user_addr_order uao ON o.addr_order_id = uao.addr_order_id
	LEFT JOIN tz_coupon_use_record tcur ON o.order_number = tcur.order_number
	LEFT JOIN tz_coupon_user tcu ON tcu.coupon_user_id = tcur.coupon_user_id
	LEFT JOIN tz_coupon tc ON tcu.coupon_id = tc.coupon_id
	LEFT JOIN tz_order_item toi ON o.order_number = toi.order_number
	LEFT JOIN (
		SELECT 
			order_numbers AS order_number, 
			IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount, 
			pay_no, 
			biz_pay_no 
		FROM tz_pay_info 
		WHERE pay_status = 1 AND pay_lh_type = '2002'
	) alipay ON o.order_number = alipay.order_number
	LEFT JOIN (
		SELECT 
			order_numbers AS order_number, 
			IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount, 
			pay_no, 
			biz_pay_no 
		FROM tz_pay_info 
		WHERE pay_status = 1 AND pay_lh_type = '2001'
	) wxpay ON o.order_number = wxpay.order_number
	LEFT JOIN (
		SELECT 
			order_numbers AS order_number, 
			IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount, 
			pay_no, 
			biz_pay_no 
		FROM tz_pay_info 
		WHERE pay_status = 1 AND pay_lh_type = '1003'
	) czkpay ON o.order_number = czkpay.order_number
	LEFT JOIN (
		SELECT 
			order_numbers AS order_number, 
			IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount, 
			pay_no, 
			biz_pay_no 
		FROM tz_pay_info 
		WHERE pay_lh_actual_amount > 0 AND pay_lh_type = '1005'
	) kbpay ON o.order_number = kbpay.order_number
	LEFT JOIN (
		SELECT 
			order_numbers AS order_number, 
			IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount, 
			pay_no, 
			biz_pay_no 
		FROM tz_pay_info 
		WHERE pay_status = 1 AND pay_lh_type = '1004'
	) wzfpay ON o.order_number = wzfpay.order_number
	LEFT JOIN (
		SELECT 
			order_numbers AS order_number, 
			IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount, 
			pay_no, 
			biz_pay_no 
		FROM tz_pay_info 
		WHERE pay_status = 1 AND pay_lh_type = '1001'
	) fkpay ON o.order_number = fkpay.order_number
	LEFT JOIN (
		SELECT 
			order_numbers AS order_number, 
			IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount, 
			pay_no, 
			biz_pay_no 
		FROM tz_pay_info 
		WHERE pay_status = 1 AND pay_lh_type = '1002'
	) jtpay ON o.order_number = jtpay.order_number
WHERE
	o.is_payed = 1 
	AND o.create_time >= ?  -- 开始时间参数
	AND o.create_time < DATE_ADD(?, INTERVAL 1 DAY)  -- 结束时间参数
	AND (? = '' OR FIND_IN_SET(ts.out_code, REPLACE(?, '，', ',')) > 0)  -- 门店筛选
	AND (? = '' OR tu.user_mobile = ?)  -- 手机号筛选
	AND (? = '' OR o.status IN (?))  -- 订单状态筛选
GROUP BY
	o.order_number, o.create_time
ORDER BY
	o.create_time DESC
LIMIT ? OFFSET ?;  -- 分页参数