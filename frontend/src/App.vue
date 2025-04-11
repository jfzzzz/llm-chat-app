<template>
  <el-container class="app-container">
    <!-- 侧边栏 -->
    <el-aside width="280px" class="sidebar" v-show="sidebarVisible">
      <ChatHistory 
        @new-chat="createNewChat"
        @select-chat="switchChat"
        @delete-chat="deleteChat"
      />
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 顶部导航 -->
      <el-header class="app-header">
        <div class="header-left">
          <el-button 
            @click="toggleSidebar" 
            type="info" 
            plain 
            size="small"
          >
            <el-icon><Menu /></el-icon>
          </el-button>
        </div>
        <div class="header-title">
          LLM Chat App
        </div>
        <div class="header-right">
          <ThemeToggle />
          <el-button @click="openSettings" type="primary" plain size="small">
            <el-icon><Setting /></el-icon> 设置
          </el-button>
        </div>
      </el-header>
      
      <!-- 聊天内容区 -->
      <el-main class="chat-main">
        <ChatContainer ref="chatContainer" />
      </el-main>
    </el-container>
  </el-container>
  
  <!-- 设置面板 -->
  <SettingsPanel 
    v-model:visible="settingsVisible"
    @settings-saved="handleSettingsSaved"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Menu, Setting } from '@element-plus/icons-vue';

// 组件导入
import ChatHistory from './components/chat/ChatHistory.vue';
import ChatContainer from './components/chat/ChatContainer.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import SettingsPanel from './components/settings/SettingsPanel.vue';

// 服务导入
import { loadThemeSettings } from './services/themeService';
import { loadThinkingModeSettings } from './services/thinkingModeService';
import { loadModels, loadApiSettings } from './services/modelService';
import { 
  createNewChat, 
  switchChat, 
  deleteChat, 
  loadChatHistory 
} from './services/chatService';

// 状态
const sidebarVisible = ref(true);
const settingsVisible = ref(false);
const chatContainer = ref(null);

// 切换侧边栏
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
};

// 打开设置面板
const openSettings = () => {
  settingsVisible.value = true;
};

// 处理设置保存
const handleSettingsSaved = () => {
  // 设置已经在服务中保存，这里可以添加额外的处理逻辑
};

// 聚焦输入框
const focusInput = () => {
  chatContainer.value?.focusInput();
};

// 初始化
onMounted(() => {
  // 加载设置
  loadThemeSettings();
  loadThinkingModeSettings();
  loadApiSettings();
  loadModels();
  
  // 加载聊天历史
  loadChatHistory();
});
</script>

<style lang="scss">
@import './styles/main.scss';

.app-container {
  height: 100vh;
  
  .sidebar {
    background-color: var(--sidebar-color);
    border-right: 1px solid var(--border-color);
    transition: width 0.3s;
  }
  
  .main-container {
    flex: 1;
    background-color: var(--bg-color);
  }
  
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--header-color);
    border-bottom: 1px solid var(--border-color);
    padding: 0 20px;
    height: 60px;
    
    .header-title {
      font-size: 18px;
      font-weight: bold;
      color: var(--text-color);
    }
  }
  
  .chat-main {
    padding: 0;
    overflow: hidden;
  }
}
</style>
