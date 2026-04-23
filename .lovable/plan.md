# Plan: Send All 6 Final Shotlist Files

You want all 6 files in one place so you can download them without scrolling. I'll list `/mnt/documents/`, confirm the 6 final files are there, then output each one's full contents in the chat with a download artifact tag underneath.

## What I'll Do

1. Run `ls -la /mnt/documents/` to confirm all 6 files exist and check sizes
2. `cat` each file and post its full contents in the chat in this order:
   1. `shotlist-master-prompt.md` (updated — Stripe + tiers)
   2. `shotlist-feature-spec.md` (original)
   3. `shotlist-challenge-templates.md` (original)
   4. `shotlist-database-schema.sql` (updated — subscription fields)
   5. `shotlist-monetisation-strategy.md` (new — replaces etsy-products)
   6. `shotlist-brand-pack.md` (original — FlashNShare colours)
3. Under each file, drop a `<lov-artifact>` tag so you can one-click download
4. If `shotlist-etsy-products.md` still exists, delete it so you don't grab it by mistake

## What I Will NOT Do

- Re-generate or change any file contents
- Touch the FlashNShare codebase
- Add anything new

## Credit Estimate

~1 credit (just reading and printing files).

Approve and I'll dump all 6 in the next message.