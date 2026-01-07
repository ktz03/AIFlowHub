# AIFlowHub 部署指南

## 目录

-   [环境要求](#环境要求)
-   [快速部署](#快速部署)
-   [Docker 部署](#docker-部署)
-   [手动部署](#手动部署)
-   [配置说明](#配置说明)
-   [常见问题](#常见问题)

---

## 环境要求

### 硬件要求

| 配置项 | 最低要求 | 推荐配置 |
| ------ | -------- | -------- |
| CPU    | 2 核     | 4 核+    |
| 内存   | 4 GB     | 8 GB+    |
| 磁盘   | 20 GB    | 50 GB+   |

### 软件要求

| 软件           | 版本要求     |
| -------------- | ------------ |
| Node.js        | 18.x 或 20.x |
| pnpm           | 8.x+         |
| Docker         | 20.x+ (可选) |
| Docker Compose | 2.x+ (可选)  |

---

## 快速部署

### 方式一：Docker Compose (推荐)

```bash
# 1. 克隆仓库
git clone https://github.com/ktz03/AIFlowHub.git
cd AIFlowHub/docker

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置必要的配置

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

服务启动后访问: http://localhost:3000

### 方式二：一键脚本

```bash
# Linux/macOS
curl -fsSL https://raw.githubusercontent.com/ktz03/AIFlowHub/main/scripts/install.sh | bash

# Windows (PowerShell)
iwr -useb https://raw.githubusercontent.com/ktz03/AIFlowHub/main/scripts/install.ps1 | iex
```

---

## Docker 部署

### 使用预构建镜像

```bash
docker run -d \
  --name aiflow-hub \
  -p 3000:3000 \
  -v aiflow-data:/root/.flowise \
  -e DATABASE_TYPE=sqlite \
  -e JWT_SECRET=your-secret-key \
  ghcr.io/ktz03/aiflow-hub:latest
```

### 自行构建镜像

```bash
# 在项目根目录执行
docker build -t aiflow-hub:local .

# 运行容器
docker run -d \
  --name aiflow-hub \
  -p 3000:3000 \
  -v aiflow-data:/root/.flowise \
  aiflow-hub:local
```

### Docker Compose 完整配置

```yaml
# docker-compose.yml
version: '3.8'

services:
    aiflow-hub:
        image: ghcr.io/ktz03/aiflow-hub:latest
        container_name: aiflow-hub
        restart: unless-stopped
        ports:
            - '3000:3000'
        environment:
            # 基础配置
            - PORT=3000
            - DATABASE_TYPE=sqlite
            - DATABASE_PATH=/root/.flowise

            # 安全配置
            - JWT_SECRET=${JWT_SECRET}
            - CORS_ORIGINS=*

            # 日志配置
            - LOG_LEVEL=info
            - LOG_PATH=/root/.flowise/logs

            # 存储配置
            - BLOB_STORAGE_PATH=/root/.flowise/storage
            - FLOWISE_FILE_SIZE_LIMIT=50mb
        volumes:
            - aiflow-data:/root/.flowise
        healthcheck:
            test: ['CMD', 'curl', '-f', 'http://localhost:3000/api/v1/ping']
            interval: 30s
            timeout: 10s
            retries: 3

volumes:
    aiflow-data:
```

---

## 手动部署

### 1. 安装依赖

```bash
# 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# 安装 pnpm
npm install -g pnpm
```

### 2. 克隆并构建

```bash
# 克隆仓库
git clone https://github.com/ktz03/AIFlowHub.git
cd AIFlowHub

# 安装依赖
pnpm install

# 构建项目
pnpm build
```

### 3. 配置环境变量

```bash
# 创建环境变量文件
cat > .env << EOF
# 服务配置
PORT=3000
DATABASE_TYPE=sqlite
DATABASE_PATH=./data

# 安全配置
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_PATH=./logs

# 存储配置
BLOB_STORAGE_PATH=./storage
EOF
```

### 4. 启动服务

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm start
```

### 5. 使用 PM2 管理进程 (推荐)

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start pnpm --name "aiflow-hub" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs aiflow-hub
```

---

## 配置说明

### 环境变量

| 变量名                    | 说明                         | 默认值                 |
| ------------------------- | ---------------------------- | ---------------------- |
| `PORT`                    | 服务端口                     | 3000                   |
| `DATABASE_TYPE`           | 数据库类型 (sqlite/postgres) | sqlite                 |
| `DATABASE_PATH`           | SQLite 数据库路径            | /root/.flowise         |
| `JWT_SECRET`              | JWT 签名密钥                 | (必填)                 |
| `JWT_EXPIRES_IN`          | Token 过期时间               | 7d                     |
| `CORS_ORIGINS`            | 允许的跨域来源               | \*                     |
| `LOG_LEVEL`               | 日志级别                     | info                   |
| `LOG_PATH`                | 日志存储路径                 | /root/.flowise/logs    |
| `BLOB_STORAGE_PATH`       | 文件存储路径                 | /root/.flowise/storage |
| `FLOWISE_FILE_SIZE_LIMIT` | 上传文件大小限制             | 50mb                   |

### PostgreSQL 配置 (可选)

如需使用 PostgreSQL 替代 SQLite：

```bash
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=aiflow_hub
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
```

---

## 常见问题

### Q1: 启动时报内存不足错误

**解决方案**: 增加 Node.js 内存限制

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm start
```

### Q2: Docker 构建失败

**解决方案**: 确保 Docker 有足够的资源

```bash
# 增加 Docker 内存限制 (Docker Desktop)
# Settings -> Resources -> Memory: 8GB+
```

### Q3: 无法连接数据库

**解决方案**: 检查数据库配置和权限

```bash
# SQLite: 确保目录存在且有写权限
mkdir -p /root/.flowise
chmod 755 /root/.flowise

# PostgreSQL: 确保数据库已创建
psql -U postgres -c "CREATE DATABASE aiflow_hub;"
```

### Q4: 国产模型调用失败

**解决方案**: 检查 API Key 配置

1. 确保 API Key 正确无误
2. 检查网络是否能访问模型 API
3. 查看服务日志获取详细错误信息

### Q5: 如何备份数据

```bash
# SQLite 备份
cp /root/.flowise/flowise.db /backup/flowise-$(date +%Y%m%d).db

# Docker 卷备份
docker run --rm -v aiflow-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/aiflow-backup-$(date +%Y%m%d).tar.gz /data
```

---

## 升级指南

### Docker 升级

```bash
# 拉取最新镜像
docker pull ghcr.io/ktz03/aiflow-hub:latest

# 停止并删除旧容器
docker-compose down

# 启动新容器
docker-compose up -d
```

### 手动升级

```bash
# 备份数据
cp -r ./data ./data.backup

# 拉取最新代码
git pull origin main

# 重新安装依赖
pnpm install

# 重新构建
pnpm build

# 运行数据库迁移
pnpm migration:run

# 重启服务
pm2 restart aiflow-hub
```

---

## 技术支持

-   GitHub Issues: https://github.com/ktz03/AIFlowHub/issues
-   文档: https://github.com/ktz03/AIFlowHub/wiki
