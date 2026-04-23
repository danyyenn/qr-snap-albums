

# Plan: Pivot Shotlist to Hybrid SaaS Model (Website-First, Etsy as Lead Magnet)

Replace the Etsy-centric strategy with a proper SaaS business model. Etsy becomes a customer acquisition channel, not the core revenue stream.

## What I'll Change

### File 1 — Replace `shotlist-etsy-products.md` with `shotlist-monetisation-strategy.md`

New file covering the full hybrid model:

**Pricing Tiers**
- **Free** — 1 event, max 20 photos, watermarked exports, 5 preset challenges only
- **Single Event** — £12 one-off — unlimited photos, no watermark, full challenge library, custom challenges, host curation, reel export
- **Pro Subscription** — £8/month — unlimited events, priority support, white-label option, branded QR codes (for wedding planners, event companies, venues)

**Etsy's New Role (Lead Magnet, Not Core Revenue)**
- 3 cheap printables (£3–£5): Wedding Bingo PDF, Hen Do Bingo PDF, Birthday Bingo PDF
- Each printable includes a QR code → lands on shotlist.com with a "1 free event" credit pre-applied
- Goal: convert printable buyers into website users, then upsell to paid tier or subscription

**Direct-to-Website Sign-Up Flow**
- Landing page → "Try free" CTA → create event in 60 seconds → hit free tier limit → upgrade prompt
- No Etsy required to use the product

**Upsell Mechanics (where to ask for money)**
- Free tier hits 20-photo cap → "Unlock unlimited for £12"
- Trying to export reel/carousel → "Remove watermark for £12"
- Creating 2nd event → "Go Pro for £8/month, unlimited events"
- Custom challenges locked behind paid tier

**Suggested Launch Sequence**
1. Week 1–2: Build website with free + single-event tiers, integrate Stripe
2. Week 3: Launch Etsy printables as funnel (low priority, low effort)
3. Week 4+: Add subscription tier once you have 50+ paid users for validation

### File 2 — Update `shotlist-master-prompt.md`

Add to the build instructions:
- Database needs `subscription_tier` field on profiles ('free' | 'paid_event' | 'pro_subscription')
- Database needs `events_used_this_month` counter for subscription limits
- Stripe integration baked in from day one (single-payment for £12 unlocks, subscription for £8/month)
- Free tier limits enforced in code (photo cap, watermark, challenge restrictions)
- Upgrade prompts at the right friction points (not the landing page)
- Etsy claim code system kept but de-emphasised (it's just one of three ways to unlock paid features)

## What I Will NOT Touch

- The 4 other files (challenges, feature spec, database schema, brand pack) — none of these need changes for the monetisation pivot, except the database schema which I'll add a small note about
- Actually — small addition to `shotlist-database-schema.sql`: add `subscription_tier`, `subscription_status`, `subscription_end`, `stripe_customer_id` fields to profiles table. Quick edit.

## Output

Three files updated/created in `/mnt/documents/`:
1. `shotlist-monetisation-strategy.md` (NEW — replaces etsy-products.md)
2. `shotlist-master-prompt.md` (UPDATED — Stripe + tiers baked in)
3. `shotlist-database-schema.sql` (UPDATED — subscription fields added)

Old `shotlist-etsy-products.md` deleted to avoid confusion.

## Credit Estimate

~3 credits.

