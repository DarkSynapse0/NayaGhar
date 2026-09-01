# Design

Visual system for NayaGhar. Direction: **Field Guide / Wayfinding** — the clarity of
good public signage. Ink on warm paper, bold functional color, rigorous structure,
dense and fast. Light theme (chosen for daylight outdoor legibility and battery/data on
cheap phones, see PRODUCT.md scene). Not marketing gloss; a dependable public map.

## Theme

Light. Warm paper ground, warm ink foreground. Never `#fff` / `#000` — every neutral is
tinted toward the paper hue (~75°). Dark mode is intentionally out of scope: the audience
uses the app outdoors in sunlight.

## Color (OKLCH)

Strategy: **Committed.** Brick-red is the single voice color and carries primary action
and brand emphasis. Status colors are functional (they mean something), never decorative.

Neutrals — the paper system:
- `--paper`      `oklch(0.976 0.008 78)`  page background (warm off-white)
- `--paper-2`    `oklch(0.955 0.011 78)`  sunk areas, table stripes
- `--panel`      `oklch(0.992 0.004 78)`  raised blocks / cards (near-white paper)
- `--ink`        `oklch(0.23 0.017 62)`   primary text + strong borders (warm near-black)
- `--ink-2`      `oklch(0.42 0.014 62)`   secondary text
- `--ink-3`      `oklch(0.56 0.011 62)`   muted text, captions
- `--line`       `oklch(0.86 0.012 78)`   hairline dividers/borders
- `--line-strong``oklch(0.23 0.017 62)`   full ink borders (signage frames)

Voice — brick:
- `--brick`      `oklch(0.55 0.15 40)`    primary action, logo accent, key emphasis
- `--brick-ink`  `oklch(0.44 0.15 40)`    hover/active
- `--brick-wash` `oklch(0.55 0.15 40 / 0.10)` tint fills behind brick emphasis

Functional status (always paired with an icon or label, never color-alone):
- `--verified`   `oklch(0.56 0.13 150)`   verified / available (green)
- `--verified-wash` `oklch(0.56 0.13 150 / 0.12)`
- `--pending`    `oklch(0.72 0.15 72)`    pending / caution (amber)
- `--pending-wash` `oklch(0.72 0.15 72 / 0.14)`
- `--geo`        `oklch(0.52 0.11 242)`   location / distance / map (blue)
- `--geo-wash`   `oklch(0.52 0.11 242 / 0.12)`
- `--whatsapp`   `oklch(0.72 0.17 152)`   WhatsApp contact CTA (brand green)
- `--danger`     `oklch(0.53 0.20 27)`    errors/destructive (true red, distinct from brick)

## Typography

Two families, both free (Google Fonts), both performant, both cover **Latin + Devanagari**
where it matters. This replaces Inter/JetBrains (reflex defaults with no Devanagari).

- `--font-display` **Archivo** (600/700/800/900). Signage-grade grotesque. Headlines,
  hero, prices, uppercase tracked labels. Tabular figures for all numbers/prices.
- `--font-body` **Hind** (400/500/600). Engineered for Devanagari + Latin UI legibility on
  low-DPI screens. All body copy, UI, and every Nepali string. Nepali headings use Hind
  600 (Archivo is Latin-only; Hind carries Devanagari display weight).

Scale: fluid `clamp()`, ratio ≥ 1.25. Body 15–16px, line-height 1.5, max 70ch.
Headlines tight tracking (`-0.02em`), heavy weight. Labels: uppercase, `0.08em` tracking,
Archivo 700, small (11–12px). Do not use labels above *every* heading — they are the
named wayfinding grammar for sections and status, used deliberately.

## Components

- **Panel** (replaces "Card"): `--panel` fill, full `1px --line` border, radius
  `--radius` (6px), no drop shadow by default. Nested panels are banned.
- **Block shadow** (signature): `3px 3px 0 --ink` hard offset. Used sparingly on the
  primary CTA and the "verified" seal to give the poster/stamp character. Not on grids.
- **Rules**: sections separated by `2px --ink` horizontal rules, not whitespace alone.
  This is the map-grid voice. Full borders only; **side-stripe accent borders are banned.**
- **Status chip**: icon + label, `--radius-sm` (4px). Verified = green wash + green ink +
  ✓. Available = green. Property type = ink outline, no fill. Distance = geo-blue wash +
  ● marker.
- **Button / primary**: `--brick` fill, `--panel` text, squared (radius 6px), Archivo 700,
  optional leading `▸`. Hover → `--brick-ink`. Key CTAs may take the block shadow.
- **Button / secondary**: paper fill, `1px --ink` border, ink text.
- **Button / whatsapp**: `--whatsapp` fill, white text, WhatsApp glyph. The one-tap
  contact affordance; always visible on a listing.
- **Price**: Archivo 700 tabular, ink; `Rs 8,000` with muted `/mo`. Never divide paisa
  inline — use `formatPrice()`.
- **Input**: paper fill, `1px --ink` border (not a faint gray), ink text, brick focus ring.

## Layout

- Left-aligned, structural, visible grid. Wayfinding is rigorous grid, not centered stack.
- Listing grids: `repeat(auto-fit, minmax(280px, 1fr))`.
- Search is **map-forward**: split list + map on desktop, toggle on mobile.
- Fluid spacing with `clamp()`; vary rhythm (tight groups, generous section gaps).
- Content width cap ~1200px; reading text capped at 70ch.
- Optional subtle ink dot-grid as paper texture in hero/empty areas (very low opacity).

## Motion

Minimal by mandate (2G + battery). One light `fade-in-up` on first paint (≤ 400ms,
ease-out-quart), subtle stagger for lists. No float, no shimmer-heavy, no scroll-jacking,
no autoplay. Fully honor `prefers-reduced-motion: reduce` (disable all). Never animate
layout properties; transform/opacity only.

## Bans (project-specific, on top of impeccable shared bans)

- No gradient hero, no `background-clip:text` gradient text (remove `.gradient-text`).
- No glassmorphism / decorative blur.
- No indigo/purple accent (the old `--accent: #6366F1`).
- No identical icon-heading-text card grids as the section grammar.
- No color-only status. No side-stripe borders. No em dashes in UI copy.
