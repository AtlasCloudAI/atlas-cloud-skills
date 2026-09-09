#!/bin/bash
# 把仓库里的 skill 同步进 Codex plugin 目录。
#
# 为什么要复制而不是 symlink：Codex 安装 plugin 时不跟随符号链接，
# 装出来的 skills/ 会是空目录（验证过）。所以这里生成实体副本，
# 而唯一的源仍然是仓库根的 media-generation/ 与 skills/。
#
# 改了任何 skill 之后跑一次： bash plugins/build.sh
set -e
cd "$(dirname "$0")/.."
DEST=plugins/atlas-cloud/skills
rm -rf "$DEST"; mkdir -p "$DEST"
cp -R media-generation "$DEST/media-generation"
for d in skills/*/; do cp -R "$d" "$DEST/$(basename "$d")"; done
find "$DEST" -name ".DS_Store" -delete
echo "synced $(ls "$DEST" | wc -l | tr -d ' ') skills into $DEST"
