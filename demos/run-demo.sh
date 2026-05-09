# File:        demos/run-demo.sh
# Module:      demos
# Purpose:     One-command demo launcher — serves the pre-built static broker-admin
#              at http://localhost:4500. Use this for video shoots.
#              No build step, no install needed — just Node.js.
#
# Usage:
#   bash demos/run-demo.sh
#
# Side-effects:
#   - Starts a local HTTP server on port 4500
#   - Press Ctrl+C to stop
#
# Author:      BharatERP
# Last-updated: 2026-05-09

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STATIC_DIR="$SCRIPT_DIR/broker-admin-static"

if [ ! -d "$STATIC_DIR" ]; then
  echo "ERROR: $STATIC_DIR not found."
  echo "       Run: bash demos/export-broker-admin.sh  to build it first."
  exit 1
fi

echo ""
echo "=== NestTrade Broker Admin Demo ==="
echo "  Serving: $STATIC_DIR"
echo "  URL:     http://localhost:4500"
echo "  Stop:    Ctrl+C"
echo ""

npx --yes serve "$STATIC_DIR" -p 4500
