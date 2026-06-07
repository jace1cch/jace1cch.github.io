# Jace's Blog

基于 **Logseq + Schrödinger + Hugo (PaperMod)** 的个人博客。

## 快速开始

完整搭建说明见 **[SETUP.md](SETUP.md)**。

## 本地开发

```bash
hugo server -D
```

## 写作流程

```
Logseq 写笔记 → 标记 public:: true → Schrödinger 导出 → 解压到 content/ → git push
```

## 技术栈

- [Logseq](https://logseq.com) — 笔记工具
- [Schrödinger 插件](https://github.com/sawhney17/logseq-schrodinger) — Logseq → Hugo 导出
- [Hugo](https://gohugo.io) — 静态站点生成器 (v0.162.1 Extended)
- [PaperMod 主题](https://adityatelange.github.io/hugo-PaperMod/) — 博客主题
- GitHub Actions + Pages — 自动部署
