#!/usr/bin/env bash
# Checks that the shop's main pages load and show products.
# Usage: scripts/smoke.sh <base-url>   e.g. scripts/smoke.sh http://localhost:3000
set -u
base="${1:?usage: scripts/smoke.sh <base-url>}"
fail=0

check() { # path, text the page must contain (may be empty)
  local path="$1" needle="$2" body status
  body=$(mktemp)
  status=$(curl -sS -m 90 -L -o "$body" -w '%{http_code}' "$base$path") || status=000
  if [ "$status" != 200 ]; then
    echo "FAIL $path: HTTP $status"; fail=1
  elif grep -q 'digest' "$body"; then
    echo "FAIL $path: server error in page"; fail=1
  elif [ -n "$needle" ] && ! grep -q "$needle" "$body"; then
    echo "FAIL $path: page does not contain '$needle'"; fail=1
  else
    echo "ok   $path"
  fi
  rm -f "$body"
}

check / 'KES '
check /shop 'KES '
check /deals 'KES '
check '/list?cat=gents-watches' 'KES '
check /cart ''
exit $fail
