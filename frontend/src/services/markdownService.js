import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/monokai.css';

import { copyToClipboard, getLanguageDisplayName } from '../utils/helpers';

// 注册常用语言
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('sql', sql);

/**
 * 处理复制按钮点击事件
 * @param {Event} event - 点击事件
 */
const handleCopyClick = (event) => {
  const target = event.target;

  // 如果点击的是复制按钮
  if (target.classList.contains('code-copy-button')) {
    const pre = target.closest('pre');
    if (pre) {
      const code = pre.querySelector('code');
      if (code) {
        copyToClipboard(code.textContent);

        // 更新按钮文本
        const originalText = target.textContent;
        target.textContent = '已复制';
        target.classList.add('copied');

        // 2秒后恢复
        setTimeout(() => {
          target.textContent = originalText;
          target.classList.remove('copied');
        }, 2000);
      }
    }
  }
};

/**
 * 渲染Markdown为HTML
 * @param {string} text - Markdown文本
 * @returns {string} 渲染后的HTML
 */
export const renderMarkdown = (text) => {
  if (!text) return '';

  // 使用marked渲染Markdown
  const styledHtml = marked(text, {
    gfm: true,
    breaks: true,
    smartLists: true
  });

  // 在下一个事件循环中处理代码块
  // 避免重复处理
  if (window._markdownProcessing) {
    clearTimeout(window._markdownProcessing);
  }

  window._markdownProcessing = setTimeout(() => {
    // 使用数组而不是 NodeList，避免在处理过程中 DOM 变化引起的问题
    Array.from(document.querySelectorAll('pre code:not(.hljs-processing)')).forEach((block) => {
      // 标记正在处理中，避免重复处理
      block.classList.add('hljs-processing');

      // 检查元素是否已经高亮
      if (block.dataset.highlighted === 'yes') {
        // 如果已经高亮，先移除标记
        delete block.dataset.highlighted;
      }

      // 使用静默模式高亮，避免控制台输出
      try {
        // 添加选项来抑制控制台输出
        const options = { silent: true };
        hljs.highlightElement(block, options);
      } catch (e) {
        // 如果出错，静默处理
        console.error('Highlight error:', e);
      }

      // 获取语言名称
      const pre = block.parentNode;
      if (!pre) return;

      // 获取语言类型
      let language = '';
      const classList = block.classList;
      for (const className of classList) {
        if (className.startsWith('language-')) {
          language = className.replace('language-', '');
          break;
        }
      }

      // 添加语言标签（如果还没有）
      if (language && !pre.querySelector('.code-language')) {
        const languageTag = document.createElement('div');
        languageTag.className = 'code-language';
        languageTag.textContent = getLanguageDisplayName(language);
        pre.appendChild(languageTag);
      }

      // 添加复制按钮（如果还没有）
      if (!pre.querySelector('.code-copy-button')) {
        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-button';
        copyButton.textContent = '复制';
        copyButton.addEventListener('click', handleCopyClick);
        pre.appendChild(copyButton);
      }

      // 添加行号（如果还没有）
      if (!pre.classList.contains('line-numbers-added')) {
        // 标记已添加行号，避免重复添加
        pre.classList.add('line-numbers-added');

        // 获取代码内容并计算行数
        const codeContent = block.textContent || '';

        // 处理不同的换行符
        let lines = [];
        if (codeContent.includes('\r\n')) {
          // Windows风格换行
          lines = codeContent.split('\r\n');
        } else if (codeContent.includes('\n')) {
          // Unix/Linux风格换行
          lines = codeContent.split('\n');
        } else if (codeContent.includes('\r')) {
          // 旧Mac风格换行
          lines = codeContent.split('\r');
        } else {
          // 如果没有换行符，则将整个内容作为一行
          lines = [codeContent];
        }

        // 计算行数，忽略最后的空行
        let lineCount = lines.length;
        if (lineCount > 0 && lines[lineCount - 1].trim() === '') {
          lineCount--;
        }

        // 确保至少有一行
        lineCount = Math.max(lineCount, 1);

        // 创建行号容器
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'line-numbers';

        // 生成行号
        for (let i = 1; i <= lineCount; i++) {
          const lineNumber = document.createElement('span');
          lineNumber.className = 'line-number';
          lineNumber.textContent = i;
          lineNumber.setAttribute('data-line-number', i);
          lineNumbers.appendChild(lineNumber);
        }

        // 添加样式以确保行号正确显示
        if (!document.getElementById('code-line-numbers-style')) {
          const style = document.createElement('style');
          style.id = 'code-line-numbers-style';
          style.textContent = `
            pre.with-line-numbers {
              position: relative;
              padding-left: 3.5em;
            }
            pre.with-line-numbers .line-numbers {
              position: absolute;
              top: 0;
              left: 0;
              width: 3em;
              height: 100%;
              border-right: 1px solid var(--code-border, #444);
              background-color: rgba(0, 0, 0, 0.1);
              padding-top: 2em;
              text-align: right;
              user-select: none;
              overflow: hidden;
            }
            pre.with-line-numbers .line-number {
              display: block;
              padding: 0 0.5em;
              line-height: 1.5;
              height: 1.5em;
              font-family: monospace;
              color: rgba(255, 255, 255, 0.6);
            }
            pre.with-line-numbers code {
              display: block;
              line-height: 1.5;
              font-family: monospace;
            }
          `;
          document.head.appendChild(style);
        }

        // 将行号容器添加到代码块
        pre.appendChild(lineNumbers);

        // 添加行号样式类
        pre.classList.add('with-line-numbers');
        block.classList.add('with-line-numbers');
      }

      // 处理完成后移除处理中标记
      setTimeout(() => {
        block.classList.remove('hljs-processing');
      }, 100);
    });

    // 添加全局事件监听器（如果还没有添加）
    if (!window._hasCopyEventListener) {
      document.addEventListener('click', handleCopyClick);
      window._hasCopyEventListener = true;
    }
  }, 0);

  return DOMPurify.sanitize(styledHtml);
};
