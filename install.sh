#!/usr/bin/env bash
set -euo pipefail

DEST="$HOME/.claude/statusline.js"
SETTINGS="$HOME/.claude/settings.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$HOME/.claude"
cp "$SCRIPT_DIR/statusline.js" "$DEST"
chmod +x "$DEST"

node - "$SETTINGS" <<'EOF'
const fs = require("fs");
const path = process.argv[2];
let settings = {};
if (fs.existsSync(path)) {
  settings = JSON.parse(fs.readFileSync(path, "utf8"));
}
settings.statusLine = { type: "command", command: "node ~/.claude/statusline.js" };
fs.writeFileSync(path, JSON.stringify(settings, null, 2) + "\n");
EOF

echo "cc-fuel installed. Restart Claude Code to see the statusline."
