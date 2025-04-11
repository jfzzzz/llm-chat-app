# AI 智能助手项目

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

基于 Vue3 + Element Plus + Node.js 的智能对话应用，支持多种 LLM API。

## 项目结构

```
llm-chat-app/
├── backend/        # 后端服务(Node.js + Express)
├── frontend/       # 前端应用(Vue3 + Element Plus)
└── README.md       # 项目说明文档
```

## 环境准备

1. Node.js 16+
2. npm 8+
3. DeepSeek API Key (配置在 backend/.env 文件)

## 快速启动

### 后端服务

```bash
cd backend
npm install
npm start
```

服务将运行在: http://localhost:3000

### 前端应用

```bash
cd frontend
npm install
npm run dev
```

应用将运行在: http://localhost:5173

## 配置说明

### 后端配置

在 `backend/.env` 文件中配置:

```ini
DEEPSEEK_API_KEY=your_api_key_here
PORT=3000
```

### 前端配置

前端API基础URL在 `frontend/src/App.vue` 中配置:

```javascript
const backendUrlBase = 'http://localhost:3000/api/chat';
```

### 用户配置

用户可以通过设置面板配置以下项目:

1. **API 密钥**: 用户可以输入自己的 DeepSeek API 密钥
2. **模型选择**: 用户可以选择不同的 DeepSeek 模型

这些设置将保存在浏览器的本地存储中。

## 功能特性

- 实时流式对话
- Markdown 格式回复渲染
- 响应式布局
- 错误处理和重试机制
- 支持多种模型选择
- 用户自定义 API 密钥配置

## 开发建议

1. 先启动后端服务，再启动前端
2. 开发时可以使用 `npm run dev` 热重载
3. 生产构建使用 `npm run build`

## 贡献

欢迎提交 Pull Request 或提出 Issue。详细信息请参考 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 初始化 Git 仓库

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 初始提交
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin <你的远程仓库URL>

# 推送到远程仓库
git push -u origin main
```

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
