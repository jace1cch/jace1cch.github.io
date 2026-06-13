#!/usr/bin/env bash
# =================================================
# 新设备初始化脚本
# 在另一台设备上首次使用时运行
# 用法: ./scripts/setup-new-device.sh [目标目录]
# =================================================
set -euo pipefail

REPO_URL="https://github.com/jace1cch/jace1cch.github.io.git"
DEFAULT_DIR="$HOME/logseq-notes"
TARGET_DIR="${1:-$DEFAULT_DIR}"

echo "========================================"
echo "  Logseq 笔记 - 新设备初始化"
echo "========================================"
echo ""

# 检查依赖
for cmd in git; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "❌ 未找到 $cmd，请先安装"
    exit 1
  fi
done

echo "📍 克隆到: $TARGET_DIR"
echo ""

# 克隆仓库
if [ -d "$TARGET_DIR" ]; then
  echo "⚠️  目录已存在，尝试更新..."
  cd "$TARGET_DIR"
  git pull
else
  git clone "$REPO_URL" "$TARGET_DIR"
  cd "$TARGET_DIR"
fi

echo ""
echo "✅ 初始化完成！"
echo ""
echo "接下来:"
echo "1. 打开 Logseq"
echo "2. 点击 \"Open a directory\""
echo "3. 选择: $TARGET_DIR"
echo ""
echo "写笔记后同步:"
echo "  cd $TARGET_DIR"
echo "  git add -A && git commit -m \"📝 更新笔记\" && git push"
echo ""
echo "或者用快捷脚本:"
echo "  $TARGET_DIR/scripts/sync.sh"
