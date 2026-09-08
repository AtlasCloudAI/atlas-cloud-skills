#!/bin/bash
set -e

# Installs the Atlas Cloud skill and its model-specific sub-skills.
#   curl -fsSL .../install.sh | sh              # everything
#   curl -fsSL .../install.sh | sh -s atlas-cloud   # main skill only
#   curl -fsSL .../install.sh | sh -s seedance-2-5-skill

REPO_URL="https://github.com/AtlasCloudAI/atlas-cloud-skills"
SKILLS_ROOT="$HOME/.claude/skills"
WANT="${1:-all}"

if ! command -v git &> /dev/null; then
  echo "Error: git is required to install these skills."
  exit 1
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT
git clone --depth 1 "$REPO_URL" "$TMP_DIR" 2>/dev/null

install_one() {
  name="$1"; src="$2"
  dest="$SKILLS_ROOT/$name"
  mkdir -p "$dest"
  cp -r "$src/." "$dest/"
  echo "  installed $name -> $dest"
}

echo "Installing Atlas Cloud skills for Claude Code..."

if [ "$WANT" = "all" ] || [ "$WANT" = "atlas-cloud" ]; then
  install_one "atlas-cloud" "$TMP_DIR/atlas-cloud"
fi

if [ -d "$TMP_DIR/skills" ]; then
  for dir in "$TMP_DIR"/skills/*/; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    if [ "$WANT" = "all" ] || [ "$WANT" = "$name" ]; then
      install_one "$name" "$dir"
    fi
  done
fi

echo "Done. Restart Claude Code (or run /skills) to pick them up."
