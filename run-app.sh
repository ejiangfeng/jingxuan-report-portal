#!/bin/bash

echo "🐋 启动鲸选报表平台"
echo "======================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 停止之前的进程
echo -e "${YELLOW}🛑 停止现有服务...${NC}"
pkill -f "node.*simple-server" 2>/dev/null
pkill -f "vite" 2>/dev/null

# 清理端口占用
echo -e "${YELLOW}🧹 清理端口...${NC}"
for port in 4000 3000 3001; do
    pid=$(lsof -ti :$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "  端口 $port 被占用，清理中..."
        kill -9 $pid 2>/dev/null
    fi
done
sleep 2

# 启动后端服务
echo -e "${BLUE}🚀 启动后端服务 (端口: 4000)...${NC}"
cd backend
node simple-server.js &
BACKEND_PID=$!
echo -e "  ${GREEN}✅ 后端启动完成 (PID: $BACKEND_PID)${NC}"

# 等待后端启动
echo -e "${YELLOW}⏳ 等待后端服务就绪...${NC}"
sleep 5

# 测试后端
echo -e "${BLUE}🔍 测试后端连接...${NC}"
if curl -s http://localhost:4000/api/v1/health >/dev/null 2>&1; then
    echo -e "  ${GREEN}✅ 后端服务运行正常${NC}"
else
    echo -e "  ${RED}❌ 后端服务启动失败${NC}"
    echo -e "  正在查看错误日志..."
    pkill -f "node.*simple-server"
    exit 1
fi

# 启动前端服务
echo -e "${BLUE}🚀 启动前端服务 (端口: 3000或3001)...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo -e "  ${GREEN}✅ 前端启动完成 (PID: $FRONTEND_PID)${NC}"

# 等待前端启动
echo -e "${YELLOW}⏳ 等待前端服务就绪 (约10秒)...${NC}"
sleep 10

# 找到前端端口
FRONTEND_PORT=""
for i in {1..10}; do
    if lsof -i :3000 >/dev/null 2>&1; then
        FRONTEND_PORT=3000
        break
    elif lsof -i :3001 >/dev/null 2>&1; then
        FRONTEND_PORT=3001
        break
    fi
    sleep 1
done

if [ -z "$FRONTEND_PORT" ]; then
    # 尝试从日志中找端口
    if [ -f frontend.log ]; then
        FRONTEND_PORT=$(grep -o "Local:.*http://localhost:[0-9]*" frontend.log 2>/dev/null | grep -o "[0-9]*" | tail -1)
    fi
    FRONTEND_PORT=${FRONTEND_PORT:-3000}
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}        🎉 部署成功！${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo -e "${BLUE}🌐 访问地址:${NC}"
echo -e "  前端应用: ${GREEN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "  后端API:  ${GREEN}http://localhost:4000${NC}"
echo ""
echo -e "${BLUE}📊 功能测试:${NC}"
echo "  1. 打开浏览器访问: http://localhost:${FRONTEND_PORT}"
echo "  2. 测试订单查询功能"
echo "  3. 使用各种筛选器"
echo "  4. 点击导出按钮"
echo ""
echo -e "${BLUE}📝 快速验证:${NC}"
echo "  curl http://localhost:4000/api/v1/health"
echo "  curl http://localhost:4000/api/v1/orders/filter-options"
echo ""
echo -e "${RED}🛑 停止服务:${NC}"
echo "  pkill -f \"node.*simple-server\""
echo "  pkill -f vite"
echo ""
echo -e "${YELLOW}💡 提示: 请保持此终端窗口打开${NC}"
echo -e "按 Ctrl+C 停止所有服务"
echo ""

# 显示服务信息
echo "服务状态:"
echo -e "  后端: ${GREEN}运行中${NC} (PID: $BACKEND_PID, 端口: 4000)"
echo -e "  前端: ${GREEN}运行中${NC} (PID: $FRONTEND_PID, 端口: $FRONTEND_PORT)"
echo ""

# 保持脚本运行
trap 'echo ""; echo -e "${YELLOW}正在停止服务...${NC}"; pkill -f "node.*simple-server" 2>/dev/null; pkill -f vite 2>/dev/null; echo -e "${GREEN}服务已停止${NC}"; exit 0' INT TERM
wait