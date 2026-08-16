# 离线使用本地 LLM（Ollama）指南

本项目已经内置 `ChatOllama` / `Ollama` 节点，可直接接入本地模型。  
本文档用于快速完成离线部署，避免依赖外部云模型服务。

## 1. 启动离线服务

在 `docker` 目录执行：

```bash
docker compose -f docker-compose.offline.yml up -d
```

启动后会包含两个服务：

-   `aiflow-hub`：Flowise 主服务（默认 `http://localhost:3000`）
-   `ollama`：本地模型服务（默认 `http://localhost:11434`）

## 2. 下载本地模型

首次使用需拉取模型（只需执行一次）：

```bash
docker exec -it ollama ollama pull qwen2.5:7b
```

你也可以替换为其他模型，例如：

-   `llama3.1:8b`
-   `deepseek-r1:7b`
-   `nomic-embed-text`（向量模型）

查看已安装模型：

```bash
docker exec -it ollama ollama list
```

## 3. 在系统中配置模型节点

进入 Flowise 页面后新增节点：

-   聊天模型：`ChatOllama`
-   或通用模型：`Ollama`

关键配置：

-   `Base URL`：`http://ollama:11434`（容器内网络）
-   `Model Name`：如 `qwen2.5:7b`

如果你是在宿主机直接运行 Flowise（非容器），则使用：

-   `Base URL`：`http://localhost:11434`

## 4. 验证是否离线可用

1. 断开外网（或禁用代理）
2. 保持本机 Docker 服务运行
3. 在 Flowise 里调用 `ChatOllama` 节点测试问答

只要模型已拉取到本地并且 `ollama` 服务正常，系统即可离线使用。

## 5. 常见问题

-   端口占用：修改 `docker-compose.offline.yml` 中映射端口
-   模型下载慢：可先在网络环境下完成 `ollama pull`，离线场景复用本地缓存
-   显存不足：改用更小模型（如 `3b` / `1.5b`）
