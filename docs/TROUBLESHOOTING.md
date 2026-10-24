# Troubleshooting

| Symptom | What to do |
| --- | --- |
| `pnpm` not found | Install Node.js 22.13+ and run `npm install --global pnpm@11.25.0`, then open a new terminal. |
| Engine loading fails | Check that `/engine/stockfish-19-lite-single.js` and its `.wasm` file return successfully. Turn off Full-strength neural network for a smaller download, then retry. |
| Full engine fails on a phone | The 95 MB network needs more memory. Select the compact engine in Settings. Both are genuine Stockfish. |
| Pieces are missing | Verify all twelve SVGs exist in the selected set under `public/pieces/`. Check the browser Network panel for blocked or missing assets. |
| Online database is not configured | Set the hosting D1 binding to `DB`; follow the database setup in `DEPLOYMENT.md`. |
| `no such table: rooms` or `limits` | Apply the committed migration to the correct local/remote database. Never delete a database just to clear this error. |
| Invitation does not open on another device | `localhost` is local to that device. Use a public deployment. An owner-private Sites URL cannot be opened by your friend. |
| Room already has two players | The room has no spectator or third-player slot. Return using your original tab/session or create another room. |
| Membership rejected after closing a tab | Membership is a guest session token, not an account. Reopening without that token cannot recover the seat. Create a new room; do not share your player token. |
| Position changed / synchronizing | Another request updated the room. The app refreshes its version and retries safe actions once. Choose the move again if the board changed. |
| Too many requests | Wait until the next minute. Creation is limited to five rooms/minute/IP; other requests to 100/minute/IP. Multiple users behind one IP share this budget. |
| Clock ran while disconnected | This is intentional for online games. Local games have a Pause control. |
| Resume seems paused | Saved local games deliberately restore paused. Resume through the home action or game menu. |
| Draw claim rejected | Threefold/fifty-move draws require a valid current or intended position. Fivefold/75-move draws are automatic. |
| PGN/FEN rejected | Check the notation and king placement. Imported content opens in analysis, preserving the current live game's rules. |
| PWA does not install | Use HTTPS and a supported browser. Check the manifest and service-worker registration. Platform install UI differs. |
| Offline screen is unavailable | Wait for the initial worker installation and offline asset cache to finish. Storage limits or eviction can remove caches; reopen online. |
| New version seems stale | Close other tabs, reopen online, and allow the new worker to activate. Export important local games before clearing site data. |
| Online performance degrades | Check Worker CPU, request counts, D1 writes and errors in the hosting dashboard. Two-second polling and per-request limits consume quota. |

Useful local checks:

```sh
pnpm typecheck
pnpm test
pnpm build
```

For API tests against a running local deployment, use `TEST_ORIGIN`:

```sh
# macOS / Linux
TEST_ORIGIN=http://localhost:5173 node --test tests/online.test.mjs
```

```powershell
# PowerShell
$env:TEST_ORIGIN="http://localhost:5173"
node --test tests/online.test.mjs
Remove-Item Env:TEST_ORIGIN
```

Without that variable, online tests execute the actual route handlers against an in-memory SQLite adapter. They do not imply successful network testing or production load testing.
