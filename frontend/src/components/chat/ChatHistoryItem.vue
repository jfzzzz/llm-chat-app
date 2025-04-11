<template>
  <div 
    class="chat-item" 
    :class="{ active: isActive }"
    @click="$emit('select', chat.id)"
  >
    <div class="chat-title">{{ chat.title }}</div>
    <div class="chat-actions">
      <el-button 
        size="small" 
        type="danger" 
        circle 
        :plain="!isDarkTheme"
        @click.stop="$emit('delete', chat.id)"
      >
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { Delete } from '@element-plus/icons-vue';
import { isDarkTheme } from '../../services/themeService';

// 定义属性
const props = defineProps({
  chat: {
    type: Object,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false
  }
});

// 定义事件
defineEmits(['select', 'delete']);
</script>

<style lang="scss" scoped>
// 样式在全局 _chat-items.scss 中定义
</style>
