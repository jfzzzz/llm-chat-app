import { ref } from 'vue';

// 模型状态
export const models = ref([]);
export const apiKey = ref('');
export const selectedModel = ref('');
export const selectedProvider = ref('deepseek');
export const apiEndpoint = ref('https://api.deepseek.com/v1/chat/completions');

/**
 * 加载模型列表
 */
export const loadModels = () => {
  const savedModels = localStorage.getItem('models');
  if (savedModels) {
    try {
      models.value = JSON.parse(savedModels);
    } catch (e) {
      console.error('加载模型列表失败:', e);
      models.value = [];
    }
  }
  
  // 如果没有模型，添加默认模型
  if (models.value.length === 0) {
    models.value = [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek' }
    ];
    saveModels();
  }
};

/**
 * 保存模型列表
 */
export const saveModels = () => {
  localStorage.setItem('models', JSON.stringify(models.value));
};

/**
 * 添加新模型
 * @param {Object} model - 模型信息
 */
export const addModel = (model) => {
  models.value.push(model);
  saveModels();
};

/**
 * 删除模型
 * @param {string} modelId - 模型ID
 */
export const deleteModel = (modelId) => {
  models.value = models.value.filter(m => m.id !== modelId);
  saveModels();
};

/**
 * 保存API设置
 */
export const saveApiSettings = () => {
  localStorage.setItem('apiKey', apiKey.value);
  localStorage.setItem('selectedModel', selectedModel.value);
  localStorage.setItem('selectedProvider', selectedProvider.value);
  localStorage.setItem('apiEndpoint', apiEndpoint.value);
};

/**
 * 加载API设置
 */
export const loadApiSettings = () => {
  apiKey.value = localStorage.getItem('apiKey') || '';
  selectedModel.value = localStorage.getItem('selectedModel') || '';
  selectedProvider.value = localStorage.getItem('selectedProvider') || 'deepseek';
  apiEndpoint.value = localStorage.getItem('apiEndpoint') || 'https://api.deepseek.com/v1/chat/completions';
};
