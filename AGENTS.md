# Agent instructions — FlutterFilms by Ritvik M

## IMPORTANT: repository root

**The FlutterFilms by Ritvik M repository root is:**

```
/Users/rpm/vitamovies
```

**Never** execute `npm`, `npx`, `pnpm`, or `yarn` commands from unrelated directories (for example `/Users/rpm/metadata.themoviedb.org.python`).

Before running any project command, resolve the repository root from the current file or repository context.

When a project-root command is required, use:

```bash
cd /Users/rpm/vitamovies
```

Or launch development from any directory with:

```bash
/Users/rpm/vitamovies/dev.sh
```

## Separate projects (do not confuse)

| Project | Path | Purpose |
| --- | --- | --- |
| **FlutterFilms by Ritvik M** | `/Users/rpm/vitamovies` | Next.js web app |
| **TMDB metadata (Kodi)** | `/Users/rpm/metadata.themoviedb.org.python` | Python scraper add-on |

These are **separate repositories**. Do not treat the Kodi metadata project as the FlutterFilms by Ritvik M application root.

## Safe commands

```bash
# Development (works from any directory)
/Users/rpm/vitamovies/dev.sh

# Or from the project root
cd /Users/rpm/vitamovies && npm run dev

# Verify you are in the correct directory
npm run check:root
```

## Do not

- Run `npm run dev` from `/Users/rpm/metadata.themoviedb.org.python`
- Create a fake `package.json` in the Kodi metadata project
- Assume the Cursor workspace path is the FlutterFilms by Ritvik M root

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
