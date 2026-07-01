# Youth Communication App — API Server

A secure Node.js/Express backend for a teenage communication web app. Receives Discord webhook events, anonymizes all sensitive user data before any processing or storage, and maps real identities to temporary anonymous IDs.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/lib/anonymize.ts` — anonymization engine (real ID → anon UUID with 24h TTL)
- `artifacts/api-server/src/routes/webhook.ts` — Discord webhook handler (`POST /webhook/discord`)
- `artifacts/api-server/src/middlewares/discordWebhookAuth.ts` — Ed25519 signature verification
- `artifacts/api-server/src/middlewares/rateLimit.ts` — in-memory IP rate limiter (60 req/min)
- `lib/api-spec/openapi.yaml` — OpenAPI contract source of truth

## Architecture decisions

- **Anonymization at the edge**: sensitive fields (`id`, `user_id`, `author_id`, `username`, `global_name`, `nick`, `email`, `ip`) are stripped/replaced before the payload reaches any business logic or storage.
- **Stable anonymous IDs within a 24h window**: the same real user gets the same `anonId` within a day, allowing session-level correlation without permanent identity linkage.
- **Ed25519 signature verification**: Discord's official verification scheme is enforced via Node's built-in `crypto` module. When `DISCORD_PUBLIC_KEY` is unset (dev), the check is skipped with a warning.
- **Raw body capture via `express.json` verify callback**: the raw buffer is attached to `req.rawBody` before JSON parsing so the signature check can verify the unmodified bytes.
- **In-memory rate limiter**: 60 requests per IP per 60-second sliding window; no external dependency.

## Product

The backend securely ingests Discord events for a teen communication platform. All personally identifiable information is anonymized at the ingestion point — downstream consumers only ever see anonymous UUIDs, never real usernames, Discord IDs, or nicknames.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `DISCORD_PUBLIC_KEY` must be set in production or all webhook requests will be accepted without signature verification.
- The anonymous ID store is in-memory — a server restart clears all mappings (IDs regenerate on next event). For persistent cross-restart anonymization, back the store with the database.
- Do not call both the raw-body middleware and `express.json` with `verify` — the stream can only be read once. Use only the `verify` callback on `express.json`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
