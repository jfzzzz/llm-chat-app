<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="文件管理"
    direction="rtl"
    size="600px"
    :before-close="handleClose"
  >
    <div class="files-container">
      <h3>文件上传与管理</h3>
      <p class="description">
        上传文件后，您可以在聊天中引用这些文件。
      </p>
      
      <FileUploader />
    </div>
  </el-drawer>
</template>

<script setup>
import { ref } from 'vue';
import FileUploader from './FileUploader.vue';

// 属性定义
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// 事件定义
const emit = defineEmits(['update:visible']);

// 关闭抽屉
const handleClose = () => {
  emit('update:visible', false);
};
</script>

<style lang="scss" scoped>
.files-container {
  padding: 0 20px;
  
  h3 {
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 18px;
    color: var(--text-color);
  }
  
  .description {
    margin-bottom: 20px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}
</style>
