<template>
  <div class="file-uploader">
    <el-upload
      class="upload-area"
      drag
      action="/api/upload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
      :limit="5"
      multiple
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        拖拽文件到此处或 <em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          支持任意类型文件，单个文件大小不超过 10MB
        </div>
      </template>
    </el-upload>

    <div v-if="files.length > 0" class="file-list">
      <h3>已上传文件</h3>
      <el-table :data="files" style="width: 100%">
        <el-table-column prop="filename" label="文件名" min-width="180">
          <template #default="scope">
            <el-link :href="scope.row.path" target="_blank" type="primary">
              {{ scope.row.originalname || scope.row.filename }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="120">
          <template #default="scope">
            {{ formatFileSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button
              type="danger"
              size="small"
              @click="deleteFile(scope.row)"
              :loading="deletingFiles[scope.row.filename]"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';

// 文件列表
const files = ref([]);
const deletingFiles = ref({});

// 获取文件列表
const fetchFiles = async () => {
  try {
    const response = await fetch('/api/files');
    if (!response.ok) {
      throw new Error(`获取文件列表失败: ${response.status}`);
    }
    files.value = await response.json();
  } catch (error) {
    console.error('获取文件列表失败:', error);
    ElMessage.error('获取文件列表失败');
  }
};

// 上传前检查
const beforeUpload = (file) => {
  // 检查文件大小
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!');
    return false;
  }
  return true;
};

// 上传成功处理
const handleSuccess = (response, uploadFile) => {
  if (response.success) {
    ElMessage.success('文件上传成功');
    // 添加文件到列表
    files.value.push({
      ...response.file,
      originalname: uploadFile.name
    });
  } else {
    ElMessage.error(response.error || '上传失败');
  }
};

// 上传失败处理
const handleError = (error) => {
  console.error('上传失败:', error);
  ElMessage.error('文件上传失败');
};

// 删除文件
const deleteFile = async (file) => {
  try {
    deletingFiles.value[file.filename] = true;
    const response = await fetch(`/api/files/${file.filename}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `删除失败: ${response.status}`);
    }
    
    const result = await response.json();
    if (result.success) {
      ElMessage.success('文件已删除');
      // 从列表中移除
      files.value = files.value.filter(f => f.filename !== file.filename);
    } else {
      throw new Error(result.error || '删除失败');
    }
  } catch (error) {
    console.error('删除文件失败:', error);
    ElMessage.error(error.message || '删除文件失败');
  } finally {
    deletingFiles.value[file.filename] = false;
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

// 组件挂载时获取文件列表
onMounted(() => {
  fetchFiles();
});
</script>

<style lang="scss" scoped>
.file-uploader {
  margin: 20px 0;
  
  .upload-area {
    width: 100%;
  }
  
  .file-list {
    margin-top: 20px;
    
    h3 {
      margin-bottom: 10px;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }
  }
}
</style>
