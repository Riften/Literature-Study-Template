// src/paper-source.js
//
// "查看原文"按钮：为详情页里的 `<div class="paper-source" data-paper-key="...">`
// 元素提供三种状态的渲染：
//   1. 本地已有文件（papers/manifest.json 登记且 papers/ 下文件存在）——
//      渲染一个可点击打开本地文件的链接；
//   2. 已登记获取方式但本地暂无文件——渲染一个按钮，点击后展开获取方式提示
//      （下载方式/来源链接/备注），不会自动触发下载；
//   3. 完全未登记——渲染一段说明文字，提示这是可选功能（可能是 online report
//      或原文确实无法获取）。
//
// 数据来自 `virtual:papers-index`（由 plugins/papers-index-plugin.js 在
// 构建/开发时解析 papers/manifest.json + papers/ 目录生成）。

import papersIndex from 'virtual:papers-index';
import { escapeHtml } from './escape-html.js';

export function initPaperSource() {
  document.querySelectorAll('.paper-source[data-paper-key]').forEach(setupPaperSource);
}

function setupPaperSource(container) {
  const key = container.getAttribute('data-paper-key');
  const entry = papersIndex[key];
  container.innerHTML = '';

  if (entry && entry.fileExists) {
    const link = document.createElement('a');
    link.className = 'btn-view-paper';
    link.href = entry.href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = '📄 查看原文';
    container.appendChild(link);
    return;
  }

  if (entry && entry.registered) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-view-paper btn-view-paper--missing';
    btn.textContent = '📄 本地暂无原文（点击查看获取方式）';
    btn.addEventListener('click', () => toggleHint(container, key, entry));
    container.appendChild(btn);
    return;
  }

  const span = document.createElement('span');
  span.className = 'paper-source-empty';
  span.textContent = '暂未登记本地原文（可能是 online report，或原文无法获取，这是可选项）';
  container.appendChild(span);
}

function toggleHint(container, key, entry) {
  const existing = container.querySelector('.paper-source-hint');
  if (existing) {
    existing.remove();
    return;
  }
  const hint = document.createElement('div');
  hint.className = 'paper-source-hint';
  hint.innerHTML = `
    <p>本地未找到 <code>papers/${escapeHtml(entry.filename || '?')}</code>，可按登记的方式手动获取：</p>
    ${entry.method ? `<pre>${escapeHtml(entry.method)}</pre>` : ''}
    ${entry.url ? `<p>来源链接：<a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(entry.url)}</a></p>` : ''}
    ${entry.note ? `<p>备注：${escapeHtml(entry.note)}</p>` : ''}
    <p class="paper-source-hint-tip">也可以运行 <code>npm run papers:fetch -- ${escapeHtml(key)}</code>
      按登记方式下载；下载不会自动执行，需要手动触发。</p>
  `;
  container.appendChild(hint);
}
