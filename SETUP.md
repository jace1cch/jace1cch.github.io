# Logseq → Hugo 博客搭建指南 (Schrödinger 方案)

## 目录结构

```
blog/                       # Hugo 站点根目录
├── config.yml              # 站点配置（已配置为 Jace）
├── content/
│   ├── archives.md         # 归档页面
│   ├── search.md           # 搜索页面
│   ├── assets/             # 来自 Logseq 导出的资源文件
│   └── pages/              # 来自 Logseq 导出的文章
├── layouts/                # 模板覆盖（已修复 Hugo 0.162 兼容问题）
├── themes/PaperMod/        # Hugo 主题
└── .github/workflows/      # GitHub Actions 自动部署
```

## 使用流程

### 第一步：在 GitHub 上创建仓库

1. 打开 https://github.com/new
2. 仓库名：`YOUR_GITHUB_USERNAME.github.io`
   （GitHub Pages 要求这个命名规则）
3. 设为 **Public**
4. 创建后，在本地 blog 目录执行：

```bash
cd /home/ubuntu/prj/blog
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_GITHUB_USERNAME.github.io.git
git push -u origin main
```

### 第二步：启用 GitHub Pages

1. 打开仓库 Settings → Pages
2. Source 选 **GitHub Actions**
3. 推送后 Actions 会自动构建部署

> ⚠️ **完成前需修改 config.yml：**
> 把 `baseURL: https://YOUR_GITHUB_USERNAME.github.io/` 中的 `YOUR_GITHUB_USERNAME` 替换为你的实际 GitHub 用户名

### 第三步：在 Logseq 中安装 Schrödinger 插件

1. 打开 Logseq → 设置 → Advanced → 启用 **Plug-in system**
2. 重启 Logseq，按 `Esc t p` 打开插件面板
3. 点击 **Marketplace** → **Plugins**
4. 搜索 **Schrödinger** 并安装
5. 在插件设置中确认配置

### 第四步：标记并导出文章

在 Logseq 中写笔记，要发布的页面添加属性：

```
public:: true
date:: 2026-06-07
tags:: ["tag1", "tag2"]
categories:: ["分类名"]
```

然后在 Logseq 中运行 Schrödinger 插件 → 导出为 Hugo 格式。

### 第五步：部署到博客

1. 将导出的 zip 解压
2. 把内容移到 Hugo 的 `content/` 目录（覆盖 `pages/` 和 `assets/`）
3. 提交并推送：

```bash
cd /home/ubuntu/prj/blog
cp -r /path/to/export/pages/* content/pages/
cp -r /path/to/export/assets/* content/assets/
git add -A
git commit -m "更新博客内容"
git push
```

4. GitHub Actions 自动构建并部署
5. 访问 `https://YOUR_GITHUB_USERNAME.github.io/` 查看

### 本地预览

想在推送前预览效果：

```bash
cd /home/ubuntu/prj/blog
hugo server -D
# 打开 http://localhost:1313
```

## 日常写作流程（总结）

```
Logseq 写笔记
  → 标记 public:: true
  → Schrödinger 导出
  → 解压到 content/
  → git push
  → 自动部署 🎉
```

## 自定义主题

编辑 `config.yml` 可以修改：
- **标题、描述**：`title`、`params.homeInfoParams`
- **社交链接**：`params.socialIcons`
- **菜单**：`menu.main`
- **主题设置**：PaperMod 主题支持大量参数

## 备份

所有笔记在 Logseq 本地目录中（纯 Markdown 文件），Hugo 博客是导出副本。
推荐将 Logseq 笔记目录也用 git 管理。

---

有任何问题，参考：
- [Schrödinger 插件](https://github.com/sawhney17/logseq-schrodinger)
- [logseq-hugo-template](https://github.com/sawhney17/logseq-hugo-template)
- [PaperMod 主题文档](https://adityatelange.github.io/hugo-PaperMod/)
