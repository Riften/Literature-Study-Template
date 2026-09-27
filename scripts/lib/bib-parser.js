// scripts/lib/bib-parser.js
//
// 依赖无关的 BibTeX 解析器，从早期的 tools/build_bib_index.py 移植而来。
// 被 plugins/bib-index-plugin.js（生成 virtual:bib-index）与
// tests/integrity.test.mjs（完整性检查）共用，保证两处行为一致。
//
// 只解析本项目实际会用到的字段结构，不是通用 BibTeX 解析器：
//   - 支持 `% ...` 整行注释；
//   - 支持 `@type{key, field = {...} | "..." | 裸值, ...}`；
//   - 用大括号计数定位每个条目/字段的结束位置，能处理字段值内部嵌套的 `{}`。

/** 去掉 `%` 开头的整行注释（不处理字符串内的 % ，本项目 bib 文件不会用到）。 */
export function stripComments(text) {
  return text
    .split('\n')
    .map((line) => (line.trimStart().startsWith('%') ? '' : line))
    .join('\n');
}

/**
 * 从 `openIndex`（指向左花括号 `{` 或 `(`）开始，返回与之匹配的右花括号的下标。
 * 找不到匹配时返回 -1。
 */
export function findMatchingBrace(text, openIndex) {
  const open = text[openIndex];
  const close = open === '{' ? '}' : open === '(' ? ')' : null;
  if (close === null) return -1;
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * 把一个条目大括号内部的原始内容（不含最外层 `{}`）按逗号切分成字段列表，
 * 忽略嵌套在 `{...}` / `"..."` 内部的逗号。第一段是 key（不含 `=`）。
 */
function splitTopLevel(body) {
  const parts = [];
  let depth = 0;
  let inQuotes = false;
  let current = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inQuotes) {
      current += ch;
      if (ch === '"') inQuotes = false;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      current += ch;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim() !== '') parts.push(current);
  return parts;
}

/** 把 `field = {...}` / `field = "..."` / `field = 裸值` 解析成 [name, value]。 */
function parseField(fieldText) {
  const eqIndex = fieldText.indexOf('=');
  if (eqIndex === -1) return null;
  const name = fieldText.slice(0, eqIndex).trim().toLowerCase();
  let value = fieldText.slice(eqIndex + 1).trim();
  if (value.startsWith('{') && value.endsWith('}')) {
    value = value.slice(1, -1);
  } else if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1);
  }
  return [name, value.replace(/\s+/g, ' ').trim()];
}

/**
 * 解析整份 .bib 文本，返回条目数组：
 *   { key, type, fields: { title, author, year, ... }, raw }
 * `raw` 是该条目在原文件中的完整原始文本（含 `@type{...}`），供悬浮提示展示。
 */
export function parseBib(text) {
  const cleaned = stripComments(text);
  const entries = [];
  const entryRe = /@(\w+)\s*\{/g;
  let match;
  while ((match = entryRe.exec(cleaned)) !== null) {
    const type = match[1].toLowerCase();
    const openBrace = match[0].length - 1 + match.index;
    const closeBrace = findMatchingBrace(cleaned, openBrace);
    if (closeBrace === -1) continue;
    const raw = cleaned.slice(match.index, closeBrace + 1);
    const body = cleaned.slice(openBrace + 1, closeBrace);
    const parts = splitTopLevel(body);
    if (parts.length === 0) continue;
    const key = parts[0].trim();
    const fields = {};
    for (const part of parts.slice(1)) {
      const parsed = parseField(part);
      if (parsed) fields[parsed[0]] = parsed[1];
    }
    entries.push({ key, type, fields, raw: raw.trim() });
    entryRe.lastIndex = closeBrace + 1;
  }
  return entries;
}
