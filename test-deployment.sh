#!/bin/bash

echo "========================================="
echo "  鲸选报表平台部署测试"
echo "========================================="
echo ""

echo "🔍 测试后端API..."
echo ""

# 测试健康检查
echo "1. 测试健康检查端点:"
curl -s http://localhost:4000/api/v1/health | jq . || echo "请确保后端服务正在运行：node simple-server.js"

echo ""
echo "2. 测试筛选选项API:"
curl -s http://localhost:4000/api/v1/orders/filter-options | jq '.success'

echo ""
echo "3. 测试订单查询API:"
curl -s -X POST http://localhost:4000/api/v1/orders/query \
  -H "Content-Type: application/json" \
  -d '{"startTime": "2026-01-01", "endTime": "2026-01-31", "page": 1, "pageSize": 10}' | jq '.success'

echo ""
echo "========================================="
echo "📊 前端访问信息"
echo "========================================="
echo ""
echo "🌐 前端应用: http://localhost:3001"
echo "🔗 后端API: http://localhost:4000"
echo ""
echo "🛠️ 启动命令:"
echo "后端: cd backend && node simple-server.js"
echo "前端: cd frontend && npm run dev"
echo ""
echo "✅ 部署完成！"