import { ref } from 'vue';
import { generateId } from '../utils/helpers';
import { thinkingModeEnabled, supportsThinkingMode } from './thinkingModeService';

// 聊天状态
export const messages = ref([]);
export const chatHistory = ref([]);
export const currentChatId = ref('');
export const isLoading = ref(false);
export const newMessage = ref('');
export let nextMessageId = 0;

/**
 * 创建新聊天
 */
export const createNewChat = () => {
  const chatId = generateId();
  const timestamp = new Date().toISOString();

  chatHistory.value.push({
    id: chatId,
    title: '新对话',
    timestamp,
    messages: []
  });

  // 保存聊天历史
  saveChatHistory();

  // 切换到新聊天
  switchChat(chatId);
};

/**
 * 切换聊天
 * @param {string} chatId - 聊天ID
 */
export const switchChat = (chatId) => {
  currentChatId.value = chatId;

  // 查找对应的聊天记录
  const chat = chatHistory.value.find(c => c.id === chatId);
  if (!chat) {
    messages.value = [];
    return;
  }

  // 加载消息
  messages.value = [...chat.messages];

  // 重置消息ID计数器
  nextMessageId = messages.value.length > 0 ?
    Math.max(...messages.value.map(m => m.id)) + 1 : 0;

  // 滚动到底部
  setTimeout(() => {
    const chatMain = document.querySelector('.chat-main');
    if (chatMain) chatMain.scrollTop = chatMain.scrollHeight;
  }, 0);
};

/**
 * 删除聊天
 * @param {string} chatId - 聊天ID
 */
export const deleteChat = (chatId) => {
  // 从历史记录中删除
  chatHistory.value = chatHistory.value.filter(c => c.id !== chatId);

  // 保存聊天历史
  saveChatHistory();

  // 如果删除的是当前聊天，切换到第一个聊天或创建新聊天
  if (chatId === currentChatId.value) {
    if (chatHistory.value.length > 0) {
      switchChat(chatHistory.value[0].id);
    } else {
      createNewChat();
    }
  }
};

/**
 * 更新聊天标题
 * @param {string} chatId - 聊天ID
 * @param {string} title - 新标题
 */
export const updateChatTitle = (chatId, title) => {
  const chat = chatHistory.value.find(c => c.id === chatId);
  if (chat) {
    chat.title = title;
    saveChatHistory();
  }
};

/**
 * 保存聊天历史到本地存储
 */
export const saveChatHistory = () => {
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value));
};

/**
 * 从本地存储加载聊天历史
 */
export const loadChatHistory = () => {
  const savedHistory = localStorage.getItem('chatHistory');
  if (savedHistory) {
    try {
      chatHistory.value = JSON.parse(savedHistory);

      // 如果有聊天历史，切换到第一个聊天
      if (chatHistory.value.length > 0) {
        switchChat(chatHistory.value[0].id);
      } else {
        // 否则创建新聊天
        createNewChat();
      }
    } catch (e) {
      console.error('加载聊天历史失败:', e);
      createNewChat();
    }
  } else {
    // 没有聊天历史，创建新聊天
    createNewChat();
  }
};

/**
 * 发送消息
 * @param {string} apiKey - API密钥
 * @param {string} selectedModel - 选中的模型
 * @param {string} selectedProvider - 选中的提供商
 * @param {string} apiEndpoint - API端点
 */
export const sendMessage = async (apiKey, selectedModel, selectedProvider, apiEndpoint) => {
  if (!newMessage.value.trim() || isLoading.value) return;

  // 添加用户消息
  const userMessage = {
    id: nextMessageId++,
    sender: 'user',
    text: newMessage.value,
    timestamp: new Date().toISOString()
  };

  messages.value.push(userMessage);
  newMessage.value = '';

  // 更新聊天历史
  const chat = chatHistory.value.find(c => c.id === currentChatId.value);
  if (chat) {
    chat.messages = [...messages.value];

    // 如果是第一条消息，更新聊天标题
    if (chat.messages.length === 1) {
      chat.title = userMessage.text.substring(0, 30) + (userMessage.text.length > 30 ? '...' : '');
    }

    saveChatHistory();
  }

  // 滚动到底部
  setTimeout(() => {
    const chatMain = document.querySelector('.chat-main');
    if (chatMain) chatMain.scrollTop = chatMain.scrollHeight;
  }, 0);

  // 准备发送请求
  isLoading.value = true;

  // 添加临时AI消息
  const tempAiMessageId = nextMessageId++;
  messages.value.push({
    id: tempAiMessageId,
    sender: 'llm',
    text: '思考中...',
    timestamp: new Date().toISOString(),
    model: selectedModel
  });

  try {
    // 准备请求数据
    // 获取所有历史消息和最后一条用户消息
    const filteredMessages = messages.value.filter(m => m.id !== tempAiMessageId);
    const lastUserMessage = filteredMessages.filter(m => m.sender === 'user').pop();

    if (!lastUserMessage) {
      throw new Error('找不到用户消息');
    }

    // 构建消息历史数组，用于上下文理解
    const messageHistory = filteredMessages.map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    const requestData = {
      model: selectedModel,
      provider: selectedProvider,
      apiKey: apiKey, // 使用 apiKey 而不是 api_key
      message: lastUserMessage.text, // 发送最后一条用户消息
      messages: messageHistory // 发送完整的消息历史供模型参考
    };

    // 添加API端点参数（如果已提供）
    if (apiEndpoint) {
      requestData.endpoint = apiEndpoint;
    }

    // 添加思考模式参数（如果开启）
    if (thinkingModeEnabled.value && supportsThinkingMode(selectedModel)) {
      requestData.thinking_mode = true;
    }

    // 创建一个空的响应文本变量
    let responseText = '';

    // 发送请求
    // 直接使用 /api/chat 端点对接模型
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('API请求失败:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`API请求失败: ${response.status} - ${errorText || response.statusText}`);
    }

    // 获取响应流
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    // 循环读取流数据
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      // 解码数据块
      const chunk = decoder.decode(value, { stream: true });
      console.log('Received chunk:', chunk);

      // 处理 SSE 格式的数据
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = line.substring(5).trim();

          // 处理流结束信号
          if (data === '[DONE]' || data.includes('"event": "done"')) {
            console.log('Stream completed');
            continue;
          }

          try {
            // 尝试解析 JSON
            const parsed = JSON.parse(data);

            // 提取文本内容
            let content = null;

            if (parsed.text) {
              content = parsed.text;
            } else if (parsed.choices && parsed.choices[0]) {
              if (parsed.choices[0].delta && parsed.choices[0].delta.content) {
                content = parsed.choices[0].delta.content;
              } else if (parsed.choices[0].message && parsed.choices[0].message.content) {
                content = parsed.choices[0].message.content;
              }
            }

            if (content) {
              // 累加响应文本
              responseText += content;

              // 实时更新消息
              const aiMessageIndex = messages.value.findIndex(m => m.id === tempAiMessageId);
              if (aiMessageIndex !== -1) {
                messages.value[aiMessageIndex] = {
                  ...messages.value[aiMessageIndex],
                  text: responseText
                };

                // 更新聊天历史
                const chat = chatHistory.value.find(c => c.id === currentChatId.value);
                if (chat) {
                  chat.messages = [...messages.value];
                  // 不需要在每次更新时都保存，可以减少写入操作
                }
              }
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, data);
          }
        }
      }
    }

    // 完成后保存聊天历史
    saveChatHistory();

    // 构造最终数据对象
    const data = { text: responseText };

    // 更新AI消息
    const aiMessageIndex = messages.value.findIndex(m => m.id === tempAiMessageId);
    if (aiMessageIndex !== -1) {
      messages.value[aiMessageIndex] = {
        id: tempAiMessageId,
        sender: 'llm',
        text: data.text || data.message || '服务器返回了空响应',
        timestamp: new Date().toISOString(),
        model: selectedModel
      };
    }

    // 更新聊天历史
    if (chat) {
      chat.messages = [...messages.value];
      saveChatHistory();
    }

    // 滚动到底部
    setTimeout(() => {
      const chatMain = document.querySelector('.chat-main');
      if (chatMain) chatMain.scrollTop = chatMain.scrollHeight;
    }, 0);
  } catch (error) {
    console.error('发送消息失败:', error);

    // 更新AI消息为错误信息
    const aiMessageIndex = messages.value.findIndex(m => m.id === tempAiMessageId);
    if (aiMessageIndex !== -1) {
      messages.value[aiMessageIndex] = {
        id: tempAiMessageId,
        sender: 'llm',
        text: `发生错误: ${error.message}`,
        timestamp: new Date().toISOString(),
        model: selectedModel
      };
    }

    // 更新聊天历史
    if (chat) {
      chat.messages = [...messages.value];
      saveChatHistory();
    }
  } finally {
    isLoading.value = false;
  }
};
