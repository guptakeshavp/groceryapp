# How are the same products matched across apps?

Type: prototype
Status: resolved
Blocked by: 07

## Question

"Amul Butter 500g" appears under different names, pack sizes and IDs on each app. How does the tool decide two listings are the same item (or comparable, via per-unit price), and how much does the family confirm/correct matches by hand? Prototype against real sample listings from each platform and react to the results.

## Answer

Resolved 2026-10-19 by prototype + grilling with Keshav. Prototype and real listing data: [prototypes/product-matching/](../prototypes/product-matching/) (`match_prototype.py`, `listings.blinkit.json`, `listings.bigbasket.json` — Blinkit + BigBasket, Ahmedabad store, read via Keshav's Chrome on 2026-10-19).

1. **Confirm once, remember.** A household **Item** (e.g. "our Amul Cow Ghee") maps to one confirmed listing per app. For a new Item, Claude proposes the best candidate per app; Keshav ticks/corrects (~10 s per Item). Repeat staples reuse the saved mapping; new Items ask again.
2. **Quantity, not pack.** A basket line is an Item + rough quantity (e.g. 500 g). Per app, fill the quantity with the cheapest combination of real packs (e.g. 5 × 100 g); if nothing fits, show the closest pack plus ₹/kg·L. Never invent a pack.
3. **Container is irrelevant** (tin / pouch / jar / carton) — cheapest wins — unless Keshav pins a container for that Item at confirmation.
4. **Brand-strict by default.** An Item can be marked "any brand is fine" at confirmation, then it compares across brands. Produce is brand-free. No automatic swaps, no cheaper-brand hints.
5. **Out of stock** confirmed listings show as unavailable on that app — never silently re-matched.

**Evidence from the prototype:** rules alone misfired on BigBasket's "Amul Pasteurised Butter" (= ordinary salted), Blinkit Maggi packs lacking the word "Masala" (dropped), and Surf Excel Matic vs non-Matic (wrongly merged) — hence human confirmation. Naming quirks: Gujarati transliterations ("Gaay Nu Ghee", "Dungdi", "Lott"), BigBasket splits brand/name, multipacks ("2x420 g"). Availability gaps: no 500 g Amul salted butter on either app; no 280 g Maggi on BigBasket; BigBasket Amul Cow Ghee pouches out of stock. Search phrasing matters ("amul ghee" → nothing on BigBasket; "amul cow ghee" → results). Blinkit's results page went blank once after ~6 quick searches, then worked on retry. Zepto, Instamart, Minutes not sampled; decisions are platform-agnostic.
