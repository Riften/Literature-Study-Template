## 这是什么

一个用来做科研文献调研的 Workspace 模板：用户会告诉你一个调研目标/范围，你需要按照本文件与 `docs/` 下的规范，产出三类 HTML 页面（总结/详情/专题），并把涉及的文献统一记录到 `bib/references.bib` 里。

## 核心原则

1. **内容直接写在 html 里**：正文（背景、方法、发现、结论等）直接写在 `pages/**/*.html` 文件中，不要抽到单独的数据文件（JSON/YAML/Markdown）再生成页面。模板和 `src/` 下的共享代码只负责样式与通用交互能力（公式渲染、引用悬浮跳转、导航、3D 场景初始化），不管理具体内容。
2. **一个 bib，唯一信源**：所有涉及的文献都记录在 `bib/references.bib` 里，不要在页面里另写文献信息。
3. **详情页文件名 == bib key**：这是引用工具能够"点击跳转"的唯一依据。
4. **不需要手动跑脚本**：改 `.bib`、加详情页面后，`npm run dev` 会自动感知变化并刷新；`npm run build` 会自动重新生成一份内置的引用索引。

## 快速开始

```bash
npm install
npm run dev      # 本地开发服务器，改文件即时热更新
```

## 三类页面

| 类型 | 目录 | 模板 |
| --- | --- | --- |
| 总结页面（一个调研任务一篇） | `pages/summaries/` | `templates/summary.template.html` |
| 详情页面（一篇文献一篇，文件名 == bib key） | `pages/details/` | `templates/detail.template.html` |
| 专题页面（灵活，如技术路线分析/原理讲解/3D 可视化） | `pages/topics/` | `templates/topic.template.html` |

模板文件里有 `<!-- AGENT: ... -->` 注释指导每个部分应该写什么，复制模板到目标路径后按提示填充即可；章节结构可以按调研任务实际情况增删/重命名，但尽量保留 `id`（用于目录跳转）。

完整的写作规范（class 约定、页面骨架）见 [docs/page-authoring.md](./docs/page-authoring.md)。

## 引用文献

```html
<cite class="ref" data-key="vaswani2017attention">Transformer</cite>
```

原理与用法见 [docs/citation-guide.md](./docs/citation-guide.md)。

## 本地原文管理

调研过程中下载到的论文原文（PDF 等）存到 `papers/` 目录并在详情页提供"查看原文"入口；原文本身不进版本库，只在 `papers/manifest.json` 里登记获取方式，方便在新环境重新下载。这是**可选功能**——工作以 online report 形式发布、或原文确实无法获取时，不登记即可，不影响任何检查。论文下载由 `npm run papers:*` 命令行工具完成，不是页面本身的功能。完整说明见 [docs/paper-archive.md](./docs/paper-archive.md)。

## 数学公式

直接写 LaTeX：行内 `$...$`，独立成段 `$$...$$`，会被自动渲染，无需任何额外配置。

## 3D 可视化

用 `src/viz/create-orbit-scene.js` 封装的 `createOrbitScene` 工具，减少每个 3D 场景的样板代码，用法见 [docs/visualization-guide.md](./docs/visualization-guide.md)。three.js 作为普通 npm 依赖（`package.json` 的 `dependencies.three`）被管理，页面里直接 `import * as THREE from "three"` 即可，无需 importmap。

## 完成一批页面后

```bash
npm test         # 引用 key / 详情页命名 / 内部链接完整性检查
npm run build     # 确认能正常构建成静态站点
```

`npm test` 只做完整性检查，不做视觉渲染层面的验证；悬浮提示/点击跳转/3D 拖拽缩放等交互效果，建议用 `npm run dev` 启动后在浏览器里手动看一眼。

## 新增静态图片

放到 `public/img/` 下，页面里用相对路径引用（例如 `../../public/img/xxx.png`），构建时会被原样拷贝到产物根目录。

## 完整执行流程

详细的"从零开始一次调研任务"步骤见 [docs/workflow.md](./docs/workflow.md)。

## 部署与命令说明

安装/开发/构建/预览/测试命令与部署说明见根目录 [README.md](./README.md)。
