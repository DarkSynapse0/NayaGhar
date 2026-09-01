# Product

## Register

product

## Users

Rural-to-urban migrants in Nepal, mostly students (16–24) and young professionals
(22–30), moving to Kathmandu, Lalitpur, Pokhara and other cities for study or work.
They are often first-time renters, new to the city, without a local network, and
anxious about being scammed or overcharged. They browse on cheap Android phones,
frequently outdoors in bright daylight, on slow or metered connections (2G/3G common).
Many read Nepali more comfortably than English. Their job to be done: **find a safe,
affordable, real room fast, and reach the landlord without friction.**

## Product Purpose

NayaGhar connects migrants with verified housing (rooms, apartments, PG, hostels) and
lets them contact landlords over WhatsApp. It exists because the informal rental market
is opaque and scam-prone: listings without photos, fake prices, no way to judge trust.
Success = a newcomer finds a place they believe is real, in a location they understand,
and starts a landlord conversation, on their first visit, on a bad connection.

## Brand Personality

Sturdy, plain-spoken, and public-service. The voice of good wayfinding: a transit map,
a well-made public sign. It tells you exactly what you need, in the order you need it,
without decoration or hype. Warm because it is on the migrant's side, not the market's.
Three words: **direct, dependable, grounded.** Emotional goal: relief and confidence,
never dazzle.

## Anti-references

- **Generic AI-startup / SaaS.** Gradient hero, identical icon-heading-text cards,
  indigo/purple accent, floating glass panels. This is what the site looks like now and
  the whole redesign exists to escape it.
- **Crypto / web3 aesthetics.** Neon-on-black, techy on-chain framing. The blockchain
  layer was removed; the look goes with it.
- **Corporate real-estate portal.** Cold listing-database, enterprise property-management
  chrome, stock-photo executives.
- **Heavy / animation-loud.** Scroll-jacking, autoplaying video, big WebGL, chained
  entrance animations. Anything that costs data or battery is a bug for this audience.

## Design Principles

1. **Information before decoration.** Every screen answers the renter's live question
   (is it real, where, how much, can I contact them) before it does anything pretty.
2. **Wayfinding, not marketing.** Structure and labels do the work. Bold functional color
   carries meaning (verified, available, distance), never mood.
3. **Trust is the product.** Verification, real photos, and price honesty are the loudest
   elements on any listing, not afterthoughts.
4. **Fast on a bad phone.** Light theme for daylight legibility, minimal JS/animation,
   lazy media, small font payload. Performance is a design decision.
5. **Bilingual by default.** Nepali and English are equals. Type and layout must hold up
   in Devanagari, never treat it as a fallback.

## Accessibility & Inclusion

Target WCAG 2.1 AA. High text/background contrast (ink on paper) as a first-class goal,
not a check. Full support for `prefers-reduced-motion` (motion is minimal regardless).
Tap targets ≥ 44px for one-handed outdoor use. Never encode meaning in color alone:
pair every status color with a label or icon (colorblind-safe). Devanagari and Latin
must both render at full legibility on low-DPI screens.
