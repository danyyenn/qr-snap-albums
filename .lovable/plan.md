

# Plan: Swap Shotlist Brand Pack to Use FlashNShare Colours

Keep the Shotlist concept and structure, but swap the coral/cream palette for your existing FlashNShare purple/coral/teal colours so the new app feels familiar.

## What I'll Change

**File 1 — `shotlist-brand-pack.md`** (rewrite the colour section only)

Replace the coral/cream palette with FlashNShare's tokens (pulled from `src/index.css`):

| Token | New HSL | Source |
|---|---|---|
| `--primary` | `280 70% 55%` | FlashNShare purple |
| `--secondary` | `15 80% 65%` | FlashNShare coral |
| `--accent` | `180 70% 55%` | FlashNShare teal |
| `--gradient-primary` | `linear-gradient(135deg, hsl(280 70% 55%), hsl(15 80% 65%))` | Purple → coral |
| `--gradient-accent` | `linear-gradient(135deg, hsl(280 70% 55%), hsl(180 70% 55%))` | Purple → teal |
| `--shadow-elegant` | `0 10px 40px -10px hsl(280 70% 55% / 0.4)` | Purple glow |
| Background | `0 0% 100%` light / `280 20% 8%` dark | FlashNShare neutrals |

**Keep the same:**
- Fonts (Fraunces display + Inter body) — these are new for Shotlist's premium feel
- Imagery style guidance
- Logo direction (just swap the suggested colour to purple `#B23AC9`)
- Don't-do list (but remove the "no purple gradients" rule since we're embracing it)

**File 2 — `shotlist-master-prompt.md`** (update colour references only)

Find every place the master prompt mentions coral/cream tokens and swap to the FlashNShare purple/coral/teal values, so the new Lovable agent gets the right palette in the very first build.

## What I Will NOT Touch

- The 4 other files (challenges, feature spec, database schema, Etsy products) — none reference colours
- Layout, fonts, name, taglines, or any other Shotlist branding
- Anything in this current FlashNShare codebase

## Output

Both files re-written and saved to `/mnt/documents/` (overwriting the existing versions). You re-download those two files and use them with the other 4 unchanged ones.

## Credit Estimate

~2 credits.

