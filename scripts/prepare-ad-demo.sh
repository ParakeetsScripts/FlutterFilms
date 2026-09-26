#!/usr/bin/env bash
# Opens FlutterFilms by Ritvik M routes used in the 15s product ad for screen capture.
# Usage: ./scripts/prepare-ad-demo.sh [base_url]

set -euo pipefail

BASE="${1:-http://localhost:3001}"

open "${BASE}/"
sleep 1
open "${BASE}/movies"
open "${BASE}/latest"
open "${BASE}/watchlist"
open "${BASE}/movie/13885-sweeney-todd-the-demon-barber-of-fleet-street"
open "${BASE}/favorites"
open "${BASE}/history"
open "${BASE}/genres"

echo "Demo routes opened at ${BASE}"
echo "Before recording Shot 5:"
echo "  1. Add Sweeney Todd to Watchlist and Favorites"
echo "  2. Visit the movie detail page once (History)"
echo "  3. Press ⌘K and search 'Sweeney Todd' for Shot 3"
