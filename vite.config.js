import { defineConfig } from 'vite';
import bibIndexPlugin from './plugins/bib-index-plugin.js';
import papersIndexPlugin from './plugins/papers-index-plugin.js';
import { buildRollupInput } from './scripts/lib/glob-html.js';

// 多页应用入口：根目录 index.html + pages/**/*.html，自动枚举，
// 新增调研页面无需手动修改本文件。
const input = buildRollupInput(process.cwd());

export default defineConfig({
  // 相对路径部署：GitHub Pages 项目页等子路径场景下，构建产物内部引用
  // 一律使用相对路径，因此默认不需要设置 base。若部署到固定子路径且
  // public/ 下的资源用了根路径引用，可在此显式设置 base（详见 README）。
  base: './',
  plugins: [bibIndexPlugin(), papersIndexPlugin()],
  build: {
    rollupOptions: {
      input,
    },
  },
});
