# Play on GitHub Pages

The Pages build reuses the existing React chess interface and rules engine. It serves local two-player games, real Stockfish (compact/full), analysis, customization and browser-local saves at `/chess-game/`.

Online Friend displays an explicit link to the hosted multiplayer app. GitHub Pages cannot run the authoritative D1 room API. No room requests are sent to GitHub Pages.

Build locally:

```sh
pnpm install --frozen-lockfile
node scripts/build-pages.mjs
```

Output: `dist-pages/`. Generated intermediate client files: `.pages-src/`. Both are ignored by Git. The original server build and deployment stay unchanged.

Repository Settings → Pages → Source must be **GitHub Actions**. `.github/workflows/pages.yml` builds, tests, uploads and deploys after pushes to `main`. The workflow uses the built-in token; no personal access token or secret is needed.

Engine assets, manifest, offline cache and worker paths are scoped to `/chess-game/`. If renaming the repository, change `base` in `scripts/build-pages.mjs`.

Saved games are local to each browser origin. Saves on the hosted multiplayer site do not automatically transfer to GitHub Pages; use PGN export/import.
