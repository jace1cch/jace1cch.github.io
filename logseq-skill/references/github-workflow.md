---
title: GitHub Actions 工作流参考
---

# GitHub Actions 工作流

## 文件位置

`.github/workflows/publish.yml`

## 完整配置

```yaml
name: Publish Logseq SPA

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: logseq/publish-spa@v0.3.1
        with:
          graph-directory: .
          output-directory: www
          version: 0.10.15
      - name: Add .nojekyll
        run: touch www/.nojekyll
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./www

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## 各步骤详解

### 1. `actions/checkout@v4`
拉取仓库最新代码到构建环境。

### 2. `logseq/publish-spa@v0.3.1`
核心步骤。使用 `logseq/publish-spa` action 将 Logseq 笔记图解析并编译为单页应用 (SPA)。

参数：
- `graph-directory: .` — 笔记图的根目录（仓库根）
- `output-directory: www` — 构建产物输出目录
- `version: 0.10.15` — Logseq 前端版本（对应 Git tag）

### 3. `touch www/.nojekyll`
GitHub Pages 默认使用 Jekyll 构建。这个文件告诉 Pages 不要运行 Jekyll，直接托管静态文件。

### 4. `actions/upload-pages-artifact@v3`
将 `www/` 目录上传为部署 artifact。

### 5. `actions/deploy-pages@v4`
将 artifact 部署到 GitHub Pages 环境。

## 触发方式

- **自动**：push 到 `main` 分支
- **手动**：在 GitHub 仓库 Actions 标签页点击 "Run workflow"

## 版本记录

| 工具 | 版本 | 备注 |
|------|------|------|
| `logseq/publish-spa` | v0.3.1 | SPA 发布 action |
| Logseq 前端 | 0.10.15 | 用于生成静态站点 |
| `actions/checkout` | v4 | 代码检出 |
| `actions/upload-pages-artifact` | v3 | 构建产物上传 |
| `actions/deploy-pages` | v4 | Pages 部署 |
