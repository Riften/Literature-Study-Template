// src/escape-html.js
//
// 最小的 HTML 转义工具，被 citation.js 与 paper-source.js 共用，避免往
// tooltip / 提示框里插入的字段（标题、备注、命令等）破坏页面结构。

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
