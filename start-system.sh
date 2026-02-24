#!/bin/bash

# 鲸选报表平台启动脚本
echo "=== 启动鲸选自助报表平台 ==="

# 检查后端是否运行
echo "1. 检查后端服务..."
if curl -s http://localhost:4000/api/v1/health > /dev/null 2>&1; then
    echo "   ✅ 后端服务已在运行 (端口: 4000)"
else
    echo "   ⚠️  后端服务未运行，启动中..."
    kill $(lsof -ti:4000) 2>/dev/null
    cd backend
    node simple-server.js > ../backend.log 2>&1 &
    echo "   ⏳ 等待数据库连接（可能需要60秒）..."
    sleep 70
    if curl -s http://localhost:4000/api/v1/health > /dev/null 2>&1; then
        echo "   ✅ 后端服务启动成功"
        # 显示数据模式
        if grep -q "OceanBase真实数据" ../backend.log; then
            echo "   📊 数据模式: OceanBase真实数据"
        else
            echo "   📦 数据模式: 模拟数据"
        fi
    else
        echo "   ❌ 后端服务启动失败，请查看 backend.log"
    fi
    cd ..
fi

# 检查前端HTTP服务器是否运行
echo "2. 检查前端服务..."
if curl -s http://localhost:3001/simple-frontend.html > /dev/null 2>&1; then
    echo "   ✅ 前端服务已在运行 (端口: 3001)"
else
    echo "   ⚠️  前端服务未运行，启动简化HTML前端..."
    kill $(lsof -ti:3001) 2>/dev/null
    python3 -m http.server 3001 > simple-frontend.log 2>&1 &
    sleep 2
    if curl -s http://localhost:3001/simple-frontend.html > /dev/null 2>&1; then
        echo "   ✅ 前端服务启动成功"
    else
        echo "   ❌ 前端服务启动失败，请查看 simple-frontend.log"
    fi
fi

echo ""
echo "=== 系统状态 ==="
echo "🔧 后端API: http://localhost:4000"
echo "    健康检查: curl http://localhost:4000/api/v1/health"
echo "    筛选选项: curl http://localhost:4000/api/v1/orders/filter-options"
echo "    订单查询: curl http://localhost:4000/api/v1/orders/query"
echo ""
echo "🌐 前端界面: http://localhost:3001/simple-frontend.html"
echo "    请用浏览器打开以上链接访问订单查询系统"
echo ""
echo "📊 数据源: 检查 backend.log 确认数据模式"
echo ""
echo "📋 可用报表:"
echo "    1. 订单查询 - 多维度订单数据查询"
echo "    2. 商品渗透率 - 商品销售渗透分析"
echo "    3. 优惠券领用核销 - 优惠券使用记录查询"
echo "    4. 免运活动查询 - 免运费活动使用记录"
echo ""
echo "📂 日志文件:"
echo "    backend.log - 后端服务日志"
echo "    simple-frontend.log - 前端服务器日志"
echo ""
echo "🛑 停止系统: 运行 ./stop-system.sh"
echo "🔁 重启系统: 运行 ./start-system.sh"
echo ""