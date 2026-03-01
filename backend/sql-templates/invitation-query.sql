/* 社群拉新查询 SQL 模板 */
/* 查询社群拉新统计数据 */

/*+ QUERY_TIMEOUT(1000000000) */
SELECT
    i.id AS '记录ID',
    i.inviter_id AS '邀请人ID',
    i.inviter_mobile AS '邀请人手机号',
    i.invitee_id AS '被邀请人ID',
    i.invitee_mobile AS '被邀请人手机号',
    i.created_at AS '拉新时间',
    i.status AS '状态',
    i.reward_amount AS '奖励金额'
FROM
    jx_invitation i
WHERE
    i.created_at >= ?
    AND i.created_at < DATE_ADD(?, INTERVAL 1 DAY)
ORDER BY
    i.created_at DESC
LIMIT ? OFFSET ?;
