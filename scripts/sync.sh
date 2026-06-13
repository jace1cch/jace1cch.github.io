#!/usr/bin/env bash
# =================================================
# Logseq 笔记一键同步脚本
# 用法: ./scripts/sync.sh ["提交信息"]
# =================================================
set -euo pipefail

BLOG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$BLOG_DIR"

# 默认提交信息
MSG="${1:-📝 更新笔记 $(date '+%Y-%m-%d %H:%M')}"

echo "📦 仓库: $(basename $(git rev-parse --show-toplevel))"
echo ""

# 检查是否有变更
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ 没有变更需要提交"
  exit 0
fi

# 显示变更概览
echo "📋 变更文件:"
git status --short
echo ""

# 暂存
echo "📌 暂存变更..."
git add -A

# 提交
echo "✍️  提交: $MSG"
git commit -m "$MSG"

# 推送
echo "📤 推送到远程..."
git push origin main

echo ""
echo "✅ 同步完成！"
echo "⏱  GitHub Actions 正在构建，1-3 分钟后访问:"
echo "   https://jace1cch.github.io"
