<template>
  <div class="chat-input-container">
    <div class="input-controls">
      <ThinkingModeToggle :modelId="modelId" />
      <FileSelector
        :isLoading="isLoading"
        @select-file="handleFileSelect"
      />
    </div>

    <div class="input-area">
      <div v-if="selectedFile" class="selected-file">
        <el-tag closable @close="removeSelectedFile">
          <el-icon><Document /></el-icon>
          {{ selectedFile.originalname || selectedFile.filename }}
        </el-tag>
      </div>

      <el-input
        ref="inputRef"
        v-model="message"
        placeholder="请输入您的问题..."
        @keyup.enter="sendMessage"
        clearable
        :disabled="isLoading"
        type="textarea"
        :rows="2"
        resize="none"
      >
        <template #append>
          <el-button-group>
            <el-button @click="sendMessage" :disabled="(!message && !selectedFile) || isLoading">
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
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Promotion, Close, Document } from '@element-plus/icons-vue';
import ThinkingModeToggle from './ThinkingModeToggle.vue';
import FileSelector from './FileSelector.vue';

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
const selectedFile = ref(null);

// 监听外部值变化
watch(() => props.value, (newValue) => {
  message.value = newValue;
});

// 监听本地值变化
watch(message, (newValue) => {
  emit('update:value', newValue);
});

// 处理文件选择
const handleFileSelect = (file) => {
  selectedFile.value = file;
};

// 移除选中的文件
const removeSelectedFile = () => {
  selectedFile.value = null;
};

// 发送消息
const sendMessage = () => {
  // 如果没有消息也没有文件，或者正在加载，则不发送
  if ((!message.value.trim() && !selectedFile.value) || props.isLoading) return;

  // 发送消息和文件信息
  emit('send', {
    text: message.value,
    file: selectedFile.value
  });

  // 清空选中的文件
  selectedFile.value = null;
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

  .input-controls {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  .input-area {
    .selected-file {
      margin-bottom: 8px;

      .el-tag {
        display: inline-flex;
        align-items: center;

        .el-icon {
          margin-right: 4px;
        }
      }
    }

    .el-textarea {
      width: 100%;
    }
  }
}
</style>
