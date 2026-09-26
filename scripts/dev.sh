#!/usr/bin/env bash
set -euo pipefail

# FlutterFilms by Ritvik M — development server launcher
# Works from ANY directory. Never depends on the shell's current working directory.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
KNOWN_ROOT="/Users/rpm/vitamovies"

resolve_project_root() {
  local candidate="$PROJECT_ROOT"

  if [[ -f "$candidate/package.json" ]] && grep -q '"name"[[:space:]]*:[[:space:]]*"flutter-films"' "$candidate/package.json" 2>/dev/null; then
    printf '%s' "$candidate"
    return 0
  fi

  if [[ -f "$KNOWN_ROOT/package.json" ]] && grep -q '"name"[[:space:]]*:[[:space:]]*"flutter-films"' "$KNOWN_ROOT/package.json" 2>/dev/null; then
    printf '%s' "$KNOWN_ROOT"
    return 0
  fi

  if command -v git >/dev/null 2>&1; then
    local git_root
    git_root="$(git -C "$candidate" rev-parse --show-toplevel 2>/dev/null || true)"
    if [[ -n "$git_root" && -f "$git_root/package.json" ]] && grep -q '"name"[[:space:]]*:[[:space:]]*"flutter-films"' "$git_root/package.json" 2>/dev/null; then
      printf '%s' "$git_root"
      return 0
    fi
  fi

  return 1
}

fail_wrong_directory() {
  local cwd
  cwd="$(pwd)"
  echo ""
  echo "You are outside the FlutterFilms project."
  echo ""
  echo "FlutterFilms root:"
  echo "  /Users/rpm/vitamovies"
  echo ""
  echo "You are currently in:"
  echo "  $cwd"
  echo ""
  echo "Use:"
  echo "  /Users/rpm/vitamovies/dev.sh"
  echo ""
  exit 1
}

PROJECT="$(resolve_project_root)" || fail_wrong_directory
cd "$PROJECT"

if [[ ! -f "package.json" ]]; then
  echo "ERROR: package.json not found in $PROJECT"
  exit 1
fi

if ! grep -q '"name"[[:space:]]*:[[:space:]]*"flutter-films"' package.json 2>/dev/null; then
  echo "ERROR: $PROJECT does not appear to be the FlutterFilms application."
  exit 1
fi

if ! grep -q '"next"' package.json 2>/dev/null; then
  echo "ERROR: Next.js dependency not found in package.json."
  exit 1
fi

if [[ ! -d "node_modules" ]]; then
  echo "Installing dependencies..."
  npm install
fi

if [[ ! -x "node_modules/.bin/next" && ! -f "node_modules/next/package.json" ]]; then
  echo "ERROR: Next.js is not installed. Run: npm install"
  exit 1
fi

NODE_VERSION="$(node -v 2>/dev/null || echo 'unknown')"
NPM_VERSION="$(npm -v 2>/dev/null || echo 'unknown')"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "FlutterFilms by Ritvik M — Development"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Project: $PROJECT"
echo "Node:    $NODE_VERSION"
echo "npm:     $NPM_VERSION"
echo "Starting development server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exec npm run dev
