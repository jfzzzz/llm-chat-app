<template>
  <div class="message-row" :class="msg.sender">
    <div class="avatar" :class="msg.sender === 'user' ? 'user-avatar' : 'ai-avatar'">
      {{ msg.sender === 'user' ? 'U' : getModelInitial(msg.model) }}
    </div>
    <div class="message-content-wrapper">
      <el-card class="message-card" :body-style="{ padding: '12px 20px' }">
        <!-- 用户消息显示为纯文本 -->
        <div v-if="msg.sender === 'user'" class="message-content">{{ msg.text }}</div>
        <!-- AI消息渲染为Markdown格式 -->
        <div v-else class="message-content">
          <!-- 消息模型标记 -->
          <div v-if="msg.model" class="model-tag">
            {{ getModelName(msg.model) }}
          </div>
          <div v-html="renderMarkdown(msg.text)"></div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { renderMarkdown } from '../../services/markdownService';
import { getModelInitial } from '../../utils/helpers';

// 定义属性
const props = defineProps({
  msg: {
    type: Object,
    required: true
  },
  getModelName: {
    type: Function,
    required: true
  }
});
</script>

<style lang="scss" scoped>
// 样式在全局 _messages.scss 中定义
</style>
