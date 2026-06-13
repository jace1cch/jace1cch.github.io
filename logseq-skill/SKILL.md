---
name: logseq-github-sync
description: Logseq 笔记 → GitHub 仓库 → GitHub Pages 自动部署的完整工作流
---

# Logseq 笔记同步与 GitHub Pages 部署

## 概览

本工作流实现 Logseq 笔记的多端同步与自动发布：

```
WSL / Local
  Logseq 写笔记
      │
      ▼  git add + commit + push
  GitHub 仓库 (jace1cch/jace1cch.github.io)
      │
      ▼  GitHub Actions (logseq/publish-spa)
  GitHub Pages (https://jace1cch.github.io)
```

## 架构分层

| 层 | 路径/工具 | 职责 |
|---|-----------|------|
| **数据源** | `pages/` `journals/` `assets/` | 纯 Markdown 笔记文件 |
| **本地同步** | Git (GitHub 远程仓库) | 版本控制、多端传输 |
| **自动构建** | `.github/workflows/publish.yml` | GitHub Actions 自动编译 SPA |
| **静态托管** | GitHub Pages | CDN 分发，全球可访问 |

## 前置条件

- [x] Git 已安装
- [x] GitHub 仓库已创建并关联 (origin)
- [x] GitHub Pages 已开启 (Source → GitHub Actions)
- [x] Logseq 本地可用 (WSL AppImage / 桌面版)

## 日常流程

### 写笔记后同步

```bash
cd ~/prj/blog

# 方式一：一键脚本
bash logseq-skill/scripts/sync.sh

# 方式二：手动
git add -A && git commit -m "📝 更新笔记" && git push
```

### 等待部署

Push 后 GitHub Actions 自动执行：
1. `actions/checkout@v4` — 拉取最新代码
2. `logseq/publish-spa@v0.3.1` — 解析笔记图，生成 SPA 站点
3. `actions/upload-pages-artifact@v3` — 上传构建产物
4. `actions/deploy-pages@v4` — 部署到 GitHub Pages

⏱ 整个过程约 1-3 分钟。

### 在新设备上初始化

```bash
# 1. 克隆仓库
git clone https://github.com/jace1cch/jace1cch.github.io.git 笔记文件夹

# 2. Logseq 中 Open Graph → 选择该文件夹

# 3. 以后每次写笔记后
git add -A && git commit -m "📝 更新笔记" && git push
```

## 笔记管理规则

### 页面属性

新页面需要添加以下属性才能在发布时被包含（在 Logseq UI 中创建页面会自动添加）：

```markdown
title:: 页面标题
tags:: tag1, tag2
public:: true
```

### 目录结构

```
blog/
├── pages/                    # 笔记页面（.md 文件）
├── journals/                 # 日记（自动按日期命名）
├── assets/                   # 图片、附件
├── logseq/                   # Logseq 内部配置
│   └── config.edn            # 发布配置
├── .github/workflows/        # GitHub Actions 工作流
├── logseq-skill/             # ← 本技能文档
│   ├── SKILL.md              #    主流程说明
│   ├── references/           #    参考文档
│   └── scripts/              #    自动化脚本
└── ...
```

### 最佳实践

1. **新页面在 Logseq UI 内创建** — 自动生成正确的属性格式
2. **频繁 push** — 每次写完一段笔记就推送，避免丢失
3. **push 前查看状态** — `git status` 检查是否有未跟踪文件
4. **遇到冲突** — `git pull --rebase` 后再 push
5. **主题/样式** — 编辑 `logseq/custom.css` 自定义外观

## 故障排查

| 问题 | 原因 | 解决 |
|------|------|------|
| 网页没更新 | Action 还在构建中 | 等 1-3 分钟刷新 |
| 新页面不显示 | 缺 `public:: true` | 在 Logseq 中加属性 |
| git push 失败 | 远程有新提交 | `git pull --rebase` 再 push |
| Logseq 无法启动 | WSLg 问题 | 检查 DISPLAY 环境变量 |

## 相关文件

- [GitHub Workflow 配置](references/github-workflow.md)
- [Logseq 发布配置](references/logseq-config.md)
- [Git 命令速查](references/git-commands.md)
- [一键同步脚本](scripts/sync.sh)
- [新设备初始化脚本](scripts/setup-new-device.sh)

> 所有文件均位于 `logseq-skill/` 目录下。
