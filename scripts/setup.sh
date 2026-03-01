#!/bin/bash

# 鲸选报表平台 - 项目初始化脚本
# 此脚本用于快速搭建开发环境

set -e

echo "🚀 开始初始化鲸选报表平台开发环境..."

# 检查依赖
echo "📋 检查系统依赖..."
command -v docker >/dev/null 2>&1 || { echo "❌ 需要安装Docker"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ 需要安装Docker Compose"; exit 1; }

# 检查当前目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
cd "$PROJECT_ROOT"

echo "📁 项目根目录: $PROJECT_ROOT"

# 1. 创建.env文件（如果不存在）
if [ ! -f .env ]; then
    echo "📝 创建.env配置文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，配置数据库连接信息"
    read -p "是否现在编辑.env文件？ [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-vi} .env
    fi
else
    echo "✅ .env文件已存在"
fi

# 2. 创建必要的目录
echo "📁 创建项目目录结构..."
mkdir -p exports logs

# 3. 安装依赖（如果需要的话）
if [ -f "backend/package.json" ]; then
    echo "📦 检查后端依赖..."
    if [ ! -d "backend/node_modules" ]; then
        echo "🔧 安装后端依赖..."
        cd backend && npm ci --silent
        cd "$PROJECT_ROOT"
    else
        echo "✅ 后端依赖已安装"
    fi
fi

if [ -f "frontend/package.json" ]; then
    echo "📦 检查前端依赖..."
    if [ ! -d "frontend/node_modules" ]; then
        echo "🔧 安装前端依赖..."
        cd frontend && npm ci --silent
        cd "$PROJECT_ROOT"
    else
        echo "✅ 前端依赖已安装"
    fi
fi

# 4. 启动Docker开发环境
echo "🐳 启动Docker开发环境..."
docker-compose build --quiet

echo "🚀 启动服务容器..."
docker-compose up -d

# 5. 等待服务启动
echo "⏳ 等待服务启动（预计30秒）..."
sleep 5

# 检查服务状态
echo "📡 检查服务状态..."
MAX_WAIT=30
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    # 检查后端健康状态
    if curl -s -f http://localhost:4000/health > /dev/null 2>&1; then
        echo "✅ 后端服务已启动"
        break
    fi
    
    echo -n "."
    sleep 1
    ((WAITED++))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "❌ 服务启动超时，请检查日志："
    echo "docker-compose logs backend"
    exit 1
fi

# 6. 输出访问信息
echo ""
echo "🎉 开发环境初始化完成！"
echo "========================================"
echo "🌐 访问地址:"
echo "   前端开发服务器: http://localhost:3000"
echo "   后端API服务: http://localhost:4000"
echo "   API文档: http://localhost:4000"
echo ""
echo "🔧 常用命令:"
echo "   启动服务: docker-compose up -d"
echo "   停止服务: docker-compose down"
echo "   查看日志: docker-compose logs -f"
echo "   查看状态: docker-compose ps"
echo ""
echo "📊 数据库管理:"
echo "   地址: localhost:3307"
echo "   数据库: jingxuan_test"
echo "   用户: dev_user"
echo "   密码: dev_password"
echo ""
echo "📂 项目结构:"
echo "   前端代码: frontend/src/"
echo "   后端代码: backend/src/"
echo "   SQL模板: sql-templates/"
echo "========================================"

echo ""
echo "🚪 现在您可以开始开发了！"
echo ""
echo "如果需要生成测试数据，请执行:"
echo "  docker-compose exec database mysql -u dev_user -pdev_password jingxuan_test -e \"CALL generate_test_orders();\""
echo ""
echo "查看详细文档请阅读 README.md"

# 7. 打开浏览器（可选）
read -p "🚀 是否现在打开浏览器访问应用？ [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    case "$(uname -s)" in
        Darwin)
            open "http://localhost:3000"
            ;;
        Linux)
            xdg-open "http://localhost:3000" 2>/dev/null || \
            sensible-browser "http://localhost:3000" 2>/dev/null
            ;;
        CYGWIN*|MINGW*|MSYS*)
            start "http://localhost:3000"
            ;;
        *)
            echo "请手动打开: http://localhost:3000"
            ;;
    esac
fi