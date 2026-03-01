# 鲸选自助报表平台 - 部署指南

## 📋 部署准备

### 系统要求
| 组件 | 要求 | 推荐版本 |
|------|------|----------|
| 操作系统 | Linux/macOS/Windows | Ubuntu 20.04+ |
| Node.js | >= 18.0.0 | 18.17.0 LTS |
| npm | >= 9.0.0 | 9.6.7 |
| 数据库 | OceanBase or MySQL | OceanBase 3.x |
| 内存 | >= 8GB RAM | 16GB RAM |
| 存储 | >= 20GB | 50GB SSD |

### 网络要求
| 服务 | 端口 | 协议 | 备注 |
|------|------|------|------|
| 前端 | 3000 | HTTP/HTTPS | 用户访问 |
| 后端 | 4000 | HTTP/HTTPS | API服务 |
| 数据库 | 3306 | TCP | 可选，仅生产 |

## 🚀 快速部署

### 1. 环境准备
```bash
# 克隆或复制项目文件
cd /opt
cp -r "鲸选部门数据查询需求/jingxuan-report-portal" .
cd jingxuan-report-portal
```

### 2. 配置环境变量
```bash
# 后端配置
cp backend/.env.example backend/.env
# 使用编辑器修改 .env 文件，配置数据库连接等

# 前端配置
cp frontend/.env.example frontend/.env
```

关键配置项：
```bash
# 后端 .env
DB_HOST=<您的数据库主机>
DB_USER=<数据库用户>
DB_PASSWORD=<数据库密码>
USE_MOCK_DATA=false  # 生产环境设为false

# 前端 .env
VITE_API_URL=https://your-domain.com/api/v1  # 生产API地址
```

### 3. 安装依赖
```bash
# 后端依赖
cd backend
npm install --production

# 前端依赖
cd ../frontend
npm install --production
```

### 4. 构建应用程序
```bash
# 后端构建
cd backend
npm run build

# 前端构建
cd ../frontend
npm run build
```

### 5. 启动服务
```bash
# 使用PM2管理进程（推荐）
npm install -g pm2

# 启动后端
cd backend
pm2 start dist/index.js --name "jingxuan-backend"

# 启动前端（使用serve）
cd ../frontend
npm install -g serve
serve -s dist -l 3000 &
```

## 📦 Docker部署（推荐）

### 1. 使用现有Docker配置
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 2. 自定义Docker构建
```bash
# 构建后端镜像
docker build -t jingxuan/report-backend:latest -f backend/Dockerfile backend/

# 构建前端镜像
docker build -t jingxuan/report-frontend:latest -f frontend/Dockerfile frontend/

# 运行容器
docker run -d -p 4000:4000 --name jingxuan-backend jingxuan/report-backend:latest
docker run -d -p 3000:3000 --name jingxuan-frontend jingxuan/report-frontend:latest
```

## 🌐 Nginx反向代理配置

### 1. 安装Nginx
```bash
sudo apt-get update
sudo apt-get install nginx
```

### 2. 配置站点
```nginx
# /etc/nginx/sites-available/jingxuan-report
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS（如果启用）
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL证书配置
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;
    
    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. 启用站点
```bash
sudo ln -s /etc/nginx/sites-available/jingxuan-report /etc/nginx/sites-enabled/
sudo nginx -t  # 测试配置
sudo systemctl restart nginx  # 重启Nginx
```

## 🗄️ 数据库配置

### 1. MySQL/OceanBase配置
```sql
-- 创建数据库
CREATE DATABASE jingxuan_order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（如果使用MySQL）
CREATE USER 'jingxuan_user'@'%' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON jingxuan_order_db.* TO 'jingxuan_user'@'%';
FLUSH PRIVILEGES;
```

### 2. DataWorks配置（可选）
如果您使用阿里云DataWorks作为数据源，需要配置：
- 项目ID
- AccessKey ID
- AccessKey Secret
- 端点区域

## 🔒 安全配置

### 1. 防火墙配置
```bash
# 允许必要端口
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. 应用安全
```bash
# 生成JWT密钥
openssl rand -base64 32

# 在后端.env中配置
JWT_SECRET=<生成的密钥>

# 配置CORS
CORS_ORIGIN=https://your-domain.com
```

### 3. 数据库安全
```bash
# 禁用远程root登录
# 使用强密码
# 定期备份
# 启用SSL连接（如果支持）
```

## 📊 监控和日志

### 1. 应用日志
```bash
# 查看后端日志
pm2 logs jingxuan-backend

# 查看前端日志
tail -f /var/log/nginx/access.log
```

### 2. 系统监控
```bash
# 安装监控工具
sudo apt-get install htop iotop

# 查看系统资源
htop
```

### 3. 设置日志轮转
```nginx
# /etc/logrotate.d/jingxuan-app
/var/log/jingxuan/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 640 www-data www-data
}
```

## 🔄 数据迁移

### 1. 初始数据
系统使用模拟数据模式启动，无需初始数据库表结构。

### 2. 数据字典查询配置
将您的实际SQL查询放入：
```
sql-templates/order-reconciliation.sql
```

### 3. 配置文件更新
当连接真实数据库时：
1. 更新数据库连接信息
2. 设置 `USE_MOCK_DATA=false`
3. 重启服务

## 🧪 部署验证

### 1. 健康检查
```bash
# API健康检查
curl https://your-domain.com/api/v1/health

# 预期返回
{"status":"ok","timestamp":"..."}
```

### 2. 功能测试
按顺序测试：
1. 访问前端页面
2. 测试订单查询
3. 验证筛选功能
4. 测试分页
5. 验证导出功能

### 3. 性能测试
```bash
# 使用ab进行压力测试
ab -n 1000 -c 100 https://your-domain.com/api/v1/orders/filter-options
```

## 🚨 故障排除

### 常见问题

#### 1. 服务无法启动
```bash
# 检查端口占用
netstat -tulpn | grep :4000

# 检查日志
pm2 logs jingxuan-backend --lines 100
```

#### 2. 数据库连接失败
```bash
# 测试数据库连接
mysql -h <host> -u <user> -p<password> -e "SELECT 1;"

# 检查防火墙
sudo ufw status
```

#### 3. API返回错误
```bash
# 查看应用日志
tail -f backend/logs/app.log

# 检查CORS配置
# 检查JWT配置
```

#### 4. 前端静态文件404
```bash
# 检查Nginx配置
sudo nginx -t

# 检查文件权限
ls -la frontend/dist/
```

## 📈 备份和恢复

### 1. 数据库备份
```bash
# 创建备份脚本
mysqldump -h <host> -u <user> -p<password> jingxuan_order_db > backup-$(date +%Y%m%d).sql

# 定时备份（crontab）
0 2 * * * /path/to/backup-script.sh
```

### 2. 应用备份
```bash
# 备份配置文件
tar -czf config-backup-$(date +%Y%m%d).tar.gz backend/.env frontend/.env
```

### 3. 恢复步骤
```bash
# 恢复数据库
mysql -h <host> -u <user> -p<password> jingxuan_order_db < backup-file.sql

# 恢复配置
tar -xzf config-backup.tar.gz
```

## 🔄 更新升级

### 1. 滚动更新策略
```bash
# 更新后端
cd backend
git pull origin main
npm install
npm run build
pm2 restart jingxuan-backend

# 更新前端
cd ../frontend
git pull origin main
npm install
npm run build
# 重新部署静态文件
```

### 2. 零停机更新
```bash
# 使用蓝绿部署或金丝雀发布
# 需要额外的负载均衡器支持
```

## 📞 技术支持

### 紧急联系方式
- **系统管理员**: admin@your-company.com
- **技术支持**: support@your-company.com
- **值班电话**: +86 123-4567-8900

### 监控报警
设置以下监控警报：
- 服务不可用
- 响应时间超时
- 数据库连接失败
- 磁盘空间不足

---

## 🎯 上线检查清单

### 部署前检查
- [ ] 环境变量配置正确
- [ ] 数据库连接测试通过
- [ ] SSL证书已安装
- [ ] 防火墙配置正确
- [ ] 备份机制已建立

### 部署中检查
- [ ] 服务启动正常
- [ ] 端口监听正常
- [ ] Nginx配置正确
- [ ] 域名解析正确

### 部署后验证
- [ ] 前端页面可访问
- [ ] API接口可用
- [ ] 功能测试通过
- [ ] 性能测试通过
- [ ] 安全扫描通过

### 文档更新
- [ ] 更新操作手册
- [ ] 更新故障处理文档
- [ ] 更新联系方式
- [ ] 更新监控配置

---

**部署负责人**: 运维团队  
**部署日期**: 2026-02-15  
**版本**: v1.0.0  
**维护周期**: 3年  
**支持状态**: 上线支持