-- 鲸选报表平台 - 开发环境数据库初始化脚本
-- 此脚本仅用于开发和测试环境，用于模拟OceanBase的表结构

-- 创建测试数据库
CREATE DATABASE IF NOT EXISTS `jingxuan_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `jingxuan_test`;

-- 1. 门店表
CREATE TABLE IF NOT EXISTS `tz_station` (
  `station_id` bigint NOT NULL,
  `station_name` varchar(100) DEFAULT NULL COMMENT '门店名称',
  `out_code` varchar(20) DEFAULT NULL COMMENT '门店外部编码',
  `province` varchar(50) DEFAULT NULL COMMENT '省份',
  `city` varchar(50) DEFAULT NULL COMMENT '城市',
  `area` varchar(50) DEFAULT NULL COMMENT '区域',
  `province_id` int DEFAULT NULL,
  PRIMARY KEY (`station_id`),
  KEY `idx_out_code` (`out_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 用户表
CREATE TABLE IF NOT EXISTS `tz_user` (
  `user_id` bigint NOT NULL,
  `user_mobile` varchar(20) DEFAULT NULL COMMENT '手机号',
  `user_regtime` datetime DEFAULT NULL COMMENT '注册时间',
  PRIMARY KEY (`user_id`),
  KEY `idx_user_mobile` (`user_mobile`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 订单表（核心表）
CREATE TABLE IF NOT EXISTS `tz_order` (
  `order_number` bigint NOT NULL COMMENT '订单号',
  `user_id` bigint DEFAULT NULL COMMENT '用户ID',
  `station_id` bigint DEFAULT NULL COMMENT '门店ID',
  `social_type` tinyint DEFAULT NULL COMMENT '来源渠道',
  `order_type` tinyint DEFAULT NULL COMMENT '订单类型',
  `status` tinyint DEFAULT NULL COMMENT '订单状态',
  `dvy_type` tinyint DEFAULT NULL COMMENT '配送方式',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `is_payed` tinyint(1) DEFAULT '0' COMMENT '是否支付',
  `total` decimal(20,2) DEFAULT '0.00' COMMENT '商品总金额',
  `reduce_amount` decimal(20,2) DEFAULT '0.00' COMMENT '优惠总金额',
  `actual_total` decimal(20,2) DEFAULT '0.00' COMMENT '客户实付金额',
  `freight_amount` decimal(20,2) DEFAULT '0.00' COMMENT '原应付运费金额',
  `platform_free_freight_amount` decimal(20,2) DEFAULT '0.00' COMMENT '运费活动优惠金额',
  `packing` decimal(20,2) DEFAULT '0.00' COMMENT '包装费',
  `receiver_name` varchar(50) DEFAULT NULL COMMENT '收货人姓名',
  `receiver_mobile` varchar(20) DEFAULT NULL COMMENT '收货人手机号',
  `addr_order_id` bigint DEFAULT NULL COMMENT '地址ID',
  `remarks` varchar(500) DEFAULT NULL COMMENT '客户备注',
  PRIMARY KEY (`order_number`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_station_id` (`station_id`),
  KEY `idx_is_payed` (`is_payed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 订单商品表
CREATE TABLE IF NOT EXISTS `tz_order_item` (
  `order_number` bigint NOT NULL,
  `sku_id` bigint NOT NULL,
  `prod_count` int DEFAULT '1' COMMENT '商品数量',
  PRIMARY KEY (`order_number`, `sku_id`),
  KEY `idx_order_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 用户地址订单表
CREATE TABLE IF NOT EXISTS `tz_user_addr_order` (
  `addr_order_id` bigint NOT NULL,
  `order_number` bigint DEFAULT NULL,
  `province` varchar(50) DEFAULT NULL,
  `city` varchar(50) DEFAULT NULL,
  `area` varchar(50) DEFAULT NULL,
  `addr` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`addr_order_id`),
  KEY `idx_order_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 优惠券使用记录表
CREATE TABLE IF NOT EXISTS `tz_coupon_use_record` (
  `order_number` bigint NOT NULL,
  `coupon_user_id` bigint DEFAULT NULL,
  PRIMARY KEY (`order_number`),
  KEY `idx_order_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 用户优惠券表
CREATE TABLE IF NOT EXISTS `tz_coupon_user` (
  `coupon_user_id` bigint NOT NULL,
  `coupon_id` bigint DEFAULT NULL,
  PRIMARY KEY (`coupon_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 优惠券表
CREATE TABLE IF NOT EXISTS `tz_coupon` (
  `coupon_id` bigint NOT NULL,
  `coupon_name` varchar(100) DEFAULT NULL COMMENT '优惠券名称',
  `cash_condition` varchar(200) DEFAULT NULL COMMENT '使用条件',
  `reduce_amount` decimal(20,2) DEFAULT '0.00' COMMENT '减免金额',
  PRIMARY KEY (`coupon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. 支付信息表
CREATE TABLE IF NOT EXISTS `tz_pay_info` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_numbers` varchar(100) DEFAULT NULL COMMENT '订单号',
  `pay_lh_type` varchar(10) DEFAULT NULL COMMENT '支付类型',
  `pay_lh_actual_amount` decimal(20,2) DEFAULT '0.00' COMMENT '实际支付金额',
  `pay_no` varchar(100) DEFAULT NULL COMMENT '支付流水号',
  `biz_pay_no` varchar(100) DEFAULT NULL COMMENT '外部支付流水号',
  `pay_status` tinyint DEFAULT '0' COMMENT '支付状态',
  PRIMARY KEY (`id`),
  KEY `idx_order_numbers` (`order_numbers`),
  KEY `idx_pay_lh_type` (`pay_lh_type`),
  KEY `idx_pay_status` (`pay_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入测试数据（可选，用于开发测试）
INSERT IGNORE INTO `tz_station` (`station_id`, `station_name`, `out_code`, `province`, `city`) VALUES
(1, '北京朝阳门店', '1101', '北京市', '北京市'),
(2, '上海浦东门店', '2001', '上海市', '上海市'),
(3, '深圳南山门店', '3101', '广东省', '深圳市');

INSERT IGNORE INTO `tz_user` (`user_id`, `user_mobile`, `user_regtime`) VALUES
(1, '13800138000', '2024-01-01 10:00:00'),
(2, '13800138001', '2024-01-02 11:00:00'),
(3, '13800138002', '2024-01-03 12:00:00');

-- 创建测试数据的存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_test_orders()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE max_orders INT DEFAULT 1000; -- 生成1000条测试订单
    
    WHILE i <= max_orders DO
        INSERT IGNORE INTO `tz_order` (
            `order_number`, `user_id`, `station_id`, `social_type`, `order_type`, 
            `status`, `dvy_type`, `create_time`, `is_payed`, `total`, 
            `reduce_amount`, `actual_total`, `freight_amount`, `platform_free_freight_amount`, `packing`,
            `receiver_name`, `receiver_mobile`, `addr_order_id`
        ) VALUES (
            1000000000 + i,
            (i % 3) + 1, -- 用户ID在1-3之间
            (i % 3) + 1, -- 门店ID在1-3之间
            (i % 12) + 1, -- 渠道类型
            i % 4, -- 订单类型
            CASE WHEN i % 20 = 0 THEN 1          -- 待付款
                 WHEN i % 20 = 1 THEN 2          -- 待发货
                 WHEN i % 20 = 10 THEN 5         -- 交易成功
                 ELSE 5                          -- 默认交易成功
            END,
            CASE WHEN i % 10 = 0 THEN 2 ELSE 1 END, -- 配送方式（大多数为快递，少数为自提）
            DATE_ADD('2026-01-01 00:00:00', INTERVAL i * 10 MINUTE),
            1, -- 已支付
            ROUND(RAND() * 1000 + 100, 2), -- 商品总金额
            ROUND(RAND() * 50, 2), -- 优惠金额
            ROUND(RAND() * 1000 + 50, 2), -- 实付金额
            ROUND(RAND() * 30, 2), -- 运费
            ROUND(RAND() * 20, 2), -- 运费优惠
            ROUND(RAND() * 10, 2), -- 包装费
            CONCAT('用户', i),
            CONCAT('138', LPAD(i % 100000000, 8, '0')),
            i
        );
        
        INSERT IGNORE INTO `tz_order_item` (`order_number`, `sku_id`, `prod_count`) VALUES
        (1000000000 + i, 1000 + i, (i % 10) + 1);
        
        INSERT IGNORE INTO `tz_user_addr_order` (`addr_order_id`, `order_number`, `province`, `city`, `area`, `addr`) VALUES
        (i, 1000000000 + i, '北京市', '北京市', '朝阳区', CONCAT('测试地址', i));
        
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- 为已有管理员用户授予权限
GRANT ALL PRIVILEGES ON `jingxuan_test`.* TO 'dev_user'@'%' IDENTIFIED BY 'dev_password';
GRANT EXECUTE ON PROCEDURE `jingxuan_test`.generate_test_orders TO 'dev_user'@'%';

FLUSH PRIVILEGES;

-- 执行生成测试数据的存储过程
-- CALL generate_test_orders(); -- 开发环境中根据需要手动调用