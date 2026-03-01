#!/bin/bash

# 鲸选自助报表平台启动脚本
# 同时启动前端和后端服务

set -e

echo "========================================="
echo "  鲸选自助报表平台启动脚本"
echo "========================================="
echo ""

# 启动后端服务
echo "🚀 启动后端服务..."
cd backend

# 复制环境配置文件（如果不存在）
if [ ! -f .env ]; then
    echo "📄 复制环境配置文件..."
    cp .env.example .env
fi

# 安装依赖（如果有package.json且node_modules不存在）
if [ -f package.json ] && [ ! -d node_modules ]; then
    echo "📦 安装后端依赖..."
    npm install || echo "警告：npm安装可能失败，请手动安装"
fi

echo "🔄 启动后端服务 (端口: 4000)..."
npm run dev &
BACKEND_PID=$!

echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 启动前端服务
echo ""
echo "🚀 启动前端服务..."
cd ../frontend

# 复制环境配置文件（如果不存在）
if [ ! -f .env ]; then
    echo "📄 复制环境配置文件..."
    cp .env.example .env
fi

# 安装依赖（如果有package.json且node_modules不存在）
if [ -f package.json ] && [ ! -d node_modules ]; then
    echo "📦 安装前端依赖..."
    npm install || echo "警告：npm安装可能失败，请手动安装"
fi

echo "🔄 启动前端服务 (端口: 3000)..."
npm run dev &
FRONTEND_PID=$!

echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"

echo ""
echo "========================================="
echo "  启动完成！"
echo "========================================="
echo ""
echo "🌐 前端访问: http://localhost:3000"
echo "🔗 后端API: http://localhost:4000"
echo "📚 API文档: http://localhost:4000/api-docs"
echo ""
echo "📝 按 Ctrl+C 停止所有服务"
echo ""

# 捕获Ctrl+C，优雅停止服务
trap 'echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID; wait; echo "服务已停止"; exit 0' INT TERM

# 等待前台进程
wait $FRONTEND_PID

# 如果前端停止，也停止后端
kill $BACKEND_PID
wait $BACKEND_PID