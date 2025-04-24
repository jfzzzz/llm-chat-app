<template>
  <div class="file-selector">
    <el-popover
      placement="top"
      :width="400"
      trigger="click"
      v-model:visible="popoverVisible"
    >
      <template #reference>
        <el-button
          type="primary"
          :icon="Plus"
          circle
          size="small"
          :disabled="isLoading"
          class="file-button"
        />
      </template>

      <div class="file-selector-content">
        <h4>选择文件</h4>
        <div v-if="loading" class="loading-files">
          <el-icon class="is-loading"><Loading /></el-icon> 加载文件中...
        </div>
        <div v-else-if="files.length === 0" class="no-files">
          没有可用的文件。请先在文件管理中上传文件。
        </div>
        <el-scrollbar height="250px" v-else>
          <el-radio-group v-model="selectedFile" class="file-list">
            <div v-for="file in files" :key="file.filename" class="file-item">
              <el-radio :label="file.filename">
                <div class="file-info">
                  <div class="file-name">{{ file.originalname || file.filename }}</div>
                  <div class="file-size">{{ formatFileSize(file.size) }}</div>
                </div>
              </el-radio>
            </div>
          </el-radio-group>
        </el-scrollbar>

        <div class="file-actions">
          <el-button @click="popoverVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="selectFile"
            :disabled="!selectedFile"
          >
            插入文件
          </el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Plus, Loading } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// 定义属性
const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
});

// 定义事件
const emit = defineEmits(['select-file']);

// 状态
const popoverVisible = ref(false);
const files = ref([]);
const selectedFile = ref('');
const loading = ref(false);

// 获取文件列表
const fetchFiles = async () => {
  loading.value = true;
  try {
    const response = await fetch('/api/files');
    if (!response.ok) {
      throw new Error(`获取文件列表失败: ${response.status}`);
    }
    files.value = await response.json();
  } catch (error) {
    console.error('获取文件列表失败:', error);
    ElMessage.error('获取文件列表失败');
  } finally {
    loading.value = false;
  }
};

// 选择文件
const selectFile = () => {
  if (!selectedFile.value) return;

  const file = files.value.find(f => f.filename === selectedFile.value);
  if (file) {
    emit('select-file', file);
    popoverVisible.value = false;
    selectedFile.value = '';
  }
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 监听 popover 显示
watch(popoverVisible, (visible) => {
  if (visible) {
    fetchFiles();
  }
});

// 组件挂载时获取文件列表
onMounted(() => {
  fetchFiles();
});
</script>

<style lang="scss" scoped>
.file-selector {
  display: inline-block;
  margin-right: 8px;

  .file-button {
    margin-right: 8px;
  }

  .file-selector-content {
    h4 {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 16px;
    }

    .loading-files,
    .no-files {
      padding: 20px 0;
      text-align: center;
      color: var(--el-text-color-secondary);
    }

    .file-list {
      display: flex;
      flex-direction: column;
      width: 100%;

      .file-item {
        margin-bottom: 8px;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--el-fill-color-light);
        }

        .file-info {
          display: flex;
          flex-direction: column;

          .file-name {
            font-weight: 500;
            margin-bottom: 4px;
            word-break: break-all;
          }

          .file-size {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }

    .file-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;

      .el-button {
        margin-left: 8px;
      }
    }
  }
}
</style>
