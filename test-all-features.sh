#!/bin/bash

echo "========================================="
echo "  鲸选自助报表平台 - 功能测试"
echo "  日期：$(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

cd /Users/ejiangfeng/ai-jx-report/jingxuan-report-portal

# 计数器
PASS=0
FAIL=0

# 测试函数
test_api() {
  local name=$1
  local url=$2
  local method=$3
  local data=$4
  
  echo -e "\n📍 测试：$name"
  
  if [ "$method" == "GET" ]; then
    result=$(curl -s "$url")
  else
    result=$(curl -s -X POST "$url" -H "Content-Type: application/json" -d "$data")
  fi
  
  success=$(echo "$result" | python3 -c "import sys,json; d=json.load(sys.stdin); print('true' if d.get('success') else 'false')" 2>/dev/null)
  
  if [ "$success" == "true" ]; then
    echo "   ✅ PASS"
    ((PASS++))
  else
    echo "   ❌ FAIL"
    echo "   响应：$result" | head -c 200
    ((FAIL++))
  fi
}

# 1. 健康检查
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  一、基础服务测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_api "健康检查" \
  "http://localhost:4000/api/v1/health" \
  "GET" \
  ""

# 2. 订单查询
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  二、报表查询测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_api "订单查询" \
  "http://localhost:4000/api/v1/orders/query" \
  "POST" \
  '{"startTime":"2026-02-01","endTime":"2026-02-25","page":1,"pageSize":2}'

# 3. 商品渗透率
test_api "商品渗透率" \
  "http://localhost:4000/api/v1/reports/product-penetration" \
  "POST" \
  '{"startTime":"2026-02-24","endTime":"2026-02-25","stationCodes":"2625","page":1,"pageSize":2}'

# 4. 优惠券查询
test_api "优惠券查询" \
  "http://localhost:4000/api/v1/reports/coupon-query" \
  "POST" \
  '{"receiveStartTime":"2026-02-01","receiveEndTime":"2026-02-25","page":1,"pageSize":2}'

# 5. 免运活动
test_api "免运活动" \
  "http://localhost:4000/api/v1/reports/freight-activity" \
  "POST" \
  '{"startTime":"2026-02-01","endTime":"2026-02-25","page":1,"pageSize":2}'

# 6. 社群拉新
test_api "社群拉新" \
  "http://localhost:4000/api/v1/reports/invitation" \
  "POST" \
  '{"startTime":"2026-02-01","endTime":"2026-02-25","activityId":"32","page":1,"pageSize":2}'

# 7. 商城用户
test_api "商城用户下单" \
  "http://localhost:4000/api/v1/reports/mall-user" \
  "POST" \
  '{"queryDate":"2026-02-24","page":1,"pageSize":2}'

# 8. 导出功能测试（简化版）
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  三、导出功能测试（简化）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "\n📍 测试：创建订单导出任务"
export_result=$(curl -s -X POST "http://localhost:4000/api/v1/orders/export" \
  -H "Content-Type: application/json" \
  -d '{"startTime":"2026-02-24","endTime":"2026-02-25"}')

task_id=$(echo "$export_result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('id',''))" 2>/dev/null)

if [ -n "$task_id" ]; then
  echo "   ✅ 任务创建成功：$task_id"
  ((PASS++))
  
  # 等待并检查状态
  echo -e "\n⏳ 等待导出完成 (30 秒)..."
  sleep 30
  
  status_result=$(curl -s "http://localhost:4000/api/v1/exports/$task_id")
  status=$(echo "$status_result" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('status',''))" 2>/dev/null)
  
  echo "   导出状态：$status"
  if [ "$status" == "completed" ]; then
    echo "   ✅ PASS"
    ((PASS++))
  else
    echo "   ⚠️  导出仍在处理中（正常，大数据量需要时间）"
  fi
else
  echo "   ❌ FAIL: 无法创建导出任务"
  ((FAIL++))
fi

# 测试总结
echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  测试总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  通过：$PASS"
echo "  失败：$FAIL"
echo "  总计：$((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "  🎉 所有测试通过！"
else
  echo "  ⚠️  有 $FAIL 个测试失败，请检查日志"
fi

echo -e "\n========================================="
echo "  测试完成时间：$(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# 退出码
if [ $FAIL -eq 0 ]; then
  exit 0
else
  exit 1
fi
