import { ref } from 'vue';

// 聊天设置状态
export const systemPrompt = ref('');
export const streamOutput = ref(true);

/**
 * 保存聊天设置
 */
export const saveChatSettings = () => {
  localStorage.setItem('systemPrompt', systemPrompt.value);
  localStorage.setItem('streamOutput', streamOutput.value ? 'true' : 'false');
};

/**
 * 加载聊天设置
 */
export const loadChatSettings = () => {
  const savedSystemPrompt = localStorage.getItem('systemPrompt');
  if (savedSystemPrompt !== null) {
    systemPrompt.value = savedSystemPrompt;
  }
  
  const savedStreamOutput = localStorage.getItem('streamOutput');
  if (savedStreamOutput !== null) {
    streamOutput.value = savedStreamOutput === 'true';
  }
};
