<template>
  <el-container class="chat-container">
    <!-- 聊天应用头部 -->
    <el-header class="chat-header">
      <div class="header-content">
        <h1>AI 智能助手</h1>
        <el-button @click="openSettings" type="primary" plain size="small">
          <el-icon><Setting /></el-icon> 设置
        </el-button>
      </div>
    </el-header>

    <!-- 聊天内容区域 -->
    <el-main class="chat-main">
      <!-- 消息列表循环 -->
      <div v-for="msg in messages" :key="msg.id" :class="['message-row', msg.sender]">
        <el-card class="message-card" :body-style="{ padding: '15px 20px' }">
          <!-- 用户消息显示为纯文本 -->
          <div v-if="msg.sender === 'user'">{{ msg.text }}</div>
          <!-- AI消息渲染为Markdown格式 -->
          <div v-else v-html="renderMarkdown(msg.text)"></div>
        </el-card>
      </div>

      <!-- 加载状态指示器 -->
      <div v-if="isLoading" class="loading-indicator">
        <el-icon class="is-loading"><Loading /></el-icon> 思考中...
      </div>
    </el-main>

    <!-- 聊天输入区域 -->
    <el-footer class="chat-footer">
      <el-input
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

  <!-- 设置面板 -->
  <SettingsPanel
    v-model:visible="settingsVisible"
    @settings-saved="handleSettingsSaved"
  />
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
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
import { ElContainer, ElHeader, ElMain, ElFooter, ElInput, ElButton, ElCard, ElIcon } from 'element-plus';
import { Promotion, Loading, Close, Setting } from '@element-plus/icons-vue';

// 导入设置面板组件
import SettingsPanel from './components/SettingsPanel.vue';

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

// 设置相关状态
const settingsVisible = ref(false);
const apiKey = ref('');
const selectedModel = ref('');
const selectedProvider = ref('deepseek');
const apiEndpoint = ref('https://api.deepseek.com/v1/chat/completions');

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
 */
const addOrUpdateMessage = (id, sender, textChunk, isComplete = false) => {
  const existingIndex = messages.value.findIndex(msg => msg.id === id && msg.sender === sender);
  if (existingIndex !== -1) {
    // 追加到现有消息
    messages.value[existingIndex].text += textChunk;
  } else {
    // 添加新消息
    messages.value.push({ id, sender, text: textChunk });
  }
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
    addOrUpdateMessage(llmMessageId, 'llm', `错误: ${errorText}`, true);
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
            addOrUpdateMessage(llmMessageId, 'llm', data.text);
          }
        } catch (error) {
          console.error('Failed to parse SSE data:', error, 'Line:', line);
        }
      }
    }
  }

  // 注意：我们已经在上面的代码中处理了所有的响应和错误情况
};

// 组件挂载时添加欢迎消息并加载设置
onMounted(() => {
  // 从本地存储加载设置
  apiKey.value = localStorage.getItem('apiKey') || '';
  selectedModel.value = localStorage.getItem('selectedModel') || '';
  selectedProvider.value = localStorage.getItem('selectedProvider') || 'deepseek';
  apiEndpoint.value = localStorage.getItem('apiEndpoint') || 'https://api.deepseek.com/v1/chat/completions';

  const welcomeId = nextMessageId++;
  addOrUpdateMessage(welcomeId, 'llm', '您好！请问有什么可以帮您？', true);
});

// 组件卸载时的清理工作
onUnmounted(() => {
  // 清理工作（如果有需要）
});
</script>

<style>
:root {
  --bg-color: #f7f7f8;
  --sidebar-color: #ffffff;
  --text-color: #374151;
  --primary-color: #10a37f;
  --user-bubble: #ffffff;
  --ai-bubble: #f7f7f8;
}

.chat-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.chat-header {
  background-color: var(--sidebar-color);
  color: var(--text-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 15px;
}

.header-content h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
}

.chat-main {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px 15%;
  background-color: var(--bg-color);
}

.message-row {
  display: flex;
  margin-bottom: 24px;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.llm {
  justify-content: flex-start;
}

.message-card {
  max-width: 85%;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message-row.user .message-card {
  background-color: var(--user-bubble);
  border: 1px solid #e5e5e6;
}

.message-row.llm .message-card {
  background-color: var(--ai-bubble);
  border: 1px solid #e5e5e6;
}

/* Markdown内容样式 */
.message-card {
  .hljs {
    background: #f8f8f8;
    border-radius: 6px;
    padding: 1em;
    overflow-x: auto;
    font-size: 0.9em;
    line-height: 1.5;
  }

  code:not(.hljs) {
    background: #f3f3f3;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }

  pre {
    margin: 1em 0;
    position: relative;
  }

  .markdown-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;

    th, td {
      padding: 0.5em 1em;
      border: 1px solid #ddd;
    }

    th {
      background-color: #f5f5f5;
    }
  }

  blockquote {
    border-left: 4px solid #409EFF;
    margin: 1em 0;
    padding: 0 1em;
    color: #555;
    background-color: #f8fafc;
  }

  ul, ol {
    padding-left: 2em;
    margin: 1em 0;
  }

  img {
    max-width: 100%;
    border-radius: 4px;
  }
}

.message-card blockquote {
  border-left: 4px solid #ddd;
  margin: 0;
  padding: 0 15px;
  color: #666;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  margin: 20px 0;
  gap: 8px;
}

.chat-footer {
  padding: 16px 20px;
  background-color: var(--sidebar-color);
  border-top: 1px solid #e5e5e6;
  box-shadow: 0 -1px 3px rgba(0,0,0,0.05);
}

.el-input {
  --el-input-bg-color: var(--sidebar-color);
}

.el-button-group {
  gap: 8px;
}

.el-button--danger {
  --el-button-danger-bg-color: #ef4444;
}
</style>
