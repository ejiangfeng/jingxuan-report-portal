# 多阶段Docker构建 - 开发和生产环境

# =========== 开发阶段 ===========
FROM node:18-alpine AS development

WORKDIR /app

# 安装开发依赖
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p /app/exports /app/logs /app/sql-templates

# 暴露端口
EXPOSE 4000

# 开发阶段命令
CMD ["npm", "run", "dev"]

# =========== 构建阶段 ===========
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建TypeScript
RUN npm run build

# 安装生产依赖
RUN npm ci --only=production

# =========== 生产阶段 ===========
FROM node:18-alpine AS production

WORKDIR /app

# 添加非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S jingxuan -u 1001 && \
    chown -R jingxuan:nodejs /app

# 从构建阶段复制
COPY --from=builder --chown=jingxuan:nodejs /app/dist ./dist
COPY --from=builder --chown=jingxuan:nodejs /app/package*.json ./
COPY --from=builder --chown=jingxuan:nodejs /app/node_modules ./node_modules

# 复制配置文件和SQL模板
COPY --chown=jingxuan:nodejs config/ ./config/
COPY --chown=jingxuan:nodejs sql-templates/ ./sql-templates/

# 创建必要的目录
RUN mkdir -p /app/exports /app/logs && \
    chown -R jingxuan:nodejs /app/exports /app/logs

# 切换到非root用户
USER jingxuan

# 暴露端口
EXPOSE 4000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if(r.statusCode===200)process.exit(0);process.exit(1)})"

# 生产环境启动命令
CMD ["npm", "start"]