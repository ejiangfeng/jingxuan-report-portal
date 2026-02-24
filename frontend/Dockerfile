# 多阶段Docker构建 - 开发和生产环境

# =========== 开发阶段 ===========
FROM node:18-alpine AS development

WORKDIR /app

# 安装开发依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 开发阶段命令
CMD ["npm", "run", "dev", "--", "--host"]

# =========== 构建阶段 ===========
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# =========== 生产阶段 ===========
FROM nginx:alpine AS production

# 安装Node.js用于配置生成
RUN apk add --no-cache nodejs npm

WORKDIR /app

# 从构建阶段复制构建结果
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建必要目录
RUN mkdir -p /var/log/nginx && \
    chmod -R 755 /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx /var/cache/nginx /usr/share/nginx/html

# 切换到nginx用户
USER nginx

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# 生产环境启动命令
CMD ["nginx", "-g", "daemon off;"]