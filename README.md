# 文献调研模板

科研文献调研模板：以 Vite 多页应用的形式管理一批调研任务的总结页面、文献详情页面、专题分析页面，统一管理 BibTeX 引用、LaTeX 公式渲染与 three.js 3D 可视化。

## 目录结构简表

```
index.html              首页，调研任务列表入口
bib/references.bib      唯一的 BibTeX 文献信息源
pages/summaries/        调研总结页面
pages/details/          文献详情页面（文件名 == bib key）
pages/topics/           专题分析页面
templates/              三类页面的 html 模板
src/                    共享前端代码（样式、KaTeX/引用/导航初始化、3D 工具）
plugins/                Vite 插件（bib 索引虚拟模块）
scripts/lib/            bib 解析、html 枚举等被插件与测试共用的纯函数
tests/                  构建/链接完整性检查（vitest）
public/img/             静态图片资源
docs/                   给 code agent 的详细写作/工具说明
```

## 环境要求

- Node.js >= 18.19（推荐使用当前 LTS 或更新版本）

## 常用命令

```bash
npm install       # 安装依赖
npm run dev        # 本地开发服务器，改 html/css/js/bib 即时热更新
npm run build       # 构建生产静态站点到 dist/
npm run preview     # 本地预览 dist/ 构建产物
npm test           # 引用完整性 / 内部链接完整性检查（vitest）
```

`npm run dev` 默认监听 http://localhost:5173 。保存任意页面文件或
`bib/references.bib` 后浏览器会自动刷新，不需要手动重新生成任何索引
文件——引用索引由 `plugins/bib-index-plugin.js` 在 dev/build 时自动生成。

## 部署

`npm run build` 产出的 `dist/` 是一个完全静态的站点，可以直接部署到
GitHub Pages、Vercel/Netlify、或任意静态文件托管服务：

```bash
npm run build
# 把 dist/ 目录的内容发布出去即可，例如：
npx gh-pages -d dist   # 部署到 GitHub Pages（需要先 npm i -D gh-pages）
```

`vite.config.js` 里设置了 `base: './'`（相对路径），所以页面之间的跳转
链接在部署到任意子路径（例如 GitHub Pages 的项目页
`https://<user>.github.io/<repo>/`）时都能正常工作，通常不需要额外配置。
唯一的例外是 `public/img/` 下的静态图片：如果页面里用了根路径引用
（`/img/xxx.png` 而不是相对路径 `../../public/img/xxx.png`），部署到
子路径时需要在 `vite.config.js` 里把 `base` 改成对应的子路径（例如
`base: '/<repo>/'`），并让 Vite 帮忙改写这些引用；本模板的示例页面统一
使用相对路径引用，不受此影响。

## 测试

`npm test` 跑的是构建/链接完整性检查，而不是视觉/渲染层面的测试：

- 页面里所有 `data-key="..."` 引用的 bib key 都必须存在于
  `bib/references.bib`；
- `pages/details/` 下每个文件名都必须对应 bib 中的同名 key；
- 页面间所有内部相对链接（`href`/`src`）都必须指向实际存在的文件；
- 存在于 bib 但暂时还没有详情页面的条目只会打印提示，不算测试失败
  （这是调研过程中的正常中间状态）。

建议在写完一批新页面后运行一次。

## 开始一次新的调研任务

1. `npm install && npm run dev`；
2. 阅读 [AGENTS.md](./AGENTS.md) 了解页面格式、引用工具、3D 可视化约定；
3. 参考 `pages/summaries/example-attention-survey.html` 等示例页面
   （可在正式调研前删除）新建总结/详情/专题页面；
4. 完成后运行 `npm test` 自查，`npm run build` 确认能正常构建。

详细步骤见 [docs/workflow.md](./docs/workflow.md)。
