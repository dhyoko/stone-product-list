#!/bin/sh
set -eu

cd "$(dirname "$0")/.."

STAGE=build/lambda
ZIP=build/lambda.zip

rm -rf "$STAGE" "$ZIP"
npm run build
mkdir -p "$STAGE"
cp -R dist package.json package-lock.json "$STAGE"/
(cd "$STAGE" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund)
(cd "$STAGE" && zip -qr ../lambda.zip .)
echo "Wrote $ZIP"
