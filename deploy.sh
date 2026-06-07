#!/bin/bash
# ============================================================
# Logseq → Hugo 博客自动部署脚本
# 用法: bash deploy.sh [导出文件路径]
# 用法: bash deploy.sh -w   (watch 模式: 监控导出目录自动部署)
# ============================================================
set -euo pipefail

BLOG_DIR="$(cd "$(dirname "$0")" && pwd)"
HUGO_CONTENT="$BLOG_DIR/content"
LOGSEQ_EXPORT_DIR="${LOGSEQ_EXPORT_DIR:-$HOME/Downloads}"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }

# ---- 清理旧内容并解压新导出 ----
process_export() {
    local zip_file="$1"

    if [ ! -f "$zip_file" ]; then
        error "文件不存在: $zip_file"
        return 1
    fi

    local tmp_dir
    tmp_dir="$(mktemp -d)"
    trap 'rm -rf "$tmp_dir"' EXIT

    info "解压: $(basename "$zip_file")"
    unzip -q "$zip_file" -d "$tmp_dir"

    # 检查导出结构
    if [ -d "$tmp_dir/pages" ]; then
        info "清空旧内容..."
        rm -rf "$HUGO_CONTENT/pages" "$HUGO_CONTENT/assets" 2>/dev/null || true

        info "复制新内容..."
        cp -r "$tmp_dir/pages" "$HUGO_CONTENT/pages"
        [ -d "$tmp_dir/assets" ] && cp -r "$tmp_dir/assets" "$HUGO_CONTENT/assets"

        info "搜索页面文件已保留，跳过"
    else
        error "导出 zip 结构不符合预期（缺少 pages/ 目录）"
        ls -la "$tmp_dir"
        return 1
    fi

    # 本地构建验证
    info "本地构建验证..."
    cd "$BLOG_DIR"
    if hugo --minify 2>&1; then
        info "构建成功"
    else
        warn "构建有告警，但继续部署"
    fi

    rm -rf "$tmp_dir"
    trap - EXIT
    return 0
}

# ---- git 提交推送 ----
git_deploy() {
    cd "$BLOG_DIR"

    if git diff --quiet && git diff --cached --quiet; then
        warn "没有内容变更，跳过提交"
        return 0
    fi

    git add -A
    git commit -m "📝 博客更新 $(date '+%Y-%m-%d %H:%M')"
    info "推送到 GitHub..."
    git push origin main
    info "部署完成！等待 GitHub Actions 构建..."
}

# ---- 单次运行 ----
run_once() {
    local zip_file="$1"
    info "处理: $zip_file"
    if process_export "$zip_file"; then
        git_deploy
        info "🎉 全部完成！https://jace1cch.github.io/"
    fi
}

# ---- Watch 模式 ----
watch_mode() {
    warn "启动 watch 模式，监控目录: $LOGSEQ_EXPORT_DIR"
    warn "按 Ctrl+C 停止"

    local last_zip=""
    [ -d "$LOGSEQ_EXPORT_DIR" ] && last_zip="$(ls -t "$LOGSEQ_EXPORT_DIR"/*.zip 2>/dev/null | head -1)" || true

    while true; do
        sleep 5
        local latest_zip=""
        [ -d "$LOGSEQ_EXPORT_DIR" ] && latest_zip="$(ls -t "$LOGSEQ_EXPORT_DIR"/*.zip 2>/dev/null | head -1)" || true

        if [ -n "$latest_zip" ] && [ "$latest_zip" != "$last_zip" ]; then
            info "检测到新导出文件: $(basename "$latest_zip")"
            if process_export "$latest_zip"; then
                git_deploy
                last_zip="$latest_zip"
            fi
        fi
    done
}

# ---- 入口 ----
case "${1:-}" in
    -w|--watch)
        watch_mode
        ;;
    -h|--help)
        echo "用法: bash deploy.sh [导出文件路径]"
        echo "       bash deploy.sh -w        (watch 模式)"
        echo ""
        echo "环境变量:"
        echo "  LOGSEQ_EXPORT_DIR  watch 模式监控目录 (默认: ~/Downloads)"
        exit 0
        ;;
    "")
        # 没有参数：自动找最新的 zip
        latest_zip="$(ls -t "$LOGSEQ_EXPORT_DIR"/*.zip 2>/dev/null | head -1 || true)"
        if [ -z "$latest_zip" ]; then
            error "在 $LOGSEQ_EXPORT_DIR 中没有找到 zip 文件"
            echo "请指定导出文件路径: bash deploy.sh /path/to/export.zip"
            exit 1
        fi
        info "自动找到最近的导出: $(basename "$latest_zip")"
        run_once "$latest_zip"
        ;;
    *)
        run_once "$1"
        ;;
esac
