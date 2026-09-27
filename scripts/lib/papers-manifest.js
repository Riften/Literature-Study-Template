// scripts/lib/papers-manifest.js
//
// 本地论文原文管理的纯函数部分：解析 papers/manifest.json、计算每个
// bib key 对应的本地文件状态。被 plugins/papers-index-plugin.js（暴露
// virtual:papers-index 给页面）、scripts/papers-cli.mjs（命令行工具）与
// tests/integrity.test.mjs（完整性检查）共用，保证行为一致。
//
// manifest.json 结构（key 为 bib key，只登记"确实打算/已经维护本地原文"
// 的条目；允许某些工作完全不在这里出现，例如只有 online report、或者
// 原文已确认无法获取）：
//
//   {
//     "vaswani2017attention": {
//       "filename": "vaswani2017attention.pdf",  // 对应 papers/ 下的本地文件名
//       "url": "https://arxiv.org/pdf/1706.03762.pdf", // 原文下载/访问链接
//       "method": "curl -L -o papers/vaswani2017attention.pdf <url>", // 获取方式
//       "note": ""  // 可选备注，例如"需要机构订阅"等
//     }
//   }

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const PAPERS_DIRNAME = 'papers';
export const MANIFEST_FILENAME = 'manifest.json';

/** 读取并解析 papers/manifest.json；文件不存在时返回空对象。 */
export function loadManifest(root) {
  const manifestPath = join(root, PAPERS_DIRNAME, MANIFEST_FILENAME);
  if (!existsSync(manifestPath)) return {};
  const text = readFileSync(manifestPath, 'utf-8');
  if (text.trim() === '') return {};
  const data = JSON.parse(text);
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${manifestPath} 顶层必须是一个以 bib key 为字段名的对象`);
  }
  return data;
}

export function manifestPath(root) {
  return join(root, PAPERS_DIRNAME, MANIFEST_FILENAME);
}

export function papersDir(root) {
  return join(root, PAPERS_DIRNAME);
}

/**
 * 计算每个登记条目对应的本地文件是否存在，返回以 bib key 为索引的状态表：
 *   { registered, filename, url, method, note, fileExists }
 * 不在 manifest 里的 bib key 不会出现在返回结果中（由调用方决定如何处理
 * "未登记" 的情况——通常代表这篇工作暂无需要维护的本地原文）。
 */
export function buildPapersStatus(root) {
  const manifest = loadManifest(root);
  const dir = papersDir(root);
  const status = {};
  for (const [key, entry] of Object.entries(manifest)) {
    const filename = entry.filename || '';
    const fileExists = Boolean(filename) && existsSync(join(dir, filename));
    status[key] = {
      registered: true,
      filename,
      url: entry.url || '',
      method: entry.method || '',
      note: entry.note || '',
      fileExists,
    };
  }
  return status;
}
