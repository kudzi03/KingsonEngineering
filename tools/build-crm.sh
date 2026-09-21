#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# tools/build-crm.sh — bundle the CRM into crm/ for deployment
# ═══════════════════════════════════════════════════════════════════════════
#
# The CRM is written as twenty-six ES modules in crm-src/ and is developed by
# serving that directory directly — no build step, no bundler, which is the
# whole point of how it is written.
#
# It ships as three files, because it is served from the website's deployment
# and twenty-six round trips on a Harare connection is a slow morning. The
# bundle is a build artefact: never edit crm/ by hand, edit crm-src/ and run
# this. Committing the output is deliberate — the site has no build step on
# Vercel and adding one for this would mean adding a package.json to a
# repository that has done without one.
#
# The default source used to be ../kingson-crm, a directory OUTSIDE this
# repository. It worked only for as long as that machine existed, and the
# committed crm-src/ was a copy somebody had to remember to keep in step. The
# source of truth is the one that is version-controlled.
#
#   tools/build-crm.sh [path-to-crm-source]
# ═══════════════════════════════════════════════════════════════════════════
set -euo pipefail

SRC="${1:-$(cd "$(dirname "$0")/../crm-src" && pwd)}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/crm"
ESBUILD="${ESBUILD:-esbuild}"

[ -f "$SRC/app.js" ] || { echo "No CRM source at $SRC" >&2; exit 1; }
command -v "$ESBUILD" >/dev/null 2>&1 || { echo "esbuild not found; set ESBUILD=/path/to/esbuild" >&2; exit 1; }

mkdir -p "$OUT"
"$ESBUILD" "$SRC/app.js" --bundle --format=esm --minify --outfile="$OUT/app.js"
cat "$SRC/styles/tokens.css" "$SRC/styles/app.css" > "$OUT/app.css"
cp "$SRC/fonts.css" "$OUT/fonts.css"

# Two rewrites.
#
# The source page loads tokens.css and app.css separately; the bundle has one.
#
# And every reference becomes root-absolute. The source is served from the root
# in development, where "app.css" is right. In production it is served at /crm
# with cleanUrls on — no trailing slash — so a browser resolves "app.css"
# against the site root and gets the website's 404 page with a text/html
# content type. The CRM then loads with no styles at all. /crm/app.css is
# correct whether the URL ends in a slash or not.
sed -e 's|<link rel="stylesheet" href="styles/tokens.css">||' \
    -e 's|<link rel="stylesheet" href="styles/app.css">|<link rel="stylesheet" href="/crm/app.css">|' \
    -e 's|href="fonts.css"|href="/crm/fonts.css"|' \
    -e 's|src="app.js"|src="/crm/app.js"|' \
    "$SRC/index.html" | grep -v '^$' > "$OUT/index.html"

printf 'crm/ built from %s\n' "$SRC"
ls -la "$OUT"
