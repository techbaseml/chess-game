# NEXA CHESS

A working chess application with a navy-and-gold interface, wooden boards, open-source SVG pieces, local games, real Stockfish workers, analysis, and a private-room backend.

**Release: 1.0.0-beta.1.** This is a playable implementation, not a claim of tournament certification or complete production validation. Read [the feature and verification report](docs/VERIFICATION.md) for the remaining limitations.

## Start on your computer

Install Node.js **22.13 or newer**, Git, and pnpm. Open Terminal or PowerShell **inside this project folder**, then run:

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Open the local address printed by the development server, normally `http://localhost:5173`.

Local Friend games, Computer games, settings and analysis do not need a database account, API key, or secret. Stockfish binaries and SVGs are already included. Do not open `index.html` directly: the application uses a development server and a Worker backend.

## Enable local online-room testing

Create the build output and apply the bundled migration to the **local** D1 database:

```sh
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_solid_triathlon.sql
pnpm dev
```

Apply the migration only once to a new local database. If a table already exists, do not delete the database: check whether the migration was previously applied.

1. Open the site in two independent browser profiles, such as normal Chrome and Firefox.
2. In the first browser choose **Online Friend → Create room**.
3. Copy the invitation link, open it in the second browser, enter a nickname, and join.
4. The creator is White and the joining player is Black.
5. Make a move in each browser and check the other board.

`localhost` invitations only work on the same computer. Friends on different networks need a publicly accessible deployment. A private Sites deployment is visible only to its owner and does not make invitations available to other people.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` | Compile the existing application and generate offline asset manifest |
| `pnpm start` | Serve the compiled Cloudflare Worker locally |
| `pnpm typecheck` | TypeScript checks |
| `pnpm test` | Rules, clocks, backend-handler and real-engine tests |
| `pnpm engine:prepare` | Recreate bundled Stockfish assets from the pinned npm package |
| `pnpm db:generate` | Generate a new migration after a deliberate schema change |

## How to play

- **Friend:** two people share one screen; click/tap a piece, then its destination. Desktop drag-and-drop is also supported.
- **Computer:** choose Beginner through Maximum and White or Black. Maximum sets Stockfish Skill Level 20 without intentional weakening.
- **Online Friend:** invite exactly one person. Moves are validated on the server. The browser never submits an authoritative FEN.
- **Keyboard:** enter SAN such as `Nf3` or coordinate notation such as `e2e4` below the board. Use `a7a8q` for promotion by keyboard.
- **Analysis:** import PGN, load FEN, navigate moves, or run a real engine evaluation. The best continuation is calculated, never fabricated.
- **Game menu:** pause local clocks, claim a draw, restart, import/export and save/resume. Online clocks cannot be paused; online moves cannot be undone by one player.
- **Draw claims:** leave the claim field empty for the current position, or enter an intended move for a prospective threefold/fifty-move claim.
- **Save:** saves on this device. Local progress also autosaves. Reopening restores a paused local game; choose Resume to continue.

## Engine settings

The compact Stockfish 19 neural-network build is approximately 1.8 MB; the full network build is approximately 95 MB. The full binary is split into five asset-sized chunks and reconstructed as a stream inside the browser Worker. It does not run on the backend.

On a first visit, devices reporting at least 4 GB through `navigator.deviceMemory` default to the full engine. Other devices default to compact. You can change this in **Settings → Full-strength neural network**. Memory reporting is not available in every browser.

Thinking time is configurable from 0.3 to 10 seconds. Depth 0 means no depth cap within the time budget. Both builds use one Web Worker and one engine thread for compatibility without cross-origin isolation. Maximum does not promise an unbeatable opponent. The selected network, search budget and device affect strength.

## Project map

| Path | Contents |
| --- | --- |
| `app/page.tsx` | Application screens, board interaction, local persistence and online client |
| `app/globals.css` | Responsive navy/gold and light themes |
| `app/layout.tsx` | Document metadata and manifest |
| `app/api/rooms/route.ts` | Trusted room API, membership, move validation, CAS ordering and rate limits |
| `lib/chess-core.mjs` | Rules wrapper, terminal conditions, claims, clocks, PGN/FEN |
| `lib/engine.ts` | UCI Worker adapter, cancellation, errors and evaluation |
| `lib/i18n.ts` | Initial English navigation dictionary and translation adapter |
| `db/schema.ts`, `drizzle/` | Database schema and migrations |
| `public/pieces/` | Unmodified Cburnett and Merida SVG sources |
| `public/engine/` | Pinned Stockfish worker and network binaries |
| `public/sw.js`, `public/manifest.webmanifest` | PWA shell and safe asset caching |
| `scripts/create-offline-manifest.mjs` | Build-time list of offline assets |
| `scripts/prepare-cloudflare-deploy.mjs` | Standalone Cloudflare configuration helper |
| `tests/` | Executable rules, engine and room-handler tests |
| `docs/DEPLOYMENT.md` | Hosting and backend setup |
| `docs/VERIFICATION.md` | Test evidence, feature coverage and remaining gaps |
| `docs/TROUBLESHOOTING.md` | Common problems and recovery steps |
| `public/credits.txt`, `LICENSE` | Attribution, engine sources and licenses |

## Offline and installation

Use HTTPS in production. After the first successful service-worker installation, the built application, SVG pieces and compact engine are cached. The full engine is cached only after it is used. Online rooms always require a connection. Browser storage limits can prevent or evict caches.

On Android, use the browser's Install app / Add to Home screen action when offered. On iPhone, open in Safari and use Share → Add to Home Screen. Installation and offline reopening still need verification on actual Android/iOS devices; they were not claimed as tested here.

## Data and security

Room IDs and membership tokens use 24 random bytes each. Only token hashes are stored server-side. Tokens stay in tab-scoped session storage to preserve separate player identities in two tabs. Reloading the same tab reconnects; losing the tab/session token does not grant an account-recovery mechanism.

Room writes use a version-qualified SQL update. Two requests with the same version cannot both update the game. The database holds the position, moves and clock anchor. Clocks keep running during disconnection. All rooms expire after 24 hours; expired rows are cleaned up when another room is created. Games where both participants have been absent for ten minutes are adjudicated as abandoned when next accessed. See the report for limitations.

No service-role key or database credential belongs in browser code. Standalone Cloudflare deployment uses a D1 binding; there are no frontend environment secrets to configure.

## Licenses

Application code is supplied under GPLv3. Stockfish is GPLv3; SVG sets are GPLv2-or-later, distributed under GPLv3 here; chess.js is BSD-2-Clause. Keep `public/credits.txt`, all notices, and the applicable source-access obligations when redistributing. The exact SVG sources are included. Engine source/build instructions are linked to the matching upstream release in the credits.

Engine binaries are generated automatically by dev/build from the pinned Stockfish dependency; they are excluded from Git to stay within source upload limits. The deployment package includes them.
