<template>
  <el-button @click="toggleTheme" type="info" plain size="small" class="theme-toggle-btn">
    <el-icon v-if="isDarkTheme"><Sunny /></el-icon>
    <el-icon v-else><Moon /></el-icon>
    {{ isDarkTheme ? '浅色模式' : '深色模式' }}
  </el-button>
</template>

<script setup>
import { Moon, Sunny } from '@element-plus/icons-vue';
import { isDarkTheme, toggleTheme } from '../services/themeService';
</script>

<style lang="scss" scoped>
.theme-toggle-btn {
  margin-right: 10px;
}
</style>
