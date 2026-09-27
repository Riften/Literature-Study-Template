# papers/ 目录说明

这个目录用来存放调研过程中下载的论文原文（PDF、网页快照等）本地副本，**不进版本库**（见根目录 `.gitignore`）。

- 只有本文件 `README.md` 和 `manifest.json` 会被 git 追踪；实际下载下来的原文文件本身不会被提交。
- `manifest.json` 记录"如何在新环境里重新获取这些原文"的元信息（bib key、本地文件名、下载方式/来源链接），这样即便本地文件丢失或者换了一台机器，也能按登记的方式重新下载。
- 完整说明见 [docs/paper-archive.md](../docs/paper-archive.md)。

## 快速上手

```bash
npm run papers:list                                          # 查看每篇工作的本地原文状态
npm run papers:add -- he2016resnet --url=https://arxiv.org/pdf/1512.03385.pdf
npm run papers:fetch -- he2016resnet                          # 按登记方式下载到 papers/ 下
```

不是每篇调研到的工作都需要在这里登记——如果原文是 online report 之类的形式，或者确实无法获取，直接跳过即可，属于正常情况。
