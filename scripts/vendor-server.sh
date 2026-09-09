#!/usr/bin/env bash
# Copia o bundle do beplus-mcp para dentro do plugin. O plugin roda
# "node ${CLAUDE_PLUGIN_ROOT}/server/index.js", entao o arquivo tem que
# estar versionado no repo, nao baixado na hora do install.
set -euo pipefail

SOURCE_DIST="${BEPLUS_MCP_DIST:-/Users/macbook/Developer/academy-backend/beplus-ia-lab-mcp/dist/index.js}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$REPO_ROOT/plugins/beplus/server/index.js"

if [ ! -f "$SOURCE_DIST" ]; then
  echo "erro: bundle nao encontrado em $SOURCE_DIST" >&2
  echo "rode 'npm run build' no repo do beplus-mcp, ou aponte BEPLUS_MCP_DIST para o bundle." >&2
  exit 1
fi

mkdir -p "$(dirname "$TARGET")"
cp "$SOURCE_DIST" "$TARGET"
chmod 644 "$TARGET"

echo "vendorizado: $SOURCE_DIST -> $TARGET"
echo "bytes: $(wc -c < "$TARGET" | tr -d ' ')"
echo
echo "agora valide o handshake:"
echo "  node scripts/smoke-stdio.mjs \"$TARGET\""
