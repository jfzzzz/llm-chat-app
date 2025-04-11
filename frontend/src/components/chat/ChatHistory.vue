<template>
  <div class="chat-history">
    <div class="history-header">
      <h3>对话历史</h3>
      <el-button 
        type="primary" 
        plain 
        size="small"
        @click="$emit('new-chat')"
      >
        <el-icon><Plus /></el-icon> 新对话
      </el-button>
    </div>
    
    <el-scrollbar>
      <div class="chat-list">
        <ChatHistoryItem 
          v-for="chat in chatHistory" 
          :key="chat.id" 
          :chat="chat" 
          :isActive="chat.id === currentChatId"
          @select="$emit('select-chat', $event)"
          @delete="$emit('delete-chat', $event)"
        />
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { Plus } from '@element-plus/icons-vue';
import ChatHistoryItem from './ChatHistoryItem.vue';
import { chatHistory, currentChatId } from '../../services/chatService';

// 定义事件
defineEmits(['new-chat', 'select-chat', 'delete-chat']);
</script>

<style lang="scss" scoped>
.chat-history {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    border-bottom: 1px solid var(--border-color);
    
    h3 {
      margin: 0;
      font-size: 16px;
      color: var(--text-color);
    }
  }
  
  .chat-list {
    padding: 10px;
  }
}
</style>
