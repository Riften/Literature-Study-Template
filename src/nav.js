// src/nav.js
//
// 顶部导航当前页高亮 + "返回顶部"悬浮按钮，从早期的 assets/js/main.js 迁移。

export function initNav() {
  highlightCurrentNavLink();
  setupBackToTop();
}

function highlightCurrentNavLink() {
  const links = document.querySelectorAll('.site-nav a');
  const here = window.location.pathname.replace(/\/index\.html$/, '/');
  links.forEach((link) => {
    const target = new URL(link.getAttribute('href'), window.location.href).pathname.replace(
      /\/index\.html$/,
      '/'
    );
    if (target === here) link.classList.add('active');
  });
}

function setupBackToTop() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', '返回顶部');
  btn.textContent = '↑';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
}
