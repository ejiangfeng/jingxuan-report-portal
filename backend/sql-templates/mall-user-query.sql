/* 商城用户查询 SQL 模板 */
/* 查询商城用户数据 */

/*+ QUERY_TIMEOUT(1000000000) */
SELECT
    u.id AS '用户ID',
    u.mobile AS '手机号',
    u.nickname AS '昵称',
    u.register_time AS '注册时间',
    u.last_login_time AS '最后登录时间',
    u.total_orders AS '总订单数',
    u.total_amount AS '总消费金额'
FROM
    jx_mall_user u
WHERE
    DATE(u.register_time) = ?
    AND (? = '' OR u.mobile LIKE CONCAT('%', ?, '%'))
ORDER BY
    u.register_time DESC
LIMIT ? OFFSET ?;
