/* 助力活动查询 SQL 模板 */
/* 支持按活动 ID 和日期范围筛选 */

/*+ QUERY_TIMEOUT(1000000000) */
SELECT
    tu.user_mobile AS '用户手机号',
    sa.create_time AS '助力时间',
    sa.activity_id AS '活动 ID',
    sa.activity_name AS '活动名称',
    CASE sa.status
        WHEN 0 THEN '待助力'
        WHEN 1 THEN '助力成功'
        WHEN 2 THEN '助力失败'
        WHEN 3 THEN '已过期'
        ELSE '未知'
    END AS '助力状态',
    sa.reward_amount AS '奖励金额',
    sa.reward_type AS '奖励类型',
    sa.helped_user_mobile AS '被助力用户'
FROM
    tz_support_activity sa
    LEFT JOIN tz_user tu ON sa.user_id = tu.user_id
WHERE
    sa.create_time >= ?
    AND sa.create_time < DATE_ADD(?, INTERVAL 1 DAY)
    AND (? = '' OR sa.activity_id = ?)
ORDER BY
    sa.create_time DESC
LIMIT ? OFFSET ?;
