#!/usr/bin/env bash
# Build the datamine vehicle SQLite DB (extractor/output/vehicles.sqlite) used by
# the API and scraper images. Run in CI before `docker build` so the Dockerfiles
# can COPY the DB into the final images.
#
# Sparse-checks out only the datamine paths the extractor needs, skipping the
# multi-GB texture/atlas dirs, to keep the clone small.
set -euo pipefail

DATAMINE_DIR="${1:-/tmp/wt-datamine}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -d "$DATAMINE_DIR/.git" ]; then
  echo "Cloning War Thunder datamine (sparse) into $DATAMINE_DIR"
  git clone --filter=blob:none --sparse --depth 1 \
    https://github.com/gszabi99/War-Thunder-Datamine "$DATAMINE_DIR"
  git -C "$DATAMINE_DIR" sparse-checkout set \
    char.vromfs.bin_u/config \
    lang.vromfs.bin_u/lang \
    aces.vromfs.bin_u/gamedata
fi

echo "Running extractor against $DATAMINE_DIR"
NODE_OPTIONS="--max-old-space-size=4096" \
  node "$REPO_ROOT/extractor/src/main.js" --datamine "$DATAMINE_DIR"

echo "Vehicle DB built:"
ls -lh "$REPO_ROOT/extractor/output/vehicles.sqlite"
