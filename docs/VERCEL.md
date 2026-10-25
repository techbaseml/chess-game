# Vercel Hobby deployment

Import `techbaseml/chess-game` into a **Hobby** personal project. Use the repository's `vercel.json` (Framework Preset: Other). Do not choose Pro, a trial, paid add-ons or a purchased domain. Name availability is determined by Vercel during import.

- Install: `npm install -g pnpm@11.25.0 && pnpm install --frozen-lockfile`
- Build: `node scripts/build-pages.mjs --vercel`
- Output: `dist-vercel`
- Node: 22.x

The same existing React client is built at `/`, including the real online create/join screens. Invitation links use the current Vercel origin. `/api/rooms` is a server-side gateway to the existing public NEXA CHESS room service. There is no browser redirect and no database secret in the frontend.

## Backend dependency and limits

This deployment **does not migrate the room database to Vercel**. Existing room validation/storage remains at `nexa-chess-sanjay.adoredotter18.chatgpt.site`. It must remain public and available. Vercel forwards membership tokens only to that fixed backend; it does not forward browser cookies or allow arbitrary proxy destinations. Origin checks, request bounds, timeouts, no-cache responses and non-JSON/redirect rejection are enforced. Existing membership and compare-and-swap validation remain on the trusted backend.

Gateway egress can share the backend's per-IP rate limit (100 requests/minute, 5 creates/minute). Two-player casual testing is suitable; concurrent rooms may hit that limit. Moving to a dedicated database/backend with gateway-aware rate limiting is a separate migration. No claim is made that multiplayer is unlimited or production-scalable.

Vercel Hobby is limited to personal/non-commercial use and has quotas. No paid service is configured by this repository. Availability and provider plan rules can change.

## Validation

Run `node --test tests/*.test.mjs`. Gateway tests exercise actual room handlers against SQLite: create, join, move synchronization, wrong-turn denial, origin/body checks and upstream failure handling. This is not a deployed Vercel two-device test. After deployment, verify local play, real engine response, room create/join/moves in two clients, and reload/reconnect before calling online deployment verified.

GitHub Pages retains its separate build and online handoff. The existing Sites deployment remains unchanged.
