# AI 智能助手项目

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

基于 Vue3 + Element Plus + Node.js 的智能对话应用，支持多种大语言模型 API，包括 DeepSeek、OpenAI 和 Anthropic 等。

## 项目结构

```
llm-chat-app/
├── backend/        # 后端服务(Node.js + Express)
├── frontend/       # 前端应用(Vue3 + Element Plus)
├── .gitignore      # Git 忽略文件配置
├── .gitattributes  # Git 属性配置
├── .editorconfig   # 编辑器配置
├── package.json    # 项目配置文件
└── README.md       # 项目说明文档
```

## 环境准备

1. Node.js 16+
2. npm 8+
3. LLM API Key (可选择 DeepSeek、OpenAI 或 Anthropic 等)

## 快速启动

### 后端服务

```bash
cd backend
npm install

# 生产环境启动
npm start

# 开发环境启动（使用 nodemon 自动重启）
npm run dev
```

服务将运行在: http://localhost:3001

### 前端应用

```bash
cd frontend
npm install
npm run dev
```

应用将运行在: http://localhost:5173

## 配置说明

### 后端配置

在 `backend/.env` 文件中配置 (可从 `.env.example` 复制并修改):

```ini
# 主要 API 密钥
OPENAI_API_KEY=your_openai_api_key_here

# 其他提供商 API 密钥（可选）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# 服务器配置
PORT=3000
```

### 前端配置

前端API基础URL在 `frontend/src/App.vue` 中配置:

```javascript
const backendUrlBase = 'http://localhost:3000/api/chat';
```

### 用户配置

用户可以通过设置面板配置以下项目:

1. **API 提供商**: 用户可以选择不同的 API 提供商 (DeepSeek、OpenAI、Anthropic)
2. **API 密钥**: 用户可以输入自己的 API 密钥
3. **模型选择**: 用户可以选择不同的模型
4. **API 端点**: 高级用户可以自定义 API 端点

这些设置将保存在浏览器的本地存储中，确保隐私和安全。

## 功能特性

- 实时流式对话响应
- Markdown 格式回复渲染
- 代码高亮显示
- 响应式布局，适配各种设备
- 错误处理和重试机制
- 支持多种 LLM 提供商和模型选择
- 用户自定义 API 密钥和端点配置
- 聊天历史记录保存

## 开发建议

1. 先启动后端服务，再启动前端
2. 开发时可以使用 `npm run dev` 启动开发模式（后端使用 nodemon 热重载）
3. 生产构建使用 `npm run build`
4. 使用 `npm run install:all` 安装所有依赖
5. 使用 `npm run start` 同时启动前端和后端（生产模式）

## 贡献

欢迎提交 Pull Request 或提出 Issue。详细信息请参考 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
