# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NayaGhar (package name: `naya-ghar`) is a housing platform for rural-to-urban migrants in Nepal — students and young professionals. Core features: AI-powered property matching via semantic search, interactive map-based search, verified listings, WhatsApp landlord contact, and a trust/review system. Optimised for low-bandwidth users.

## ⚠️ Next.js 16 — read first

See `AGENTS.md`: this repo is on **Next.js 16** (App Router, React 19). APIs, conventions, and file structure differ from older Next versions you may have memorised. Before writing route handlers, server components, caching code, or `next.config` changes, consult `node_modules/next/dist/docs/` for the canonical guide and heed any deprecation notices.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint (eslint-config-next)

# Database (Drizzle ORM, PostgreSQL via Neon serverless driver)
npx drizzle-kit generate   # Generate migrations from schema.ts changes
npx drizzle-kit migrate    # Apply migrations
npx drizzle-kit push       # Push schema directly (dev only)
npx drizzle-kit studio     # Open Drizzle Studio GUI
npx tsx src/lib/db/seed.ts # Seed sample data (script lives at src/lib/db/seed.ts)

# Embedding service (separate process, must be running for semantic features)
cd embedding-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Solana / Anchor (separate workspace under solana/)
cd solana
anchor build                         # compile escrow + reputation programs
anchor deploy --provider.cluster devnet
anchor keys sync                     # sync new program ids into Anchor.toml
anchor test                          # runs tests/escrow.ts against a local validator
```

There is no JS test suite for the Next app. Anchor tests live in `solana/tests/`.

## Architecture

### Three-process system

1. **Next.js 16 app (TypeScript, React 19)** — frontend, API routes, auth, CRUD, escrow orchestration. App Router; Server Components by default.
2. **Python FastAPI microservice** (`embedding-service/`) — wraps OpenAI embeddings. Single endpoint `POST /embed` returning a 1536-dim vector. The Next.js app talks to it via `src/lib/embeddings.ts` (`EMBEDDING_SERVICE_URL`, defaults to `http://localhost:8000`).
3. **Solana programs** (`solana/programs/`) — two Anchor programs (`escrow` + `reputation`) deployed to devnet for the hackathon. The Next app talks to them via `@solana/web3.js` from `src/lib/solana/`.

### Key architectural decisions

- **PostgreSQL + pgvector on Neon** — one database for relational data and vector similarity. The `listings.embedding` column (`vector(1536)`) is intended for hybrid queries that combine pgvector cosine distance (`<=>`) with standard SQL `WHERE` filters in a single statement.
- **Drizzle ORM** — `src/lib/db/schema.ts` is the single source of truth; types are inferred (e.g. `Listing`, `NewListing` in `src/types/listing.ts`). Database access goes through `getDb()` in `src/lib/db/index.ts`, which lazily constructs the Neon HTTP client. Always use `getDb()` — never instantiate the client at module top level (lambda cold-start friendliness).
- **NextAuth v5 (beta)** — `src/lib/auth/index.ts` exports `{ handlers, signIn, signOut, auth }`. Single Credentials provider keyed on `phone + password` (bcrypt hash in `users.passwordHash`). JWT session strategy. Custom sign-in page at `/login`. The session shape is augmented in `src/types/next-auth.d.ts` to include `id`, `role`, and `phone` on `session.user`.
- **MapLibre GL JS + react-map-gl** — open-source tiles, low-bandwidth-friendly. `supercluster`/`use-supercluster` cluster markers client-side. The map's bounding box is meant to feed the search API for viewport-scoped queries.
- **Cloudinary for media uploads** — `src/lib/cloudinary.ts` + `POST /api/upload` accept multipart form-data, validate types/sizes (5MB images, 50MB videos, max 5 images + 2 videos per listing), and return Cloudinary URLs that get stored in `listings.photos` / `listings.videos` jsonb columns. Note: `src/lib/storage.ts` contains an unused S3 presigned-URL helper — the actual upload path is Cloudinary; do not assume S3.
- **WhatsApp Cloud API** — `src/lib/whatsapp/client.ts` sends template messages via Graph API v21. The receiving webhook route is not yet implemented (no `app/api/webhooks/`).
- **GSAP + custom hooks** (`useGsap`, `useInView`, `useRipple`) for landing-page animation; `framer-motion` is *not* used here.
- **Tailwind CSS v4** via `@tailwindcss/postcss` (no `tailwind.config.*` — v4 config is in CSS).
- **Custodial Solana wallets** — every user gets an Ed25519 keypair at signup (`src/app/api/auth/register/`). Secret keys are envelope-encrypted (`src/lib/solana/keys.ts`): a per-user DEK (data encryption key) is wrapped by a single KEK from `WALLET_KEK_BASE64` env var (production migration target: AWS/GCP KMS — the storage layout doesn't change). The plaintext secret never leaves the server; signing happens via `signAsUser()` in `src/lib/solana/signer.ts`, which decrypts, signs, then drops the keypair reference.
- **Anchor escrow** (`solana/programs/escrow/`) — six instructions (`initialize_escrow`, `fund_escrow`, `release_to_landlord`, `refund_to_tenant`, `raise_dispute`, `partial_release`). Escrow PDA seeds: `["escrow", listing_id (16 bytes), tenant.pubkey]`. State machine: `Initialized → Funded → {Released | Refunded | Disputed → Resolved}`. Platform authority (env `PLATFORM_AUTHORITY_SECRET`) signs all admin transitions; for production this should be a Squads/Realms multisig.
- **Anchor reputation** (`solana/programs/reputation/`) — append-only counters per `(user, role)`. Only callable via CPI from the escrow program at terminal state transitions, so reputation can't be faked. PDA seeds: `["reputation", user.pubkey, role_byte]`.
- **Pyth + forex composition** — `SOL/NPR = SOL/USD (Pyth) × USD/NPR (forex API)`. Pyth doesn't ship NPR. Quotes are locked into `price_quotes` table for 5 min with a 1% drift tolerance enforced at funding time (`src/lib/solana/quotes.ts`). Reject quotes if Pyth confidence > 2% of price or feed > 30s old.
- **Esewa + Khalti** — `src/lib/payments/{esewa,khalti}.ts` cover init, callback verification, and status lookup. Both providers settle into the same `fiat_payments` table with `providerRef UNIQUE` for idempotent webhook replays. Esewa uses ePay v2 HMAC-signed forms; Khalti uses KPG-2 epayment initiate/lookup.
- **Postgres-backed job queue** — `jobs` table + `src/lib/jobs/queue.ts` (uses `FOR UPDATE SKIP LOCKED`). Avoids Redis. Async work like `convert_and_fund`, `release_and_payout`, `refund`, `esewa_reconcile` flows through it; happy path also runs inline from the Esewa/Khalti callback for snappier demo UX, with the queue as fallback. Cron endpoint at `POST /api/jobs/process` (auth: `X-Cron-Secret` header).

### Source layout

```
src/
  app/
    (auth)/          # /login, /register — uses (auth)/layout.tsx
    (main)/          # /search, /listing/[id], /listing/new, /dashboard, /community
    api/
      auth/[...nextauth]/    # NextAuth handlers
      auth/register/         # Phone+password signup, also mints Solana wallet
      listings/              # GET (list/by id) + POST (create, generates embedding)
      listings/[id]/toggle/  # Activate/deactivate a listing (landlord action)
      suggestions/           # Search suggestion endpoint
      upload/                # Multipart → Cloudinary
      quotes/sol-npr/        # Locked SOL/NPR rate quote (Pyth + forex)
      payments/init/         # Start an Esewa or Khalti deposit flow
      payments/esewa/callback/   # Esewa redirect handler (HMAC-verified)
      payments/khalti/callback/  # Khalti browser redirect
      payments/khalti/webhook/   # Khalti server-to-server webhook
      escrows/               # GET list, GET/[id], POST [id]/release|refund|dispute
      wallet/balance/        # Custodial wallet SOL balance
      reputation/[userId]/   # Read on-chain reputation PDA (?role=tenant|landlord)
      jobs/process/          # Cron drains job queue (X-Cron-Secret)
      jobs/reconcile/        # Cron reconciles Esewa state + invariant check
  components/
    ui/              # Button, Card, Input, Badge, Chip, Select, Logo, Navbar, Footer, AnimatedSection, ListPropertyButton
    map/             # MapView, SearchMap, HomeMap, HomeMapSection, ListingMarkers, ListingDetailMap
    listing/         # ListingCard, ListingToggle, MediaGallery
    search/          # SearchBar, FilterPanel, FilterSidebar, SearchResults, MobileSearchBar, MobileFilterSheet, SearchMapWrapper
    providers/       # SessionProvider, LanguageProvider
  lib/
    db/{schema.ts, index.ts, seed.ts, migrations/}
    auth/index.ts          # NextAuth v5 config
    whatsapp/client.ts     # Graph API v21 template-message sender
    embeddings.ts          # Tiny client for the Python service
    cloudinary.ts          # Cloudinary SDK wrapper (uploadToCloudinary, deleteFromCloudinary)
    storage.ts             # S3 presigned-URL helper — currently unused; prefer cloudinary.ts
    geo.ts, geocoding.ts   # Distance / bounding box / address lookups
    nepali-date.ts         # BS↔AD date conversion (nepali-date-converter)
    constants.ts           # formatPrice, AMENITY_ICONS, PROPERTY_TYPES, CITIES
    solana/
      config.ts          # cluster, RPC, program ids, Pyth feed, TTL/drift constants
      connection.ts      # singleton Connection (commitment="confirmed")
      keys.ts            # envelope encryption: KEK→DEK→secret key; platform keypair loader
      signer.ts          # signAsUser(): decrypt-sign-drop, used by dispute route
      pyth.ts            # SOL/USD reading via @pythnetwork/client; staleness/conf checks
      quotes.ts          # createQuote/consumeQuote, paisaToLamports, drift enforcement
      escrow.ts          # hand-rolled Anchor client (no @coral-xyz/anchor in server bundle)
      reputation.ts      # PDA reader (manual layout, must match Rust struct)
      treasury.ts        # mock NPR↔SOL swap for hackathon; swap with Jupiter for prod
    payments/
      esewa.ts           # ePay v2: form HMAC, callback verify, status check
      khalti.ts          # KPG-2: initiate, lookup
      forex.ts           # USD/NPR with 60s in-process cache
    jobs/
      queue.ts           # enqueue/claimNext/complete/fail with backoff; reapZombieJobs
      handlers.ts        # convert_and_fund, release_and_payout, refund, esewa_reconcile
  hooks/             # useDebounce, useInView, useGsap, useRipple, useLanguage
  types/             # listing.ts, user.ts, search.ts, escrow.ts, payment.ts, next-auth.d.ts
embedding-service/   # FastAPI: POST /embed, GET /health (Dockerfile included)
solana/              # Anchor workspace
  programs/escrow/         # Rust escrow program (state machine + reputation CPIs)
  programs/reputation/     # Rust reputation program (CPI-only writes)
  tests/escrow.ts          # Mocha integration test
  Anchor.toml, Cargo.toml
```

### Database tables (`src/lib/db/schema.ts`)

- **users** — phone (unique), email, bcrypt password hash, role enum (`tenant | landlord | admin`), avatar, `trustScore` (decimal), `isPhoneVerified`, `isIdVerified`.
- **listings** — landlord FK, title, description, `embedding vector(1536)`, integer `priceMonthly` & `deposit` (paisa), property type enum, lat/lng (`doublePrecision`), address/city/neighborhood, `amenities jsonb`, `photos jsonb`, `videos jsonb`, `isVerified`, `isActive`, `availableFrom`. Composite indexes on `(city, priceMonthly, isActive)` and `(latitude, longitude)`.
- **reviews** — listing FK, reviewer FK, smallint rating, text, `isVerifiedStay`.
- **pois** — name, category enum (`university | transit | hospital | market | office_hub`), lat/lng, city. For proximity features.
- **conversations** — listing/tenant/landlord FKs, `whatsappThreadId`, status enum. WhatsApp conversation tracking.
- **user_wallets** — one-to-one with users. `publicKey` (base58), `encryptedSecretKey` + `iv` + `authTag` (AES-256-GCM), `dekWrapped` (KEK-wrapped DEK), `kekId` (for rotation). Created in the same transaction-ish block as the user; failure rolls the user back.
- **price_quotes** — locked SOL/NPR with components (`solUsdMicros`, `usdNprMicros`, `solNprMicros`), Pyth `pythPublishTime` and `pythConfBps`, `expiresAt` (5 min default), `consumedAt` for one-shot use.
- **escrows** — full life cycle of a deposit: `state` enum (`pending_fiat → fiat_settled → funded → released | refunded | disputed → resolved | failed`), `amountPaisa` + `amountLamports`, `quoteId`, `pdaAddress`, three tx sigs (`fundTxSig` / `releaseTxSig` / `refundTxSig`), `releasePolicy` jsonb for splits.
- **fiat_payments** — every Esewa/Khalti hit. `providerRef UNIQUE` is the idempotency key (Esewa `transaction_uuid` or Khalti `pidx`). `direction` is `deposit_in | payout_out | refund_out`.
- **jobs** — kind/payload/status/attempts queue, processed by `/api/jobs/process`. Backoff is exponential (30s, 2min, 8min, ... cap 30min). After `maxAttempts` fails, status moves to `dead` for manual inspection.

Drizzle relations are wired for `users → listings/reviews/wallet/escrows`, `listings → landlord/reviews/escrows`, and `escrows → tenant/landlord/listing/quote/payments`.

### Search & embeddings — current state

- Embeddings are generated **at listing-create time** in `POST /api/listings`: title + description + neighborhood + propertyType + active amenity keys are concatenated and sent to the embedding service. If the service is unreachable, the listing is still saved with `embedding = null` (graceful degradation — no semantic match for that listing until backfilled).
- The hybrid `/api/search` endpoint described in past docs **is not yet implemented**. Listing fetches go through `GET /api/listings` (basic active-only list) and `GET /api/suggestions`. When adding semantic search, follow the same lazy-embedding pattern: call `generateEmbedding()` and combine with SQL filters in a single Drizzle query using pgvector's `<=>` operator.

### Data conventions

- All API responses follow `ApiResponse<T> = { data, pagination?, error }` from `src/types/search.ts`. Errors are `{ code, message }` — keep `code` as a screaming-snake string.
- Property type enum values: `room | apartment | pg | hostel`. Display labels in `PROPERTY_TYPE_LABELS` (`src/lib/constants.ts`).
- Prices are stored as **integers in paisa** (1 NPR = 100 paisa). Always render via `formatPrice()` / `formatPriceValue()` from `src/lib/constants.ts` — never divide by 100 inline.
- Supported cities are constrained to `CITIES` in `src/lib/constants.ts` (Kathmandu, Lalitpur, Pokhara, Biratnagar, Bharatpur, Bhaktapur). New listings should validate against this list.
- Path alias `@/*` → `src/*` (see `tsconfig.json`).

### Escrow flow — happy path at a glance

1. tenant → `POST /api/quotes/sol-npr` → locked `quoteId`
2. tenant → `POST /api/payments/init` (with `quoteId`, listingId, amount) → escrow row in `pending_fiat`, payment row in `pending`, returns Esewa form / Khalti `payment_url`
3. tenant pays in provider UI
4. provider → `GET /api/payments/{esewa,khalti}/callback` → verify, mark `fiat_settled`, **inline call** to `convert_and_fund` job (consume quote → mock swap → `initialize_escrow` + `fund_escrow` tx)
5. escrow row updates: `state=funded`, `pdaAddress`, `fundTxSig`
6. landlord → `POST /api/escrows/[id]/release` → `release_to_landlord` tx (CPI's into reputation), then mock SOL→NPR swap, then `fiat_payments(direction=payout_out)`
7. anytime → `POST /api/escrows/[id]/dispute` (tenant or landlord, signed by their custodial wallet) → on-chain `raise_dispute` with sha256 hash of reason; admin resolves with `partial_release`

Critical invariant (checked by `/api/jobs/reconcile`): `Σ deposit_in settled == Σ payout_out settled + Σ refund_out settled + Σ escrow held (funded|disputed)`. Drift > 0 should page someone.

## Environment

Copy `.env.example` to `.env.local`. Required: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `EMBEDDING_SERVICE_URL`, `OPENAI_API_KEY`, `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`, the WhatsApp trio, and the Solana stack: `SOLANA_RPC_URL`, `SOLANA_CLUSTER`, `ESCROW_PROGRAM_ID`, `REPUTATION_PROGRAM_ID`, `PLATFORM_AUTHORITY_SECRET`, `PLATFORM_TREASURY_SECRET`, `WALLET_KEK_BASE64` (32 raw bytes, base64), `WALLET_KEK_ID`, `PYTH_SOL_USD_FEED`, `FOREX_API_URL`, `ESEWA_*`, `KHALTI_*`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`.

Bootstrap for a fresh dev env:
```bash
openssl rand -base64 32                   # → WALLET_KEK_BASE64
solana-keygen new --no-bip39-passphrase --outfile platform.json   # platform authority
solana airdrop 5 $(solana-keygen pubkey platform.json) --url devnet
cd solana && anchor build && anchor deploy --provider.cluster devnet
anchor keys sync   # then copy the program ids into .env.local
```

## Design constraints

- Audience is on slow connections (2G common). Prefer Server Components, lazy-load the map and images, keep client JS small. Treat any new client component as a justification call.
- Bilingual UI is in scope (`LanguageProvider`, `useLanguage`) — avoid hard-coding user-visible strings; route them through the language layer when one exists for that surface.
