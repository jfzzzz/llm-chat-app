<template>
  <el-container class="app-container">
    <!-- 侧边栏 - 对话历史 -->
    <el-aside width="250px" class="chat-sidebar">
      <div class="sidebar-header">
        <h2>对话历史</h2>
        <el-button @click="createNewChat" type="primary" size="small" plain>
          <el-icon><Plus /></el-icon> 新对话
        </el-button>
      </div>

      <div class="chat-list">
        <el-scrollbar>
          <div
            v-for="chat in chatHistory"
            :key="chat.id"
            :class="['chat-item', { active: currentChatId === chat.id }]"
            @click="switchChat(chat.id)"
          >
            <div class="chat-item-content">
              <el-icon><ChatDotRound /></el-icon>
              <span class="chat-title">{{ chat.title || '新对话' }}</span>
            </div>
            <div class="chat-actions">
              <el-popconfirm
                title="确定要删除这个对话吗？"
                @confirm="deleteChat(chat.id)"
                width="200"
              >
                <template #reference>
                  <el-button size="small" type="danger" circle plain>
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </el-aside>

    <!-- 主聊天区域 -->
    <el-container class="chat-container">
      <!-- 聊天应用头部 -->
      <el-header class="chat-header">
        <div class="header-content">
          <div class="header-left">
            <el-button
              @click="toggleSidebar"
              type="text"
              class="toggle-sidebar-btn"
            >
              <el-icon><Menu /></el-icon>
            </el-button>
            <h1>{{ currentChat?.title || 'AI 智能助手' }}</h1>
          </div>
          <div class="header-right">
            <el-button @click="openSettings" type="primary" plain size="small">
              <el-icon><Setting /></el-icon> 设置
            </el-button>
          </div>
        </div>
      </el-header>

      <!-- 聊天内容区域 -->
      <el-main class="chat-main">
        <!-- 消息列表循环 -->
        <div v-for="msg in messages" :key="msg.id" :class="['message-row', msg.sender]">
          <div class="avatar-container">
            <!-- 用户头像 -->
            <div v-if="msg.sender === 'user'" class="avatar user-avatar">
              <span>U</span>
            </div>
            <!-- AI头像，显示模型首字母 -->
            <div v-else class="avatar ai-avatar">
              <span>{{ getModelInitial(msg.model) }}</span>
            </div>
          </div>
          <el-card class="message-card" :body-style="{ padding: '15px 20px' }">
            <!-- 消息模型标记 -->
            <div v-if="msg.sender === 'llm' && msg.model" class="model-tag">
              {{ getModelName(msg.model) }}
            </div>
            <!-- 用户消息显示为纯文本 -->
            <div v-if="msg.sender === 'user'" class="message-content">{{ msg.text }}</div>
            <!-- AI消息渲染为Markdown格式 -->
            <div v-else class="message-content" v-html="renderMarkdown(msg.text)"></div>
          </el-card>
        </div>

        <!-- 加载状态指示器 -->
        <div v-if="isLoading" class="loading-indicator">
          <el-icon class="is-loading"><Loading /></el-icon> 思考中...
        </div>

        <!-- 空聊天提示 -->
        <div v-if="messages.length === 0" class="empty-chat">
          <el-empty description="开始一个新的对话吧！">
            <el-button type="primary" @click="focusInput">开始对话</el-button>
          </el-empty>
        </div>
      </el-main>

      <!-- 聊天输入区域 -->
      <el-footer class="chat-footer">
        <el-input
          ref="messageInput"
          v-model="newMessage"
          placeholder="请输入您的问题..."
          @keyup.enter="sendMessage"
          clearable
          :disabled="isLoading"
        >
          <template #append>
            <el-button-group>
              <el-button @click="sendMessage" :disabled="!newMessage || isLoading">
                <el-icon><Promotion /></el-icon> 发送
              </el-button>
              <el-button
                @click="stopGeneration"
                :disabled="!isLoading"
                type="danger"
                v-if="isLoading"
              >
                <el-icon><Close /></el-icon> 停止
              </el-button>
            </el-button-group>
          </template>
        </el-input>
      </el-footer>
    </el-container>
  </el-container>

  <!-- 设置面板 -->
  <SettingsPanel
    v-model:visible="settingsVisible"
    @settings-saved="handleSettingsSaved"
  />
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import 'highlight.js/styles/github.min.css';

// 注册常用语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
import {
  ElContainer, ElHeader, ElMain, ElFooter, ElInput, ElButton, ElCard, ElIcon,
  ElAside, ElScrollbar, ElEmpty, ElPopconfirm
} from 'element-plus';
import {
  Promotion, Loading, Close, Setting, Plus, ChatDotRound, Delete, Menu
} from '@element-plus/icons-vue';

// 导入设置面板组件
import SettingsPanel from './components/SettingsPanel.vue';

// 生成唯一ID
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Markdown渲染函数
 * @param {string} text - 需要渲染的Markdown文本
 * @returns {string} 渲染后的HTML字符串
 */
const renderMarkdown = (text) => {
  // 确保marked配置每次调用都生效
  marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: (code, lang) => {
      try {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      } catch (e) {
        return hljs.highlightAuto(code).value;
      }
    }
  });

  // 确保DOM更新后应用highlight.js
  const html = marked.parse(text);
  const styledHtml = html
    .replace(/<pre><code/g, '<pre class="hljs"><code')
    .replace(/<table>/g, '<table class="markdown-table">');

  // 强制重新高亮
  nextTick(() => {
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  });

  return DOMPurify.sanitize(styledHtml);
};

// 消息列表
const messages = ref([]);
// 当前输入的消息
const newMessage = ref('');
// 加载状态
const isLoading = ref(false);
// 后端API基础地址
const backendUrlBase = 'http://localhost:3000/api/chat';
// 消息ID计数器
let nextMessageId = 0;
// 侧边栏状态
const sidebarVisible = ref(true);
// 消息输入框引用
const messageInput = ref(null);

// 设置相关状态
const settingsVisible = ref(false);
const apiKey = ref('');
const selectedModel = ref('');
const selectedProvider = ref('deepseek');
const apiEndpoint = ref('https://api.deepseek.com/v1/chat/completions');
// 模型列表
const models = ref([]);

// 对话历史相关
const chatHistory = ref([]);
const currentChatId = ref('');

// 获取当前对话
const currentChat = computed(() => {
  return chatHistory.value.find(chat => chat.id === currentChatId.value) || null;
});

// 切换侧边栏显示状态
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

// 聚焦到输入框
const focusInput = () => {
  nextTick(() => {
    messageInput.value?.input?.focus();
  });
};

// 创建新对话
const createNewChat = () => {
  // 保存当前对话
  if (currentChatId.value) {
    saveCurrentChat();
  }

  // 创建新对话
  const newChatId = generateId();
  chatHistory.value.unshift({
    id: newChatId,
    title: '新对话',
    messages: [],
    lastModel: selectedModel.value || '',  // 记录最后使用的模型
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // 切换到新对话
  switchChat(newChatId);

  // 保存对话历史
  saveChatHistory();

  // 聚焦到输入框
  focusInput();
};

// 切换对话
const switchChat = (chatId) => {
  // 保存当前对话
  if (currentChatId.value && currentChatId.value !== chatId) {
    saveCurrentChat();
  }

  // 设置当前对话ID
  currentChatId.value = chatId;

  // 加载对话消息
  const chat = chatHistory.value.find(c => c.id === chatId);
  if (chat) {
    messages.value = [...chat.messages];
    // 更新对话的访问时间
    chat.updatedAt = new Date().toISOString();

    // 如果对话有最后使用的模型，切换到该模型
    if (chat.lastModel) {
      selectedModel.value = chat.lastModel;
    }

    saveChatHistory();
  } else {
    messages.value = [];
  }

  // 重置消息ID计数器
  nextMessageId = messages.value.length > 0 ?
    Math.max(...messages.value.map(m => m.id)) + 1 : 0;
};

// 删除对话
const deleteChat = (chatId) => {
  // 从历史记录中删除
  chatHistory.value = chatHistory.value.filter(chat => chat.id !== chatId);

  // 如果删除的是当前对话，切换到第一个对话或创建新对话
  if (chatId === currentChatId.value) {
    if (chatHistory.value.length > 0) {
      switchChat(chatHistory.value[0].id);
    } else {
      createNewChat();
    }
  }

  // 保存对话历史
  saveChatHistory();
};

// 保存当前对话
const saveCurrentChat = () => {
  const chat = chatHistory.value.find(c => c.id === currentChatId.value);
  if (chat) {
    chat.messages = [...messages.value];
    chat.updatedAt = new Date().toISOString();

    // 如果没有标题，使用第一条用户消息作为标题
    if (chat.title === '新对话' && messages.value.length > 0) {
      const firstUserMsg = messages.value.find(m => m.sender === 'user');
      if (firstUserMsg) {
        chat.title = firstUserMsg.text.substring(0, 20) + (firstUserMsg.text.length > 20 ? '...' : '');
      }
    }
  }
};

// 保存对话历史到本地存储
const saveChatHistory = () => {
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value));
};

// 加载对话历史
const loadChatHistory = () => {
  try {
    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
      chatHistory.value = JSON.parse(savedHistory);
      // 按更新时间排序
      chatHistory.value.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
  } catch (error) {
    console.error('加载对话历史失败:', error);
    chatHistory.value = [];
  }

  // 如果没有对话历史，创建一个新对话
  if (chatHistory.value.length === 0) {
    createNewChat();
  } else {
    // 否则加载最近的对话
    switchChat(chatHistory.value[0].id);
  }
};

// 打开设置面板
const openSettings = () => {
  settingsVisible.value = true;
};

// 处理设置保存
const handleSettingsSaved = (settings) => {
  apiKey.value = settings.apiKey;
  selectedModel.value = settings.selectedModel;
  selectedProvider.value = settings.selectedProvider;
  apiEndpoint.value = settings.apiEndpoint;
};

/**
 * 添加或更新消息
 * @param {number} id - 消息ID
 * @param {'user'|'llm'} sender - 发送者类型
 * @param {string} textChunk - 消息内容
 * @param {boolean} [isComplete=false] - 是否已完成
 * @param {string} [model] - 使用的模型（当sender为'llm'时）
 */
const addOrUpdateMessage = (id, sender, textChunk, isComplete = false, model = '') => {
  const existingIndex = messages.value.findIndex(msg => msg.id === id && msg.sender === sender);
  if (existingIndex !== -1) {
    // 追加到现有消息
    messages.value[existingIndex].text += textChunk;
  } else {
    // 添加新消息
    const newMessage = { id, sender, text: textChunk };

    // 如果是AI消息且指定了模型，添加模型信息
    if (sender === 'llm' && model) {
      newMessage.model = model;

      // 更新当前对话的最后使用模型
      const chat = chatHistory.value.find(c => c.id === currentChatId.value);
      if (chat) {
        chat.lastModel = model;
      }
    }

    messages.value.push(newMessage);
  }

  // 如果是第一条用户消息，更新对话标题
  if (sender === 'user' && messages.value.filter(m => m.sender === 'user').length === 1) {
    const chat = chatHistory.value.find(c => c.id === currentChatId.value);
    if (chat && chat.title === '新对话') {
      chat.title = textChunk.substring(0, 20) + (textChunk.length > 20 ? '...' : '');
    }
  }

  // 保存当前对话
  saveCurrentChat();
  saveChatHistory();

  // 滚动到底部
  nextTick(() => {
    const chatMain = document.querySelector('.chat-main');
    if (chatMain) chatMain.scrollTop = chatMain.scrollHeight;
  });
};

/**
 * 停止生成
 */
const stopGeneration = () => {
  isLoading.value = false;
  const lastMessage = messages.value[messages.value.length - 1];
  if (lastMessage && lastMessage.sender === 'llm') {
    lastMessage.text += '\n\n[输出已终止]';
  }
};

/**
 * 获取模型首字母
 * @param {string} model - 模型名称
 * @returns {string} 模型首字母或默认值
 */
const getModelInitial = (model) => {
  if (!model) return 'A'; // 默认显示 A

  // 处理常见模型的特殊情况
  if (model.startsWith('gpt-')) {
    return 'G';
  } else if (model.startsWith('claude-')) {
    return 'C';
  } else if (model.startsWith('deepseek-')) {
    return 'D';
  }

  // 其他模型返回首字母
  return model.charAt(0).toUpperCase();
};

/**
 * 获取模型显示名称
 * @param {string} modelId - 模型ID
 * @returns {string} 模型显示名称
 */
const getModelName = (modelId) => {
  if (!modelId) return '';

  // 尝试从模型列表中查找对应的名称
  const modelInfo = models.value.find(m => m.id === modelId);
  if (modelInfo) {
    return modelInfo.name;
  }

  // 如果没找到，返回模型ID
  return modelId;
};

/**
 * 发送消息
 */
const sendMessage = async () => {
  const text = newMessage.value.trim();
  if (!text || isLoading.value) return;

  // 添加用户消息
  const userMessageId = nextMessageId++;
  addOrUpdateMessage(userMessageId, 'user', text, true);
  newMessage.value = '';
  isLoading.value = true;

  // 准备接收AI回复
  const llmMessageId = nextMessageId++;

  // 创建一个包含所有必要参数的请求体
  const requestData = {
    message: text
  };

  // 添加模型参数（如果已选择）
  if (selectedModel.value) {
    requestData.model = selectedModel.value;
  }

  // 添加提供商参数
  if (selectedProvider.value) {
    requestData.provider = selectedProvider.value;
  }

  // 添加API密钥参数（如果已提供）
  if (apiKey.value) {
    requestData.apiKey = apiKey.value;
  }

  // 添加API端点参数（如果已提供）
  if (apiEndpoint.value) {
    requestData.endpoint = apiEndpoint.value;
  }

  // 使用 fetch API 发送 POST 请求并设置流式响应
  const response = await fetch(backendUrlBase, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  });

  // 检查响应状态
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `错误: ${errorText}`;

    // 如果是 API 密钥错误，添加设置按钮
    if (response.status === 401 || errorText.includes('API 密钥无效') || errorText.includes('认证失败')) {
      errorMessage += '\n\n<div class="error-action"><button class="open-settings-btn" onclick="document.dispatchEvent(new CustomEvent(\'open-settings\'))">\u6253开设置</button></div>';

      // 添加事件监听器来处理点击事件
      document.addEventListener('open-settings', () => {
        openSettings();
      }, { once: true });
    }

    addOrUpdateMessage(llmMessageId, 'llm', errorMessage, true);
    isLoading.value = false;
    return;
  }

  // 创建一个读取流
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  // 处理流式响应
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 解码数据
    const chunk = decoder.decode(value, { stream: true });

    // 处理 SSE 格式的数据
    const lines = chunk.split('\n').filter(line => line.trim() !== '');
    for (const line of lines) {
      if (line.startsWith('data:')) {
        try {
          const data = JSON.parse(line.substring(5).trim());
          if (data.error) {
            addOrUpdateMessage(llmMessageId, 'llm', `错误: ${data.error}`, true);
            isLoading.value = false;
            return;
          }
          if (data.event === 'done') {
            isLoading.value = false;
            return;
          }
          if (data.text) {
            addOrUpdateMessage(llmMessageId, 'llm', data.text, false, selectedModel.value);
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error, 'Line:', line);
        }
      }
    }
  }

  // 注意：我们已经在上面的代码中处理了所有的响应和错误情况
};

// 加载模型列表
const loadModels = () => {
  try {
    const savedModels = JSON.parse(localStorage.getItem('models') || '[]');
    if (savedModels.length > 0) {
      models.value = savedModels;
      return;
    }
  } catch (error) {
    console.error('加载模型列表失败:', error);
  }

  // 如果本地没有，设置默认模型
  models.value = [
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
};

// 组件挂载时加载对话历史和设置
onMounted(() => {
  // 从本地存储加载设置
  apiKey.value = localStorage.getItem('apiKey') || '';
  selectedModel.value = localStorage.getItem('selectedModel') || '';
  selectedProvider.value = localStorage.getItem('selectedProvider') || 'deepseek';
  apiEndpoint.value = localStorage.getItem('apiEndpoint') || 'https://api.deepseek.com/v1/chat/completions';

  // 加载模型列表
  loadModels();

  // 加载对话历史
  loadChatHistory();
});

// 组件卸载时保存当前对话
onUnmounted(() => {
  if (currentChatId.value) {
    saveCurrentChat();
    saveChatHistory();
  }
});
</script>

<style lang="scss">
@import './styles/main.scss';

</style>
