// plugins/papers-index-plugin.js
//
// Vite 插件：把 papers/manifest.json + papers/ 目录下实际存在的本地文件，
// 解析成"每个 bib key 是否有可用原文副本"的状态表，通过虚拟模块
// `virtual:papers-index` 暴露给页面代码（src/paper-source.js）。
//
// 论文原文本身不进版本库（见 .gitignore），只有 papers/manifest.json 这份
// "如何重新获取"的元信息被提交。因此：
//   - dev 模式下，本插件额外挂一个 /papers/ 静态服务中间件，让详情页面的
//     "查看原文" 按钮能直接打开本地已下载的文件；
//   - build 产物里不包含 papers/ 下的原始文件（不适合随静态站点分发），
//     所以线上部署站点看到的都是"本地未找到，请见获取方式"的提示——这是
//     预期行为：原文副本是调研者本机的维护物，不是要对外发布的内容。

import { existsSync, statSync, createReadStream } from 'node:fs';
import { join, resolve, extname, normalize, sep } from 'node:path';
import { buildPapersStatus, manifestPath, papersDir } from '../scripts/lib/papers-manifest.js';

const VIRTUAL_ID = 'virtual:papers-index';
const RESOLVED_ID = '\0' + VIRTUAL_ID;

const MIME_TYPES = {
  '.pdf': 'application/pdf',
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.zip': 'application/zip',
};

/** 在状态表基础上补上 `href`（可用于 <a href> 的 dev 访问路径）。 */
export function buildPapersIndex(root) {
  const status = buildPapersStatus(root);
  const index = {};
  for (const [key, entry] of Object.entries(status)) {
    index[key] = {
      ...entry,
      href: entry.fileExists ? `/papers/${entry.filename}` : null,
    };
  }
  return index;
}

/**
 * @param {object} [options]
 * @param {string} [options.root] 项目根目录，默认 process.cwd()。
 */
export default function papersIndexPlugin(options = {}) {
  const root = resolve(options.root || process.cwd());
  const manifestFile = manifestPath(root);
  const dir = papersDir(root);

  return {
    name: 'papers-index-plugin',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      const index = buildPapersIndex(root);
      return `export default ${JSON.stringify(index)};\n`;
    },

    configureServer(server) {
      server.watcher.add(manifestFile);
      server.watcher.add(dir);

      const onRelevantChange = (changedPath) => {
        if (changedPath === manifestFile || changedPath.startsWith(dir + sep)) {
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('change', onRelevantChange);
      server.watcher.on('add', onRelevantChange);
      server.watcher.on('unlink', onRelevantChange);

      // 仅 dev 模式：把 papers/ 目录下已下载的本地文件挂到 /papers/ 路径下，
      // 让"查看原文"按钮能直接打开。做了基础的路径穿越防护。
      server.middlewares.use('/papers/', (req, res, next) => {
        try {
          const urlPath = decodeURIComponent((req.url || '').split('?')[0]);
          const relPath = normalize(urlPath).replace(/^([./\\]+)/, '');
          const filePath = join(dir, relPath);
          if (!filePath.startsWith(dir) || !existsSync(filePath) || !statSync(filePath).isFile()) {
            next();
            return;
          }
          const type = MIME_TYPES[extname(filePath).toLowerCase()] || 'application/octet-stream';
          res.setHeader('Content-Type', type);
          createReadStream(filePath).pipe(res);
        } catch {
          next();
        }
      });
    },
  };
}
