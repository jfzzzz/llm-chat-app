require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { PassThrough } = require('stream'); // 用于管道化流

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors()); // 启用 CORS (允许所有来源)
app.use(express.json()); // 解析 JSON 请求体

// DeepSeek API 配置
const DEFAULT_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // 确认使用正确的 API 端点

// 可用模型列表
const AVAILABLE_MODELS = [
  { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek' },
  { id: 'deepseek-lite', name: 'DeepSeek Lite', provider: 'deepseek' },
  { id: 'deepseek-v2', name: 'DeepSeek V2', provider: 'deepseek' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic' }
];

// 用于测试的基础路由
app.get('/', (req, res) => {
  res.send('LLM Chat Backend is running!');
});

// 获取可用模型列表
app.get('/api/models', (req, res) => {
  res.json(AVAILABLE_MODELS);
});

// 聊天 API 端点
app.post('/api/chat', async (req, res) => {
  // 从请求体中获取参数
  const { message, model, apiKey, provider, endpoint } = req.body;

  if (!message) {
    return res.status(400).send('Message is required in the request body');
  }

  // 使用提供的API密钥或默认密钥
  const useApiKey = apiKey || DEFAULT_API_KEY;

  if (!useApiKey) {
    console.error('API key is missing. Please provide an API key.');
    return res.status(500).send('API key not configured');
  }

  // 使用提供的模型或默认模型
  const useModel = model || 'deepseek-chat';

  // 使用提供的API端点或默认端点
  const useEndpoint = endpoint || DEEPSEEK_API_URL;

  // 注意：我们不再验证模型，因为用户可能使用自定义模型

  // 设置 SSE (Server-Sent Events) 的响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // 刷新响应头以建立连接

  try {
    const response = await axios.post(
      useEndpoint,
      {
        model: useModel, // 使用选定的模型
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message }
        ],
        stream: true, // 启用流式传输
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${useApiKey}`,
          'Accept': 'text/event-stream' // 对于某些流式 API 很重要
        },
        responseType: 'stream' // 告知 axios 将响应作为流处理
      }
    );

    // 将来自 API 的流直接通过管道传输到客户端响应
    response.data.on('data', (chunk) => {
      try {
        // 将数据块转换为字符串
        const chunkStr = chunk.toString();
        console.log('Received chunk:', chunkStr); // 调试日志

        // 分割单个数据块中可能包含的多个事件
        const lines = chunkStr.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          // 处理标准的 SSE 格式
          if (line.startsWith('data:')) {
            const jsonData = line.substring(5).trim(); // 移除 'data: ' 前缀

            // 处理流结束信号
            if (jsonData === '[DONE]') {
              res.write('data: {"event": "done"}\n\n'); // 发送自定义的完成事件
              res.end(); // 关闭连接
              return;
            }

            try {
              // 尝试解析 JSON
              const parsed = JSON.parse(jsonData);

              // 处理不同的 API 响应格式
              let content = null;

              // OpenAI/DeepSeek 格式
              if (parsed.choices && parsed.choices[0]) {
                if (parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  content = parsed.choices[0].delta.content;
                } else if (parsed.choices[0].message && parsed.choices[0].message.content) {
                  content = parsed.choices[0].message.content;
                }
              }
              // Anthropic 格式
              else if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
                content = parsed.delta.text;
              }
              // Gemini 格式
              else if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
                const parts = parsed.candidates[0].content.parts;
                if (parts && parts.length > 0) {
                  content = parts[0].text || parts[0];
                }
              }
              // 通用处理，尝试从各种可能的路径提取内容
              else if (parsed.content) {
                content = typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content);
              }
              else if (parsed.text) {
                content = parsed.text;
              }

              if (content) {
                // 发送内容到客户端
                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              }
            } catch (parseError) {
              console.error('Failed to parse stream chunk JSON:', parseError, 'Chunk:', jsonData);
              // 如果无法解析为 JSON，尝试直接发送文本
              if (jsonData && jsonData !== '[DONE]') {
                res.write(`data: ${JSON.stringify({ text: jsonData })}\n\n`);
              }
            }
          } else if (line.trim() !== '') {
            // 如果不是标准 SSE 格式，但不是空行，尝试直接发送
            try {
              // 尝试解析为 JSON
              const parsed = JSON.parse(line);
              let content = null;

              // 尝试从各种可能的路径提取内容
              if (parsed.choices && parsed.choices[0]) {
                if (parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  content = parsed.choices[0].delta.content;
                } else if (parsed.choices[0].message && parsed.choices[0].message.content) {
                  content = parsed.choices[0].message.content;
                }
              } else if (parsed.content) {
                content = typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content);
              } else if (parsed.text) {
                content = parsed.text;
              }

              if (content) {
                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              }
            } catch (e) {
              // 如果不是 JSON，尝试直接发送文本
              res.write(`data: ${JSON.stringify({ text: line })}\n\n`);
            }
          }
        }
      } catch (error) {
        console.error('Error processing stream chunk:', error);
        // 如果发生错误，尝试直接发送原始数据
        try {
          res.write(`data: ${JSON.stringify({ text: chunk.toString() })}\n\n`);
        } catch (e) {
          console.error('Failed to send error chunk:', e);
        }
      }
    });

    response.data.on('end', () => {
      console.log('API stream ended.');
      res.write('data: {"event": "done"}\n\n'); // 确保在没有收到 [DONE] 信号时也发送完成事件
      res.end(); // 关闭 SSE 连接
    });

    response.data.on('error', (streamError) => {
      console.error('Error in API stream:', streamError);
      res.write(`data: ${JSON.stringify({ error: 'Stream error occurred: ' + streamError.message })}\n\n`);
      res.end(); // 在流错误时关闭连接
    });

  } catch (error) {
    console.error('Error calling API:', error);
    console.error('Error details:', error.response ? {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    } : error.message);

    // 如果响应头已发送且在流设置期间失败，则不要尝试写入响应
    if (!res.headersSent) {
      // 构建详细的错误消息
      let errorMessage = 'Failed to connect to API';
      if (error.response) {
        errorMessage += `: ${error.response.status} ${error.response.statusText}`;
        if (error.response.data) {
          try {
            const errorData = typeof error.response.data === 'string'
              ? error.response.data
              : JSON.stringify(error.response.data);
            errorMessage += ` - ${errorData}`;
          } catch (e) {
            errorMessage += ' - Error details available in server logs';
          }
        }
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      res.status(500).send(errorMessage);
    } else {
      // 如果流已建立但稍后失败，尝试发送错误事件
      let errorMessage = 'API connection failed';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
