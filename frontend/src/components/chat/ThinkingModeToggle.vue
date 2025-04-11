<template>
  <div class="thinking-mode-toggle" v-if="supportsThinkingMode">
    <el-switch
      v-model="thinkingModeEnabled"
      active-text="思考模式"
      inactive-text="直接回答"
      @change="saveThinkingModePreference"
    />
    <el-tooltip content="思考模式会显示模型的思考过程，帮助您理解模型如何得出答案" placement="top">
      <el-icon class="info-icon"><InfoFilled /></el-icon>
    </el-tooltip>
  </div>
</template>

<script setup>
import { InfoFilled } from '@element-plus/icons-vue';
import { thinkingModeEnabled, saveThinkingModePreference, supportsThinkingMode as checkSupportsThinkingMode } from '../../services/thinkingModeService';
import { computed } from 'vue';

// 定义属性
const props = defineProps({
  modelId: {
    type: String,
    required: true
  }
});

// 计算属性：当前模型是否支持思考模式
const supportsThinkingMode = computed(() => checkSupportsThinkingMode(props.modelId));
</script>

<style lang="scss" scoped>
// 样式在全局 _layout.scss 中定义
</style>
