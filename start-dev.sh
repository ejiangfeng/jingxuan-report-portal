#!/bin/bash

echo "========================================="
echo "  鲸选自助报表平台 - 开发环境"
echo "========================================="
echo ""

cd "$(dirname "$0")"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本：$(node -v)"
echo "✅ npm 版本：$(npm -v)"
echo ""

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend
    npm install
    cd ..
fi

# 启动后端服务
echo ""
echo "🚀 启动后端服务（端口 3000）..."
echo "   API 地址：http://localhost:3000"
echo "   健康检查：http://localhost:3000/api/v1/health"
echo ""

cd backend
node simple-server.js &
BACKEND_PID=$!
cd ..

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -s http://localhost:3000/api/v1/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "========================================="
echo "  开发环境启动完成！"
echo "========================================="
echo ""
echo "📱 访问地址:"
echo "   前端页面：http://localhost:8888"
echo "   后端 API: http://localhost:3000"
echo ""
echo "📋 操作说明:"
echo "   - 按 Ctrl+C 停止服务"
echo "   - 后端进程 PID: $BACKEND_PID"
echo ""
echo "🔧 开发提示:"
echo "   - 代码修改后需要重启服务"
echo "   - 查看日志：docker logs jingxuan-backend (生产环境)"
echo ""

# 等待用户中断
wait $BACKEND_PID
