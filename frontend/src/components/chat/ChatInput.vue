<template>
  <div class="chat-input-container">
    <ThinkingModeToggle :modelId="modelId" />
    
    <el-input
      ref="inputRef"
      v-model="message"
      placeholder="请输入您的问题..."
      @keyup.enter="sendMessage"
      clearable
      :disabled="isLoading"
    >
      <template #append>
        <el-button-group>
          <el-button @click="sendMessage" :disabled="!message || isLoading">
            <el-icon><Promotion /></el-icon> 发送
          </el-button>
          <el-button
            @click="$emit('stop')"
            :disabled="!isLoading"
            type="danger"
            v-if="isLoading"
          >
            <el-icon><Close /></el-icon> 停止
          </el-button>
        </el-button-group>
      </template>
    </el-input>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Promotion, Close } from '@element-plus/icons-vue';
import ThinkingModeToggle from './ThinkingModeToggle.vue';

// 定义属性
const props = defineProps({
  modelId: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  value: {
    type: String,
    default: ''
  }
});

// 定义事件
const emit = defineEmits(['update:value', 'send', 'stop']);

// 本地状态
const message = ref(props.value);
const inputRef = ref(null);

// 监听外部值变化
watch(() => props.value, (newValue) => {
  message.value = newValue;
});

// 监听本地值变化
watch(message, (newValue) => {
  emit('update:value', newValue);
});

// 发送消息
const sendMessage = () => {
  if (!message.value.trim() || props.isLoading) return;
  emit('send', message.value);
};

// 暴露方法
defineExpose({
  focus: () => {
    inputRef.value?.focus();
  }
});
</script>

<style lang="scss" scoped>
.chat-input-container {
  width: 100%;
}
</style>
