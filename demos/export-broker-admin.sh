# File:        demos/export-broker-admin.sh
# Module:      demos · Static Export
# Purpose:     Build broker-admin as a fully static site and snapshot it to
#              demos/broker-admin-static/. Run whenever you want a new demo snapshot.
#              The output can be served with: npx serve demos/broker-admin-static
#
# Usage:
#   bash demos/export-broker-admin.sh
#
# Side-effects:
#   - Writes/overwrites demos/broker-admin-static/ directory
#   - Does NOT touch the live app source; config change is env-var-driven
#
# Key invariants:
#   - Must be run from the repo root (NestTrade/)
#   - Requires Node.js and npm to be available
#   - next build writes to apps/broker-admin/out/ when output:'export' is set
#
# Author:      BharatERP
# Last-updated: 2026-04-26

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="$REPO_ROOT/apps/broker-admin"
OUT_DIR="$APP_DIR/out"
DEMO_DIR="$REPO_ROOT/demos/broker-admin-static"

echo ""
echo "=== broker-admin static export ==="
echo "  App:  $APP_DIR"
echo "  Demo: $DEMO_DIR"
echo ""

# Build with static export mode
echo "[1/3] Building static export..."
cd "$APP_DIR"
STATIC_EXPORT=true npx next build

# Verify output was created
if [ ! -d "$OUT_DIR" ]; then
  echo "ERROR: Expected output at $OUT_DIR — was not created."
  echo "       Check that next.config.js reads STATIC_EXPORT env var correctly."
  exit 1
fi

# Snapshot to demos/
echo "[2/3] Copying output to $DEMO_DIR..."
rm -rf "$DEMO_DIR"
cp -r "$OUT_DIR" "$DEMO_DIR"

# Confirm
PAGE_COUNT=$(find "$DEMO_DIR" -name "index.html" | wc -l)
echo "[3/3] Done — $PAGE_COUNT pages exported."
echo ""
echo "  To view the demo:"
echo "    npx serve $DEMO_DIR"
echo ""
echo "  Or open directly (limited — some CSS vars may not load via file://):"
echo "    open $DEMO_DIR/index.html"
echo ""
