-- Row Level Security policies for NayaGhar.
--
-- Architecture:
--   Per-request, the API layer sets two Postgres session variables inside a
--   transaction wrapper (see src/lib/db/rls.ts):
--     SET LOCAL app.user_id    = '<uuid>'  -- the authenticated user
--     SET LOCAL app.is_service = 'true'    -- when running as cron/admin/signup
--
--   Policies read them via app.current_user_id() / app.is_service().
--
-- Current enforcement:
--   RLS is ENABLED but NOT FORCED. The Neon DB owner role (which the app uses)
--   bypasses policies on tables it owns. To activate enforcement:
--     1. wrap every API route's queries in withRls() / withServiceRole()
--     2. run `ALTER TABLE <name> FORCE ROW LEVEL SECURITY;` on each table
--
--   Doing both at once would break the app — the migration path is "wire
--   helpers route-by-route, then flip FORCE per table".

CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_user_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION app.is_service()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT COALESCE(NULLIF(current_setting('app.is_service', true), '')::boolean, false)
$$;

-- SECURITY DEFINER so the policy lookup itself is exempt from RLS, otherwise
-- you get infinite recursion (users policy → is_admin → SELECT users → users policy).
CREATE OR REPLACE FUNCTION app.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = app.current_user_id() AND role = 'admin'
  )
$$;

-- ─────────────────────────────────────────────────────────────────
-- USERS
-- Profile data is public-readable (name, avatar, role, trust score),
-- writes restricted to self or admin, registration via service role.
-- Caveat: RLS is row-level, not column-level. Truly hiding phone/email/
-- passwordHash from public reads requires a SECURITY DEFINER view.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_public ON public.users;
CREATE POLICY users_select_public ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS users_insert_service ON public.users;
CREATE POLICY users_insert_service ON public.users
  FOR INSERT WITH CHECK (app.is_service());

DROP POLICY IF EXISTS users_update_self_or_admin ON public.users;
CREATE POLICY users_update_self_or_admin ON public.users
  FOR UPDATE
  USING (id = app.current_user_id() OR app.is_admin() OR app.is_service())
  WITH CHECK (id = app.current_user_id() OR app.is_admin() OR app.is_service());

DROP POLICY IF EXISTS users_delete_admin ON public.users;
CREATE POLICY users_delete_admin ON public.users
  FOR DELETE USING (app.is_admin() OR app.is_service());

-- ─────────────────────────────────────────────────────────────────
-- USER_WALLETS
-- Highly sensitive (encrypted secret keys live here). Self-read only,
-- writes via service role (signup + key rotation worker).
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wallets_select_self ON public.user_wallets;
CREATE POLICY wallets_select_self ON public.user_wallets
  FOR SELECT USING (user_id = app.current_user_id() OR app.is_service());

DROP POLICY IF EXISTS wallets_write_service ON public.user_wallets;
CREATE POLICY wallets_write_service ON public.user_wallets
  FOR ALL
  USING (app.is_service())
  WITH CHECK (app.is_service());

-- ─────────────────────────────────────────────────────────────────
-- LISTINGS
-- Active listings public; landlord controls own; admin override.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listings_select_visible ON public.listings;
CREATE POLICY listings_select_visible ON public.listings
  FOR SELECT USING (
    is_active = true
    OR landlord_id = app.current_user_id()
    OR app.is_admin()
    OR app.is_service()
  );

DROP POLICY IF EXISTS listings_insert_landlord ON public.listings;
CREATE POLICY listings_insert_landlord ON public.listings
  FOR INSERT WITH CHECK (
    landlord_id = app.current_user_id() OR app.is_service()
  );

DROP POLICY IF EXISTS listings_update_owner ON public.listings;
CREATE POLICY listings_update_owner ON public.listings
  FOR UPDATE
  USING (landlord_id = app.current_user_id() OR app.is_admin() OR app.is_service())
  WITH CHECK (landlord_id = app.current_user_id() OR app.is_admin() OR app.is_service());

DROP POLICY IF EXISTS listings_delete_owner ON public.listings;
CREATE POLICY listings_delete_owner ON public.listings
  FOR DELETE USING (
    landlord_id = app.current_user_id() OR app.is_admin() OR app.is_service()
  );

-- ─────────────────────────────────────────────────────────────────
-- REVIEWS
-- Public read, reviewer-only write, can't review your own listing.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_select_public ON public.reviews;
CREATE POLICY reviews_select_public ON public.reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS reviews_insert_self_not_own_listing ON public.reviews;
DROP POLICY IF EXISTS reviews_insert_verified_stay ON public.reviews;
CREATE POLICY reviews_insert_verified_stay ON public.reviews
  FOR INSERT WITH CHECK (
    (
      reviewer_id = app.current_user_id()
      -- can't review your own listing
      AND NOT EXISTS (
        SELECT 1 FROM public.listings l
        WHERE l.id = listing_id AND l.landlord_id = app.current_user_id()
      )
      -- must have a completed (or refunded/resolved) escrow on this listing
      AND EXISTS (
        SELECT 1 FROM public.escrows e
        WHERE e.listing_id = listing_id
          AND e.tenant_id = app.current_user_id()
          AND e.state IN ('released', 'refunded', 'resolved')
      )
    )
    OR app.is_service()
  );

DROP POLICY IF EXISTS reviews_update_self ON public.reviews;
CREATE POLICY reviews_update_self ON public.reviews
  FOR UPDATE
  USING (reviewer_id = app.current_user_id() OR app.is_admin())
  WITH CHECK (reviewer_id = app.current_user_id() OR app.is_admin());

DROP POLICY IF EXISTS reviews_delete_self_or_admin ON public.reviews;
CREATE POLICY reviews_delete_self_or_admin ON public.reviews
  FOR DELETE USING (reviewer_id = app.current_user_id() OR app.is_admin());

-- ─────────────────────────────────────────────────────────────────
-- POIS — fully public read, admin/service write only.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pois_select_public ON public.pois;
CREATE POLICY pois_select_public ON public.pois FOR SELECT USING (true);

DROP POLICY IF EXISTS pois_write_admin ON public.pois;
CREATE POLICY pois_write_admin ON public.pois FOR ALL
  USING (app.is_admin() OR app.is_service())
  WITH CHECK (app.is_admin() OR app.is_service());

-- ─────────────────────────────────────────────────────────────────
-- CONVERSATIONS — only the two parties (or admin/service) can see.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_party_select ON public.conversations;
CREATE POLICY conversations_party_select ON public.conversations FOR SELECT
  USING (
    tenant_id = app.current_user_id()
    OR landlord_id = app.current_user_id()
    OR app.is_admin()
    OR app.is_service()
  );

DROP POLICY IF EXISTS conversations_tenant_insert ON public.conversations;
CREATE POLICY conversations_tenant_insert ON public.conversations FOR INSERT
  WITH CHECK (tenant_id = app.current_user_id() OR app.is_service());

DROP POLICY IF EXISTS conversations_party_update ON public.conversations;
CREATE POLICY conversations_party_update ON public.conversations FOR UPDATE
  USING (
    tenant_id = app.current_user_id()
    OR landlord_id = app.current_user_id()
    OR app.is_service()
  );

-- ─────────────────────────────────────────────────────────────────
-- PRICE_QUOTES — own quotes only; service can update consumed_at.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.price_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quotes_select_self ON public.price_quotes;
CREATE POLICY quotes_select_self ON public.price_quotes FOR SELECT
  USING (user_id = app.current_user_id() OR app.is_service());

DROP POLICY IF EXISTS quotes_insert_self ON public.price_quotes;
CREATE POLICY quotes_insert_self ON public.price_quotes FOR INSERT
  WITH CHECK (user_id = app.current_user_id() OR app.is_service());

DROP POLICY IF EXISTS quotes_update_service ON public.price_quotes;
CREATE POLICY quotes_update_service ON public.price_quotes FOR UPDATE
  USING (app.is_service())
  WITH CHECK (app.is_service());

-- ─────────────────────────────────────────────────────────────────
-- ESCROWS — tenant + landlord can read; only service writes.
-- (State transitions are platform-driven, never user-driven.)
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escrows_party_select ON public.escrows;
CREATE POLICY escrows_party_select ON public.escrows FOR SELECT
  USING (
    tenant_id = app.current_user_id()
    OR landlord_id = app.current_user_id()
    OR app.is_admin()
    OR app.is_service()
  );

DROP POLICY IF EXISTS escrows_service_write ON public.escrows;
CREATE POLICY escrows_service_write ON public.escrows FOR ALL
  USING (app.is_service() OR app.is_admin())
  WITH CHECK (app.is_service() OR app.is_admin());

-- ─────────────────────────────────────────────────────────────────
-- FIAT_PAYMENTS — owner can read own; service writes.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.fiat_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fiat_payments_owner_select ON public.fiat_payments;
CREATE POLICY fiat_payments_owner_select ON public.fiat_payments FOR SELECT
  USING (
    user_id = app.current_user_id()
    OR app.is_admin()
    OR app.is_service()
  );

DROP POLICY IF EXISTS fiat_payments_service_write ON public.fiat_payments;
CREATE POLICY fiat_payments_service_write ON public.fiat_payments FOR ALL
  USING (app.is_service() OR app.is_admin())
  WITH CHECK (app.is_service() OR app.is_admin());

-- ─────────────────────────────────────────────────────────────────
-- JOBS — internal queue, service/admin only.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jobs_service_only ON public.jobs;
CREATE POLICY jobs_service_only ON public.jobs FOR ALL
  USING (app.is_service() OR app.is_admin())
  WITH CHECK (app.is_service() OR app.is_admin());

-- ─────────────────────────────────────────────────────────────────
-- ATTESTATIONS — publicly verifiable; service-only writes.
-- Reads are public so anyone (other platforms, embassies, employers) can
-- verify attestations belonging to a wallet without trusting NayaGhar.
-- Writes go through service role because creation involves orchestrating
-- two-party signing on behalf of users.
-- ─────────────────────────────────────────────────────────────────
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attestations_select_public ON public.attestations;
CREATE POLICY attestations_select_public ON public.attestations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS attestations_write_service ON public.attestations;
CREATE POLICY attestations_write_service ON public.attestations FOR ALL
  USING (app.is_service() OR app.is_admin())
  WITH CHECK (app.is_service() OR app.is_admin());
