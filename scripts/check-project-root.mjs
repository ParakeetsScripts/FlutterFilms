#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN_ROOT = "/Users/rpm/vitamovies";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FROM_SCRIPT = path.resolve(SCRIPT_DIR, "..");

function readPackageJson(dir) {
  const file = path.join(dir, "package.json");
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function isFlutterFilmsRoot(dir) {
  const pkg = readPackageJson(dir);
  if (!pkg) return false;
  if (pkg.name !== "flutter-films") return false;
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return Boolean(deps.next);
}

function resolveProjectRoot() {
  if (isFlutterFilmsRoot(FROM_SCRIPT)) return FROM_SCRIPT;
  if (isFlutterFilmsRoot(KNOWN_ROOT)) return KNOWN_ROOT;

  if (fs.existsSync(path.join(process.cwd(), ".git"))) {
    try {
      const gitRoot = execSync("git rev-parse --show-toplevel", {
        cwd: process.cwd(),
        encoding: "utf8",
      }).trim();
      if (isFlutterFilmsRoot(gitRoot)) return gitRoot;
    } catch {
      // ignore
    }
  }

  return null;
}

function printWrongDirectory(projectRoot) {
  const cwd = process.cwd();
  console.error("");
  console.error("You are outside the FlutterFilms by Ritvik M project.");
  console.error("");
  console.error("FlutterFilms by Ritvik M project detected at:");
  console.error(`  ${projectRoot}`);
  console.error("");
  console.error("You are currently in:");
  console.error(`  ${cwd}`);
  console.error("");
  console.error("Run:");
  console.error("  /Users/rpm/vitamovies/dev.sh");
  console.error("");
}

const projectRoot = resolveProjectRoot();

if (!projectRoot) {
  console.error("ERROR: Could not locate the FlutterFilms by Ritvik M project.");
  console.error(`Expected root: ${KNOWN_ROOT}`);
  process.exit(1);
}

const cwd = path.resolve(process.cwd());
const inProject = cwd === path.resolve(projectRoot) || cwd.startsWith(path.resolve(projectRoot) + path.sep);

if (!inProject) {
  printWrongDirectory(projectRoot);
  process.exit(1);
}

console.log("FlutterFilms by Ritvik M project root OK:");
console.log(`  ${projectRoot}`);
process.exit(0);
