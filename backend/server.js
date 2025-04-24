require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai"); // 使用 OpenAI 官方 SDK
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000; // 使用 3000 端口避免冲突

// 创建上传目录
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置文件存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// 创建 multer 实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 限制文件大小为 10MB
  }
});

// 中间件
app.use(cors()); // 启用 CORS (允许所有来源)
app.use(express.json()); // 解析 JSON 请求体
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 静态文件服务

// 环境变量中的 API 密钥
const DEFAULT_API_KEY = process.env.OPENAI_API_KEY;

// 初始化 OpenAI 客户端
// 仅当环境变量中有 API 密钥时才初始化
let openai;
if (DEFAULT_API_KEY) {
  openai = new OpenAI({
    apiKey: DEFAULT_API_KEY,
  });
}

// 其他提供商的 API 端点
const API_ENDPOINTS = {
  openai: "https://api.openai.com/v1/chat/completions",
  anthropic: "https://api.anthropic.com/v1/messages",
  deepseek: "https://api.deepseek.com/v1/chat/completions",
};

// 可用模型列表
const AVAILABLE_MODELS = [
  // OpenAI 模型
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai" },
  { id: "gpt-4", name: "GPT-4", provider: "openai" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  // 其他提供商模型（保留但默认使用 OpenAI 格式请求）
  { id: "claude-3-opus", name: "Claude 3 Opus", provider: "anthropic" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet", provider: "anthropic" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", provider: "anthropic" },
  { id: "deepseek-chat", name: "DeepSeek Chat", provider: "deepseek" },
  { id: "deepseek-coder", name: "DeepSeek Coder", provider: "deepseek" },
];

// 用于测试的基础路由
app.get("/", (req, res) => {
  res.send("LLM Chat Backend is running!");
});

// 获取可用模型列表
app.get("/api/models", (req, res) => {
  res.json(AVAILABLE_MODELS);
});

// 聊天 API 端点
app.post("/api/chat", async (req, res) => {
  // 从请求体中获取参数
  const { message, messages, model, apiKey, endpoint, systemPrompt, stream = true, file } = req.body;

  if (!message && (!messages || messages.length === 0)) {
    console.error("Missing message or messages in request body:", req.body);
    return res.status(400).json({
      error: "Either message or messages is required in the request body",
      receivedBody: req.body,
    });
  }

  // 如果有文件，尝试读取文件内容
  let fileContent = null;
  if (file && file.path) {
    console.log('收到文件信息:', JSON.stringify(file));
    try {
      // 处理路径，兼容不同的路径格式
      let relativePath = file.path;
      if (relativePath.startsWith('/uploads/')) {
        relativePath = relativePath.replace(/^\/uploads\//, 'uploads/');
      } else if (relativePath.startsWith('uploads/')) {
        // 已经是相对路径，不需要处理
      } else {
        relativePath = 'uploads/' + file.filename; // 假设文件在 uploads 目录下
      }

      const filePath = path.join(__dirname, relativePath);
      console.log('尝试读取文件:', filePath);

      if (fs.existsSync(filePath)) {
        // 读取文件内容
        fileContent = fs.readFileSync(filePath, 'utf8');
        console.log(`成功读取文件: ${file.filename}, 内容长度: ${fileContent.length}`);
      } else {
        console.error(`文件不存在: ${filePath}`);
        // 尝试列出 uploads 目录中的文件
        const uploadsDir = path.join(__dirname, 'uploads');
        if (fs.existsSync(uploadsDir)) {
          const files = fs.readdirSync(uploadsDir);
          console.log('当前 uploads 目录中的文件:', files);
        }
      }
    } catch (error) {
      console.error(`读取文件失败: ${error.message}`);
    }
  }

  // 使用提供的API密钥或默认密钥
  const useApiKey = apiKey || DEFAULT_API_KEY;

  // 如果没有 API 密钥，返回错误
  if (!useApiKey) {
    console.error("API key is missing. Please provide an API key.");
    return res.status(500).json({
      error:
        "API key not configured. Please provide an API key in the settings.",
    });
  }

  // 使用提供的模型或默认模型
  const useModel = model || "gpt-3.5-turbo";

  // 设置 SSE (Server-Sent Events) 的响应头
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders(); // 刷新响应头以建立连接

  // 准备消息数组
  let apiMessages = [];

  // 使用自定义系统提示或默认提示
  const defaultSystemPrompt = "You are a helpful assistant.";
  const systemMessage = { role: "system", content: systemPrompt || defaultSystemPrompt };

  // 如果提供了消息历史，使用它
  if (messages && messages.length > 0) {
    // 处理消息历史，如果有文件则添加文件内容
    const processedMessages = messages.map(msg => {
      // 如果是用户消息并且有文件属性
      if (msg.role === 'user' && msg.file && fileContent) {
        // 检查文件内容大小，如果过大则截断
        const MAX_FILE_CONTENT_LENGTH = 300000; // 大约 30k 个字符，约为 7.5k 个 token
        let truncatedContent = fileContent;

        if (fileContent.length > MAX_FILE_CONTENT_LENGTH) {
          console.log(`消息历史中的文件内容过大 (${fileContent.length} 字符)，已截断到 ${MAX_FILE_CONTENT_LENGTH} 字符`);
          truncatedContent = fileContent.substring(0, MAX_FILE_CONTENT_LENGTH) +
            `\n\n... [文件内容过大，已截断。原文件大小: ${fileContent.length} 字符]`;
        }

        // 在消息中添加文件内容
        return {
          role: msg.role,
          content: `${msg.content}\n\n文件内容:\n\`\`\`\n${truncatedContent}\n\`\`\``
        };
      }
      return msg;
    });

    // 确保系统消息在最前面
    apiMessages = [
      systemMessage,
      ...processedMessages,
    ];
  } else {
    // 否则只使用当前消息
    let userContent = message;

    // 如果有文件内容，添加到消息中
    if (fileContent) {
      // 检查文件内容大小，如果过大则截断
      const MAX_FILE_CONTENT_LENGTH = 30000; // 大约 30k 个字符，约为 7.5k 个 token
      let truncatedContent = fileContent;

      if (fileContent.length > MAX_FILE_CONTENT_LENGTH) {
        console.log(`文件内容过大 (${fileContent.length} 字符)，已截断到 ${MAX_FILE_CONTENT_LENGTH} 字符`);
        truncatedContent = fileContent.substring(0, MAX_FILE_CONTENT_LENGTH) +
          `\n\n... [文件内容过大，已截断。原文件大小: ${fileContent.length} 字符]`;
      }

      userContent = `${message}\n\n文件内容:\n\`\`\`\n${truncatedContent}\n\`\`\``;
    }

    apiMessages = [
      systemMessage,
      { role: "user", content: userContent },
    ];
  }

  console.log(
    "Sending request to API with messages:",
    JSON.stringify(apiMessages, null, 2)
  );

  try {
    // 创建一个新的 OpenAI 实例
    // 如果提供了自定义 API 密钥，使用它；否则使用全局实例（如果存在）
    const clientOptions = {
      apiKey: useApiKey
    };

    // 只有当提供了自定义端点时才设置 baseURL
    if (endpoint) {
      clientOptions.baseURL = endpoint;
    }

    console.log('创建 OpenAI 客户端使用的选项:', clientOptions);
    const client = new OpenAI(clientOptions);

    console.log('开始发送请求到 OpenAI API, 模型:', useModel);

    try {
      // 根据请求参数决定是否使用流式输出
      if (stream) {
        console.log('使用流式输出模式');
        // 使用 OpenAI SDK 发送流式请求
        const streamResponse = await client.chat.completions.create({
          model: useModel,
          messages: apiMessages,
          stream: true,
        });

        console.log('成功创建流式请求');

        // 处理流式响应
        for await (const chunk of streamResponse) {
          // 提取内容
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            // 发送内容到客户端
            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
          }
        }
      } else {
        console.log('使用非流式输出模式');
        // 非流式输出，一次性返回完整响应
        const completion = await client.chat.completions.create({
          model: useModel,
          messages: apiMessages,
          stream: false,
        });

        // 输出完整响应以便调试
        console.log("API 响应完整内容:", JSON.stringify(completion, null, 2));

        // 处理不同 API 响应格式
        let content = "";

        // 尝试不同的响应格式
        if (completion.choices && completion.choices[0]) {
          // OpenAI 标准格式
          if (completion.choices[0].message && completion.choices[0].message.content) {
            content = completion.choices[0].message.content;
          }
          // OpenRouter 可能的格式
          else if (completion.choices[0].content) {
            content = completion.choices[0].content;
          }
          // 其他可能的格式
          else if (completion.choices[0].text) {
            content = completion.choices[0].text;
          }
        }
        // 如果没有 choices 属性，尝试其他可能的格式
        else if (completion.content) {
          content = typeof completion.content === 'string' ? completion.content : JSON.stringify(completion.content);
        }
        else if (completion.text) {
          content = completion.text;
        }
        else if (completion.output) {
          content = typeof completion.output === 'string' ? completion.output : JSON.stringify(completion.output);
        }
        // 如果所有尝试都失败，将整个响应转为字符串
        else {
          content = `API 响应无法解析为文本内容。原始响应: ${JSON.stringify(completion)}`;
        }

        console.log("Extracted content from API response, length:", content.length);

        // 发送完整响应
        res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
      }

      // 流结束
      console.log("API request completed successfully.");
      res.write('data: {"event": "done"}\n\n');
      res.end();
    } catch (streamError) {
      console.error("Error in stream processing:", streamError);

      // 如果响应头已发送
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: `Stream error: ${streamError.message}` })}\n\n`);
        res.write('data: {"event": "done"}\n\n');
        res.end();
      } else {
        res.status(500).json({ error: `Error in stream: ${streamError.message}` });
      }
    }
  } catch (error) {
    console.error("Error calling OpenAI API:", error);

    // 如果响应头已发送
    if (res.headersSent) {
      res.write(
        `data: ${JSON.stringify({ error: `Error: ${error.message}` })}\n\n`
      );
      res.end();
    } else {
      res.status(500).json({ error: `Error calling API: ${error.message}` });
    }
  }
});

// 文件上传路由
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有收到文件' });
  }

  // 返回文件信息
  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}` // 客户端可访问的路径
    }
  });
});

// 获取所有上传的文件
app.get('/api/files', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: '读取文件列表失败' });
    }

    // 过滤掉隐藏文件
    const visibleFiles = files.filter(file => !file.startsWith('.'));

    // 获取文件详细信息
    const fileDetails = visibleFiles.map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        path: `/uploads/${filename}`,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });

    res.json(fileDetails);
  });
});

// 删除文件
app.delete('/api/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);

  // 验证文件名以防止路径遍历攻击
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: '无效的文件名' });
  }

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  // 删除文件
  fs.unlink(filePath, err => {
    if (err) {
      return res.status(500).json({ error: `删除文件失败: ${err.message}` });
    }
    res.json({ success: true, message: '文件已成功删除' });
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
