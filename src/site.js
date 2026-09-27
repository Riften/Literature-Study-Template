// src/site.js
//
// 每个内容页面唯一需要引入的入口模块：
//   <script type="module" src="../../src/site.js"></script>
// （相对路径深度按页面在 pages/<category>/*.html 中的位置调整；
//  index.html 用 "./src/site.js"）
//
// 负责：引入全局样式（含 KaTeX 样式）、渲染 LaTeX 公式、初始化引用工具、
// 初始化"查看原文"按钮（详情页 `.paper-source` 元素）、初始化导航高亮/
// 返回顶部按钮。页面专属的内容（3D 场景等）仍由页面自己的
// <script type="module"> 负责，不在这里处理。

import './styles/main.css';
import 'katex/dist/katex.min.css';
import { renderMath } from './katex-init.js';
import { initCitations } from './citation.js';
import { initPaperSource } from './paper-source.js';
import { initNav } from './nav.js';

function init() {
  renderMath(document.body);
  initCitations();
  initPaperSource();
  initNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
