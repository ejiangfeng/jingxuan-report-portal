#!/bin/bash

echo "=== 停止鲸选报表平台系统 ==="

echo "1. 停止后端服务..."
BACKEND_PID=$(lsof -ti:4000)
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID
    echo "   ✅ 后端服务已停止 (PID: $BACKEND_PID)"
else
    echo "   ℹ️  后端服务未运行"
fi

echo "2. 停止前端服务..."
FRONTEND_PID=$(lsof -ti:3001)
if [ ! -z "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID
    echo "   ✅ 前端服务已停止 (PID: $FRONTEND_PID)"
else
    echo "   ℹ️  前端服务未运行"
fi

echo "3. 停止React开发服务器..."
VITE_PIDS=$(pgrep -f "vite")
if [ ! -z "$VITE_PIDS" ]; then
    kill $VITE_PIDS
    echo "   ✅ React开发服务器已停止"
else
    echo "   ℹ️  React开发服务器未运行"
fi

echo ""
echo "✅ 系统已完全停止"
echo ""
echo "重新启动: ./start-system.sh"
echo ""