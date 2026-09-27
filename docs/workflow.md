# 调研任务执行流程

本文档描述在这个 Workspace 里从零开始一次调研任务的推荐步骤。写作规范（模板用法、class 约定）见 [page-authoring.md](./page-authoring.md)；引用工具原理见 [citation-guide.md](./citation-guide.md)；3D 可视化用法见 [visualization-guide.md](./visualization-guide.md)；本地原文管理见 [paper-archive.md](./paper-archive.md)。

## 0. 准备环境

```bash
npm install
npm run dev
```

`npm run dev` 启动本地开发服务器（默认 http://localhost:5173），保存任意 `.html` / `.css` / `.js` / `bib/references.bib` 文件都会自动刷新浏览器，不需要手动重启或跑任何脚本。

## 1. 明确调研目标与范围

在开始写页面之前，先确认：

- 这次调研要回答的核心问题是什么；
- 检索范围（关键词、数据库、时间范围）；
- 大致会涉及多少篇工作（决定后面要建多少详情页）。

## 2. 建一个调研总结页面

1. 复制 `templates/summary.template.html` 到 `pages/summaries/<task-slug>.html`（`task-slug` 用简短的英文/拼音短横线命名，例如 `attention-survey`）；
2. 把 `index.html` 里"调研任务列表"下追加一张卡片，链接到这个新总结页面；
3. 按模板里的 `<!-- AGENT: ... -->` 提示填充各 `<section>` 的正文内容（先写背景/方法/开放问题等，工作总览部分等文献调研完再回填）。

## 3. 为每篇涉及的工作补充 bib 条目 + 详情页面

对每一篇要详细调研的文献：

1. 在 `bib/references.bib` 里追加一条标准 BibTeX 条目，key 用 "作者姓+年份+关键词"的形式（如 `he2016resnet`），全小写、无空格；
2. 复制 `templates/detail.template.html` 到 `pages/details/<key>.html`——**文件名必须与 bib key 完全一致**，这是引用工具判断"点击后跳转到哪个页面"的唯一依据；
3. 按模板提示填充方法/实验/优缺点/相关工作等内容；
4. 回到总结页面的"工作总览"部分，用 `<cite class="ref" data-key="key">标题</cite>` 加一张卡片链接过去；
5.（可选）如果这篇工作的原文能下载到本地，把文件放进 `papers/` 目录，再运行
   `npm run papers:add -- <key> --url=<原文链接>` 登记获取方式——详情页面的
   "查看原文"按钮会自动识别到本地文件。这是可选步骤，工作以 online report
   形式发布、或原文无法获取时可以跳过，详见 [paper-archive.md](./paper-archive.md)。

不需要手动重新生成任何索引文件——`bib/references.bib` 与 `pages/details/` 的变化会被 Vite 插件实时感知并反映到页面上。

## 4. 需要时建专题页面

如果调研过程中出现了值得单独展开的主题（技术路线对比、原理讲解、某个问题的专门讨论、3D 可视化演示等），复制 `templates/topic.template.html` 到 `pages/topics/<topic-slug>.html`，并在对应总结页面的"相关专题页面"字段里加上链接。专题页面结构比总结页/详情页更自由，具体写法不强制。

## 5. 自查

写完一批页面后，运行一次完整性检查：

```bash
npm test
```

它会检查：引用的 bib key 是否都存在、详情页文件名是否符合命名约定、页面间的相对链接是否都指向存在的文件。终端里还会打印哪些 bib 条目暂时还没有详情页面（仅提示，不算失败，属于调研中间状态）。

## 6. 构建与查看最终效果

```bash
npm run build      # 产出 dist/，静态站点
npm run preview     # 本地预览构建产物
```

部署方式见根目录 [README.md](../README.md)。
