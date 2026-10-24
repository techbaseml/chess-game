# Deployment and backend setup

## Existing Sites project

The existing project identity is in `.openai/hosting.json`. Keep it: creating another Site is unnecessary. Its D1 binding is `DB`. Sites applies the committed Drizzle migration during publication. No Supabase account or frontend secret is needed.

This project begins owner-private. A private publication supports owner review; it does **not** let an overseas friend open a room. Public access must be deliberately enabled by the owner before inviting other people. Do not alter the access policy merely to make deployment pass.

## Standalone Cloudflare Workers + D1

The following is a deployment path, not a claim that deployment to your Cloudflare account has already happened. It requires a free Cloudflare account and manual authentication. Run commands from the project root.

1. Install dependencies and validate:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

2. Authenticate Wrangler and create your own database:

```sh
pnpm exec wrangler login
pnpm exec wrangler d1 create nexa-chess
```

Complete login in your browser. Copy the **database_id** printed by the create command. It is an identifier, not a secret. Do not paste an API token into source files.

3. Generate your deployment configuration, replacing the placeholder:

```sh
node scripts/prepare-cloudflare-deploy.mjs YOUR_D1_DATABASE_ID
```

This writes ignored `wrangler.deploy.json`. It points to `dist/server/index.js`, `dist/client` and your database binding. It does not deploy. You may edit its `name` to choose an available Worker name.

4. Apply the schema to the new remote database:

```sh
pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.deploy.json
```

5. Publish when ready:

```sh
pnpm exec wrangler deploy --config wrangler.deploy.json
```

Open the exact `workers.dev` URL Wrangler returns. Do not guess the URL. A custom domain is optional. Keep the Worker and D1 database in the same account.

6. Check two real browsers/devices:

- Create a room on one device, join on the other, and exchange legal moves.
- Confirm the wrong side cannot move and both clocks agree within normal network delay.
- Reload a player's existing tab and confirm its color and move history return.
- Offer/accept a draw and agree to a rematch.
- Play a full timed game and verify timeout behavior.
- Install the PWA, finish downloading its assets, disconnect, and open a local game.

## Updates and rollback

Keep a Git commit/tag for each known-good version. Build and test before deployment. Wrangler/Cloudflare's deployment history can restore a previous Worker version. Database migrations are separate: do not assume reverting code reverses a migration. Back up data before schema changes; append new migrations instead of rewriting applied migrations.

## Free-tier capacity

The application has no paid gameplay features. Hosting has quotas. Cloudflare's published Free-plan limits checked on 22 October 2026 include:

| Resource | Published allowance |
| --- | --- |
| Worker requests | 100,000 per day across the account |
| Worker CPU | 10 ms per HTTP request |
| Worker memory | 128 MB per isolate |
| D1 reads | 5 million rows per day |
| D1 writes | 100,000 rows per day |
| D1 storage | 5 GB total |
| Individual static asset | 25 MiB |

Official references: [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/).

The room client polls every two seconds while its game or online page is open. Each poll writes the rate-limit counter and periodically updates presence. A pair of active clients can therefore use around 60 API requests and at least 60 counter writes per minute before moves, presence and index costs. This is suitable for small-scale testing, not a promise of unlimited concurrent games. SSR and chess validation also require CPU; long games and heavier traffic need profiling against the 10 ms allowance. Free-tier exhaustion can make online rooms unavailable.

Room expiry is enforced on reads even if cleanup has not run. Cleanup is opportunistic on creation, not a scheduled deletion job. For sustained public traffic, a more efficient push-based transport and stronger edge-level abuse protection are recommended before launch. Do not upgrade to a paid plan automatically.

GitHub Pages alone cannot run this trusted backend. It can serve static assets, but a separate deployed API would still be needed. Do not claim server-authoritative multiplayer by hosting only the frontend.
