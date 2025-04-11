/**
 * 生成唯一ID
 * @returns {string} 唯一ID
 */
export const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    // 可以添加一个复制成功的提示，但这里简化处理
  } catch (err) {
    console.error('复制失败:', err);
  }
};

/**
 * 获取语言的友好显示名称
 * @param {string} langCode - 语言代码
 * @returns {string} 语言的友好显示名称
 */
export const getLanguageDisplayName = (langCode) => {
  if (!langCode) return '';
  
  const languageMap = {
    // 常见语言
    'js': 'JavaScript',
    'javascript': 'JavaScript',
    'ts': 'TypeScript',
    'typescript': 'TypeScript',
    'py': 'Python',
    'python': 'Python',
    'rb': 'Ruby',
    'ruby': 'Ruby',
    'java': 'Java',
    'c': 'C',
    'cpp': 'C++',
    'cs': 'C#',
    'csharp': 'C#',
    'go': 'Go',
    'rust': 'Rust',
    'php': 'PHP',
    'swift': 'Swift',
    'kotlin': 'Kotlin',
    
    // 脚本语言
    'sh': 'Shell',
    'bash': 'Bash',
    'powershell': 'PowerShell',
    'ps1': 'PowerShell',
    'bat': 'Batch',
    'cmd': 'Batch',
    
    // 标记语言
    'html': 'HTML',
    'xml': 'XML',
    'css': 'CSS',
    'scss': 'SCSS',
    'sass': 'Sass',
    'less': 'Less',
    'md': 'Markdown',
    'markdown': 'Markdown',
    
    // 数据格式
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'toml': 'TOML',
    'ini': 'INI',
    
    // 数据库
    'sql': 'SQL',
    'mysql': 'MySQL',
    'pgsql': 'PostgreSQL',
    'postgresql': 'PostgreSQL',
    'mongodb': 'MongoDB',
    
    // 其他
    'plaintext': '纯文本',
    'text': '纯文本',
    'txt': '纯文本',
    'diff': 'Diff',
    'dockerfile': 'Dockerfile',
    'docker': 'Dockerfile'
  };
  
  return languageMap[langCode.toLowerCase()] || langCode;
};

/**
 * 获取模型的首字母
 * @param {string} model - 模型名称
 * @returns {string} 模型的首字母
 */
export const getModelInitial = (model) => {
  if (!model) return 'A';
  
  if (model.startsWith('gpt-')) {
    return 'G';
  } else if (model.startsWith('claude-')) {
    return 'C';
  } else if (model.startsWith('deepseek-')) {
    return 'D';
  }
  
  // 默认返回首字母
  return model.charAt(0).toUpperCase();
};

/**
 * 获取模型的显示名称
 * @param {string} modelId - 模型ID
 * @param {Array} modelsList - 模型列表
 * @returns {string} 模型的显示名称
 */
export const getModelName = (modelId, modelsList) => {
  if (!modelId) return '';
  
  // 在模型列表中查找
  const modelInfo = modelsList.find(m => m.id === modelId);
  if (modelInfo) {
    return modelInfo.name;
  }
  
  // 如果没找到，返回模型ID
  return modelId;
};
