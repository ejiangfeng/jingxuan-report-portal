# 鲸选自助报表平台 - 运行指南

## 🚀 快速启动（推荐）

### 使用启动脚本（最简单）
```bash
# 1. 进入项目目录
cd /Users/ejiangfeng/鲸选部门数据查询需求/jingxuan-report-portal

# 2. 运行启动脚本
./start.sh
```

启动脚本会自动：
- 复制环境配置文件（如果不存在）
- 安装依赖
- 同时启动前后端服务
- 提供访问地址

### 预期输出
```
=========================================
  鲸选自助报表平台启动脚本
=========================================

🚀 启动后端服务...
🔄 启动后端服务 (端口: 4000)...
✅ 后端服务已启动 (PID: XXXXX)

🚀 启动前端服务...
🔄 启动前端服务 (端口: 3000)...
✅ 前端服务已启动 (PID: XXXXX)

=========================================
  启动完成！
=========================================

🌐 前端访问: http://localhost:3000
🔗 后端API: http://localhost:4000
📚 API文档: http://localhost:4000/api-docs

📝 按 Ctrl+C 停止所有服务
```

## 📁 目录结构

```
jingxuan-report-portal/
├── backend/           # 后端服务
│   ├── src/          # 源代码
│   ├── .env.example  # 环境配置模板
│   └── package.json  # 依赖配置
├── frontend/         # 前端应用
│   ├── src/          # 源代码
│   ├── .env.example  # 环境配置模板
│   └── package.json  # 依赖配置
├── sql-templates/    # SQL模板
├── docker/          # Docker配置
├── README.md        # 项目说明
├── RUNNING_GUIDE.md # 本文件
└── start.sh         # 启动脚本
```

## 🔧 手动启动方式

### 方式一：分别启动前后端

#### 1. 启动后端服务
```bash
# 进入后端目录
cd backend

# 复制环境配置
cp .env.example .env

# 安装依赖（如果需要）
npm install

# 启动开发服务器
npm run dev
```

#### 2. 启动前端服务
```bash
# 进入前端目录
cd frontend

# 复制环境配置
cp .env.example .env

# 安装依赖（如果需要）
npm install

# 启动开发服务器
npm run dev
```

### 方式二：使用Docker（需要Docker环境）
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 🌐 访问地址

| 服务 | 端口 | 地址 | 说明 |
|------|------|------|------|
| 前端应用 | 3000 | http://localhost:3000 | 用户界面 |
| 后端API | 4000 | http://localhost:4000 | RESTful API |
| API文档 | 4000 | http://localhost:4000/api-docs | Swagger文档 |

## 🔌 API端点

### 主要API接口

#### 订单查询
- `POST /api/v1/orders/query` - 查询订单列表
- `POST /api/v1/orders/count` - 获取订单数量
- `POST /api/v1/orders/stats` - 获取订单统计
- `GET /api/v1/orders/:orderNumber` - 获取订单详情

#### 筛选选项
- `GET /api/v1/orders/filter-options` - 获取筛选选项

#### 导出功能
- `POST /api/v1/orders/export` - 创建导出任务
- `GET /api/v1/exports/:jobId` - 获取导出状态
- `GET /api/v1/exports/download/:jobId` - 下载导出文件

### 请求示例

#### 查询订单
```bash
curl -X POST http://localhost:4000/api/v1/orders/query \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-01-01",
    "endTime": "2026-01-31",
    "page": 1,
    "pageSize": 20
  }'
```

## 📊 模拟数据

系统默认使用模拟数据模式，无需真实数据库连接即可运行。

### 模拟数据特性
- ✅ 1000条预生成的订单数据
- ✅ 支持所有筛选条件
- ✅ 模拟查询延迟（50-300ms）
- ✅ 完整的业务逻辑验证

### 切换模式

#### 启用模拟数据（默认）
```bash
# 在后端 .env 文件中设置
USE_MOCK_DATA=true
```

#### 连接真实数据库
1. 在 `.env` 文件中配置数据库连接
2. 设置 `USE_MOCK_DATA=false`
3. 启动服务时会尝试连接真实数据库

## 🐛 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 查找占用端口的进程
lsof -i :3000  # 前端端口
lsof -i :4000  # 后端端口

# 停止占用进程
kill -9 <PID>
```

#### 2. npm安装失败
```bash
# 清除缓存
npm cache clean --force

# 手动安装
cd backend && npm install --legacy-peer-deps
cd ../frontend && npm install --legacy-peer-deps
```

#### 3. 环境配置缺失
确保两个目录都有 `.env` 文件：
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

#### 4. Node.js版本问题
系统要求 Node.js >= 18.0.0：
```bash
node --version

# 如果版本过低，建议使用nvm管理
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 检查服务状态

#### 后端状态
```bash
curl http://localhost:4000/api/v1/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2026-02-15T12:00:00.000Z"
}
```

#### 前端状态
访问 http://localhost:3000 应该看到登录页面。

## 🧪 测试用户

系统默认不启用认证，可以直接访问所有功能。

## 🚀 生产部署

### 构建生产版本

#### 后端构建
```bash
cd backend
npm run build
```

#### 前端构建
```bash
cd frontend
npm run build
```

### 使用Docker部署
```bash
# 构建镜像
docker-compose build

# 运行服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

## 📈 监控和日志

### 后端日志
- 控制台输出：实时日志
- 文件日志：`backend/logs/app.log`
- 访问日志：HTTP请求记录

### 前端开发者工具
浏览器开发者工具：
- Console: 查看输出和错误
- Network: 监控API请求
- Application: 查看存储和缓存

## 🔒 安全考虑

**⚠️ 开发环境警告**：
- 默认使用模拟数据，不连接真实数据库
- 认证功能默认禁用
- 不要在开发环境中使用生产数据

**生产环境必须配置**：
- 数据库连接凭据
- JWT密钥
- HTTPS证书
- 访问控制规则

## 📞 支持

### 技术支持
- 后端API问题：检查后端日志
- 前端UI问题：浏览器开发者工具
- 数据库问题：检查连接配置

### 文档目录
- `README.md` - 项目概述
- `FRONTEND_DEV_COMPLETED.md` - 前端开发文档
- `PROGRESS_REPORT.md` - 项目进度报告
- `GET_STARTED.md` - 快速入门指南

---

## 🎯 快速验证

完成启动后，可以通过以下步骤验证系统是否正常工作：

1. **访问前端**：打开 http://localhost:3000
2. **查看订单列表**：进入订单查询页面
3. **测试筛选功能**：选择日期范围、门店等条件
4. **使用分页**：切换不同的页码
5. **查看订单详情**：点击"查看详情"按钮
6. **测试导出功能**：点击"导出数据"按钮

如果以上步骤都能正常工作，说明系统部署成功！