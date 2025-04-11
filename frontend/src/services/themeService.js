import { ref } from 'vue';

// 主题状态
export const isDarkTheme = ref(true); // 默认使用暗色主题

/**
 * 切换主题
 */
export const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  applyTheme();
  localStorage.setItem('isDarkTheme', isDarkTheme.value ? 'true' : 'false');
};

/**
 * 应用主题
 */
export const applyTheme = () => {
  // 使用 Element Plus 的主题切换
  const htmlEl = document.documentElement;
  
  if (isDarkTheme.value) {
    htmlEl.classList.add('dark');
    htmlEl.classList.add('dark-theme');
    // 设置 Element Plus 的暗色主题
    htmlEl.setAttribute('data-theme', 'dark');
  } else {
    htmlEl.classList.remove('dark');
    htmlEl.classList.remove('dark-theme');
    // 移除 Element Plus 的暗色主题
    htmlEl.removeAttribute('data-theme');
  }
};

/**
 * 加载主题设置
 */
export const loadThemeSettings = () => {
  const savedTheme = localStorage.getItem('isDarkTheme');
  // 如果没有保存的主题设置，默认使用暗色主题
  isDarkTheme.value = savedTheme === null ? true : savedTheme === 'true';
  applyTheme();
};
