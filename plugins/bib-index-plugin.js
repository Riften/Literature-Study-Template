// plugins/bib-index-plugin.js
//
// Vite 插件：把 bib/references.bib 解析成结构化数据，通过虚拟模块
// `virtual:bib-index` 暴露给页面代码（src/citation.js）导入，替代早期
// "手动跑 Python 脚本生成 JSON + 运行时 fetch" 的方案。
//
// dev 模式下监听 bib/references.bib 与 pages/details/ 目录的变化，一旦改动
// 立即让虚拟模块失效并触发浏览器整页刷新，实现"改 bib 立刻生效"。

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseBib } from '../scripts/lib/bib-parser.js';

const VIRTUAL_ID = 'virtual:bib-index';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

/**
 * 把 bib 条目数组转换成以 key 为索引的对象，并标注每条是否已有对应的
 * 详情页面（约定：bib key === pages/details/<key>.html 的文件名）。
 */
export function buildBibIndex(root) {
  const bibPath = join(root, 'bib', 'references.bib');
  const detailsDir = join(root, 'pages', 'details');

  let entries = [];
  if (existsSync(bibPath)) {
    entries = parseBib(readFileSync(bibPath, 'utf-8'));
  }

  const detailKeys = new Set();
  if (existsSync(detailsDir)) {
    for (const name of readdirSync(detailsDir)) {
      if (name.endsWith('.html')) detailKeys.add(name.replace(/\.html$/, ''));
    }
  }

  const index = {};
  for (const entry of entries) {
    index[entry.key] = {
      key: entry.key,
      type: entry.type,
      title: entry.fields.title || '',
      author: entry.fields.author || '',
      year: entry.fields.year || '',
      venue: entry.fields.booktitle || entry.fields.journal || entry.fields.venue || '',
      url: entry.fields.url || '',
      raw: entry.raw,
      hasDetailPage: detailKeys.has(entry.key),
    };
  }
  return index;
}

/**
 * @param {object} [options]
 * @param {string} [options.root] 项目根目录，默认 process.cwd()。
 */
export default function bibIndexPlugin(options = {}) {
  const root = resolve(options.root || process.cwd());
  const bibPath = join(root, 'bib', 'references.bib');
  const detailsDir = join(root, 'pages', 'details');

  return {
    name: 'bib-index-plugin',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      const index = buildBibIndex(root);
      return `export default ${JSON.stringify(index)};\n`;
    },

    configureServer(server) {
      server.watcher.add(bibPath);
      server.watcher.add(detailsDir);

      const onRelevantChange = (changedPath) => {
        if (changedPath === bibPath || changedPath.startsWith(detailsDir)) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
          server.ws.send({ type: 'full-reload' });
        }
      };

      server.watcher.on('change', onRelevantChange);
      server.watcher.on('add', onRelevantChange);
      server.watcher.on('unlink', onRelevantChange);
    },
  };
}
