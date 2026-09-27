// src/katex-init.js
//
// 封装 KaTeX 的 auto-render 调用，供 site.js 在页面加载后调用。
// 支持的定界符：行内 $...$ / \(...\)，行间 $$...$$ / \[...\]。

import renderMathInElement from 'katex/contrib/auto-render';

/**
 * 在 `el`（默认 document.body）范围内查找并渲染 LaTeX 公式。
 * @param {HTMLElement} [el]
 */
export function renderMath(el = document.body) {
  renderMathInElement(el, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
    ],
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    throwOnError: false,
  });
}
