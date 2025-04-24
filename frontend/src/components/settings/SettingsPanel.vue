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
        <!-- 系统提示设置 -->
        <el-form-item label="系统提示 (System Prompt)">
          <el-input
            v-model="systemPromptValue"
            type="textarea"
            :rows="3"
            placeholder="请输入系统提示，不填则使用默认值"
          />
        </el-form-item>

        <!-- 流式输出开关 -->
        <el-form-item label="流式输出">
          <el-switch
            v-model="streamOutputValue"
            active-text="启用"
            inactive-text="关闭"
          />
          <div class="setting-description">启用流式输出可实时看到回答，关闭则一次性返回完整回答</div>
        </el-form-item>
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

        <!-- API 密钥 -->
        <el-form-item label="API 密钥">
          <el-input
            v-model="apiKey"
            placeholder="请输入 API 密钥"
            show-password
          />
        </el-form-item>

        <!-- API 端点 -->
        <el-form-item label="API 端点">
          <el-input
            v-model="apiEndpoint"
            placeholder="请输入 API 端点"
          />
        </el-form-item>

        <!-- 模型选择 -->
        <el-form-item label="模型">
          <div class="model-selection">
            <el-select
              v-model="selectedModel"
              placeholder="选择模型"
              style="width: 100%"
              filterable
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
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <div class="settings-actions">
        <el-button @click="resetSettings">重置</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </div>
    </div>
  </el-drawer>

  <!-- 添加模型对话框 -->
  <el-dialog
    v-model="showAddModelDialog"
    title="添加新模型"
    width="400px"
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
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import {
  apiKey,
  selectedModel,
  selectedProvider,
  apiEndpoint,
  models,
  saveApiSettings,
  addModel
} from '../../services/modelService';
import {
  systemPrompt,
  streamOutput,
  saveChatSettings
} from '../../services/chatSettingsService';

// 属性定义
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

// 事件定义
const emit = defineEmits(['update:visible', 'settings-saved']);

// 提供商列表
const providers = ref([
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'deepseek', name: 'DeepSeek' },
  { id: 'custom', name: '自定义' }
]);

// 新模型表单
const newModel = ref({
  id: '',
  name: '',
  provider: selectedProvider.value
});

// 对话框状态
const showAddModelDialog = ref(false);

// 聊天设置
const systemPromptValue = ref(systemPrompt.value);
const streamOutputValue = ref(streamOutput.value);

// 根据当前选择的提供商过滤模型
const filteredModels = computed(() => {
  if (!selectedProvider.value) return models.value;
  return models.value.filter(model => model.provider === selectedProvider.value);
});

// 处理提供商变更
const handleProviderChange = (value) => {
  // 检查是否是新创建的提供商
  const existingProvider = providers.value.find(p => p.id === value);
  if (!existingProvider) {
    // 添加新提供商
    providers.value.push({
      id: value,
      name: value
    });
  }

  // 更新新模型表单中的提供商
  newModel.value.provider = value;

  // 如果当前选中的模型不属于新的提供商，清空选择
  const currentModel = models.value.find(m => m.id === selectedModel.value);
  if (currentModel && currentModel.provider !== value) {
    selectedModel.value = '';
  }

  // 根据提供商更新默认API端点
  if (value === 'openai') {
    apiEndpoint.value = 'https://api.openai.com/v1/chat/completions';
  } else if (value === 'anthropic') {
    apiEndpoint.value = 'https://api.anthropic.com/v1/messages';
  } else if (value === 'deepseek') {
    apiEndpoint.value = 'https://api.deepseek.com/v1/chat/completions';
  } else {
    apiEndpoint.value = '';
  }
};

// 关闭抽屉
const handleClose = () => {
  emit('update:visible', false);
};

// 重置设置
const resetSettings = () => {
  if (confirm('确定要重置所有设置吗？这将清除您的API密钥和其他配置。')) {
    apiKey.value = '';
    selectedModel.value = '';
    selectedProvider.value = 'openai';
    apiEndpoint.value = '';
    systemPromptValue.value = '';
    streamOutputValue.value = true;
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
  const model = {
    id: newModel.value.id,
    name: newModel.value.name,
    provider: newModel.value.provider
  };

  addModel(model);

  // 选择新添加的模型
  selectedModel.value = newModel.value.id;

  // 重置表单并关闭对话框
  newModel.value = { id: '', name: '', provider: selectedProvider.value };
  showAddModelDialog.value = false;

  ElMessage.success('模型添加成功');
};

// 保存设置
const saveSettings = () => {
  // 保存 API 设置
  saveApiSettings();

  // 保存聊天设置
  systemPrompt.value = systemPromptValue.value;
  streamOutput.value = streamOutputValue.value;
  saveChatSettings();

  emit('settings-saved', {
    apiKey: apiKey.value,
    selectedModel: selectedModel.value,
    selectedProvider: selectedProvider.value,
    apiEndpoint: apiEndpoint.value,
    systemPrompt: systemPrompt.value,
    streamOutput: streamOutput.value
  });

  ElMessage({
    message: '设置已保存',
    type: 'success'
  });

  handleClose();
};
</script>

<style lang="scss" scoped>
.settings-container {
  padding: 0 20px;

  h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 18px;
    color: var(--text-color);
  }

  .model-selection {
    display: flex;
    align-items: center;
  }

  .setting-description {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 5px;
  }

  .settings-actions {
    margin-top: 30px;
    display: flex;
    justify-content: flex-end;

    .el-button {
      margin-left: 10px;
    }
  }
}
</style>
