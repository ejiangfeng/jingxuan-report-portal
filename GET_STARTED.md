# 开发启动指南

## 一句话启动开发环境
```bash
chmod +x scripts/setup.sh && ./scripts/setup.sh
```

## 5分钟了解项目

### 这是一套完整的报表平台解决方案，包含：
1. **基础框架**：React前端 + Express后端 + Docker容器化
2. **SQL优化**：已清理的252行复杂SQL + 参数化模板
3. **双数据库支持**：OceanBase（MySQL协议）+ 阿里云DataWorks
4. **四层架构**：导航层、控制层、视图层、动作层
5. **完整配置**：开发/测试/生产环境配置，Nginx反向代理

### 已完成的核心工作：
✅ SQL清理和参数化（252行→参数化模板）  
✅ Docker开发环境配置（开箱即用）  
✅ 项目骨架搭建（前后端完整结构）  
✅ 配置管理系统（环境变量、数据库连接）  
✅ 文档体系（开发、部署、运维文档）

### 待完成的核心功能：
🔄 SQL处理器完整实现  
🔄 双数据库连接器实现  
🔄 查询API和导出功能  
🔄 前端四层架构组件

## 开发环境快速验证

### 1. 检查项目结构
```bash
# 进入项目根目录
cd jingxuan-report-portal

# 查看关键文件
ls -la
# 应该看到这些目录：frontend/ backend/ docker-compose.yml .env.example
```

### 2. 配置环境变量
```bash
# 复制配置文件
cp .env.example .env

# 编辑配置（使用你喜欢的编辑器）
vi .env
# 或者
nano .env
```

### 3. 启动Docker环境
```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

### 4. 验证服务
```bash
# 检查后端API
curl http://localhost:4000/health
# 应该返回：{"status":"healthy"}

# 检查数据库连接
# 需要手动验证数据库配置
```

## 开发工作流程

### 后端开发
```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖（如果使用本地开发）
npm ci

# 3. 启动开发服务器
npm run dev

# 4. 代码规范检查
npm run lint
npm run format
```

### 前端开发
```bash
# 1. 进入前端目录
cd frontend

# 2. 安装依赖（如果使用本地开发）
npm ci

# 3. 启动开发服务器
npm run dev

# 4. 代码规范检查
npm run lint
npm run format
```

### Docker开发
```bash
# 重新构建服务
docker-compose build --no-cache

# 重启单个服务
docker-compose restart backend

# 查看实时日志
docker-compose logs -f

# 进入容器调试
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 快速测试

### SQL模板测试
```bash
# 1. 准备测试MySQL环境
# 使用docker-compose提供的MySQL测试数据库

# 2. 执行测试数据生成
docker-compose exec database mysql -u dev_user -pdev_password jingxuan_test -e "CALL generate_test_orders();"

# 3. 验证表结构
docker-compose exec database mysql -u dev_user -pdev_password jingxuan_test -e "SHOW TABLES;"
```

### API接口测试
```bash
# 测试查询接口
curl -X POST http://localhost:4000/api/v1/orders/query \
  -H "Content-Type: application/json" \
  -d '{
    "filters": {
      "dateRange": {
        "start": "2026-01-01",
        "end": "2026-01-31"
      }
    },
    "pagination": {
      "page": 1,
      "pageSize": 20
    }
  }'
```

## 遇到问题？

### 常见问题快速解决
```bash
# 1. Docker构建失败
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 2. 端口被占用
# 修改docker-compose.yml中的端口映射

# 3. 数据库连接失败
# 检查.env文件中的数据库配置
# 确保数据库服务已启动：docker-compose ps database

# 4. 内存不足
# 增加Docker可用内存
# 或者优化容器配置
```

### 获取更多帮助
1. 查看详细文档：README.md
2. 检查系统日志：`docker-compose logs -f`
3. 查看配置验证：检查config目录
4. 查看代码注释：核心类都有详细注释

## 开发进度跟踪

### 当前状态
```
📊 整体进度：15%（基础框架完整）
✅ 完成：项目结构、配置、文档
🔄 进行中：核心功能开发
📋 待开始：前后端具体实现
```

### 下一步开发重点
1. **完善SQLProcessor类** - 处理SQL参数化和安全验证
2. **实现数据库连接器** - OceanBase + DataWorks双连接
3. **创建基础API** - 查询、导出、文件下载接口
4. **开发前端组件** - 四层架构具体实现

### 预计时间线
```
第1周：完善SQL处理器 + 数据库连接器
第2周：实现基础API + 开发查询页面
第3周：实现导出功能 + 优化性能
第4周：集成测试 + 部署上线
```

## 贡献指南

### 开发规范
- **提交信息**: `feat: 描述功能` / `fix: 修复问题`
- **代码风格**: 使用ESLint和Prettier配置
- **目录结构**: 保持现有目录组织
- **文档更新**: 代码变更时同步更新文档

### 测试要求
- 所有新功能需要包含测试用例
- 核心API需要集成测试
- 性能敏感功能需要性能测试
- 安全相关功能需要安全测试

### 代码审查
- 功能分支完成前创建Pull Request
- 至少需要一名其他开发人员审查
- 通过所有测试后才能合并

## 立即开始开发

1. **克隆项目到本地**（如果尚未完成）
2. **运行setup.sh**配置开发环境
3. **选择一项任务**从待办事项开始
4. **提交代码**到Git仓库

### 推荐的第一步开发任务
```bash
# 任务1：完善SQLProcessor类
# 文件：backend/src/core/sql/SQLProcessor.ts
# 目标：实现所有TODO标记的方法

# 任务2：实现OceanBase连接器
# 文件：backend/src/core/database/OceanBaseClient.ts
# 需要创建这个文件并实现

# 任务3：创建订单查询页面
# 文件：frontend/src/pages/OrderQueryPage.tsx
# 需要创建这个文件并实现
```

有任何问题，请查看详细文档或咨询项目负责人。

---
**项目启动时间**: 现在！  
**技术支持**: 项目文档 + Git Issues  
**沟通渠道**: 待指定团队沟通工具