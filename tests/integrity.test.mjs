// tests/integrity.test.mjs
//
// 构建/链接完整性检查（vitest）：
//   1. pages/**/*.html 中出现的 data-key 都能在 bib/references.bib 中找到；
//   2. pages/details/*.html 的文件名都能在 bib 中找到同名 key（命名约定校验）；
//   3. pages/**/*.html 与根 index.html 中的相对内部链接（排除 http(s):/mailto:/#）
//      都指向实际存在的文件；
//   4. 存在于 bib 但还没有详情页面的 key 只打印提示，不算失败（调研中间状态）。

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parseBib } from '../scripts/lib/bib-parser.js';
import { listContentHtmlFiles } from '../scripts/lib/glob-html.js';
import { loadManifest, manifestPath, buildPapersStatus } from '../scripts/lib/papers-manifest.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bibPath = join(root, 'bib', 'references.bib');
const detailsDir = join(root, 'pages', 'details');

function loadBibEntries() {
  return parseBib(readFileSync(bibPath, 'utf-8'));
}

function extractDataKeys(html) {
  const keys = [];
  const re = /data-key="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) keys.push(m[1]);
  return keys;
}

/** 提取 href/src 中的内部相对链接（排除外链、邮件、锚点、data: URI）。 */
function extractInternalLinks(html) {
  const links = [];
  const re = /(?:href|src)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const target = m[1];
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:') ||
      target.startsWith('#') ||
      target.startsWith('data:') ||
      target.startsWith('virtual:')
    ) {
      continue;
    }
    links.push(target);
  }
  return links;
}

describe('bib 引用完整性', () => {
  const entries = loadBibEntries();
  const bibKeys = new Set(entries.map((e) => e.key));
  const htmlFiles = listContentHtmlFiles(root);

  it('bib/references.bib 至少包含一条有效条目', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('bib 中没有重复的 key', () => {
    const seen = new Set();
    const dup = [];
    for (const e of entries) {
      if (seen.has(e.key)) dup.push(e.key);
      seen.add(e.key);
    }
    expect(dup).toEqual([]);
  });

  for (const file of htmlFiles) {
    const rel = relative(root, file);
    const html = readFileSync(file, 'utf-8');
    const keys = extractDataKeys(html);
    if (keys.length === 0) continue;
    it(`${rel} 中引用的 data-key 都存在于 bib/references.bib`, () => {
      const missing = keys.filter((k) => !bibKeys.has(k));
      expect(missing, `缺失的 bib key: ${missing.join(', ')}`).toEqual([]);
    });
  }
});

describe('详情页命名约定（key === 文件名）', () => {
  const entries = loadBibEntries();
  const bibKeys = new Set(entries.map((e) => e.key));

  const detailFiles = existsSync(detailsDir)
    ? readdirSync(detailsDir).filter((f) => f.endsWith('.html'))
    : [];

  for (const file of detailFiles) {
    const key = file.replace(/\.html$/, '');
    it(`pages/details/${file} 的文件名对应 bib 中存在 key "${key}"`, () => {
      expect(bibKeys.has(key)).toBe(true);
    });
  }

  it('（提示）尚无详情页面的 bib 条目', () => {
    const detailKeys = new Set(detailFiles.map((f) => f.replace(/\.html$/, '')));
    const missing = entries.map((e) => e.key).filter((k) => !detailKeys.has(k));
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[提示] 以下 bib 条目暂无详情页面，属于调研中间状态，不算失败: ${missing.join(', ')}`);
    }
    expect(true).toBe(true);
  });
});

describe('内部链接完整性', () => {
  const htmlFiles = listContentHtmlFiles(root);

  for (const file of htmlFiles) {
    const rel = relative(root, file);
    const html = readFileSync(file, 'utf-8');
    const links = extractInternalLinks(html);
    if (links.length === 0) continue;

    it(`${rel} 中的内部链接都指向实际存在的文件`, () => {
      const baseDir = dirname(file);
      const broken = links.filter((link) => {
        const cleanPath = link.split('#')[0].split('?')[0];
        if (cleanPath === '') return false; // 纯锚点链接已被排除，这里兜底
        const target = resolve(baseDir, cleanPath);
        return !existsSync(target);
      });
      expect(broken, `失效链接: ${broken.join(', ')}`).toEqual([]);
    });
  }
});

describe('本地原文 manifest 完整性（papers/manifest.json，见 docs/paper-archive.md）', () => {
  // 只做"元信息本身没写错"的最小校验，不要求本地一定有原文文件——
  // 是否维护本地原文完全是可选的（online report / 无法获取的工作可以不登记）。
  const entries = loadBibEntries();
  const bibKeys = new Set(entries.map((e) => e.key));

  it('papers/manifest.json 是合法 JSON，且顶层是对象', () => {
    expect(() => loadManifest(root)).not.toThrow();
  });

  const manifest = existsSync(manifestPath(root)) ? loadManifest(root) : {};

  for (const key of Object.keys(manifest)) {
    it(`papers/manifest.json 中的 key "${key}" 存在于 bib/references.bib`, () => {
      expect(bibKeys.has(key)).toBe(true);
    });

    it(`papers/manifest.json 中 "${key}" 的登记信息包含 filename 字段`, () => {
      expect(Boolean(manifest[key].filename)).toBe(true);
    });
  }

  it('（提示）本地原文副本状态一览', () => {
    const status = buildPapersStatus(root);
    for (const key of Object.keys(status)) {
      const s = status[key];
      // eslint-disable-next-line no-console
      console.log(
        `[提示] ${key}: ${s.fileExists ? `本地已有 papers/${s.filename}` : `已登记但本地缺文件（papers/${s.filename}）`}`
      );
    }
    expect(true).toBe(true);
  });
});
