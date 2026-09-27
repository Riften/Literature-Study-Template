# 引用工具使用说明

## 唯一的文献信息源

所有调研涉及到的文献都在 `bib/references.bib` 里维护一条标准 BibTeX
条目，不要在页面里另外手写文献信息。字段建议至少填 `title`/`author`/
`year`，因为悬浮提示框会直接展示这些字段以及原始 BibTeX 全文。

## key 命名约定

- 格式：`作者姓+年份+简短关键词`，全小写、不含空格/特殊符号，例如
  `vaswani2017attention`、`he2016resnet`；
- **该 key 必须与其详情页面文件名一致**：`pages/details/<key>.html`。
  这是引用工具判断"点击后跳转到哪个页面"的唯一依据，没有额外的映射
  文件。

## 在页面里引用

```html
<cite class="ref" data-key="vaswani2017attention">Transformer</cite>
```

- 鼠标悬浮：弹出提示框，展示标题/作者/年份/venue 以及完整的原始 BibTeX
  文本；
- 鼠标点击：如果该 key 已有对应的详情页面（`pages/details/<key>.html`
  存在），跳转过去；如果还没有详情页面，点击不会跳转（悬浮提示里会注明
  "暂无详情页面"），但依然能正常显示 BibTeX 信息。
- 如果 `data-key` 指向的 key 在 `bib/references.bib` 里完全找不到，该
  引用会被标成"缺失"样式（虚线变色），并在悬浮时提示"未在
  bib/references.bib 中找到"——这种情况应该被 `npm test` 的完整性检查
  发现并要求修正。

## 实现原理（供二次开发参考）

- `scripts/lib/bib-parser.js`：依赖无关的 BibTeX 解析器（strip 注释 →
  按大括号匹配切出每个条目 → 按顶层逗号切分字段），被插件和测试共用；
- `plugins/bib-index-plugin.js`：Vite 插件，暴露虚拟模块
  `virtual:bib-index`，内容是"解析后的 bib 条目 + 是否已有详情页面"的
  一个 JS 对象；dev 模式下监听 `bib/references.bib` 与
  `pages/details/` 目录变化，一有改动就让虚拟模块失效并触发浏览器整页
  刷新；
- `src/citation.js`：`import bibIndex from 'virtual:bib-index'` 拿到这份
  数据，为页面里所有 `.ref[data-key]` 元素绑定悬浮提示与点击跳转逻辑。

不需要手动运行任何脚本来"生成索引"——保存 `.bib` 文件即可在 dev 模式下
立即看到效果，`npm run build` 时也会自动重新生成一份内置到构建产物里。
