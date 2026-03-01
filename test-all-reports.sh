#!/bin/bash

echo "
========================================
🧪 鲸选自助报表平台 - 全功能测试脚本
========================================
测试时间：$(date)
测试环境：开发环境 (http://localhost:7789)
数据范围：1 天 (减少数据库压力)
========================================
"

API_BASE="http://localhost:4000/api/v1"
TEST_DATE="2026-02-26"
PASS_COUNT=0
FAIL_COUNT=0

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_api() {
    local name=$1
    local endpoint=$2
    local method=$3
    local data=$4
    
    echo -e "\n${YELLOW}[测试]${NC} $name"
    
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
        -H "Content-Type: application/json" \
        -d "$data" \
        "${API_BASE}${endpoint}")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "202" ]; then
        success=$(echo "$body" | grep -o '"success":true' | head -1)
        if [ ! -z "$success" ]; then
            echo -e "${GREEN}✅ 通过${NC} - HTTP $http_code"
            PASS_COUNT=$((PASS_COUNT + 1))
            return 0
        else
            echo -e "${RED}❌ 失败${NC} - API 返回错误"
            echo "响应：$body"
            FAIL_COUNT=$((FAIL_COUNT + 1))
            return 1
        fi
    else
        echo -e "${RED}❌ 失败${NC} - HTTP $http_code"
        FAIL_COUNT=$((FAIL_COUNT + 1))
        return 1
    fi
}

echo "
========================================
📋 1. 订单查询报表测试
========================================
"

# 订单查询 - 基础查询
test_api "订单查询 - 基础查询" \
    "/orders/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"page\":1,\"pageSize\":20}"

# 订单查询 - 按状态筛选
test_api "订单查询 - 按状态筛选" \
    "/orders/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"status\":\"交易成功\",\"page\":1,\"pageSize\":20}"

# 订单查询 - 按门店筛选
test_api "订单查询 - 按门店筛选" \
    "/orders/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"stationCodes\":\"2625\",\"page\":1,\"pageSize\":20}"

# 订单查询 - 按订单号筛选
test_api "订单查询 - 按订单号筛选" \
    "/orders/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"orderNumber\":\"ORD\",\"page\":1,\"pageSize\":20}"

# 订单导出
test_api "订单查询 - 导出功能" \
    "/orders/export" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"exportType\":\"order\"}"

echo "
========================================
📊 2. 商品渗透率报表测试
========================================
"

# 商品渗透率 - 基础查询
test_api "商品渗透率 - 基础查询" \
    "/reports/penetration/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"page\":1,\"pageSize\":20}"

# 商品渗透率 - 按门店筛选
test_api "商品渗透率 - 按门店筛选" \
    "/reports/penetration/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"stationCodes\":\"2625,1405\",\"page\":1,\"pageSize\":20}"

# 商品渗透率 - 按商品条码筛选
test_api "商品渗透率 - 按商品条码筛选" \
    "/reports/penetration/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"barCode\":\"69\",\"page\":1,\"pageSize\":20}"

# 商品渗透率 - 按商品编码筛选
test_api "商品渗透率 - 按商品编码筛选" \
    "/reports/penetration/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"partyCode\":\"\",\"page\":1,\"pageSize\":20}"

# 商品渗透率 - 导出
test_api "商品渗透率 - 导出功能" \
    "/reports/penetration/export" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"stationCodes\":\"\"}"

echo "
========================================
🔍 3. 搜索关键词查询测试
========================================
"

# 搜索关键词 - 基础查询
test_api "搜索关键词 - 基础查询" \
    "/reports/search-keyword/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"page\":1,\"pageSize\":20}"

# 搜索关键词 - 按关键词筛选
test_api "搜索关键词 - 按关键词筛选" \
    "/reports/search-keyword/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"keywords\":\"牛奶，鸡蛋\",\"page\":1,\"pageSize\":20}"

# 搜索关键词 - 导出
test_api "搜索关键词 - 导出功能" \
    "/reports/search-keyword/export" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"keywords\":\"\"}"

echo "
========================================
🎫 4. 优惠券领用核销测试
========================================
"

# 优惠券 - 按领用日期查询
test_api "优惠券 - 按领用日期查询" \
    "/reports/coupon/query" \
    "POST" \
    "{\"receiveStartTime\":\"$TEST_DATE\",\"receiveEndTime\":\"$TEST_DATE\",\"page\":1,\"pageSize\":20}"

# 优惠券 - 按核销日期查询
test_api "优惠券 - 按核销日期查询" \
    "/reports/coupon/query" \
    "POST" \
    "{\"useStartTime\":\"$TEST_DATE\",\"useEndTime\":\"$TEST_DATE\",\"page\":1,\"pageSize\":20}"

# 优惠券 - 按优惠券 ID 筛选
test_api "优惠券 - 按优惠券 ID 筛选" \
    "/reports/coupon/query" \
    "POST" \
    "{\"receiveStartTime\":\"$TEST_DATE\",\"receiveEndTime\":\"$TEST_DATE\",\"couponIds\":\"\",\"page\":1,\"pageSize\":20}"

# 优惠券 - 导出
test_api "优惠券 - 导出功能" \
    "/reports/coupon/export" \
    "POST" \
    "{\"receiveStartTime\":\"$TEST_DATE\",\"receiveEndTime\":\"$TEST_DATE\"}"

echo "
========================================
🚚 5. 免运活动查询测试
========================================
"

# 免运活动 - 基础查询
test_api "免运活动 - 基础查询" \
    "/reports/freight-activity" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"page\":1,\"pageSize\":20}"

# 免运活动 - 导出
test_api "免运活动 - 导出功能" \
    "/reports/freight/export" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\"}"

echo "
========================================
👥 6. 社群拉新测试
========================================
"

# 社群拉新 - 基础查询
test_api "社群拉新 - 基础查询" \
    "/reports/invitation/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"page\":1,\"pageSize\":20}"

# 社群拉新 - 导出
test_api "社群拉新 - 导出功能" \
    "/reports/invitation/export" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\"}"

echo "
========================================
🛒 7. 商城用户下单测试
========================================
"

# 商城用户 - 基础查询
test_api "商城用户 - 基础查询" \
    "/reports/mall-user/query" \
    "POST" \
    "{\"date\":\"$TEST_DATE\",\"mobile\":\"\",\"page\":1,\"pageSize\":20}"

# 商城用户 - 按手机号筛选
test_api "商城用户 - 按手机号筛选" \
    "/reports/mall-user/query" \
    "POST" \
    "{\"date\":\"$TEST_DATE\",\"mobile\":\"138\",\"page\":1,\"pageSize\":20}"

# 商城用户 - 导出
test_api "商城用户 - 导出功能" \
    "/reports/mall-user/export" \
    "POST" \
    "{\"date\":\"$TEST_DATE\",\"mobile\":\"\"}"

echo "
========================================
🤝 8. 助力活动查询测试
========================================
"

# 助力活动 - 基础查询
test_api "助力活动 - 基础查询" \
    "/reports/support/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"page\":1,\"pageSize\":20}"

# 助力活动 - 按活动 ID 筛选
test_api "助力活动 - 按活动 ID 筛选" \
    "/reports/support/query" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"activityId\":\"\",\"page\":1,\"pageSize\":20}"

# 助力活动 - 导出
test_api "助力活动 - 导出功能" \
    "/reports/support/export" \
    "POST" \
    "{\"startTime\":\"$TEST_DATE\",\"endTime\":\"$TEST_DATE\",\"activityId\":\"\"}"

echo "
========================================
📊 测试结果汇总
========================================
"
echo -e "✅ 通过：${GREEN}$PASS_COUNT${NC}"
echo -e "❌ 失败：${RED}$FAIL_COUNT${NC}"
echo "总计：$((PASS_COUNT + FAIL_COUNT)) 个测试"
echo "========================================

"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAIL_COUNT 个测试失败，请检查日志${NC}"
    exit 1
fi
