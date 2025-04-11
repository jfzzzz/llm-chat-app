import { ref, computed } from 'vue';

// 思考模式状态
export const thinkingModeEnabled = ref(false);

/**
 * 检查当前模型是否支持思考模式
 * @param {string} modelId - 当前选中的模型ID
 * @returns {boolean} 是否支持思考模式
 */
export const supportsThinkingMode = (modelId) => {
  if (!modelId) return false;
  
  return (
    modelId.includes('claude') || // Claude 模型支持思考模式
    modelId.includes('gpt-4') || // GPT-4 支持思考模式
    modelId.includes('deepseek-coder') // DeepSeek Coder 支持思考模式
  );
};

/**
 * 保存思考模式设置
 */
export const saveThinkingModePreference = () => {
  localStorage.setItem('thinkingModeEnabled', thinkingModeEnabled.value ? 'true' : 'false');
};

/**
 * 加载思考模式设置
 */
export const loadThinkingModeSettings = () => {
  const savedThinkingMode = localStorage.getItem('thinkingModeEnabled');
  if (savedThinkingMode !== null) {
    thinkingModeEnabled.value = savedThinkingMode === 'true';
  }
};
