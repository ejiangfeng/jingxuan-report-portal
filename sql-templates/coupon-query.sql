/* 优惠券领用核销查询 SQL 模板 */

/*+ QUERY_TIMEOUT(1000000000) */
SELECT
    u.user_mobile AS '用户手机号',
    c.coupon_id AS '优惠券ID',
    c.coupon_name AS '优惠券名称',
    cu.receive_time AS '领券时间',
    cu.user_start_time AS '生效时间',
    cu.user_end_time AS '失效时间',
    CASE cu.status
        WHEN 0 THEN '已失效'
        WHEN 1 THEN '有效'
        WHEN 2 THEN '已使用'
        ELSE '未知'
    END AS '优惠券状态',
    cu.coupon_value AS '券面值'
FROM
    tz_coupon_user cu
    LEFT JOIN tz_user u ON cu.user_id = u.user_id
    LEFT JOIN tz_coupon c ON cu.coupon_id = c.coupon_id
WHERE
    1=1
    AND (? = '' OR cu.receive_time >= ?)
    AND (? = '' OR cu.receive_time < DATE_ADD(?, INTERVAL 1 DAY))
    AND (? = '' OR FIND_IN_SET(c.coupon_id, ?))
ORDER BY
    cu.receive_time DESC
LIMIT ? OFFSET ?;
