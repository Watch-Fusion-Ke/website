#!/usr/bin/env bash
# Checks that the shop's main pages load and show products.
# Usage: scripts/smoke.sh <base-url>   e.g. scripts/smoke.sh http://localhost:3000
set -u
base="${1:?usage: scripts/smoke.sh <base-url>}"
fail=0

check() { # path, text the page must contain (may be empty), text it must not contain (optional)
  local path="$1" needle="$2" banned="${3:-}" body status
  body=$(mktemp)
  status=$(curl -sS -m 90 -L -o "$body" -w '%{http_code}' "$base$path") || status=000
  if [ "$status" != 200 ]; then
    echo "FAIL $path: HTTP $status"; fail=1
  elif grep -q 'digest' "$body"; then
    echo "FAIL $path: server error in page"; fail=1
  elif [ -n "$needle" ] && ! grep -q "$needle" "$body"; then
    echo "FAIL $path: page does not contain '$needle'"; fail=1
  elif [ -n "$banned" ] && grep -q "$banned" "$body"; then
    echo "FAIL $path: page contains '$banned', so the filter did not apply"; fail=1
  else
    echo "ok   $path"
  fi
  rm -f "$body"
}

check / 'KES '
check /shop 'KES '
check /deals 'KES '
check '/shop?cat=gents-watches' 'KES '
# A name search must show matching products and hide others (names as of Oct 2026).
check '/shop?name=Naviforce' 'Naviforce' 'Poedagar'
check /cart ''
exit $fail
