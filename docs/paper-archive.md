# 本地原文管理说明

本 Workspace 支持维护一份"调研过程中下载的论文原文"的本地副本（PDF、网页快照等），并在详情页面上提供一个"查看原文"入口。这个功能整体是**可选的**：不是每篇调研到的工作都必须有本地原文——很多工作以 online report、博客、技术报告等形式发布，没有传统意义上的"论文 PDF"；也有一些论文确实无法获取。遇到这些情况，直接不登记即可，不影响其他任何检查。

## 目录与信源

```
papers/
  README.md        本目录说明（进版本库）
  manifest.json     "如何重新获取本地原文"的元信息（进版本库）
  <各种下载下来的原文文件，如 vaswani2017attention.pdf>   （不进版本库）
```

- **实际的原文文件本身不进版本库**（体积大、且可能涉及版权，不适合随仓库分发），已经在根目录 `.gitignore` 里排除；
- **`papers/manifest.json` 会被提交**，它是"如何在一个全新环境里重新获取这些原文"的唯一信源：记录了每篇工作对应的 bib key、本地应存的文件名、下载方式/来源链接。换到新机器或者本地文件被清理后，照着这份文件里的方式重新下载即可。

这和 `bib/references.bib`（记录"这篇工作是什么"）是两件不同的事：`references.bib` 管"文献信息"，`papers/manifest.json` 只管"这份文件本地怎么拿到"，两者用同一个 bib key 关联。

## manifest.json 结构

以 bib key 为字段名的对象，每条登记包含：

```json
{
  "vaswani2017attention": {
    "filename": "vaswani2017attention.pdf",
    "url": "https://arxiv.org/pdf/1706.03762.pdf",
    "method": "curl -L -o papers/vaswani2017attention.pdf https://arxiv.org/pdf/1706.03762.pdf",
    "note": "可选备注，例如「需要机构订阅」「实际是 v2 版本」等"
  }
}
```

- `filename`：对应 `papers/` 目录下的本地文件名（必填）；
- `url`：原文的下载/访问链接；
- `method`：可执行的获取方式（一般是一条 shell 命令），留空时工具会退化为直接 `curl` 该 `url`；
- `note`：任何需要人工留意的备注，可选。

不需要手动编辑这个文件的格式——用下面的命令行工具增删登记即可。

## 命令行工具

论文下载**不是页面功能**，是项目维护职责，统一通过命令行工具完成：

```bash
npm run papers:list                     # 查看每个 bib key 的本地原文状态
npm run papers:add -- <key> --url=<url> [--filename=...] [--method=...] [--note=...]
                                          # 登记/更新一条获取方式（不下载，只写 manifest.json）
npm run papers:fetch -- <key>            # 按登记的方式下载到 papers/ 下
npm run papers:fetch -- --all            # 下载所有"已登记但本地缺文件"的条目
npm run papers:remove -- <key>           # 删除一条登记（不会删除本地文件）
```

`papers:list` 的输出分三种状态：

- `✔ 已有本地文件`：manifest 里登记了，且 `papers/` 下对应文件确实存在；
- `… 已登记但本地缺文件`：登记了获取方式，但本地还没下载（或被清理了），可以 `papers:fetch` 补下载；
- `－ 未登记`：这篇工作完全没有登记本地原文，属于正常的可选状态。

## 调研工作流中什么时候用

在 [docs/workflow.md](./workflow.md) 的"补充 bib 条目 + 详情页面"这一步，如果这篇工作的原文可以下载到本地：

1. 下载后把文件放进 `papers/` 目录（文件名建议与 bib key 一致，如 `<key>.pdf`）；
2. 运行 `npm run papers:add -- <key> --url=<原文链接>` 登记获取方式（工具会自动推断 `method`，也可以用 `--method` 覆盖成实际用的命令）；
3. 完事，详情页面的"查看原文"会自动识别到本地文件（dev 模式下保存即刷新，不需要额外操作）。

如果这篇工作本来就没有可下载的原文（online report 等）或者确实找不到，什么都不用做。

## 详情页面上的效果

`templates/detail.template.html` 里已经内置了：

```html
<dt>原文副本</dt><dd><div class="paper-source" data-paper-key="{{BIB_KEY}}"></div></dd>
```

页面加载后，`src/paper-source.js` 会根据 `virtual:papers-index`（由 `plugins/papers-index-plugin.js` 解析 `papers/manifest.json` + `papers/` 目录实时生成）把这个占位 `<div>` 渲染成三种状态之一：

1. **本地有文件** → 一个"📄 查看原文"链接，点击在新标签页打开本地文件；
2. **已登记但本地没文件** → 一个"📄 本地暂无原文"按钮，点击展开获取方式提示（下载命令/来源链接/备注），**不会自动触发下载**；
3. **完全未登记** → 一行提示文字，说明这是可选项。

注意：`papers/` 下的原文文件只在 `npm run dev` 本地开发时可访问（插件挂了一个 `/papers/` 静态服务中间件）；`npm run build` 产出的 `dist/` 静态站点**不包含**这些原文文件（不适合对外分发），部署到线上后详情页会显示"本地暂无原文"，这是预期行为——原文副本是调研者本机的维护物，不是要发布给读者看的内容。

## 完整性检查

`npm test` 会对 `papers/manifest.json` 做最小校验（JSON 合法、登记的 key 存在于 `bib/references.bib`、每条登记包含 `filename`），但**不会**因为某个 bib 条目没有登记本地原文、或登记了但本地文件缺失而报错——这属于正常的中间状态，只会在终端打印提示。
