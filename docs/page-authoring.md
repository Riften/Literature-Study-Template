# 页面撰写规范

本 Workspace 的核心原则："模板管理样式，内容直接写在 html 里"——不要把正文内容抽到单独的数据文件（JSON/YAML/Markdown 等）中再由脚本生成页面，而是直接在 `pages/**/*.html` 里写完整的、可读的 HTML。样式、依赖引入、引用/公式/3D 等"通用能力"由模板与 `src/` 下的共享代码负责。

## 三类页面

| 类型 | 目录 | 模板 | 用途 |
| --- | --- | --- | --- |
| 总结页面 | `pages/summaries/` | `templates/summary.template.html` | 一个调研任务对应一篇，汇总该任务的背景/方法/发现/开放问题 |
| 详情页面 | `pages/details/` | `templates/detail.template.html` | 一篇具体文献对应一篇，文件名必须等于其 bib key |
| 专题页面 | `pages/topics/` | `templates/topic.template.html` | 不必绑定单篇文献的灵活页面：技术路线分析、原理讲解、3D 可视化专题等 |

## 页面骨架约定

每个内容页面 `</body>` 前只需要一行脚本引入：

```html
<script type="module" src="../../src/site.js"></script>
```

相对路径深度按页面实际位置调整：`pages/<category>/*.html` 用 `../../src/site.js`，根目录 `index.html` 用 `./src/site.js`。这一行会自动引入全局样式、KaTeX 样式，并在页面加载后渲染公式、初始化引用工具与导航高亮/返回顶部按钮——不需要再手动引入任何其他 `<link>`/`<script>`。

## 常用 class（定义于 `src/styles/main.css`）

- `.page-header` / `.subtitle` / `.tags` / `.tag`：页面标题区；
- `.breadcrumb`：面包屑导航；
- `.meta-grid`（配合 `<dl>`/`<dt>`/`<dd>`）：元信息表；
- `.toc`：目录；
- `.callout[data-tone="good"|"warn"]`：优点/局限提示框；
- `.table-wrap` 包一层 `<table>`：让宽表格可以横向滚动；
- `.card-grid` / `.card` / `.card-link`：卡片列表（工作总览、任务列表等）；
- `.figure`（内含 `<img>` + `<figcaption>`）：图片；
- `.viz3d-container` / `.viz3d-hint` / `.viz3d-caption`：3D 可视化容器，详见 [visualization-guide.md](./visualization-guide.md)；
- `<cite class="ref" data-key="bib_key">...</cite>`：文献引用，详见 [citation-guide.md](./citation-guide.md)。

新增样式需求时，优先考虑往 `src/styles/main.css` 里加通用 class，而不是在页面里写 `<style>` 内联样式。

## 数学公式

直接在正文里写 LaTeX：行内用 `$...$` 或 `\(...\)`，独立成段用 `$$...$$` 或 `\[...\]`，`site.js` 会在页面加载后用 KaTeX 自动渲染，无需任何额外配置。

## 静态图片资源

放在 `public/img/` 下，页面里用相对路径引用，例如：

```html
<img src="../../public/img/xxx.png" alt="..." />
```

`public/` 是 Vite 的静态资源目录，构建时会被原样拷贝到产物根目录。

## 内部链接

页面之间用相对路径直接互相 `<a href="...">` 链接即可（如详情页跳到专题页、总结页跳到详情页），不需要经过任何路由配置。`npm test` 会检查这些链接是否都指向实际存在的文件。
