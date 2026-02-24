# 鲸选自助报表平台

## 项目概述

基于鲸选部门数据查询需求，构建一个支持十万级数据查询和导出的订单查询报表平台。该项目从现有252行复杂SQL查询起步，逐步演化成为一个完整的自助报表门户系统。

## 技术栈

### 前端
- **React 18** + TypeScript + Vite
- **Ant Design 5** + Ant Design Pro Components
- 前端分页 + 虚拟滚动（支持大数据量）

### 后端
- **Express.js** + TypeScript
- **原生mysql2驱动**（不使用ORM）
- 支持OceanBase（MySQL协议）和阿里云DataWorks双数据源

### 基础架构
- **Docker容器化**部署
- Nginx反向代理
- 开发环境Docker Compose

### 数据库
### 主要数据源
1. **OceanBase**（生产环境）：使用MySQL协议的分布式数据库
2. **阿里云DataWorks**（备选数据源）：通过API调用的数据服务

### 开发环境数据库（模拟）
- **MySQL 8.0**：用于开发和测试，模拟OceanBase表结构
- 包含测试数据生成脚本

## 项目结构

```
jingxuan-report-portal/
├── frontend/                    # React前端应用
│   ├── src/
│   │   ├── components/         # 四层架构组件
│   │   │   ├── Layout/        # 导航层：AppLayout等
│   │   │   ├── Filters/       # 控制层：筛选器组件
│   │   │   ├── DataTable/     # 视图层：数据表格组件
│   │   │   └── Export/        # 动作层：导出组件
│   │   ├── pages/             # 页面组件
│   │   ├── hooks/             # 自定义Hooks
│   │   ├── utils/             # 工具函数
│   │   ├── services/          # API服务层
│   │   └── types/             # TypeScript类型定义
│   ├── package.json
│   ├── Dockerfile
│   └── vite.config.ts
│
├── backend/                    # Node.js后端服务
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── core/              # 核心业务模块
│   │   │   ├── sql/           # SQL处理器
│   │   │   ├── database/      # 数据库连接器
│   │   │   ├── export/        # 导出模块
│   │   │   └── security/      # 安全模块
│   │   ├── api/               # API接口
│   │   │   ├── routes/        # 路由定义
│   │   │   └── controllers/   # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── utils/             # 工具函数
│   │   └── types/             # 类型定义
│   ├── package.json
│   ├── Dockerfile
│   └── tsconfig.json
│
├── sql-templates/              # SQL模板文件
│   ├── order-reconciliation.sql  # 订单对账模板（已参数化）
│   └── 订单查询_cleaned.sql      # 清理后的原始SQL
│
├── docker/                     # Docker配置文件
│   ├── nginx/                 # Nginx配置
│   └── mysql/                 # MySQL初始化脚本
│
├── config/                     # 配置文件
│
├── scripts/                    # 脚本文件
│
├── docs/                       # 文档
│
├── docker-compose.yml          # Docker Compose配置
├── .env.example               # 环境变量示例
└── README.md                  # 项目说明文档
```

## 核心功能

### 1. 四层架构
- **导航层**：左侧菜单，按业务维度分类（订单类、用户类、门店类、营销类）
- **控制层**：动态筛选器，根据报表类型生成对应的筛选条件
- **视图层**：数据表格展示，支持分页、排序和虚拟滚动
- **动作层**：导出功能，支持智能导出策略

### 2. 智能筛选器
- **日期范围选择器**：支持快捷选项（今日、昨日、近7天、本月）
- **门店多选输入**：支持逗号分隔，自动清洗格式
- **手机号精确查询**：11位手机号验证
- **订单状态多选**：支持多个状态同时查询

### 3. 智能导出
- **小数据量（<5000条）**：前端直接导出，快速响应
- **大数据量（≤50000条）**：流式异步导出，避免内存溢出
- **导出文件命名**：`[报表名称]_[筛选时间范围]_[导出时间].xlsx`
- **导出内容**：包含查询SQL、筛选参数、完整数据

### 4. 性能保护
- **分页限制**：前端预览最多500条，导出最多50000条
- **查询超时**：SQL执行30秒超时
- **连接池管理**：最大连接数限制为10个
- **自动清理**：导出文件1天后自动删除

## 实施计划（3-4周）

### 第1周：环境搭建和基础框架（5天）
1. **项目初始化** - 创建项目结构和开发环境
2. **SQL清理和参数化** - 清理252行SQL，创建参数化模板
3. **Docker环境配置** - 开发环境容器化
4. **数据库连接层** - 支持OceanBase和DataWorks双连接
5. **基础API开发** - Express服务器配置和基础路由

### 第2周：核心功能实现（7天）
1. **前端四层架构** - React + Ant Design页面布局
2. **控制层组件** - 动态筛选器实现
3. **视图层组件** - 数据表格和分页功能
4. **查询API** - SQL参数化和查询接口
5. **前后端联调** - 基础功能集成测试

### 第3周：导出功能和优化（7天）
1. **导出功能实现** - 智能导出策略（前端/异步）
2. **性能优化** - 查询性能、内存优化、连接池优化
3. **错误处理** - 完整的错误提示和用户反馈
4. **完整功能测试** - 集成测试和边界条件测试

### 第4周：测试和部署（5天）
1. **集成测试** - 双数据源测试，大数据量性能测试
2. **Docker生产配置** - 生产环境镜像构建
3. **部署验证** - 本地服务器部署和验证
4. **文档和交付** - 用户手册和运维文档

## 快速开始

### 1. 环境要求
- Docker 20.10+ 和 Docker Compose
- Node.js 18+（开发时可选）
- 鲸选部门数据查询权限（OceanBase/DataWorks）

### 2. 开发环境启动
```bash
# 1. 克隆项目
git clone <repository-url>
cd jingxuan-report-portal

# 2. 配置环境变量
cp .env.example .env
# 编辑.env文件，填写数据库连接信息

# 3. 启动开发环境
docker-compose up -d

# 4. 访问应用
# 前端开发服务器：http://localhost:3000
# 后端API服务：http://localhost:4000
# 数据库管理：localhost:3307 (用户名/密码在.env中配置)
```

### 3. 生产环境部署
```bash
# 1. 构建生产镜像
docker-compose -f docker-compose.prod.yml build

# 2. 启动生产服务
docker-compose -f docker-compose.prod.yml up -d

# 3. 访问应用
# 应用地址：http://localhost:8080
# API地址：http://localhost:8080/api
```

## API接口说明

### 1. 订单查询接口
```
POST /api/v1/orders/query
Content-Type: application/json

请求体：
{
  "filters": {
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    },
    "storeIds": "9933,1001",
    "mobile": "13800138000",
    "statuses": [1, 2, 5]
  },
  "pagination": {
    "page": 1,
    "pageSize": 50
  }
}

响应：
{
  "success": true,
  "data": {
    "items": [...订单数据],
    "total": 12345,
    "page": 1,
    "pageSize": 50,
    "totalPages": 247
  }
}
```

### 2. 导出接口
```
POST /api/v1/orders/export
Content-Type: application/json

请求体：
{
  "filters": {...同查询参数},
  "format": "xlsx"
}

响应（小数据量）：
{
  "success": true,
  "data": {
    "filename": "订单导出_20260101_20260131_202308151020.xlsx",
    "downloadUrl": "/api/v1/exports/download/订单导出_20260101_20260131_202308151020.xlsx",
    "size": 1500
  }
}

响应（大数据量）：
{
  "success": true,
  "data": {
    "jobId": "export_202308151020_abc123",
    "status": "processing",
    "message": "正在生成导出文件，请稍后在下载中心查看",
    "estimatedTime": 120
  }
}
```

## 技术设计决策

### 1. 数据库连接策略
- **OceanBase**：使用mysql2驱动，兼容MySQL协议
- **DataWorks**：使用阿里云SDK，通过API调用
- **连接池**：最大10个连接，支持健康检查和自动重连
- **双数据源**：主从切换，容错机制

### 2. SQL参数化方案
- **保持原样**：252行SQL逻辑完全保持原样
- **参数化占位符**：使用?占位符代替硬编码值
- **格式清洗**：前端自动清洗用户输入（逗号分隔、手机号格式等）
- **SQL注入防护**：严格参数化，禁止字符串拼接

### 3. 性能优化策略
- **前端分页**：避免大量数据传输，减轻后端压力
- **流式导出**：使用ExcelJS流式写入，避免内存溢出
- **查询限制**：强制添加查询超时和结果集限制
- **缓存策略**：常用查询结果缓存，提升响应速度

### 4. 安全考虑
- **输入验证**：严格验证所有用户输入
- **SQL防护**：多层防护防止SQL注入
- **数据脱敏**：敏感字段前端脱敏显示
- **权限控制**：预留权限系统接口

## 配置说明

### 数据库配置 (.env)
```bash
# OceanBase数据库
DB_TYPE=oceanbase
DB_HOST=your-oceanbase-host.com
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=tz_database

# 阿里云DataWorks
DATAWORKS_ENDPOINT=dw-xxx.dataworks.aliyuncs.com
DATAWORKS_API_KEY=your_access_key
DATAWORKS_API_SECRET=your_secret_key
DATAWORKS_PROJECT_ID=your_project_id

# 应用配置
EXPORT_MAX_SIZE=50000
EXPORT_RETENTION_DAYS=1
QUERY_TIMEOUT_MS=30000
```

### 开发环境快速配置
项目已包含开发环境MySQL配置，可直接用于本地开发测试：
- 数据库连接：`localhost:3307`
- 数据库名称：`jingxuan_test`
- 用户：`dev_user` / 密码：`dev_password`
- 包含测试数据生成存储过程

## 开发指南

### 前端开发
```bash
cd frontend
npm install
npm run dev
```

### 后端开发
```bash
cd backend
npm install
npm run dev
```

### Docker开发
```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 重新构建
docker-compose build --no-cache

# 停止服务
docker-compose down
```

### 调试SQL查询
1. 启动开发环境数据库
2. 执行SQL模板中的测试数据生成存储过程
3. 通过API接口测试查询功能
4. 查看SQL执行日志和性能指标

## 部署说明

### 生产环境要求
- **服务器**：4核CPU / 8GB内存 / 100GB磁盘
- **操作系统**：Ubuntu 22.04 LTS 或 CentOS 7.9
- **网络**：公司内网访问，需开放8080端口
- **数据库**：已配置OceanBase和DataWorks访问权限

### 部署步骤
1. **环境准备**：确保服务器满足要求
2. **配置文件**：创建生产环境.env文件
3. **构建镜像**：执行Docker构建命令
4. **启动服务**：使用Docker Compose启动
5. **验证部署**：访问健康检查接口，测试主要功能
6. **监控配置**：配置基础监控和告警

## 维护和监控

### 关键监控指标
1. **服务可用性**：健康检查接口响应状态
2. **查询性能**：API响应时间（P95 < 2秒）
3. **导出性能**：导出任务平均处理时间（< 5分钟/5万条）
4. **数据库连接**：连接池使用率（< 80%）
5. **内存使用**：应用内存使用率（< 70%）

### 日常维护
1. **日志检查**：定期检查错误日志和访问日志
2. **文件清理**：导出文件自动清理，可手动清理旧文件
3. **数据库连接**：定期检查数据库连接状态
4. **性能监控**：监控关键性能指标，及时优化

### 故障处理
1. **服务不可用**：检查Docker容器状态，查看应用日志
2. **查询超时**：检查数据库连接，优化SQL查询
3. **导出失败**：检查磁盘空间，查看导出任务日志
4. **连接失败**：检查网络连通性，验证数据库连接配置

## 风险和应对措施

### 技术风险
| 风险 | 影响 | 应对措施 |
|------|------|----------|
| SQL注入 | 数据泄露/系统崩溃 | 严格参数化、输入验证、SQL白名单 |
| 数据库连接超载 | 服务不可用 | 连接池限制、查询队列、熔断机制 |
| 内存泄漏 | 服务崩溃 | 流式处理、内存监控、分批处理 |
| OceanBase兼容性 | 查询失败 | 兼容性测试、降级方案 |

### 性能风险
- **查询响应时间** > 5秒：SQL优化、索引添加、查询缓存
- **导出处理时间** > 10分钟：分批处理、异步任务、进度反馈
- **连接池使用率** > 80%：扩容、限流、查询优化

### 安全风险
- **数据泄露**：敏感字段脱敏，访问日志审计
- **未授权访问**：API密钥管理，访问频率限制
- **文件安全**：导出文件权限控制，自动清理

## 未来扩展

### 第一阶段已实现
- ✅ 订单查询报表（基于现有252行SQL）
- ✅ 四层架构基础框架
- ✅ 智能筛选和导出功能
- ✅ 双数据库源支持

### 第二阶段规划
- [ ] 权限控制系统（角色、菜单、数据权限）
- [ ] 安全脱敏功能（页面展示脱敏，导出权限控制）
- [ ] 多报表支持（商品销售、退款记录等）
- [ ] 报表订阅（定时生成，邮件发送）

### 第三阶段规划
- [ ] 数据可视化（图表展示，Dashboard）
- [ ] 移动端支持（响应式设计，移动端页面）
- [ ] API开放平台（为其他系统提供数据接口）
- [ ] 智能分析（趋势预测，异常检测）

## 贡献指南

### 开发流程
1. 创建特性分支：`git checkout -b feature/your-feature`
2. 编写代码，确保通过所有测试
3. 提交代码：`git commit -m "feat: 描述你的功能"`
4. 推送分支：`git push origin feature/your-feature`
5. 创建Pull Request

### 代码规范
- **TypeScript**：严格类型检查，避免使用any
- **React**：函数组件优先，使用Hooks
- **命名规范**：camelCase变量，PascalCase类，CONSTANT常量
- **注释规范**：复杂的业务逻辑需要详细注释

### 测试要求
- 所有新功能必须包含单元测试
- 核心API必须包含集成测试
- 性能敏感功能必须包含性能测试

## 许可证

本项目为鲸选部门内部使用，未经许可不得对外发布。

---

如果有任何问题或建议，请联系项目负责人或创建Issue。