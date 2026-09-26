# FlutterFilms by Ritvik M — development workflow

## Two separate projects

| Project | Path | What it is |
| --- | --- | --- |
| **FlutterFilms by Ritvik M** | `/Users/rpm/vitamovies` | Next.js movie intelligence platform |
| **TMDB metadata (Kodi)** | `/Users/rpm/metadata.themoviedb.org.python` | Python Kodi scraper add-on |

They share TMDB concepts but are **different repositories**.  
`npm run dev` only works inside `/Users/rpm/vitamovies`.

Running `npm run dev` from the Kodi metadata directory produces:

```
ENOENT: Could not read package.json
```

That is expected — you are in the wrong project.

---

## Permanent command (use this)

From **any directory**:

```bash
/Users/rpm/vitamovies/dev.sh
```

This script:

1. Resolves the FlutterFilms by Ritvik M root automatically (never uses your shell’s current directory)
2. Verifies `package.json` and Next.js
3. Installs dependencies if `node_modules` is missing
4. Prints project path, Node, and npm versions
5. Starts `npm run dev`

---

## Global launcher

```bash
/Users/rpm/bin/flutter-films-dev
```

Add `/Users/rpm/bin` to your `PATH` if it is not already there.

---

## Optional zsh alias

Add to `~/.zshrc` (manual step — not applied automatically):

```bash
alias flutterfilms='/Users/rpm/vitamovies/dev.sh'
```

Then reload:

```bash
source ~/.zshrc
```

Usage:

```bash
flutterfilms
```

---

## npm scripts (from project root)

| Script | Purpose |
| --- | --- |
| `npm run dev` | Standard Next.js dev server (must be run from `/Users/rpm/vitamovies`) |
| `npm run dev:root` | Same as `dev.sh` — resolves root before starting |
| `npm run check:root` | Verifies the current directory is the FlutterFilms by Ritvik M root |

---

## Verify project root

```bash
cd /Users/rpm/vitamovies && npm run check:root
```

From a wrong directory (should fail with a clear message):

```bash
cd /Users/rpm/metadata.themoviedb.org.python && npm run check:root
```

---

## Typical setup

```bash
cd /Users/rpm/vitamovies
cp .env.example .env.local
npm install
/Users/rpm/vitamovies/dev.sh
```

Open [http://localhost:3000](http://localhost:3000).

---

## For Cursor / Composer agents

See [AGENTS.md](../AGENTS.md) at the repository root.
