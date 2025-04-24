<template>
  <div class="message-row" :class="msg.sender">
    <div class="avatar" :class="msg.sender === 'user' ? 'user-avatar' : 'ai-avatar'">
      {{ msg.sender === 'user' ? 'U' : getModelInitial(msg.model) }}
    </div>
    <div class="message-content-wrapper">
      <el-card class="message-card" :body-style="{ padding: '12px 20px' }">
        <!-- 用户消息显示为纯文本 -->
        <div v-if="msg.sender === 'user'" class="message-content">
          {{ msg.text }}
          <!-- 如果有文件，显示文件信息 -->
          <div v-if="msg.file" class="file-info">
            <el-link :href="msg.file.path" target="_blank" type="primary">
              <el-icon><Document /></el-icon>
              {{ msg.file.originalname || msg.file.filename }}
              <span class="file-size">({{ formatFileSize(msg.file.size) }})</span>
            </el-link>
          </div>
        </div>
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
import { Document } from '@element-plus/icons-vue';

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

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style lang="scss" scoped>
// 样式在全局 _messages.scss 中定义

.file-info {
  margin-top: 8px;
  padding: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  display: inline-block;

  .el-link {
    display: inline-flex;
    align-items: center;

    .el-icon {
      margin-right: 4px;
    }

    .file-size {
      margin-left: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}
</style>
