// 简化的后端服务器，用于快速启动
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const mysql = require('mysql2/promise');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 4000;
const USE_MOCK_DATA = process.env.USE_MOCK_DATA !== 'false';

// 导出任务存储
const exportTasks = new Map();
const EXPORT_DIR = path.join(__dirname, 'exports');
const EXPORT_MAX_RECORDS = 100000;

// 确保导出目录存在
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// 数据库连接池
let pool = null;

async function initDatabase() {
  if (USE_MOCK_DATA) {
    console.log('📦 使用模拟数据模式');
    return;
  }
  
  console.log('🔌 连接OceanBase数据库...');
  console.log('   主机:', process.env.DB_HOST);
  console.log('   端口:', process.env.DB_PORT || 3306);
  console.log('   用户:', process.env.DB_USER);
  console.log('   数据库:', process.env.DB_DATABASE);
  
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    connectTimeout: 60000,
    charset: 'utf8mb4',
    waitForConnections: true,
    queueLimit: 0
  });
  
  // 测试连接
  try {
    const conn = await pool.getConnection();
    // 设置查询超时为5分钟
    await conn.query("SET SESSION ob_query_timeout = 300000000");
    console.log('✅ 数据库连接成功:', process.env.DB_HOST);
    conn.release();
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    console.log('⚠️  将回退到模拟数据模式');
    pool = null;
  }
}

// SQL查询模板
const ORDER_QUERY_SQL = `/*+ QUERY_TIMEOUT(1000000000) */
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
  CASE WHEN o.dvy_type = 2 THEN '自提订单' ELSE CONCAT(IFNULL(uao.province,''), IFNULL(uao.city,''), IFNULL(uao.area,''), IFNULL(uao.addr,'')) END AS '收货地址',
  COUNT(DISTINCT toi.sku_id) AS '商品种类数',
  SUM(toi.prod_count) AS '商品总数量',
  o.total AS '商品总金额',
  o.reduce_amount AS '优惠总金额',
  o.actual_total - (o.freight_amount - o.platform_free_freight_amount) - IFNULL(o.packing, 0) AS '实付商品总金额',
  o.freight_amount AS '原应付运费金额',
  o.platform_free_freight_amount AS '运费活动优惠金额',
  o.freight_amount - o.platform_free_freight_amount AS '优惠后运费',
  IFNULL(o.packing, 0) AS '包装费',
  o.actual_total AS '客户实付金额',
  IFNULL(alipay.pay_lh_amount, 0) AS '支付宝支付',
  IFNULL(wxpay.pay_lh_amount, 0) AS '微信支付',
  IFNULL(czkpay.pay_lh_amount, 0) AS '储值卡支付',
  IFNULL(kbpay.pay_lh_amount, 0) AS '卡包支付',
  IFNULL(wzfpay.pay_lh_amount, 0) AS '微支付',
  IFNULL(fkpay.pay_lh_amount, 0) AS '硕洋饭卡支付',
  IFNULL(jtpay.pay_lh_amount, 0) AS '津贴支付',
  tc.coupon_id AS '优惠券ID',
  tc.coupon_name AS '优惠券名称',
  tc.cash_condition AS '优惠券使用条件',
  tc.reduce_amount AS '优惠券减免金额'
FROM tz_order o
  LEFT JOIN tz_station ts ON o.station_id = ts.station_id
  LEFT JOIN tz_user tu ON o.user_id = tu.user_id
  LEFT JOIN tz_user_addr_order uao ON o.addr_order_id = uao.addr_order_id
  LEFT JOIN tz_order_item toi ON o.order_number = toi.order_number
  LEFT JOIN tz_coupon_use_record tcur ON o.order_number = tcur.order_number
  LEFT JOIN tz_coupon_user tcu ON tcu.coupon_user_id = tcur.coupon_user_id
  LEFT JOIN tz_coupon tc ON tcu.coupon_id = tc.coupon_id
  LEFT JOIN (
    SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount
    FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '2002'
  ) alipay ON o.order_number = alipay.order_number
  LEFT JOIN (
    SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount
    FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '2001'
  ) wxpay ON o.order_number = wxpay.order_number
  LEFT JOIN (
    SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount
    FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '1003'
  ) czkpay ON o.order_number = czkpay.order_number
  LEFT JOIN (
    SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount
    FROM tz_pay_info WHERE pay_lh_actual_amount > 0 AND pay_lh_type = '1005'
  ) kbpay ON o.order_number = kbpay.order_number
  LEFT JOIN (
    SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount
    FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '1004'
  ) wzfpay ON o.order_number = wzfpay.order_number
  LEFT JOIN (
    SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount
    FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '1001'
  ) fkpay ON o.order_number = fkpay.order_number
  LEFT JOIN (
    SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount
    FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '1002'
  ) jtpay ON o.order_number = jtpay.order_number
WHERE o.is_payed = 1 
  AND DATE(o.create_time) >= ?
  AND DATE(o.create_time) <= ?
  AND (? = '' OR FIND_IN_SET(ts.out_code, REPLACE(?, '，', ',')) > 0)
  AND (? = '' OR tu.user_mobile = ?)
  AND (? = '' OR o.status IN (?))
GROUP BY o.order_number, o.create_time
ORDER BY o.create_time DESC
LIMIT ? OFFSET ?`;

// 商品渗透率报表SQL
const PRODUCT_PENETRATION_SQL = `
SELECT /*+ QUERY_TIMEOUT(1000000000) */
  a.CODE AS '大类编码',
  a.NAME AS '大类名称',
  a.party_code AS '商品编码',
  a.bar_code AS '商品条码',
  a.prod_name AS '商品名称',
  a.properties AS '规格',
  a.sku_id AS '石基sku编码',
  a.prod_id AS '石基spu编码',
  a.prod_count AS '购买数量',
  a.order_count AS '商品订单量',
  a.user_count AS '商品去重用户数',
  b.order_count AS '大类订单量',
  ROUND(a.order_count / b.order_count * 100, 2) AS '商品大类订单渗透率',
  b.user_count AS '大类去重用户数',
  ROUND(a.user_count / b.user_count * 100, 2) AS '商品大类用户渗透率',
  c.order_count AS '全局订单量',
  ROUND(a.order_count / c.order_count * 100, 2) AS '商品全局订单渗透率',
  c.user_count AS '全局去重用户数',
  ROUND(a.user_count / c.user_count * 100, 2) AS '商品全局用户渗透率'
FROM (
  SELECT /*+ QUERY_TIMEOUT(1000000000) */
    tf.CODE, tf.NAME, ts.party_code, ts.bar_code, p.prod_name, ts.properties,
    ts.sku_id, ts.prod_id,
    SUM(toi.prod_count) AS prod_count,
    COUNT(DISTINCT o.order_number) AS order_count,
    COUNT(DISTINCT o.user_id) AS user_count
  FROM tz_order_item toi
  JOIN tz_order o ON toi.order_number = o.order_number
  JOIN tz_sku ts ON toi.sku_id = ts.sku_id
  JOIN tz_prod p ON p.prod_id = ts.prod_id
  JOIN mas_sku ms ON ts.party_code = ms.id
  JOIN mas_category tc ON ms.categoryId = tc.ID
  JOIN mas_category td ON tc.upper = td.ID
  JOIN mas_category te ON td.upper = te.ID
  JOIN mas_category tf ON te.upper = tf.ID
  WHERE o.is_payed = 1
    AND o.station_id IN (SELECT station_id FROM tz_station WHERE FIND_IN_SET(out_code, ?) > 0)
    AND o.create_time >= ?
    AND o.create_time < DATE_ADD(?, INTERVAL 1 DAY)
    AND (? = '' OR FIND_IN_SET(ts.bar_code, ?) > 0)
    AND (? = '' OR FIND_IN_SET(ts.party_code, ?) > 0)
  GROUP BY tf.CODE, tf.NAME, ts.party_code, ts.bar_code, p.prod_name, ts.properties, ts.sku_id, ts.prod_id
) a
JOIN (
  SELECT /*+ QUERY_TIMEOUT(1000000000) */
    tf.CODE, tf.NAME,
    SUM(toi.prod_count) AS prod_count,
    COUNT(DISTINCT o.order_number) AS order_count,
    COUNT(DISTINCT o.user_id) AS user_count
  FROM tz_order_item toi
  JOIN tz_order o ON toi.order_number = o.order_number
  JOIN tz_sku ts ON toi.sku_id = ts.sku_id
  JOIN mas_sku ms ON ts.party_code = ms.id
  JOIN mas_category tc ON ms.categoryId = tc.ID
  JOIN mas_category td ON tc.upper = td.ID
  JOIN mas_category te ON td.upper = te.ID
  JOIN mas_category tf ON te.upper = tf.ID
  WHERE o.is_payed = 1
    AND o.station_id IN (SELECT station_id FROM tz_station WHERE FIND_IN_SET(out_code, ?) > 0)
    AND o.create_time >= ?
    AND o.create_time < DATE_ADD(?, INTERVAL 1 DAY)
  GROUP BY tf.CODE, tf.NAME
) b ON a.CODE = b.CODE
JOIN (
  SELECT /*+ QUERY_TIMEOUT(1000000000) */
    COUNT(DISTINCT o.order_number) AS order_count,
    COUNT(DISTINCT o.user_id) AS user_count
  FROM tz_order_item toi
  JOIN tz_order o ON toi.order_number = o.order_number
  WHERE o.is_payed = 1
    AND o.station_id IN (SELECT station_id FROM tz_station WHERE FIND_IN_SET(out_code, ?) > 0)
    AND o.create_time >= ?
    AND o.create_time < DATE_ADD(?, INTERVAL 1 DAY)
) c
ORDER BY a.order_count DESC
LIMIT 10000`;

// 订单明细查询SQL
const ORDER_DETAIL_SQL = `
SELECT /*+ QUERY_TIMEOUT(1000000000) */
  o.order_number AS '订单号',
  tst.station_name AS '所属门店名称',
  tst.out_code AS '所属门店代码',
  o.create_time AS '下单时间',
  ts.party_code AS '商品编码',
  ts.bar_code AS '商品条码',
  p.prod_name AS '商品名称',
  ts.sku_id AS '石基sku编码',
  ts.prod_id AS '石基spu编码',
  toi.prod_count AS '购买数量',
  toi.price AS '购买单价',
  toi.share_reduce AS '优惠金额',
  toi.discount_amount AS '满减优惠金额',
  toi.direct_decent_price_amount AS '直降促销优惠',
  toi.shop_coupon_amount AS '优惠券优惠金额',
  toi.actual_total AS '商品实付金额',
  p.category_id AS '后台类目编码',
  tc.category_name AS '后台类目名称',
  tcp.coupon_id AS '优惠券ID',
  tcp.coupon_name AS '优惠券名称'
FROM tz_order o
JOIN tz_order_item toi ON toi.order_number = o.order_number
LEFT JOIN tz_station tst ON o.station_id = tst.station_id
LEFT JOIN tz_coupon_use_record tcur ON o.order_number = tcur.order_number
LEFT JOIN tz_coupon_user tcu ON tcu.coupon_user_id = tcur.coupon_user_id
LEFT JOIN tz_coupon tcp ON tcu.coupon_id = tcp.coupon_id
LEFT JOIN tz_sku ts ON toi.sku_id = ts.sku_id
LEFT JOIN tz_prod p ON ts.prod_id = p.prod_id
LEFT JOIN tz_category tc ON p.category_id = tc.category_id
WHERE o.is_payed = 1
  AND o.create_time >= ?
  AND o.create_time < DATE_ADD(?, INTERVAL 1 DAY)
  AND (? = '' OR FIND_IN_SET(tst.out_code, ?) > 0)
ORDER BY o.order_number
LIMIT 100000`;

// 优惠券领用核销查询SQL
const COUPON_QUERY_SQL = `
SELECT /*+ QUERY_TIMEOUT(1000000000) */
  u.user_mobile AS '用户手机号',
  a.coupon_id AS '优惠券ID',
  c.coupon_name AS '优惠券名称',
  a.receive_time AS '领券时间',
  a.user_start_time AS '生效时间',
  a.user_end_time AS '失效时间',
  b.order_number AS '订单编号',
  CASE o.dvy_type
    WHEN 1 THEN '快递'
    WHEN 2 THEN '自提'
    WHEN 4 THEN '同城配送'
    ELSE ''
  END AS '配送方式',
  b.use_time AS '下单时间',
  o.actual_total - (o.freight_amount - o.platform_free_freight_amount) - IFNULL(o.packing, 0) AS '实付商品总金额',
  o.total AS '商品总金额',
  o.reduce_amount AS '优惠总金额',
  o.platform_free_freight_amount AS '运费活动优惠金额',
  s.out_code AS '门店编码',
  s.station_name AS '门店名称'
FROM tz_user u
JOIN tz_coupon_user a ON a.user_id = u.user_id
JOIN tz_coupon c ON c.coupon_id = a.coupon_id
LEFT OUTER JOIN tz_coupon_use_record b ON a.coupon_user_id = b.coupon_user_id
LEFT OUTER JOIN tz_order o ON b.order_number = o.order_number
LEFT OUTER JOIN tz_station s ON o.station_id = s.station_id
WHERE 1=1
  AND (? = '' OR a.receive_time >= ?)
  AND (? = '' OR a.receive_time < DATE_ADD(?, INTERVAL 1 DAY))
  AND (? = '' OR b.use_time >= ?)
  AND (? = '' OR b.use_time < DATE_ADD(?, INTERVAL 1 DAY))
  AND (? = '' OR FIND_IN_SET(a.coupon_id, ?) > 0)
ORDER BY a.receive_time DESC
LIMIT ? OFFSET ?`;

// 免运活动查询SQL
const FREIGHT_ACTIVITY_SQL = `
SELECT /*+ QUERY_TIMEOUT(1000000000) */
  a.activity_id AS '活动ID',
  a.activity_name AS '活动名称',
  o.order_number AS '订单编号',
  o.use_time AS '下单时间',
  s.out_code AS '门店编码',
  s.station_name AS '门店名称'
FROM tz_freight_activity_order o
JOIN tz_freight_activity a ON a.activity_id = o.activity_id
JOIN tz_order z ON o.order_number = z.order_number
JOIN tz_station s ON z.station_id = s.station_id
WHERE o.use_time >= ?
  AND o.use_time < DATE_ADD(?, INTERVAL 1 DAY)
ORDER BY o.use_time DESC
LIMIT ? OFFSET ?`;

// 社群拉新查询SQL
const INVITATION_SQL = `
SELECT /*+ QUERY_TIMEOUT(1000000000) */
  t1.invitation_Activity_Id AS '活动ID',
  t1.NAME AS '活动名称',
  t.launch_Id AS '发起ID',
  t.launch_User_Id AS '发起用户ID',
  t3.user_Mobile AS '用户手机',
  t.assist_User_Id AS '助力用户ID',
  t4.user_Mobile AS '助力用户手机',
  t.create_time AS '助力时间',
  t.update_Time AS '更新时间',
  CASE
    WHEN t.STATUS = 1 THEN '成功'
    WHEN t.STATUS = 0 THEN '进行中'
    ELSE '失败'
  END AS '状态',
  CASE
    WHEN (t.STATUS = -1 AND t2.union_id IS NOT NULL) THEN '非新用户'
    ELSE '--'
  END AS '失败原因'
FROM tz_invitation_activity t1,
  tz_invitation_launch_item t
  LEFT JOIN tz_invitation_union_id t2 ON t.union_Id = t2.union_Id
  LEFT JOIN tz_user t3 ON t.launch_User_Id = t3.user_Id
  LEFT JOIN tz_user t4 ON t.assist_User_Id = t4.user_Id
WHERE t1.invitation_Activity_Id = t.invitation_Activity_Id
  AND (? = '' OR FIND_IN_SET(t1.invitation_Activity_Id, ?) > 0)
  AND t.create_time >= ?
  AND t.create_time < DATE_ADD(?, INTERVAL 1 DAY)
ORDER BY t.launch_Id DESC
LIMIT ? OFFSET ?`;

// 基本中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置基本头信息
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 健康检查端点
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '鲸选报表平台后端',
    version: '1.0.0'
  });
});

// 模拟筛选选项
app.get('/api/v1/orders/filter-options', (req, res) => {
  const options = {
    stores: [
      { id: '1101', name: '北京朝阳门店', outCode: '1101' },
      { id: '2001', name: '上海浦东门店', outCode: '2001' },
      { id: '3101', name: '深圳南山门店', outCode: '3101' },
      { id: '3301', name: '杭州西湖门店', outCode: '3301' },
      { id: '4401', name: '广州天河门店', outCode: '4401' }
    ],
    statuses: [
      { value: '1', label: '待付款' },
      { value: '2', label: '待发货' },
      { value: '3', label: '待收货' },
      { value: '4', label: '待评价' },
      { value: '5', label: '交易成功' },
      { value: '6', label: '交易失败' },
      { value: '7', label: '待成团' },
      { value: '10', label: '待接单' },
      { value: '15', label: '待拣货' },
      { value: '50', label: '部分支付' },
      { value: '60', label: '整单的撤销中' }
    ],
    types: [
      { value: '0', label: '普通订单' },
      { value: '1', label: '团购订单' },
      { value: '2', label: '秒杀订单' },
      { value: '3', label: '积分订单' }
    ],
    channels: [
      { value: '1', label: '鲸选微信小程序' },
      { value: '2', label: '微信公众号' },
      { value: '6', label: '鲸选支付宝小程序' },
      { value: '7', label: 'PC' },
      { value: '8', label: 'H5' },
      { value: '9', label: '新鲸选APP' },
      { value: '10', label: '新鲸选APP' },
      { value: '11', label: '支付宝H5' },
      { value: '12', label: '字节宝小程序' }
    ],
    deliveryMethods: [
      { value: '1', label: '快递' },
      { value: '2', label: '自提' },
      { value: '3', label: '无需快递' },
      { value: '4', label: '同城配送' }
    ],
    quickDateRanges: [
      { value: 'today', label: '今天', days: 0 },
      { value: 'yesterday', label: '昨天', days: 1 },
      { value: 'last7days', label: '近7天', days: 7 },
      { value: 'last30days', label: '近30天', days: 30 },
      { value: 'thismonth', label: '本月', days: 'month' },
      { value: 'lastmonth', label: '上月', days: 'last-month' }
    ]
  };

  setTimeout(() => {
    res.json({
      success: true,
      data: options,
      timestamp: new Date().toISOString()
    });
  }, 100);
});

// 商品渗透率报表查询API
app.post('/api/v1/reports/product-penetration', async (req, res) => {
  const { startTime, endTime, stationCodes, barCodes, partyCodes } = req.body;
  
  const start = startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endTime || new Date().toISOString().split('T')[0];
  const storeList = stationCodes || '2625'; // 默认门店
  
  // 处理门店编码（支持逗号分隔）
  const formattedStoreList = storeList.replace(/，/g, ',').replace(/\s/g, '');
  
  // 处理商品条码和商品编码
  const formattedBarCodes = barCodes ? barCodes.replace(/，/g, ',').replace(/\s/g, '') : '';
  const formattedPartyCodes = partyCodes ? partyCodes.replace(/，/g, ',').replace(/\s/g, '') : '';
  
  if (!pool) {
    return res.status(503).json({
      success: false,
      error: '数据库未连接，商品渗透率报表需要连接OceanBase数据库',
      timestamp: new Date().toISOString()
    });
  }
  
  let conn = null;
  try {
    conn = await pool.getConnection();
    await conn.query("SET SESSION ob_query_timeout = 300000000");
    
    const params = [
      // 子查询a的参数: storeList, start, end, barCodes判断, barCodes值, partyCodes判断, partyCodes值
      formattedStoreList, start, end,
      formattedBarCodes, formattedBarCodes,
      formattedPartyCodes, formattedPartyCodes,
      // 子查询b的参数
      formattedStoreList, start, end,
      // 子查询c的参数
      formattedStoreList, start, end
    ];
    
    const startTimeMs = Date.now();
    const [rows] = await conn.query(PRODUCT_PENETRATION_SQL, params);
    const executionTime = Date.now() - startTimeMs;
    
    conn.release();
    conn = null;
    
    res.json({
      success: true,
      data: {
        items: rows,
        total: rows.length,
        queryConditions: { startTime: start, endTime: end, stationCodes: formattedStoreList, barCodes: formattedBarCodes, partyCodes: formattedPartyCodes }
      },
      executionTime,
      dataSource: 'oceanbase',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('商品渗透率查询错误:', err.message);
    if (conn) conn.release();
    res.status(500).json({
      success: false,
      error: '查询失败: ' + err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 商品渗透率报表导出API
app.post('/api/v1/reports/product-penetration/export', async (req, res) => {
  const params = req.body;
  const { startTime, endTime, stationCodes, barCodes, partyCodes } = params;
  const start = startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endTime || new Date().toISOString().split('T')[0];
  const formattedStoreList = (stationCodes || '2625').replace(/，/g, ',').replace(/\s/g, '');
  
  // 商品渗透率报表数据量通常较小，直接导出
  const taskId = `penetration_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const task = {
    id: taskId,
    type: 'product-penetration',
    status: 'processing',
    params: params,
    created_at: new Date().toISOString(),
    total: 0,
    progress: 0
  };
  exportTasks.set(taskId, task);
  
  res.json({
    success: true,
    data: {
      id: taskId,
      status: 'processing',
      params: params,
      created_at: task.created_at,
      download_url: `/api/v1/exports/download/${taskId}`
    },
    message: '导出任务已创建，正在后台处理',
    timestamp: new Date().toISOString()
  });
  
  // 后台执行导出
  processProductPenetrationExport(taskId, params).catch(err => {
    console.error('商品渗透率导出失败:', err);
    const t = exportTasks.get(taskId);
    if (t) {
      t.status = 'failed';
      t.error = err.message;
      t.updated_at = new Date().toISOString();
    }
  });
});

// 处理商品渗透率导出
async function processProductPenetrationExport(taskId, params) {
  const task = exportTasks.get(taskId);
  if (!task) return;
  
  const { startTime, endTime, stationCodes, barCodes, partyCodes } = params;
  const start = startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endTime || new Date().toISOString().split('T')[0];
  const formattedStoreList = (stationCodes || '2625').replace(/，/g, ',').replace(/\s/g, '');
  const formattedBarCodes = barCodes ? barCodes.replace(/，/g, ',').replace(/\s/g, '') : '';
  const formattedPartyCodes = partyCodes ? partyCodes.replace(/，/g, ',').replace(/\s/g, '') : '';
  
  let rows = [];
  
  if (pool) {
    const conn = await pool.getConnection();
    try {
      await conn.query("SET SESSION ob_query_timeout = 300000000");
      
      const queryParams = [
        formattedStoreList, start, end,
        formattedBarCodes, formattedBarCodes,
        formattedPartyCodes, formattedPartyCodes,
        formattedStoreList, start, end,
        formattedStoreList, start, end
      ];
      
      const [result] = await conn.query(PRODUCT_PENETRATION_SQL, queryParams);
      rows = result;
    } finally {
      conn.release();
    }
  }
  
  task.total = rows.length;
  task.progress = 50;
  
  // 生成Excel文件
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('商品渗透率报表');
  
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map(h => ({ header: h, key: h, width: 15 }));
    
    // 渗透率字段列表，需要格式化为百分数
    const percentFields = ['商品大类订单渗透率', '商品大类用户渗透率', '商品全局订单渗透率', '商品全局用户渗透率'];
    
    rows.forEach(row => {
      // 复制行数据
      const formattedRow = { ...row };
      
      // 将渗透率字段格式化为百分数字符串
      percentFields.forEach(field => {
        if (formattedRow[field] !== null && formattedRow[field] !== undefined) {
          const value = parseFloat(formattedRow[field]);
          if (!isNaN(value)) {
            formattedRow[field] = value.toFixed(2) + '%';
          }
        }
      });
      
      worksheet.addRow(formattedRow);
    });
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  const fileName = `商品渗透率报表_${start}_${end}_${taskId}.xlsx`;
  const filePath = path.join(EXPORT_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);
  
  task.status = 'completed';
  task.progress = 100;
  task.file_name = fileName;
  task.file_path = filePath;
  task.file_size = fs.statSync(filePath).size;
  task.download_url = `/api/v1/exports/download/${taskId}`;
  task.updated_at = new Date().toISOString();
  
  console.log(`商品渗透率导出完成: ${fileName}, ${rows.length}条记录`);
}

// 优惠券领用核销查询API
app.post('/api/v1/reports/coupon-query', async (req, res) => {
  const { 
    receiveStartTime = '', receiveEndTime = '', 
    useStartTime = '', useEndTime = '',
    couponIds = '', 
    page = 1, pageSize = 20 
  } = req.body;
  
  // 校验：领用日期和核销日期必须填写其中一项
  if (!receiveStartTime && !receiveEndTime && !useStartTime && !useEndTime) {
    return res.status(400).json({
      success: false,
      error: '请至少填写领用日期或核销日期其中一项',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!pool) {
    return res.status(503).json({
      success: false,
      error: '数据库未连接，优惠券查询需要连接OceanBase数据库',
      timestamp: new Date().toISOString()
    });
  }
  
  const offset = (page - 1) * pageSize;
  const formattedCouponIds = couponIds.replace(/，/g, ',').replace(/\s/g, '');
  
  let conn = null;
  try {
    conn = await pool.getConnection();
    await conn.query("SET SESSION ob_query_timeout = 300000000");
    
    const params = [
      receiveStartTime, receiveStartTime,
      receiveEndTime, receiveEndTime,
      useStartTime, useStartTime,
      useEndTime, useEndTime,
      formattedCouponIds, formattedCouponIds,
      parseInt(pageSize), offset
    ];
    
    const startTimeMs = Date.now();
    const [rows] = await conn.query(COUPON_QUERY_SQL, params);
    const executionTime = Date.now() - startTimeMs;
    
    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total FROM tz_user u
      JOIN tz_coupon_user a ON a.user_id = u.user_id
      JOIN tz_coupon c ON c.coupon_id = a.coupon_id
      LEFT OUTER JOIN tz_coupon_use_record b ON a.coupon_user_id = b.coupon_user_id
      LEFT OUTER JOIN tz_order o ON b.order_number = o.order_number
      WHERE 1=1
        AND (? = '' OR a.receive_time >= ?)
        AND (? = '' OR a.receive_time < DATE_ADD(?, INTERVAL 1 DAY))
        AND (? = '' OR b.use_time >= ?)
        AND (? = '' OR b.use_time < DATE_ADD(?, INTERVAL 1 DAY))
        AND (? = '' OR FIND_IN_SET(a.coupon_id, ?) > 0)
    `;
    
    const [countResult] = await conn.query(countSql, params.slice(0, 10));
    const total = countResult[0]?.total || 0;
    
    conn.release();
    conn = null;
    
    res.json({
      success: true,
      data: {
        items: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      queryConditions: req.body,
      executionTime,
      dataSource: 'oceanbase',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('优惠券查询错误:', err.message);
    if (conn) conn.release();
    res.status(500).json({
      success: false,
      error: '查询失败: ' + err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 优惠券领用核销导出API
app.post('/api/v1/reports/coupon-query/export', async (req, res) => {
  const params = req.body;
  const { receiveStartTime = '', receiveEndTime = '', useStartTime = '', useEndTime = '', couponIds = '' } = params;
  const formattedCouponIds = couponIds.replace(/，/g, ',').replace(/\s/g, '');
  
  // 预检查记录数
  if (pool) {
    try {
      const conn = await pool.getConnection();
      const countSql = `
        SELECT COUNT(*) as total FROM tz_user u
        JOIN tz_coupon_user a ON a.user_id = u.user_id
        JOIN tz_coupon c ON c.coupon_id = a.coupon_id
        LEFT OUTER JOIN tz_coupon_use_record b ON a.coupon_user_id = b.coupon_user_id
        LEFT OUTER JOIN tz_order o ON b.order_number = o.order_number
        WHERE 1=1
          AND (? = '' OR a.receive_time >= ?)
          AND (? = '' OR a.receive_time < DATE_ADD(?, INTERVAL 1 DAY))
          AND (? = '' OR b.use_time >= ?)
          AND (? = '' OR b.use_time < DATE_ADD(?, INTERVAL 1 DAY))
          AND (? = '' OR FIND_IN_SET(a.coupon_id, ?) > 0)
      `;
      const [countResult] = await conn.query(countSql, [
        receiveStartTime, receiveStartTime,
        receiveEndTime, receiveEndTime,
        useStartTime, useStartTime,
        useEndTime, useEndTime,
        formattedCouponIds, formattedCouponIds
      ]);
      conn.release();
      
      const total = countResult[0]?.total || 0;
    } catch (err) {
      console.error('预检查错误:', err.message);
    }
  }
  
  const taskId = `coupon_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const task = {
    id: taskId,
    type: 'coupon-query',
    status: 'processing',
    params: params,
    created_at: new Date().toISOString(),
    total: 0,
    progress: 0
  };
  exportTasks.set(taskId, task);
  
  res.json({
    success: true,
    data: {
      id: taskId,
      type: task.type,
      status: 'processing',
      params: params,
      created_at: task.created_at,
      download_url: `/api/v1/exports/download/${taskId}`
    },
    message: '导出任务已创建，正在后台处理',
    timestamp: new Date().toISOString()
  });
  
  // 后台执行导出
  processCouponQueryExport(taskId, params).catch(err => {
    console.error('优惠券导出失败:', err);
    const t = exportTasks.get(taskId);
    if (t) {
      t.status = 'failed';
      t.error = err.message;
      t.updated_at = new Date().toISOString();
    }
  });
});

// 处理优惠券领用核销导出
async function processCouponQueryExport(taskId, params) {
  const task = exportTasks.get(taskId);
  if (!task) return;
  
  const { 
    receiveStartTime = '', receiveEndTime = '', 
    useStartTime = '', useEndTime = '',
    couponIds = ''
  } = params;
  
  const formattedCouponIds = couponIds.replace(/，/g, ',').replace(/\s/g, '');
  
  let rows = [];
  
  if (pool) {
    const conn = await pool.getConnection();
    try {
      await conn.query("SET SESSION ob_query_timeout = 300000000");
      
      const exportSql = COUPON_QUERY_SQL.replace('LIMIT ? OFFSET ?', '');
      const queryParams = [
        receiveStartTime, receiveStartTime,
        receiveEndTime, receiveEndTime,
        useStartTime, useStartTime,
        useEndTime, useEndTime,
        formattedCouponIds, formattedCouponIds
      ];
      
      const [result] = await conn.query(exportSql, queryParams);
      rows = result;
    } finally {
      conn.release();
    }
  }
  
  task.total = rows.length;
  task.progress = 50;
  
  // 生成Excel文件
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('优惠券领用核销');
  
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map(h => ({ header: h, key: h, width: 18 }));
    
    rows.forEach(row => {
      worksheet.addRow(row);
    });
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `优惠券领用核销_${dateStr}_${taskId}.xlsx`;
  const filePath = path.join(EXPORT_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);
  
  task.status = 'completed';
  task.progress = 100;
  task.file_name = fileName;
  task.file_path = filePath;
  task.file_size = fs.statSync(filePath).size;
  task.download_url = `/api/v1/exports/download/${taskId}`;
  task.updated_at = new Date().toISOString();
  
  console.log(`优惠券导出完成: ${fileName}, ${rows.length}条记录`);
}

// 免运活动查询API
app.post('/api/v1/reports/freight-activity', async (req, res) => {
  const { startTime, endTime, page = 1, pageSize = 20 } = req.body;
  
  if (!startTime || !endTime) {
    return res.status(400).json({
      success: false,
      error: '请填写查询时间范围',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!pool) {
    return res.status(503).json({
      success: false,
      error: '数据库未连接，免运活动查询需要连接OceanBase数据库',
      timestamp: new Date().toISOString()
    });
  }
  
  const offset = (page - 1) * pageSize;
  
  let conn = null;
  try {
    conn = await pool.getConnection();
    await conn.query("SET SESSION ob_query_timeout = 300000000");
    
    const params = [startTime, endTime, parseInt(pageSize), offset];
    
    const startTimeMs = Date.now();
    const [rows] = await conn.query(FREIGHT_ACTIVITY_SQL, params);
    const executionTime = Date.now() - startTimeMs;
    
    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total FROM tz_freight_activity_order o
      JOIN tz_freight_activity a ON a.activity_id = o.activity_id
      JOIN tz_order z ON o.order_number = z.order_number
      JOIN tz_station s ON z.station_id = s.station_id
      WHERE o.use_time >= ?
        AND o.use_time < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    
    const [countResult] = await conn.query(countSql, [startTime, endTime]);
    const total = countResult[0]?.total || 0;
    
    conn.release();
    conn = null;
    
    res.json({
      success: true,
      data: {
        items: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      queryConditions: req.body,
      executionTime,
      dataSource: 'oceanbase',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('免运活动查询错误:', err.message);
    if (conn) conn.release();
    res.status(500).json({
      success: false,
      error: '查询失败: ' + err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 免运活动导出API
app.post('/api/v1/reports/freight-activity/export', async (req, res) => {
  const params = req.body;
  const { startTime, endTime } = params;
  
  // 预检查记录数
  if (pool) {
    try {
      const conn = await pool.getConnection();
      const countSql = `
        SELECT COUNT(*) as total FROM tz_freight_activity_order o
        JOIN tz_freight_activity a ON a.activity_id = o.activity_id
        JOIN tz_order z ON o.order_number = z.order_number
        JOIN tz_station s ON z.station_id = s.station_id
        WHERE o.use_time >= ?
          AND o.use_time < DATE_ADD(?, INTERVAL 1 DAY)
      `;
      const [countResult] = await conn.query(countSql, [startTime, endTime]);
      conn.release();
      
      const total = countResult[0]?.total || 0;
    } catch (err) {
      console.error('预检查错误:', err.message);
    }
  }
  
  const taskId = `freight_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const task = {
    id: taskId,
    type: 'freight-activity',
    status: 'processing',
    params: params,
    created_at: new Date().toISOString(),
    total: 0,
    progress: 0
  };
  exportTasks.set(taskId, task);
  
  res.json({
    success: true,
    data: {
      id: taskId,
      type: task.type,
      status: 'processing',
      params: params,
      created_at: task.created_at,
      download_url: `/api/v1/exports/download/${taskId}`
    },
    message: '导出任务已创建，正在后台处理',
    timestamp: new Date().toISOString()
  });
  
  processFreightActivityExport(taskId, params).catch(err => {
    console.error('免运活动导出失败:', err);
    const t = exportTasks.get(taskId);
    if (t) {
      t.status = 'failed';
      t.error = err.message;
      t.updated_at = new Date().toISOString();
    }
  });
});

// 处理免运活动导出
async function processFreightActivityExport(taskId, params) {
  const task = exportTasks.get(taskId);
  if (!task) return;
  
  const { startTime, endTime } = params;
  
  let rows = [];
  
  if (pool) {
    const conn = await pool.getConnection();
    try {
      await conn.query("SET SESSION ob_query_timeout = 300000000");
      
      const exportSql = FREIGHT_ACTIVITY_SQL.replace('LIMIT ? OFFSET ?', 'LIMIT 100000');
      const [result] = await conn.query(exportSql, [startTime, endTime]);
      rows = result;
    } finally {
      conn.release();
    }
  }
  
  task.total = rows.length;
  task.progress = 50;
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('免运活动');
  
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map(h => ({ header: h, key: h, width: 18 }));
    
    rows.forEach(row => {
      worksheet.addRow(row);
    });
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  const fileName = `免运活动查询_${startTime}_${endTime}_${taskId}.xlsx`;
  const filePath = path.join(EXPORT_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);
  
  task.status = 'completed';
  task.progress = 100;
  task.file_name = fileName;
  task.file_path = filePath;
  task.file_size = fs.statSync(filePath).size;
  task.download_url = `/api/v1/exports/download/${taskId}`;
  task.updated_at = new Date().toISOString();
  
  console.log(`免运活动导出完成: ${fileName}, ${rows.length}条记录`);
}

// 社群拉新查询API
app.post('/api/v1/reports/invitation', async (req, res) => {
  const { startTime, endTime, activityIds = '', page = 1, pageSize = 20 } = req.body;
  
  if (!startTime || !endTime) {
    return res.status(400).json({
      success: false,
      error: '请填写查询时间范围',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!pool) {
    return res.status(503).json({
      success: false,
      error: '数据库未连接，社群拉新查询需要连接OceanBase数据库',
      timestamp: new Date().toISOString()
    });
  }
  
  const offset = (page - 1) * pageSize;
  const formattedActivityIds = activityIds.replace(/，/g, ',').replace(/\s/g, '');
  
  let conn = null;
  try {
    conn = await pool.getConnection();
    await conn.query("SET SESSION ob_query_timeout = 300000000");
    
    const params = [
      formattedActivityIds, formattedActivityIds,
      startTime, endTime,
      parseInt(pageSize), offset
    ];
    
    const startTimeMs = Date.now();
    const [rows] = await conn.query(INVITATION_SQL, params);
    const executionTime = Date.now() - startTimeMs;
    
    // 查询总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM tz_invitation_activity t1,
        tz_invitation_launch_item t
        LEFT JOIN tz_invitation_union_id t2 ON t.union_Id = t2.union_Id
      WHERE t1.invitation_Activity_Id = t.invitation_Activity_Id
        AND (? = '' OR FIND_IN_SET(t1.invitation_Activity_Id, ?) > 0)
        AND t.create_time >= ?
        AND t.create_time < DATE_ADD(?, INTERVAL 1 DAY)
    `;
    
    const [countResult] = await conn.query(countSql, [
      formattedActivityIds, formattedActivityIds,
      startTime, endTime
    ]);
    const total = countResult[0]?.total || 0;
    
    conn.release();
    conn = null;
    
    res.json({
      success: true,
      data: {
        items: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      queryConditions: req.body,
      executionTime,
      dataSource: 'oceanbase',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('社群拉新查询错误:', err.message);
    if (conn) conn.release();
    res.status(500).json({
      success: false,
      error: '查询失败: ' + err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 社群拉新导出API
app.post('/api/v1/reports/invitation/export', async (req, res) => {
  const params = req.body;
  const { startTime, endTime, activityIds = '' } = params;
  const formattedActivityIds = activityIds.replace(/，/g, ',').replace(/\s/g, '');
  
  // 预检查记录数
  if (pool) {
    try {
      const conn = await pool.getConnection();
      const countSql = `
        SELECT COUNT(*) as total
        FROM tz_invitation_activity t1,
          tz_invitation_launch_item t
          LEFT JOIN tz_invitation_union_id t2 ON t.union_Id = t2.union_Id
        WHERE t1.invitation_Activity_Id = t.invitation_Activity_Id
          AND (? = '' OR FIND_IN_SET(t1.invitation_Activity_Id, ?) > 0)
          AND t.create_time >= ?
          AND t.create_time < DATE_ADD(?, INTERVAL 1 DAY)
      `;
      const [countResult] = await conn.query(countSql, [
        formattedActivityIds, formattedActivityIds,
        startTime, endTime
      ]);
      conn.release();
      
      const total = countResult[0]?.total || 0;
    } catch (err) {
      console.error('预检查错误:', err.message);
    }
  }
  
  const taskId = `invitation_export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const task = {
    id: taskId,
    type: 'invitation',
    status: 'processing',
    params: params,
    created_at: new Date().toISOString(),
    total: 0,
    progress: 0
  };
  exportTasks.set(taskId, task);
  
  res.json({
    success: true,
    data: {
      id: taskId,
      type: task.type,
      status: 'processing',
      params: params,
      created_at: task.created_at,
      download_url: `/api/v1/exports/download/${taskId}`
    },
    message: '导出任务已创建，正在后台处理',
    timestamp: new Date().toISOString()
  });
  
  processInvitationExport(taskId, params).catch(err => {
    console.error('社群拉新导出失败:', err);
    const t = exportTasks.get(taskId);
    if (t) {
      t.status = 'failed';
      t.error = err.message;
      t.updated_at = new Date().toISOString();
    }
  });
});

// 处理社群拉新导出
async function processInvitationExport(taskId, params) {
  const task = exportTasks.get(taskId);
  if (!task) return;
  
  const { startTime, endTime, activityIds = '' } = params;
  const formattedActivityIds = activityIds.replace(/，/g, ',').replace(/\s/g, '');
  
  let rows = [];
  
  if (pool) {
    const conn = await pool.getConnection();
    try {
      await conn.query("SET SESSION ob_query_timeout = 300000000");
      
      const exportSql = INVITATION_SQL.replace('LIMIT ? OFFSET ?', 'LIMIT 100000');
      const [result] = await conn.query(exportSql, [
        formattedActivityIds, formattedActivityIds,
        startTime, endTime
      ]);
      rows = result;
    } finally {
      conn.release();
    }
  }
  
  task.total = rows.length;
  task.progress = 50;
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('社群拉新');
  
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map(h => ({ header: h, key: h, width: 18 }));
    
    rows.forEach(row => {
      worksheet.addRow(row);
    });
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `社群拉新_${dateStr}_${taskId}.xlsx`;
  const filePath = path.join(EXPORT_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);
  
  task.status = 'completed';
  task.progress = 100;
  task.file_name = fileName;
  task.file_path = filePath;
  task.file_size = fs.statSync(filePath).size;
  task.download_url = `/api/v1/exports/download/${taskId}`;
  task.updated_at = new Date().toISOString();
  
  console.log(`社群拉新导出完成: ${fileName}, ${rows.length}条记录`);
}

// 生成模拟订单数据
function generateOrders(count) {
  const orders = [];
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 3);
  
  const stores = [
    { code: '1101', name: '北京朝阳门店' },
    { code: '2001', name: '上海浦东门店' },
    { code: '3101', name: '深圳南山门店' },
    { code: '3301', name: '杭州西湖门店' },
    { code: '4401', name: '广州天河门店' }
  ];
  
  const statuses = ['待付款', '待发货', '待收货', '待评价', '交易成功', '交易失败'];
  const channels = ['鲸选微信小程序', '微信公众号', '鲸选支付宝小程序', 'PC', 'H5'];
  const coupons = [
    { id: 'CP001', name: '新用户满减券', condition: '满100可用', amount: 20 },
    { id: 'CP002', name: '会员专享折扣', condition: '满200可用', amount: 30 },
    { id: 'CP003', name: '节日促销券', condition: '满50可用', amount: 10 },
    { id: 'CP004', name: '免运费券', condition: '无门槛', amount: 5 },
    null, null, null // 40%的订单没有优惠券
  ];
  
  for (let i = 0; i < count; i++) {
    const orderDate = new Date(baseDate.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000);
    const store = stores[Math.floor(Math.random() * stores.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const coupon = coupons[Math.floor(Math.random() * coupons.length)];
    
    const productAmount = Math.floor(Math.random() * 4950) + 50;
    const discountAmount = Math.floor(Math.random() * productAmount * 0.3);
    const actualPaid = productAmount - discountAmount - (coupon ? coupon.amount : 0);
    
    // 生成手机号
    const phone = '1' + ['3', '5', '7', '8', '9'][Math.floor(Math.random() * 5)] + 
      Math.floor(Math.random() * 900000000 + 100000000);
    
    const order = {
      订单号: `ORD${String(1000000 + i).substring(1)}`,
      来源渠道: channel,
      下单人手机号: phone,
      平台订单号: `PLAT${String(1000000 + i).substring(1)}`,
      订单类型: '普通订单',
      订单状态: status,
      下单时间: orderDate.toISOString(),
      所属门店名称: store.name,
      所属门店代码: store.code,
      配送方式: '快递',
      收货人: `用户${i + 1}`,
      收货人手机号: phone,
      收货地址: `北京市朝阳区第${i + 1}街道`,
      商品种类数: Math.floor(Math.random() * 10) + 1,
      商品总数量: Math.floor(Math.random() * 100) + 1,
      商品总金额: productAmount,
      优惠总金额: discountAmount,
      实付商品总金额: actualPaid,
      原应付运费金额: Math.floor(Math.random() * 50) + 10,
      运费活动优惠金额: Math.floor(Math.random() * 20),
      优惠后运费: Math.floor(Math.random() * 30) + 5,
      包装费: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : 0,
      客户实付金额: actualPaid,
      支付宝支付: Math.floor(Math.random() * actualPaid * 0.7),
      微信支付: actualPaid - Math.floor(Math.random() * actualPaid * 0.7),
      储值卡支付: 0,
      卡包支付: 0,
      微支付: 0,
      硕洋饭卡支付: 0,
      津贴支付: 0,
      优惠券ID: coupon ? coupon.id : null,
      优惠券名称: coupon ? coupon.name : null,
      优惠券使用条件: coupon ? coupon.condition : null,
      优惠券减免金额: coupon ? coupon.amount : 0
    };
    
    orders.push(order);
  }
  
  // 按时间排序
  orders.sort((a, b) => new Date(b.下单时间).getTime() - new Date(a.下单时间).getTime());
  
  return orders;
}

// 生成100条模拟订单
const mockOrders = generateOrders(100);

// 订单查询API
app.post('/api/v1/orders/query', async (req, res) => {
  const { 
    startTime, 
    endTime, 
    stationCodes = '', 
    mobile = '', 
    status = '', 
    page = 1, 
    pageSize = 20 
  } = req.body;
  
  const start = startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endTime || new Date().toISOString().split('T')[0];
  const offset = (page - 1) * pageSize;
  
  // 如果数据库可用，使用真实查询
  if (pool) {
    let conn = null;
    try {
      conn = await pool.getConnection();
      await conn.query("SET SESSION ob_query_timeout = 300000000");
      
      const params = [
        start, end, 
        stationCodes, stationCodes,
        mobile, mobile,
        status, status,
        pageSize, offset
      ];
      
      const startTimeMs = Date.now();
      const [rows] = await conn.query(ORDER_QUERY_SQL, params);
      const executionTime = Date.now() - startTimeMs;
      
      // 查询总数
      const countSql = `SELECT COUNT(DISTINCT o.order_number) as total FROM tz_order o
        LEFT JOIN tz_station ts ON o.station_id = ts.station_id
        LEFT JOIN tz_user tu ON o.user_id = tu.user_id
        WHERE o.is_payed = 1 
        AND DATE(o.create_time) >= ?
        AND DATE(o.create_time) <= ?
        AND (? = '' OR FIND_IN_SET(ts.out_code, REPLACE(?, '，', ',')) > 0)
        AND (? = '' OR tu.user_mobile = ?)
        AND (? = '' OR o.status IN (?))`;
      
      const [countResult] = await conn.query(countSql, params.slice(0, 8));
      const total = countResult[0]?.total || rows.length;
      
      conn.release();
      conn = null;
      
      res.json({
        success: true,
        data: {
          items: rows,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        },
        queryConditions: req.body,
        executionTime,
        dataSource: 'oceanbase',
        timestamp: new Date().toISOString()
      });
      return;
    } catch (err) {
      console.error('数据库查询错误:', err.message);
      if (conn) conn.release();
      // 继续使用模拟数据
    }
  }
  
  // 模拟数据回退
  let filteredOrders = [...mockOrders];
  
  if (stationCodes) {
    const stations = stationCodes.split(',').map(s => s.trim());
    filteredOrders = filteredOrders.filter(order => stations.includes(order.所属门店代码));
  }
  
  if (mobile) {
    filteredOrders = filteredOrders.filter(order => order.下单人手机号.includes(mobile));
  }
  
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.订单状态 === status);
  }
  
  if (startTime && endTime) {
    const s = new Date(startTime);
    const e = new Date(endTime);
    filteredOrders = filteredOrders.filter(order => {
      const orderTime = new Date(order.下单时间);
      return orderTime >= s && orderTime <= e;
    });
  }
  
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredOrders.length);
  const paginatedData = filteredOrders.slice(startIndex, endIndex);
  
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        items: paginatedData,
        total: filteredOrders.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredOrders.length / pageSize)
      },
      queryConditions: req.body,
      executionTime: Math.random() * 100 + 50,
      dataSource: 'mock',
      timestamp: new Date().toISOString()
    });
  }, 150);
});

// 订单统计
app.post('/api/v1/orders/stats', (req, res) => {
  const filteredOrders = [...mockOrders].slice(0, 50); // 模拟过滤
  
  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.客户实付金额, 0);
  const avgAmount = filteredOrders.length > 0 ? totalAmount / filteredOrders.length : 0;
  
  setTimeout(() => {
    res.json({
      success: true,
      data: {
        totalOrders: filteredOrders.length,
        totalAmount,
        avgAmount,
        successRate: Math.random() * 20 + 80,
        topStores: [
          { storeName: '北京朝阳门店', storeCode: '1101', orderCount: 25, amount: 12500 },
          { storeName: '上海浦东门店', storeCode: '2001', orderCount: 18, amount: 9800 }
        ],
        distributionByChannel: {
          '鲸选微信小程序': 45,
          '微信公众号': 30,
          '鲸选支付宝小程序': 25
        },
        distributionByStatus: {
          '交易成功': 70,
          '待发货': 15,
          '待付款': 10,
          '交易失败': 5
        }
      },
      timestamp: new Date().toISOString()
    });
  }, 100);
});

// 订单数量查询
app.post('/api/v1/orders/count', (req, res) => {
  setTimeout(() => {
    res.json({
      success: true,
      data: { count: 100 },
      timestamp: new Date().toISOString()
    });
  }, 50);
});

// 导出订单
app.post('/api/v1/orders/export', async (req, res) => {
  const params = req.body;
  const exportType = params.exportType || 'order';
  
  const { startTime, endTime, stationCodes = '', mobile = '', status = '' } = params;
  const start = startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endTime || new Date().toISOString().split('T')[0];
  
  // 预检查记录数
  if (pool) {
    try {
      const conn = await pool.getConnection();
      const countSql = `SELECT COUNT(DISTINCT o.order_number) as total FROM tz_order o
        LEFT JOIN tz_station ts ON o.station_id = ts.station_id
        LEFT JOIN tz_user tu ON o.user_id = tu.user_id
        WHERE o.is_payed = 1 
        AND DATE(o.create_time) >= ?
        AND DATE(o.create_time) <= ?
        AND (? = '' OR FIND_IN_SET(ts.out_code, REPLACE(?, '，', ',')) > 0)
        AND (? = '' OR tu.user_mobile = ?)
        AND (? = '' OR o.status IN (?))`;
      
      const [countResult] = await conn.query(countSql, [start, end, stationCodes, stationCodes, mobile, mobile, status, status]);
      conn.release();
      
      const total = countResult[0]?.total || 0;
    } catch (err) {
      console.error('预检查错误:', err.message);
    }
  }
  
  const taskId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 创建任务记录
  const task = {
    id: taskId,
    type: exportType === 'order-detail' ? 'order-detail' : 'order',
    status: 'processing',
    params: params,
    created_at: new Date().toISOString(),
    total: 0,
    progress: 0
  };
  exportTasks.set(taskId, task);
  
  // 立即返回任务ID
  res.json({
    success: true,
    data: {
      id: taskId,
      type: task.type,
      status: 'processing',
      params: params,
      created_at: task.created_at,
      download_url: `/api/v1/exports/download/${taskId}`
    },
    message: '导出任务已创建，正在后台处理',
    timestamp: new Date().toISOString()
  });
  
  // 后台执行导出
  if (exportType === 'order-detail') {
    processOrderDetailExport(taskId, params).catch(err => {
      console.error('订单明细导出失败:', err);
      const t = exportTasks.get(taskId);
      if (t) {
        t.status = 'failed';
        t.error = err.message;
        t.updated_at = new Date().toISOString();
      }
    });
  } else {
    processExport(taskId, params).catch(err => {
      console.error('导出失败:', err);
      const t = exportTasks.get(taskId);
      if (t) {
        t.status = 'failed';
        t.error = err.message;
        t.updated_at = new Date().toISOString();
      }
    });
  }
});

// 获取导出任务列表
app.get('/api/v1/exports', (req, res) => {
  const tasks = Array.from(exportTasks.values())
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20);
  
  res.json({
    success: true,
    data: tasks,
    timestamp: new Date().toISOString()
  });
});

// 获取单个任务状态
app.get('/api/v1/exports/:taskId', (req, res) => {
  const task = exportTasks.get(req.params.taskId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: '任务不存在',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    data: task,
    timestamp: new Date().toISOString()
  });
});

// 处理导出任务
async function processExport(taskId, params) {
  const task = exportTasks.get(taskId);
  if (!task) return;
  
  const { startTime, endTime, stationCodes = '', mobile = '', status = '' } = params;
  const start = startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endTime || new Date().toISOString().split('T')[0];
  
  let rows = [];
  
  // 从数据库或模拟数据获取数据
  if (pool) {
    const conn = await pool.getConnection();
    try {
      await conn.query("SET SESSION ob_query_timeout = 300000000");
      
      const exportSql = ORDER_QUERY_SQL.replace('LIMIT ? OFFSET ?', 'LIMIT 100000');
      const queryParams = [
        start, end, 
        stationCodes, stationCodes,
        mobile, mobile,
        status, status
      ];
      
      const [result] = await conn.query(exportSql, queryParams);
      rows = result;
    } finally {
      conn.release();
    }
  } else {
    // 使用模拟数据
    rows = mockOrders.filter(order => {
      if (stationCodes && !stationCodes.split(',').includes(order.所属门店代码)) return false;
      if (mobile && !order.下单人手机号.includes(mobile)) return false;
      if (status && order.订单状态 !== status) return false;
      return true;
    });
  }
  
  task.total = rows.length;
  task.progress = 50;
  
  // 生成Excel文件
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('订单数据');
  
  // 添加表头
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map(h => ({ header: h, key: h, width: 15 }));
    
    // 添加数据行
    rows.forEach(row => {
      worksheet.addRow(row);
    });
    
    // 设置表头样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  // 保存文件
  const fileName = `订单导出_${start}_${end}_${taskId}.xlsx`;
  const filePath = path.join(EXPORT_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);
  
  // 更新任务状态
  task.status = 'completed';
  task.progress = 100;
  task.file_name = fileName;
  task.file_path = filePath;
  task.file_size = fs.statSync(filePath).size;
  task.download_url = `/api/v1/exports/download/${taskId}`;
  task.updated_at = new Date().toISOString();
  
  console.log(`导出完成: ${fileName}, ${rows.length}条记录`);
}

// 处理订单明细导出任务
async function processOrderDetailExport(taskId, params) {
  const task = exportTasks.get(taskId);
  if (!task) return;
  
  const { startTime, endTime, stationCodes = '' } = params;
  const start = startTime || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const end = endTime || new Date().toISOString().split('T')[0];
  const storeList = stationCodes.replace(/，/g, ',').replace(/\s/g, '');
  
  let rows = [];
  
  // 从数据库获取数据
  if (pool) {
    const conn = await pool.getConnection();
    try {
      await conn.query("SET SESSION ob_query_timeout = 300000000");
      
      const queryParams = [start, end, storeList, storeList];
      const [result] = await conn.query(ORDER_DETAIL_SQL, queryParams);
      rows = result;
    } finally {
      conn.release();
    }
  }
  
  task.total = rows.length;
  task.progress = 50;
  
  // 生成Excel文件
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('订单明细');
  
  if (rows.length > 0) {
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map(h => ({ header: h, key: h, width: 15 }));
    
    rows.forEach(row => {
      worksheet.addRow(row);
    });
    
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
  }
  
  const fileName = `订单明细导出_${start}_${end}_${taskId}.xlsx`;
  const filePath = path.join(EXPORT_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);
  
  task.status = 'completed';
  task.progress = 100;
  task.file_name = fileName;
  task.file_path = filePath;
  task.file_size = fs.statSync(filePath).size;
  task.download_url = `/api/v1/exports/download/${taskId}`;
  task.updated_at = new Date().toISOString();
  
  console.log(`订单明细导出完成: ${fileName}, ${rows.length}条记录`);
}

// 订单详情API
app.get('/api/v1/orders/:orderNumber', async (req, res) => {
  const orderNumber = req.params.orderNumber;
  
  // 如果数据库可用，查询真实数据
  if (pool) {
    try {
      const conn = await pool.getConnection();
      await conn.query("SET SESSION ob_query_timeout = 300000000");
      
      const detailSql = `SELECT
        o.order_number AS '订单号',
        CASE o.social_type 
          WHEN 1 THEN '鲸选微信小程序' WHEN 2 THEN '微信公众号' WHEN 6 THEN '鲸选支付宝小程序'
          WHEN 7 THEN 'PC' WHEN 8 THEN 'H5' WHEN 9 THEN '新鲸选APP' WHEN 10 THEN '新鲸选APP'
          WHEN 11 THEN '支付宝H5' WHEN 12 THEN '字节宝小程序' ELSE '' 
        END AS '来源渠道',
        tu.user_mobile AS '下单人手机号',
        CASE o.order_type WHEN 0 THEN '普通订单' WHEN 1 THEN '团购订单' WHEN 2 THEN '秒杀订单' WHEN 3 THEN '积分订单' ELSE '' END AS '订单类型',
        CASE o.STATUS WHEN 1 THEN '待付款' WHEN 2 THEN '待发货' WHEN 3 THEN '待收货' WHEN 4 THEN '待评价'
          WHEN 5 THEN '交易成功' WHEN 6 THEN '交易失败' WHEN 7 THEN '待成团' WHEN 10 THEN '待接单'
          WHEN 15 THEN '待拣货' WHEN 50 THEN '部分支付' WHEN 60 THEN '整单的撤销中' ELSE '' END AS '订单状态',
        o.create_time AS '下单时间',
        ts.station_name AS '所属门店名称', ts.out_code AS '所属门店代码',
        CASE o.dvy_type WHEN 1 THEN '快递' WHEN 2 THEN '自提' WHEN 3 THEN '无需快递' WHEN 4 THEN '同城配送' ELSE '' END AS '配送方式',
        o.receiver_name AS '收货人', o.receiver_mobile AS '收货人手机号',
        CASE WHEN o.dvy_type = 2 THEN '自提订单' ELSE CONCAT(IFNULL(uao.province,''), IFNULL(uao.city,''), IFNULL(uao.area,''), IFNULL(uao.addr,'')) END AS '收货地址',
        COUNT(DISTINCT toi.sku_id) AS '商品种类数', SUM(toi.prod_count) AS '商品总数量',
        o.total AS '商品总金额', o.reduce_amount AS '优惠总金额',
        o.actual_total - (o.freight_amount - o.platform_free_freight_amount) - IFNULL(o.packing, 0) AS '实付商品总金额',
        o.freight_amount AS '原应付运费金额', o.platform_free_freight_amount AS '运费活动优惠金额',
        o.freight_amount - o.platform_free_freight_amount AS '优惠后运费',
        IFNULL(o.packing, 0) AS '包装费', o.actual_total AS '客户实付金额',
        IFNULL(alipay.pay_lh_amount, 0) AS '支付宝支付',
        IFNULL(wxpay.pay_lh_amount, 0) AS '微信支付',
        IFNULL(czkpay.pay_lh_amount, 0) AS '储值卡支付',
        IFNULL(kbpay.pay_lh_amount, 0) AS '卡包支付',
        IFNULL(wzfpay.pay_lh_amount, 0) AS '微支付',
        IFNULL(fkpay.pay_lh_amount, 0) AS '硕洋饭卡支付',
        IFNULL(jtpay.pay_lh_amount, 0) AS '津贴支付',
        tc.coupon_id AS '优惠券ID', tc.coupon_name AS '优惠券名称',
        tc.cash_condition AS '优惠券使用条件', tc.reduce_amount AS '优惠券减免金额'
      FROM tz_order o
        LEFT JOIN tz_station ts ON o.station_id = ts.station_id
        LEFT JOIN tz_user tu ON o.user_id = tu.user_id
        LEFT JOIN tz_user_addr_order uao ON o.addr_order_id = uao.addr_order_id
        LEFT JOIN tz_order_item toi ON o.order_number = toi.order_number
        LEFT JOIN tz_coupon_use_record tcur ON o.order_number = tcur.order_number
        LEFT JOIN tz_coupon_user tcu ON tcu.coupon_user_id = tcur.coupon_user_id
        LEFT JOIN tz_coupon tc ON tcu.coupon_id = tc.coupon_id
        LEFT JOIN (SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '2002') alipay ON o.order_number = alipay.order_number
        LEFT JOIN (SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '2001') wxpay ON o.order_number = wxpay.order_number
        LEFT JOIN (SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '1003') czkpay ON o.order_number = czkpay.order_number
        LEFT JOIN (SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount FROM tz_pay_info WHERE pay_lh_actual_amount > 0 AND pay_lh_type = '1005') kbpay ON o.order_number = kbpay.order_number
        LEFT JOIN (SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '1004') wzfpay ON o.order_number = wzfpay.order_number
        LEFT JOIN (SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '1001') fkpay ON o.order_number = fkpay.order_number
        LEFT JOIN (SELECT order_numbers AS order_number, IFNULL(pay_lh_actual_amount, 0) AS pay_lh_amount FROM tz_pay_info WHERE pay_status = 1 AND pay_lh_type = '1002') jtpay ON o.order_number = jtpay.order_number
      WHERE o.order_number = ?
      GROUP BY o.order_number`;
      
      const [rows] = await conn.query(detailSql, [orderNumber]);
      conn.release();
      
      if (rows.length > 0) {
        res.json({
          success: true,
          data: rows[0],
          dataSource: 'oceanbase',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(404).json({
          success: false,
          error: '订单未找到',
          timestamp: new Date().toISOString()
        });
      }
      return;
    } catch (err) {
      console.error('查询订单详情失败:', err.message);
    }
  }
  
  // 回退到模拟数据
  const order = mockOrders.find(o => o.订单号 === orderNumber);
  
  if (order) {
    res.json({
      success: true,
      data: order,
      dataSource: 'mock',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(404).json({
      success: false,
      error: '订单未找到',
      timestamp: new Date().toISOString()
    });
  }
});

// 导出下载
app.get('/api/v1/exports/download/:jobId', (req, res) => {
  const task = exportTasks.get(req.params.jobId);
  
  if (!task) {
    return res.status(404).json({
      success: false,
      error: '任务不存在',
      timestamp: new Date().toISOString()
    });
  }
  
  if (task.status !== 'completed') {
    return res.status(400).json({
      success: false,
      error: '任务尚未完成',
      status: task.status,
      timestamp: new Date().toISOString()
    });
  }
  
  if (!fs.existsSync(task.file_path)) {
    return res.status(404).json({
      success: false,
      error: '文件不存在',
      timestamp: new Date().toISOString()
    });
  }
  
  res.download(task.file_path, task.file_name, (err) => {
    if (err) {
      console.error('文件下载失败:', err);
    }
  });
});

// 所有其他路由
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API端点不存在',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`  鲸选报表平台后端服务`);
    console.log(`=========================================`);
    console.log(`🚀 服务已启动: http://localhost:${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/api/v1/health`);
    console.log(`📋 数据模式: ${pool ? 'OceanBase真实数据' : '模拟数据'}`);
    console.log(`🔌 数据库: ${pool ? process.env.DB_HOST : '未连接'}`);
    console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
    console.log(`=========================================`);
  });
}

startServer().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});

// 处理优雅退出
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号，正在关闭服务器...');
  process.exit(0);
});