// scripts/lib/glob-html.js
//
// 枚举项目里所有作为"内容页面"的 .html 文件：根目录的 index.html + pages/
// 目录下任意深度的 .html 文件。被 vite.config.js（多页应用入口）与
// tests/integrity.test.mjs（链接完整性检查）共用，新增页面无需手动改配置。

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * 递归列出 `dir` 下所有文件的绝对路径。
 * 用手写递归而不是 `fs.readdirSync(dir, {recursive:true})`，
 * 以兼容更早的 Node 版本（recursive 选项在 Node 18.17+/20.1+ 才有）。
 */
function listFilesRecursive(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      out = out.concat(listFilesRecursive(full));
    } else if (st.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/**
 * 返回项目所有内容页面的绝对路径列表（root/index.html + root/pages/**\/*.html）。
 */
export function listContentHtmlFiles(root) {
  const files = [join(root, 'index.html')];
  files.push(...listFilesRecursive(join(root, 'pages')).filter((f) => f.endsWith('.html')));
  return files.filter((f) => {
    try {
      statSync(f);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * 返回 Vite `build.rollupOptions.input` 需要的 { name: absPath } 映射，
 * name 用相对 root 的路径（去掉扩展名、替换 `/` 为 `-`）保证唯一。
 */
export function buildRollupInput(root) {
  const input = {};
  for (const file of listContentHtmlFiles(root)) {
    const rel = relative(root, file).replace(/\.html$/, '');
    const name = rel === 'index' ? 'index' : rel.replace(/[\\/]/g, '-');
    input[name] = file;
  }
  return input;
}
