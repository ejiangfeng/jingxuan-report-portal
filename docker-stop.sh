#!/bin/bash

# 鲸选自助报表平台 - Docker停止脚本

echo "=========================================="
echo "  鲸选自助报表平台 - 停止Docker服务"
echo "=========================================="
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 停止容器
echo "🛑 停止Docker容器..."
docker-compose -f docker-compose.simple.yml down

echo ""
echo "✅ 服务已停止"
echo ""
echo "如需重新启动，请运行: ./docker-deploy.sh"
echo ""
