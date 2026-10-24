# Feature coverage and verification

Release: **1.0.0-beta.1**, continued from the original implementation, without redesigning or recreating the project.

## Executed checks

- TypeScript: `tsc --noEmit` passed.
- **32 automated tests passed**, zero failed or skipped.
- Rules tests cover all six piece types, pins, castling and its restrictions, en passant and its expiry, four promotion choices, checkmate/stalemate, common insufficient material, present/prospective repetition claims, automatic fivefold, fifty/75-move behavior, mate precedence, increments, timeout, paused/unlimited clocks, PGN/FEN and immutable undo/redo snapshots.
- Both **compact and full Stockfish 19** binaries passed UCI readiness, legal best-move and mate-in-one tests. These execute the real engines.
- Room-handler tests execute the actual route against a real in-memory SQLite database through a small D1-compatible adapter. They cover room creation/join, third-seat rejection, membership, out-of-turn/illegal moves, concurrent submissions, reconnection reads, draw acceptance, rematch, resignation, server timeouts, cross-room denial, expiry and creation rate limits.
- Service-worker logic test verifies unique precache entries, cached asset retrieval offline, and exclusion of online/authentication endpoints.

## Browser checks actually performed

- Desktop homepage, game setup and responsive UI visually inspected.
- Completed a local game from the initial position to checkmate: `1. f3 e5 2. g4 Qh4#`.
- Completed a Computer game from the initial position to checkmate. The human played `f3` and `g4`; the real browser Stockfish worker played `e5` and `Qh4#`.
- Tested undo and redo on the completed local game.
- Full engine browser analysis found mate in one (`Qg7#`) from a loaded FEN; applying its suggested move produced checkmate.
- Created an online room, joined as Black in a second tab, exchanged `e4` / `e5`, and observed the same move history in both tabs.
- Submitted an illegal online move without changing the board.
- Accepted a draw, requested/accepted a rematch and observed the reset board.
- Reloaded the host tab and verified the original White membership and room state were restored.
- Inspected home, setup and gameplay in a 390-pixel iframe viewport (375-pixel content width after scrollbar). Content `scrollWidth` matched width, with no horizontal overflow in the tested views.

These online checks used **two independent tabs in one browser**, not two physical devices or two different browsers in different countries. They verify the local backend path and synchronization, but do not fulfill the requested separate-device production acceptance test. Direct HTTP tests could not reach the managed preview from the shell; they were not reported as passed. The handler tests and actual browser checks are distinct evidence.

## Implemented scope

| Requirement | Implementation / qualification |
| --- | --- |
| Premium reference-inspired UI | Navy/gold home, setup, gameplay, analysis, customize, settings and mobile layouts; generated chess hero |
| Free play | No billing, advertisements, paid unlocks or subscriptions in the app |
| Opponents | Exactly Friend, Computer and Online Friend |
| Variants | Standard only; unsupported variants are not advertised as playable |
| Time controls | Bullet, Blitz, Rapid, Classical, Unlimited and custom minutes/increment |
| Move rules | chess.js legality, check, mate, stalemate, castling, en passant and promotion |
| Draw rules | Threefold/fifty claims, prospective claims, automatic fivefold and 75 moves |
| Dead positions | Common material cases covered; exhaustive blocked-position adjudication is not implemented |
| Timeout / resignation | Material-aware result handling; exotic reachability cases retain the dead-position limitation |
| Board input | Click/tap, desktop native drag/drop, typed SAN/UCI; promotion dialog |
| SVG artwork | Cburnett/Staunton and Merida, with upstream licensing notices |
| Computer | Real Stockfish 19, compact and full NNUE, five skill settings, configurable thinking time/depth |
| Engine resources | One worker/thread for portability; multi-thread selection is not implemented |
| Online backend | D1-backed trusted validation, cryptographic IDs/tokens, SQL compare-and-swap versioning |
| Synchronization | Two-second polling; not WebSocket/Supabase push transport |
| Reconnection | Same-tab session token restores seat on reload; no account-based recovery after losing that token |
| Rooms | Two seats, invite link/code, nicknames, presence, draw/resign/rematch, 24-hour expiry |
| Cleanup / abandonment | Opportunistic cleanup on room creation; both-absent detection on access; no scheduled cleanup worker |
| Gameplay details | Clocks, SAN move history, captures, last move, legal moves, check indicator, flip, sound |
| Controls | Local undo/redo/restart/pause/save/resume, PGN import/export, FEN load/copy; online restrictions enforced |
| Analysis | Position navigation, true engine score/PV/best move, evaluation bar; no invented accuracy or mistake labels |
| Customization | Dark/light/system, five board palettes, two piece sets, sounds, coordinates, indicators, orientation and animation |
| Language | English UI, initial navigation dictionary/adapter; not all UI strings are extracted into catalogs yet |
| PWA | Manifest, icons, generated offline asset list and versioned service worker; actual device installation remains unverified |
| Accessibility | Labeled controls, keyboard move input, focus rings, modal focus trapping/Escape, status announcements, reduced motion |
| Security | Token hashes, origin checks, size checks, sanitization, membership checks, per-IP rate limiting, atomic writes |
| Source and setup | Complete project, pinned dependencies, backend schema, setup/deployment/troubleshooting instructions |

## Remaining acceptance work

1. Test the public deployment with two separate browsers/devices on separate networks, including timed games and unreliable connections. The initial Sites audience is owner-private.
2. Test PWA installation and offline reopening on real Android and iOS devices. The managed HTTP preview deliberately does not register a service worker.
3. Validate production CPU usage and traffic against the chosen host's quotas. No sustained load test or external security audit has been performed.
4. Add exhaustive dead-position adjudication if tournament-grade rule completeness is required. No claim of full FIDE certification is made.
5. Replace two-second polling with a push transport if subsecond online updates are required.
6. Finish extracting every UI string before adding more languages. English is the only supported interface language.

The application is usable as a beta, but these gaps mean it must not be described as the entire original production-grade specification being fully completed and verified.
