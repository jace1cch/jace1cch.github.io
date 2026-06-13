---
title: Logseq 发布配置参考
---

# Logseq 发布配置

## 文件位置

`logseq/config.edn`

## 当前配置

```clojure
{
 :publishing/output-dir "www"
 :publishing/all-pages-publishing? true
}
```

## 配置项说明

| 配置 | 值 | 作用 |
|------|-----|------|
| `:publishing/output-dir` | `"www"` | 发布输出目录，与 workflow 的 `output-directory` 保持一致 |
| `:publishing/all-pages-publishing?` | `true` | 允许所有页面发布（需每页加 `public:: true`）|

## 页面属性

每个页面需要添加以下属性才能在发布时被包含：

```markdown
title:: 页面标题
tags:: tag1, tag2
public:: true
```

已在 Logseq UI 中创建的页面会自动包含这些属性。

##  .gitignore 配置

```gitignore
# Logseq
logseq/bak/
logseq/.recycle/
logseq/.db/
logseq/*.md

# OS
.DS_Store
Thumbs.db

# Build output
www/
dist/

# Logs
*.log
```

### 注意

- `logseq/bak/` — Logseq 自动备份文件，不同步
- `logseq/.db/` — 内部数据库，不同步
- `logseq/*.md` — Logseq 生成的内置页面（如 `logseq/contents.md`）
- `www/` — 构建产物，由 CI 生成
