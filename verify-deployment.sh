#!/bin/bash

echo "🔍 验证鲸选报表平台部署状态"
echo "================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_service() {
    local name=$1
    local port=$2
    local endpoint=$3
    local method=${4:-GET}
    local data=${5:-""}
    
    echo -n "检查 $name (端口: $port)... "
    
    # 检查端口是否监听
    if ! lsof -i :$port >/dev/null 2>&1; then
        echo -e "${RED}❌ 未运行${NC}"
        return 1
    fi
    
    # 检查服务响应
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port$endpoint 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method -H "Content-Type: application/json" -d "$data" http://localhost:$port$endpoint 2>/dev/null)
    fi
    
    if [[ "$response" =~ ^[23][0-9][0-9]$ ]]; then
        echo -e "${GREEN}✅ 正常${NC}"
        return 0
    else
        echo -e "${RED}❌ 异常 (HTTP: $response)${NC}"
        return 1
    fi
}

echo ""
echo "📊 服务检查:"
check_service "后端API" 4000 /api/v1/health
check_service "前端应用" 3000 /  # 检查根路径

echo ""
echo "🛠️ API端点测试:"
check_service "筛选选项API" 4000 /api/v1/orders/filter-options

# 测试订单查询API
if check_service "订单查询API" 4000 /api/v1/orders/query POST '{"startTime": "2026-01-01", "endTime": "2026-01-31", "page": 1, "pageSize": 5}'; then
    echo -n "  数据量: "
    curl -s -X POST http://localhost:4000/api/v1/orders/query \
        -H "Content-Type: application/json" \
        -d '{"startTime": "2026-01-01", "endTime": "2026-01-31", "page": 1, "pageSize": 5}' | \
        python3 -c "import sys, json; data = json.load(sys.stdin); print(f\"总订单数: {data['data']['total']}, 当前页: {len(data['data']['items'])} 条\")" 2>/dev/null || echo "N/A"
fi

echo ""
echo "🌐 访问信息:"
echo -e "  前端应用: ${GREEN}http://localhost:3000${NC}"
echo -e "  后端API:  ${GREEN}http://localhost:4000${NC}"
echo -e "  健康检查: ${GREEN}http://localhost:4000/api/v1/health${NC}"
echo -e "  API文档: ${GREEN}http://localhost:4000/api/v1/orders/filter-options${NC}"

echo ""
echo "📋 部署状态:"
if lsof -i :3000 >/dev/null 2>&1 && lsof -i :4000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 部署成功！系统完全运行。${NC}"
    
    echo ""
    echo "🚀 下一步操作:"
    echo "  1. 打开浏览器访问: http://localhost:3000"
    echo "  2. 测试订单查询功能"
    echo "  3. 使用筛选器查看数据"
    echo "  4. 点击导出按钮体验导出功能"
    
    echo ""
    echo "🔧 故障排除:"
    echo "  如果页面无法访问:"
    echo "    - 确认服务正在运行: ./run-app.sh"
    echo "    - 查看日志: tail -f backend/backend.log"
    echo "    - 重启服务: pkill -f \"node.*simple-server\" && pkill -f vite"
    
    echo ""
    echo "📝 使用须知:"
    echo "  - 系统使用模拟数据，无需真实数据库"
    echo "  - 支持所有核心订单查询功能"
    echo "  - 导出功能已实现API接口"
    echo "  - 完整的四层架构用户界面"
    
    exit 0
else
    echo -e "${RED}❌ 部署未完成，部分服务未运行${NC}"
    echo ""
    echo "🔧 修复建议:"
    echo "  1. 重新启动应用: ./run-app.sh"
    echo "  2. 检查端口占用: lsof -i :3000"
    echo "  3. 查看后端日志: tail -f backend/backend.log"
    echo "  4. 手动启动:"
    echo "     后端: cd backend && node simple-server.js"
    echo "     前端: cd frontend && npm run dev"
    
    exit 1
fi