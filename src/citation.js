// src/citation.js
//
// 引用工具：为页面中所有 `<cite class="ref" data-key="...">` 元素提供
// 悬浮提示（展示标题/作者/年份/原始 BibTeX）与点击跳转（跳到对应详情页）。
//
// 与旧版（assets/js/citation.js）的区别：不再运行时 fetch 一个生成好的
// JSON 文件，而是直接 `import bibIndex from 'virtual:bib-index'`——这个
// 虚拟模块由 plugins/bib-index-plugin.js 在构建/开发时解析
// bib/references.bib 生成，dev 模式下改动 bib 文件会自动触发刷新。

import bibIndex from 'virtual:bib-index';
import { escapeHtml } from './escape-html.js';

let tooltipEl = null;

export function initCitations() {
  const refs = document.querySelectorAll('.ref[data-key]');
  refs.forEach((el) => setupRef(el));
}

function setupRef(el) {
  const key = el.getAttribute('data-key');
  const entry = bibIndex[key];

  if (!entry) {
    el.classList.add('ref-missing');
    el.title = `未在 bib/references.bib 中找到 key: ${key}`;
    return;
  }

  el.addEventListener('mouseenter', () => showTooltip(el, entry));
  el.addEventListener('mouseleave', hideTooltip);
  el.addEventListener('click', (event) => {
    if (!entry.hasDetailPage) return;
    event.preventDefault();
    const target = new URL(`../details/${key}.html`, window.location.href);
    window.location.href = target.href;
  });

  if (!entry.hasDetailPage) {
    el.classList.add('ref-missing');
  }
}

function buildTooltipHtml(entry) {
  const metaParts = [entry.author, entry.venue, entry.year].filter(Boolean);
  return `
    <div class="cite-tooltip-title">${escapeHtml(entry.title || entry.key)}</div>
    ${metaParts.length ? `<div class="cite-tooltip-meta">${escapeHtml(metaParts.join(' · '))}</div>` : ''}
    <pre>${escapeHtml(entry.raw)}</pre>
    ${entry.hasDetailPage ? '' : '<div class="cite-tooltip-meta">（暂无详情页面，点击不会跳转）</div>'}
  `;
}

function showTooltip(anchorEl, entry) {
  hideTooltip();
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'cite-tooltip';
  tooltipEl.innerHTML = buildTooltipHtml(entry);
  document.body.appendChild(tooltipEl);

  const rect = anchorEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.getBoundingClientRect();
  let top = rect.bottom + 8;
  let left = rect.left;
  if (left + tooltipRect.width > window.innerWidth - 12) {
    left = window.innerWidth - tooltipRect.width - 12;
  }
  if (top + tooltipRect.height > window.innerHeight - 12) {
    top = rect.top - tooltipRect.height - 8;
  }
  tooltipEl.style.top = `${Math.max(8, top)}px`;
  tooltipEl.style.left = `${Math.max(8, left)}px`;
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.remove();
    tooltipEl = null;
  }
}
