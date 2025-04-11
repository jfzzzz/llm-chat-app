<template>
  <div class="chat-container">
    <!-- 聊天消息区域 -->
    <div class="chat-messages" ref="messagesContainer">
      <ChatMessage 
        v-for="msg in messages" 
        :key="msg.id" 
        :msg="msg" 
        :getModelName="(modelId) => getModelName(modelId, models)"
      />
      
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
    </div>
    
    <!-- 聊天输入区域 -->
    <div class="chat-input-area">
      <ChatInput 
        ref="chatInput"
        :modelId="selectedModel"
        :isLoading="isLoading"
        v-model:value="newMessage"
        @send="handleSendMessage"
        @stop="handleStopGeneration"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import ChatMessage from './ChatMessage.vue';
import ChatInput from './ChatInput.vue';
import { getModelName } from '../../utils/helpers';
import { messages, isLoading, newMessage, sendMessage } from '../../services/chatService';
import { models, apiKey, selectedModel, selectedProvider, apiEndpoint } from '../../services/modelService';

// 引用
const messagesContainer = ref(null);
const chatInput = ref(null);

// 监听消息变化，自动滚动到底部
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}, { deep: true });

// 处理发送消息
const handleSendMessage = async () => {
  await sendMessage(
    apiKey.value,
    selectedModel.value,
    selectedProvider.value,
    apiEndpoint.value
  );
};

// 处理停止生成
const handleStopGeneration = () => {
  // 实现停止生成的逻辑
  isLoading.value = false;
};

// 聚焦输入框
const focusInput = () => {
  chatInput.value?.focus();
};

// 暴露方法
defineExpose({
  focusInput
});
</script>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .chat-input-area {
    padding: 10px 20px 20px;
  }
  
  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 20px 0;
    color: var(--text-color-secondary);
    
    .el-icon {
      margin-right: 8px;
    }
  }
  
  .empty-chat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--text-color-secondary);
  }
}
</style>
