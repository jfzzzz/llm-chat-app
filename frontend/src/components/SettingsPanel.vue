<template>
  <el-drawer
    :model-value="visible"
    @update:model-value="emit('update:visible', $event)"
    title="设置"
    direction="rtl"
    size="450px"
    :before-close="handleClose"
  >
    <div class="settings-container">
      <h3>API 配置</h3>

      <el-form label-position="top">
        <!-- API 提供商选择 -->
        <el-form-item label="API 提供商">
          <el-select
            v-model="selectedProvider"
            placeholder="选择或添加新的API提供商"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
            @change="handleProviderChange"
          >
            <el-option
              v-for="provider in providers"
              :key="provider.id"
              :label="provider.name"
              :value="provider.id"
            />
          </el-select>
        </el-form-item>

        <!-- API 地址 -->
        <el-form-item label="API 地址">
          <el-input
            v-model="apiEndpoint"
            placeholder="请输入API地址（例如：https://api.example.com/v1/chat/completions）"
            clearable
          />
        </el-form-item>

        <!-- API 密钥 -->
        <el-form-item label="API 密钥">
          <el-input
            v-model="apiKey"
            placeholder="请输入您的 API 密钥"
            type="password"
            show-password
            clearable
          />
          <div class="form-tip">
            API 密钥将保存在浏览器本地存储中
          </div>
        </el-form-item>

        <!-- 模型选择 -->
        <el-form-item label="选择模型">
          <div class="model-selection-container">
            <el-select
              v-model="selectedModel"
              placeholder="请选择模型"
              style="width: 100%"
              filterable
              allow-create
              default-first-option
            >
              <el-option
                v-for="model in filteredModels"
                :key="model.id"
                :label="model.name"
                :value="model.id"
              />
            </el-select>

            <el-button
              type="primary"
              plain
              @click="showAddModelDialog = true"
              style="margin-left: 10px"
            >
              <el-icon><Plus /></el-icon> 添加
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="settings-actions">
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
        <el-button @click="resetSettings">重置</el-button>
      </div>
    </div>
  </el-drawer>

  <!-- 添加模型对话框 -->
  <el-dialog
    v-model="showAddModelDialog"
    title="添加新模型"
    width="500px"
  >
    <el-form label-position="top">
      <el-form-item label="模型名称">
        <el-input v-model="newModel.name" placeholder="请输入模型名称" />
      </el-form-item>
      <el-form-item label="模型 ID">
        <el-input v-model="newModel.id" placeholder="请输入模型 ID" />
      </el-form-item>
      <el-form-item label="所属提供商">
        <el-select v-model="newModel.provider" style="width: 100%">
          <el-option
            v-for="provider in providers"
            :key="provider.id"
            :label="provider.name"
            :value="provider.id"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showAddModelDialog = false">取消</el-button>
        <el-button type="primary" @click="addNewModel">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

// 属性定义
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// 事件定义
const emit = defineEmits(['update:visible', 'settings-saved']);

// 响应式状态
const apiKey = ref('');
const apiEndpoint = ref('');
const selectedModel = ref('');
const selectedProvider = ref('deepseek');
const models = ref([]);
const providers = ref([
  { id: 'deepseek', name: 'DeepSeek', endpoint: 'https://api.deepseek.com/v1/chat/completions' },
  { id: 'openai', name: 'OpenAI', endpoint: 'https://api.openai.com/v1/chat/completions' },
  { id: 'anthropic', name: 'Anthropic', endpoint: 'https://api.anthropic.com/v1/messages' },
  { id: 'custom', name: '自定义提供商', endpoint: '' }
]);

// 添加模型对话框状态
const showAddModelDialog = ref(false);
const newModel = ref({
  id: '',
  name: '',
  provider: ''
});

// 根据选择的提供商过滤模型
const filteredModels = computed(() => {
  if (!selectedProvider.value) return [];
  return models.value.filter(model => model.provider === selectedProvider.value);
});

// 监听抽屉可见性变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 当抽屉打开时，加载设置
    loadSettings();
    loadModels();
  }
});

// 处理提供商变化
const handleProviderChange = (providerId) => {
  // 如果是现有提供商，设置其默认端点
  const provider = providers.value.find(p => p.id === providerId);
  if (provider) {
    apiEndpoint.value = provider.endpoint;
    // 如果有该提供商的模型，选择第一个
    const providerModels = models.value.filter(m => m.provider === providerId);
    if (providerModels.length > 0) {
      selectedModel.value = providerModels[0].id;
    } else {
      selectedModel.value = '';
    }
  } else {
    // 新增的提供商，添加到列表中
    providers.value.push({
      id: providerId,
      name: providerId,
      endpoint: ''
    });
    apiEndpoint.value = '';
    selectedModel.value = '';
  }
};

// 添加新模型
const addNewModel = () => {
  if (!newModel.value.id || !newModel.value.name || !newModel.value.provider) {
    ElMessage.warning('请填写完整的模型信息');
    return;
  }

  // 检查是否已存在相同 ID 的模型
  const existingModel = models.value.find(m => m.id === newModel.value.id);
  if (existingModel) {
    ElMessage.warning('已存在相同 ID 的模型');
    return;
  }

  // 添加新模型
  models.value.push({
    id: newModel.value.id,
    name: newModel.value.name,
    provider: newModel.value.provider
  });

  // 选择新添加的模型
  selectedModel.value = newModel.value.id;

  // 保存模型列表到本地存储
  saveModelsToLocalStorage();

  // 重置表单并关闭对话框
  newModel.value = { id: '', name: '', provider: selectedProvider.value };
  showAddModelDialog.value = false;

  ElMessage.success('模型添加成功');
};

// 从本地存储加载设置
const loadSettings = () => {
  const savedApiKey = localStorage.getItem('apiKey') || '';
  const savedModel = localStorage.getItem('selectedModel') || '';
  const savedProvider = localStorage.getItem('selectedProvider') || 'deepseek';
  const savedEndpoint = localStorage.getItem('apiEndpoint') || '';

  apiKey.value = savedApiKey;
  selectedModel.value = savedModel;
  selectedProvider.value = savedProvider;
  apiEndpoint.value = savedEndpoint;

  // 加载自定义提供商
  try {
    const savedProviders = JSON.parse(localStorage.getItem('providers') || '[]');
    if (savedProviders.length > 0) {
      // 合并默认提供商和自定义提供商
      const defaultProviderIds = providers.value.map(p => p.id);
      const newProviders = savedProviders.filter(p => !defaultProviderIds.includes(p.id));
      providers.value = [...providers.value, ...newProviders];
    }
  } catch (error) {
    console.error('Error loading providers from localStorage:', error);
  }
};

// 保存设置到本地存储
const saveSettings = () => {
  localStorage.setItem('apiKey', apiKey.value);
  localStorage.setItem('selectedModel', selectedModel.value);
  localStorage.setItem('selectedProvider', selectedProvider.value);
  localStorage.setItem('apiEndpoint', apiEndpoint.value);
  localStorage.setItem('providers', JSON.stringify(providers.value));

  // 保存模型列表
  saveModelsToLocalStorage();

  emit('settings-saved', {
    apiKey: apiKey.value,
    selectedModel: selectedModel.value,
    selectedProvider: selectedProvider.value,
    apiEndpoint: apiEndpoint.value
  });

  ElMessage({
    message: '设置已保存',
    type: 'success'
  });

  handleClose();
};

// 保存模型列表到本地存储
const saveModelsToLocalStorage = () => {
  localStorage.setItem('models', JSON.stringify(models.value));
};

// 重置设置
const resetSettings = () => {
  apiKey.value = '';
  selectedModel.value = '';
  selectedProvider.value = 'deepseek';
  apiEndpoint.value = providers.value.find(p => p.id === 'deepseek')?.endpoint || '';
};

// 关闭抽屉
const handleClose = () => {
  emit('update:visible', false);
};

// 加载模型列表
const loadModels = () => {
  // 先尝试从本地存储加载
  try {
    const savedModels = JSON.parse(localStorage.getItem('models') || '[]');
    if (savedModels.length > 0) {
      models.value = savedModels;
      return;
    }
  } catch (error) {
    console.error('Error loading models from localStorage:', error);
  }

  // 如果本地没有，设置默认模型
  models.value = [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', provider: 'deepseek' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'deepseek' },
    { id: 'deepseek-lite', name: 'DeepSeek Lite', provider: 'deepseek' },
    { id: 'deepseek-v2', name: 'DeepSeek V2', provider: 'deepseek' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' },
    { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic' }
  ];

  // 保存到本地存储
  saveModelsToLocalStorage();
};

// 组件挂载时初始化
onMounted(() => {
  loadSettings();
  loadModels();
});
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.settings-container {
  padding: 20px;
}

.form-tip {
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.7;
  margin-top: 5px;
  transition: color 0.3s ease;
}

.settings-actions {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.model-selection-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

// 深色主题样式 - 使用 Element Plus 的暗色主题
:deep(.el-drawer) {
  .el-drawer__header {
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
  }

  .el-drawer__body {
    padding: 0;
  }
}

:deep(.el-dialog) {
  .el-dialog__header {
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 15px;
    margin-bottom: 15px;
  }

  .el-dialog__footer {
    border-top: 1px solid var(--border-color);
    padding-top: 15px;
  }
}

h3 {
  color: var(--text-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
  margin-top: 0;
}
</style>
