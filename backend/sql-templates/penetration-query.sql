/* 商品渗透率查询 SQL 模板 */
/* 支持按门店、商品条码、商品编码筛选 */

/*+ QUERY_TIMEOUT(1000000000) */
SELECT
    pc.category_code AS '大类编码',
    pc.category_name AS '大类名称',
    p.prod_code AS '商品编码',
    p.bar_code AS '商品条码',
    p.prod_name AS '商品名称',
    p.specification AS '规格',
    COALESCE(SUM(od.prod_count), 0) AS '购买数量',
    COUNT(DISTINCT od.order_id) AS '商品订单量',
    COUNT(DISTINCT o.user_id) AS '商品用户数',
    ROUND(COUNT(DISTINCT od.order_id) * 100.0 / NULLIF((
        SELECT COUNT(DISTINCT o2.order_id) 
        FROM tz_order o2
        WHERE o2.create_time >= ?
        AND o2.create_time < DATE_ADD(?, INTERVAL 1 DAY)
    ), 0), 2) AS '大类订单渗透率',
    ROUND(COUNT(DISTINCT o.user_id) * 100.0 / NULLIF((
        SELECT COUNT(DISTINCT o3.user_id)
        FROM tz_order o3
        WHERE o3.create_time >= ?
        AND o3.create_time < DATE_ADD(?, INTERVAL 1 DAY)
    ), 0), 2) AS '大类用户渗透率',
    ROUND(COUNT(DISTINCT od.order_id) * 100.0 / NULLIF((
        SELECT COUNT(DISTINCT o4.order_id)
        FROM tz_order o4
        WHERE o4.create_time >= ?
        AND o4.create_time < DATE_ADD(?, INTERVAL 1 DAY)
    ), 0), 2) AS '全局订单渗透率',
    ROUND(COUNT(DISTINCT o.user_id) * 100.0 / NULLIF((
        SELECT COUNT(DISTINCT o5.user_id)
        FROM tz_order o5
        WHERE o5.create_time >= ?
        AND o5.create_time < DATE_ADD(?, INTERVAL 1 DAY)
    ), 0), 2) AS '全局用户渗透率'
FROM
    tz_prod p
    LEFT JOIN tz_order_item od ON p.prod_id = od.prod_id
    LEFT JOIN tz_order o ON od.order_id = o.order_id
    LEFT JOIN tz_category pc ON p.category_id = pc.category_id
WHERE
    o.create_time >= ?
    AND o.create_time < DATE_ADD(?, INTERVAL 1 DAY)
    AND (? = '' OR p.bar_code LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR p.prod_code LIKE CONCAT('%', ?, '%'))
    AND (? = '' OR FIND_IN_SET(o.station_id, ?))
GROUP BY
    pc.category_code, pc.category_name, p.prod_code, p.bar_code, p.prod_name, p.specification
ORDER BY
    购买数量 DESC
LIMIT ? OFFSET ?;
