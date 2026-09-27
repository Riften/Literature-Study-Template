#!/usr/bin/env node
// scripts/papers-cli.mjs
//
// 本地论文原文的维护工具（命令行，不是页面功能——论文下载是项目维护职责，
// 不应该由网页触发，见 docs/paper-archive.md）。
//
// 用法：
//   node scripts/papers-cli.mjs list                     # 查看所有 bib key 的本地原文状态
//   node scripts/papers-cli.mjs add <key> [--url=...] [--filename=...] [--method=...] [--note=...]
//                                                          # 登记/更新一条获取方式（不下载）
//   node scripts/papers-cli.mjs remove <key>              # 删除一条登记（不删本地文件）
//   node scripts/papers-cli.mjs fetch <key> [--force]     # 按登记的方式下载到 papers/ 下
//   node scripts/papers-cli.mjs fetch --all               # 下载所有"已登记但本地缺文件"的条目
//
// 也可以通过 package.json 里的 npm run papers:list / papers:add / papers:fetch 调用，
// 传参数时注意加 `--`，例如：npm run papers:fetch -- vaswani2017attention

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseBib } from './lib/bib-parser.js';
import { loadManifest, manifestPath, papersDir, buildPapersStatus } from './lib/papers-manifest.js';

const root = resolveRoot();

function resolveRoot() {
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

function loadBibKeys() {
  const bibPath = join(root, 'bib', 'references.bib');
  if (!existsSync(bibPath)) return new Set();
  return new Set(parseBib(readFileSync(bibPath, 'utf-8')).map((e) => e.key));
}

function saveManifest(manifest) {
  const dir = papersDir(root);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(manifestPath(root), JSON.stringify(sorted, null, 2) + '\n', 'utf-8');
}

function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [k, ...rest] = arg.slice(2).split('=');
      flags[k] = rest.length > 0 ? rest.join('=') : true;
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

function cmdList() {
  const bibKeys = loadBibKeys();
  const status = buildPapersStatus(root);
  const allKeys = new Set([...bibKeys, ...Object.keys(status)]);
  if (allKeys.size === 0) {
    console.log('bib/references.bib 中还没有任何条目。');
    return;
  }
  const rows = [...allKeys].sort().map((key) => {
    const entry = status[key];
    let state;
    if (!bibKeys.has(key)) state = '⚠ manifest 中的 key 不在 bib 里';
    else if (!entry) state = '－ 未登记（可选，可能是 online report / 无法获取）';
    else if (entry.fileExists) state = `✔ 已有本地文件 papers/${entry.filename}`;
    else state = `… 已登记但本地缺文件（papers/${entry.filename || '?'}）`;
    return { key, state };
  });
  const width = Math.max(...rows.map((r) => r.key.length));
  for (const row of rows) {
    console.log(`${row.key.padEnd(width)}  ${row.state}`);
  }
}

function cmdAdd(positional, flags) {
  const [key] = positional;
  if (!key) {
    console.error('用法: papers add <bib-key> [--url=...] [--filename=...] [--method=...] [--note=...]');
    process.exitCode = 1;
    return;
  }
  const bibKeys = loadBibKeys();
  if (!bibKeys.has(key)) {
    console.warn(`[警告] "${key}" 目前不在 bib/references.bib 中，请确认 key 是否写对。`);
  }
  const manifest = loadManifest(root);
  const prev = manifest[key] || {};
  const filename = flags.filename || prev.filename || `${key}${guessExt(flags.url || prev.url)}`;
  const url = flags.url ?? prev.url ?? '';
  const method = flags.method ?? prev.method ?? (url ? `curl -L -o papers/${filename} "${url}"` : '');
  const note = flags.note ?? prev.note ?? '';
  manifest[key] = { filename, url, method, note };
  saveManifest(manifest);
  console.log(`已登记 ${key} -> papers/${filename}`);
  if (!url && !method) {
    console.log('提示：未提供 --url / --method，稍后可以再次运行 add 补充获取方式。');
  }
}

function cmdRemove(positional) {
  const [key] = positional;
  if (!key) {
    console.error('用法: papers remove <bib-key>');
    process.exitCode = 1;
    return;
  }
  const manifest = loadManifest(root);
  if (!(key in manifest)) {
    console.log(`"${key}" 本来就没有登记，无需删除。`);
    return;
  }
  delete manifest[key];
  saveManifest(manifest);
  console.log(`已从 papers/manifest.json 删除 ${key} 的登记（本地文件如存在不会被删除）。`);
}

function guessExt(url) {
  if (!url) return '.pdf';
  const match = url.split('?')[0].match(/\.([a-zA-Z0-9]{2,5})$/);
  return match ? `.${match[1]}` : '.pdf';
}

function fetchOne(key, entry, force) {
  const dir = papersDir(root);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const target = join(dir, entry.filename || `${key}.pdf`);
  if (existsSync(target) && !force) {
    console.log(`[跳过] ${key}: papers/${entry.filename} 已存在（用 --force 重新下载）`);
    return;
  }
  if (!entry.method && !entry.url) {
    console.log(`[跳过] ${key}: 未登记 method / url，无法自动下载，见 papers/manifest.json`);
    return;
  }
  console.log(`[下载] ${key} ...`);
  try {
    if (entry.method) {
      execFileSync('bash', ['-lc', entry.method], { cwd: root, stdio: 'inherit' });
    } else {
      execFileSync('curl', ['-L', '-o', target, entry.url], { cwd: root, stdio: 'inherit' });
    }
    console.log(`[完成] ${key} -> papers/${entry.filename}`);
  } catch (err) {
    console.error(`[失败] ${key}: ${err.message}`);
    process.exitCode = 1;
  }
}

function cmdFetch(positional, flags) {
  const manifest = loadManifest(root);
  const force = Boolean(flags.force);
  if (flags.all) {
    const entries = Object.entries(manifest);
    if (entries.length === 0) {
      console.log('papers/manifest.json 里还没有任何登记条目。');
      return;
    }
    for (const [key, entry] of entries) fetchOne(key, entry, force);
    return;
  }
  const [key] = positional;
  if (!key) {
    console.error('用法: papers fetch <bib-key> [--force] 或 papers fetch --all');
    process.exitCode = 1;
    return;
  }
  const entry = manifest[key];
  if (!entry) {
    console.error(`"${key}" 还没有在 papers/manifest.json 里登记，先运行 papers add ${key} --url=...`);
    process.exitCode = 1;
    return;
  }
  fetchOne(key, entry, force);
}

function main() {
  const [, , cmd, ...rest] = process.argv;
  const { flags, positional } = parseFlags(rest);
  switch (cmd) {
    case 'list':
      cmdList();
      break;
    case 'add':
      cmdAdd(positional, flags);
      break;
    case 'remove':
      cmdRemove(positional);
      break;
    case 'fetch':
      cmdFetch(positional, flags);
      break;
    default:
      console.log(`用法:
  node scripts/papers-cli.mjs list
  node scripts/papers-cli.mjs add <bib-key> [--url=...] [--filename=...] [--method=...] [--note=...]
  node scripts/papers-cli.mjs remove <bib-key>
  node scripts/papers-cli.mjs fetch <bib-key> [--force]
  node scripts/papers-cli.mjs fetch --all [--force]`);
      if (cmd) process.exitCode = 1;
  }
}

main();
