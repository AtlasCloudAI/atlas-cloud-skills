#!/bin/bash
set -e

SKILL_NAME="atlas-cloud"
SKILL_DIR="$HOME/.claude/skills/$SKILL_NAME"
REPO_URL="https://github.com/AtlasCloudAI/atlas-cloud-skills"

echo "Installing Atlas Cloud skill for Claude Code..."

mkdir -p "$SKILL_DIR"

if command -v git &> /dev/null; then
  TMP_DIR=$(mktemp -d)
  git clone --depth 1 "$REPO_URL" "$TMP_DIR" 2>/dev/null
  cp -r "$TMP_DIR/atlas-cloud/"* "$SKILL_DIR/"
  rm -rf "$TMP_DIR"
else
  echo "Error: git is required to install this skill."
  exit 1
fi

echo "Done! Atlas Cloud skill installed to $SKILL_DIR"
