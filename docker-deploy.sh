#!/bin/bash

# 鲸选自助报表平台 - Docker部署脚本

echo "=========================================="
echo "  鲸选自助报表平台 - Docker部署"
echo "=========================================="
echo ""

# 进入项目目录
cd "$(dirname "$0")"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

echo "✅ Docker环境检查通过"
echo ""

# 停止并删除旧容器
echo "🛑 停止旧容器..."
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true
echo ""

# 构建镜像
echo "📦 构建Docker镜像..."
docker-compose -f docker-compose.simple.yml build --no-cache
if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi
echo "✅ 镜像构建完成"
echo ""

# 启动容器
echo "🚀 启动容器..."
docker-compose -f docker-compose.simple.yml up -d
if [ $? -ne 0 ]; then
    echo "❌ 启动失败"
    exit 1
fi
echo ""

echo "⏳ 等待后端服务启动（OceanBase连接需要约70秒）..."
echo ""

# 等待后端健康检查通过
MAX_WAIT=120
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -s http://localhost:4000/api/v1/health > /dev/null 2>&1; then
        echo "✅ 后端服务已就绪"
        break
    fi
    sleep 5
    WAITED=$((WAITED + 5))
    echo "   等待中... ${WAITED}秒"
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠️  后端服务启动超时，请检查日志: docker-compose -f docker-compose.simple.yml logs backend"
fi

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "📋 访问地址:"
echo "   前端页面: http://localhost:7788/simple-frontend.html"
echo "   后端API:  http://localhost:4000/api/v1/health"
echo ""
echo "📋 局域网访问:"
echo "   前端页面: http://$(hostname).local:7788/simple-frontend.html"
echo ""
echo "📝 常用命令:"
echo "   查看日志:   docker-compose -f docker-compose.simple.yml logs -f"
echo "   停止服务:   docker-compose -f docker-compose.simple.yml down"
echo "   重启服务:   docker-compose -f docker-compose.simple.yml restart"
echo ""
