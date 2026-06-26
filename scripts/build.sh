#!/usr/bin/env bash
# 维护者专用：构建各平台安装包（普通用户无需运行此脚本）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PLATFORM="${1:-current}"

echo "==> Installing dependencies..."
npm install

echo "==> Type checking..."
npm run typecheck

echo "==> Building..."
case "$PLATFORM" in
  mac)
    npm run build:mac
    ;;
  win|windows)
    npm run build:win
    ;;
  linux)
    npm run build:linux
    ;;
  dir)
    npm run build:dir
    ;;
  *)
    npm run build
    ;;
esac

echo "==> Done! Artifacts in release/"
