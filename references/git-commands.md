---
title: Git 命令速查
---

# Git 命令速查

## 日常同步

```bash
# 查看变更状态
git status

# 查看具体变更
git diff

# 暂存全部变更
git add -A

# 提交
git commit -m "📝 更新笔记"

# 推送到远程
git push
```

## 多端协作

```bash
# 拉取远程最新变更（在另一台设备上）
git pull

# 如果远程有更新，先拉取再推送
git pull --rebase
git push

# 查看提交历史
git log --oneline -10
```

## 分支管理

```bash
# 查看当前分支
git branch

# 创建新分支
git checkout -b 分支名

# 切换分支
git checkout 分支名
```

## 撤销操作

```bash
# 撤销工作区修改（谨慎）
git restore <文件>

# 撤销暂存
git restore --staged <文件>

# 修改最近提交信息
git commit --amend -m "新提交信息"
```

## 仓库信息

```bash
# 查看远程地址
git remote -v

# 查看配置
git config --list
```
