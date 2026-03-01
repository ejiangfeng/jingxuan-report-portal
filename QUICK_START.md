# 快速开始指南

## 5分钟启动开发环境

### 前置要求
- Docker 20.10+
- Docker Compose
- Git（可选）

### 步骤1：获取代码
```bash
# 如果你已经有项目代码，跳到步骤2
# 否则创建一个新目录
mkdir jingxuan-report-portal
cd jingxuan-report-portal
```

### 步骤2：创建配置文件
```bash
# 从示例复制配置文件
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  backend:
    image: node:18-alpine
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
      - PORT=4000
    volumes:
      - ./backend:/app
    working_dir: /app
    command: sh -c "npm ci && npm run dev"
    
  frontend:
    image: node:18-alpine
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:4000/api
    volumes:
      - ./frontend:/app
    working_dir: /app
    command: sh -c "npm ci && npm run dev"
    
  database:
    image: mysql:8.0
    ports:
      - "3307:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=jingxuan_test
      - MYSQL_USER=dev_user
      - MYSQL_PASSWORD=dev_password
    command: --default-authentication-plugin=mysql_native_password
EOF

# 创建后端配置
mkdir -p backend
cat > backend/package.json << 'EOF'
{
  "name": "jingxuan-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec node src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.2.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF

cat > backend/src/index.js << 'EOF'
const express = require('express')
const cors = require('cors')
const app = express()
const port = 4000

app.use(cors())
app.use(express.json())

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

// 订单查询API（模拟）
app.post('/api/v1/orders/query', (req, res) => {
  const { filters, pagination } = req.body
  
  // 模拟响应
  const mockData = Array(20).fill(null).map((_, i) => ({
    订单号: `ORD2023${1000 + i}`,
    来源渠道: i % 4 === 0 ? '鲸选微信小程序' : '新鲸选APP',
    下单人手机号: '138****5678',
    平台订单号: `PLAT${20230000 + i}`,
    订单类型: i % 3 === 0 ? '普通订单' : '团购订单',
    订单状态: i % 5 === 0 ? '待付款' : i % 5 === 1 ? '待发货' : '交易成功',
    下单时间: new Date(Date.now() - 86400000 * i).toISOString(),
    所属门店名称: i % 3 === 0 ? '北京朝阳门店' : i % 3 === 1 ? '上海浦东门店' : '深圳南山门店',
    所属门店代码: i % 3 === 0 ? '1101' : i % 3 === 1 ? '2001' : '3101',
    配送方式: i % 2 === 0 ? '快递' : '自提',
    收货人: `用户${i + 1}`,
    收货人手机号: '138****4321',
    收货地址: i % 2 === 0 ? '自提订单' : '北京市朝阳区测试地址',
    商品种类数: i % 5 + 1,
    商品总数量: i % 10 + 1,
    商品总金额: (i + 1) * 100.00,
    优惠总金额: (i + 1) * 5.00,
    实付商品总金额: (i + 1) * 95.00,
    原应付运费金额: 15.00,
    运费活动优惠金额: 5.00,
    优惠后运费: 10.00,
    包装费: 2.00,
    客户实付金额: (i + 1) * 97.00,
    // 更多字段...
  }))
  
  res.json({
    success: true,
    data: {
      items: mockData,
      total: 1500,
      page: pagination.page || 1,
      pageSize: pagination.pageSize || 20,
      totalPages: 75
    }
  })
})

app.listen(port, () => {
  console.log(`🚀 后端服务运行在 http://localhost:${port}`)
})
EOF

# 创建前端配置
mkdir -p frontend
cat > frontend/package.json << 'EOF'
{
  "name": "jingxuan-frontend",
  "private": true,
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "antd": "^5.8.2",
    "axios": "^1.5.0",
    "dayjs": "^1.11.9"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.4",
    "typescript": "^5.1.6",
    "vite": "^4.4.9"
  }
}
EOF

cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>鲸选报表平台</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
EOF

mkdir -p frontend/src
cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat > frontend/src/App.tsx << 'EOF'
import React, { useState, useEffect } from 'react'
import { Table, Card, DatePicker, Input, Select, Button, Space, message } from 'antd'
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import axios from 'axios'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

function App() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  
  // 筛选条件
  const [filters, setFilters] = useState({
    dateRange: [dayjs().subtract(7, 'day'), dayjs()],
    storeIds: '',
    mobile: '',
    statuses: ['待付款', '待发货', '待收货', '交易成功']
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20
  })

  // 查询数据
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await axios.post('http://localhost:4000/api/v1/orders/query', {
        filters: {
          dateRange: {
            start: filters.dateRange[0].format('YYYY-MM-DD'),
            end: filters.dateRange[1].format('YYYY-MM-DD')
          },
          storeIds: filters.storeIds,
          mobile: filters.mobile,
          statuses: filters.statuses.map(s => 
            s === '待付款' ? 1 : 
            s === '待发货' ? 2 : 
            s === '待收货' ? 3 : 5
          )
        },
        pagination
      })
      
      if (response.data.success) {
        setData(response.data.data.items)
        setTotal(response.data.data.total)
      }
    } catch (error) {
      message.error('查询失败')
    } finally {
      setLoading(false)
    }
  }

  // 导出数据
  const handleExport = () => {
    message.info('此功能将在完整版本中实现')
  }

  useEffect(() => {
    fetchData()
  }, [pagination.page, pagination.pageSize])

  // 表格列定义
  const columns = [
    { title: '订单号', dataIndex: '订单号', key: 'order_number' },
    { title: '来源渠道', dataIndex: '来源渠道', key: 'source' },
    { title: '下单时间', dataIndex: '下单时间', key: 'create_time' },
    { title: '订单状态', dataIndex: '订单状态', key: 'status' },
    { title: '所属门店', dataIndex: '所属门店名称', key: 'store_name' },
    { title: '客户实付金额', dataIndex: '客户实付金额', key: 'amount' },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card title="订单查询报表" style={{ marginBottom: 16 }}>
        <Space size="large" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ marginBottom: 8 }}>时间范围</div>
            <RangePicker
              value={filters.dateRange}
              onChange={dates => setFilters({...filters, dateRange: dates || [dayjs().subtract(7, 'day'), dayjs()]})}
            />
          </div>
          
          <div>
            <div style={{ marginBottom: 8 }}>门店代码</div>
            <Input
              placeholder="多个用逗号分隔"
              value={filters.storeIds}
              onChange={e => setFilters({...filters, storeIds: e.target.value})}
              style={{ width: 200 }}
            />
          </div>
          
          <div>
            <div style={{ marginBottom: 8 }}>订单状态</div>
            <Select
              mode="multiple"
              placeholder="选择订单状态"
              value={filters.statuses}
              onChange={values => setFilters({...filters, statuses: values})}
              style={{ width: 200 }}
            >
              <Option value="待付款">待付款</Option>
              <Option value="待发货">待发货</Option>
              <Option value="待收货">待收货</Option>
              <Option value="交易成功">交易成功</Option>
              <Option value="交易失败">交易失败</Option>
            </Select>
          </div>
          
          <Button type="primary" icon={<SearchOutlined />} onClick={fetchData}>
            查询
          </Button>
          
          <Button type="default" icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="订单号"
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPagination({ page, pageSize })
            }
          }}
          size="middle"
        />
      </Card>
    </div>
  )
}

export default App
EOF

cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
EOF
```

### 步骤3：启动开发环境
```bash
# 给脚本添加执行权限（如果是手动创建的话）
chmod +x jingxuan-report-portal/scripts/setup.sh

# 或者直接使用Docker Compose
cd jingxuan-report-portal
docker-compose up -d
```

### 步骤4：访问应用
- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:4000
- **健康检查**: http://localhost:4000/health

## 开发进度说明

### 已完成部分
1. ✅ 项目骨架和配置
2. ✅ SQL清理和参数化模板
3. ✅ Docker开发环境配置
4. ✅ 基础的前端和后端结构
5. ✅ 配置管理和目录组织

### 待实现核心功能
以下功能需要在后续开发中完成：

#### 后端部分
1. **完整的SQL处理器**
   - 动态SQL构建
   - 参数化安全处理
   - SQL注入防护

2. **双数据库连接器**
   - OceanBase连接（mysql2驱动）
   - DataWorks API调用
   - 连接池管理和错误处理

3. **导出功能实现**
   - Excel流式导出
   - 异步任务处理
   - 文件管理和清理

#### 前端部分
1. **四层架构组件**
   - 导航层：完整的菜单系统
   - 控制层：所有筛选器组件
   - 视图层：完整表格功能
   - 动作层：完整导出功能

2. **性能优化**
   - 虚拟滚动支持大数据量
   - 前端缓存策略
   - 懒加载和代码分割

#### 完整功能
1. **权限控制系统**
2. **安全脱敏功能**
3. **多报表支持**
4. **监控和日志系统**

## 后续开发计划

### 第一阶段：核心业务实现（2-3周）
1. SQL处理器和数据库连接器
2. 基本API接口和查询功能
3. 前端查询页面和表格组件

### 第二阶段：导出功能完善（1-2周）
1. Excel导出功能实现
2. 异步任务处理
3. 文件管理和清理机制

### 第三阶段：性能优化和测试（1周）
1. 大数据量性能优化
2. 完整功能测试
3. 安全审计和代码审查

### 第四阶段：部署上线（1周）
1. 生产环境配置
2. 监控和告警设置
3. 运维文档编写

## 问题排查

### 常见问题
1. **Docker Compose启动失败**
   - 检查docker和docker-compose版本
   - 检查端口冲突
   - 查看日志：`docker-compose logs`

2. **前端无法访问后端**
   - 检查后端服务是否运行：`curl http://localhost:4000/health`
   - 检查网络连接
   - 查看代理配置是否正确

3. **数据库连接失败**
   - 检查MySQL容器状态
   - 验证连接参数
   - 检查防火墙设置

4. **内存不足**
   - Docker配置内存限制
   - 优化应用内存使用
   - 增加系统交换空间

## 获取帮助

1. **查看详细文档**: README.md
2. **检查运行日志**: `docker-compose logs -f`
3. **查看服务状态**: `docker-compose ps`
4. **重新构建服务**: `docker-compose build --no-cache`
5. **全新启动**: `docker-compose down -v && docker-compose up -d`

## 开发规范

### 分支管理
- `main`: 生产环境代码
- `develop`: 开发分支
- `feature/*`: 功能开发分支
- `bugfix/*`: 问题修复分支

### 提交规范
- `feat`: 新功能
- `fix`: 修复问题
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 代码重构
- `test`: 测试用例
- `chore`: 构建过程

### 代码审查
- 所有代码变更必须经过Code Review
- 保持代码风格一致性
- 确保有足够的测试覆盖