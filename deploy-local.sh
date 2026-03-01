#!/bin/bash

echo "========================================="
echo "  鲸选报表平台本地部署"
echo "========================================="
echo ""

# 检查端口占用情况
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        echo "⚠️  端口 $port 已被占用"
        lsof -i :$port | grep LISTEN
        echo ""
        return 1
    else
        echo "✅ 端口 $port 可用"
        return 0
    fi
}

echo "🔍 检查端口状态..."
check_port 4000 || echo "建议: 停止占用4000端口的进程 (lsof -i :4000 && kill <PID>)"
check_port 3001 || echo "前端将自动选择其他端口"

echo ""
echo "🚀 启动后端服务..."
cd backend

# 启动后端服务（后台运行）
echo "  正在启动后端 (端口: 4000)..."
if ! lsof -i :4000 >/dev/null 2>&1; then
    node simple-server.js > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "  ✅ 后端已启动 (PID: $BACKEND_PID)"
    echo "  📝 日志文件: backend/backend.log"
else
    echo "  ⏭️  后端服务已在运行"
    BACKEND_PID=$(lsof -ti :4000)
fi

# 等待后端启动
echo ""
echo "⏳ 等待后端服务启动..."
sleep 3

# 检查后端是否正常
if ! curl -s http://localhost:4000/api/v1/health >/dev/null 2>&1; then
    echo "❌ 后端服务启动失败，请检查日志"
    tail -20 backend/backend.log
    exit 1
fi

echo "✅ 后端服务运行正常"

echo ""
echo "🚀 启动前端服务..."
cd ../frontend

# 启动前端服务（后台运行）
echo "  正在启动前端 (可能端口: 3001)..."
if ! lsof -i :3000 >/dev/null 2>&1; then
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "  ✅ 前端已启动 (PID: $FRONTEND_PID)"
    echo "  📝 日志文件: frontend/frontend.log"
else
    echo "  ⏭️  前端服务已在运行"
    
    # 尝试找到运行的前端进程
    FRONTEND_PID=$(ps aux | grep -v grep | grep -E "vite|node.*dev" | head -1 | awk '{print $2}')
    if [ -z "$FRONTEND_PID" ]; then
        echo "  ⚠️  无法识别前端进程，将尝试启动..."
        npm run dev > frontend.log 2>&1 &
        FRONTEND_PID=$!
    fi
fi

# 等待前端启动
echo ""
echo "⏳ 等待前端服务启动..."
sleep 5

# 找到前端实际使用的端口
FRONTEND_PORT=$(grep -o "Local:.*http://localhost:[0-9]*" frontend/frontend.log 2>/dev/null | grep -o "[0-9]*" | tail -1)
if [ -z "$FRONTEND_PORT" ]; then
    FRONTEND_PORT=$(grep -o "port 3000 is in use, trying another one" frontend/frontend.log >/dev/null && echo "3001" || echo "3000")
fi

echo ""
echo "========================================="
echo "  🎉 部署完成！"
echo "========================================="
echo ""
echo "🌐 访问地址:"
echo "  前端应用: http://localhost:${FRONTEND_PORT:-3001}"
echo "  后端API: http://localhost:4000"
echo ""
echo "📊 健康检查:"
echo "  🔗 http://localhost:4000/api/v1/health"
echo ""
echo "🔧 功能测试:"
echo "  1. 打开浏览器访问前端页面"
echo "  2. 测试订单查询功能"
echo "  3. 使用筛选器查看数据"
echo "  4. 点击导出按钮测试导出"
echo ""
echo "📝 日志查看:"
echo "  后端日志: tail -f backend/backend.log"
echo "  前端日志: tail -f frontend/frontend.log"
echo ""
echo "🛑 停止服务:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "========================================="
echo ""
echo "💡 快速测试命令:"
echo "curl -s http://localhost:4000/api/v1/health | jq ."

# 保持脚本运行，监听Ctrl+C
trap 'echo ""; echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "服务已停止"; exit 0' INT TERM

echo ""
echo "📝 按 Ctrl+C 停止所有服务"
echo ""
wait