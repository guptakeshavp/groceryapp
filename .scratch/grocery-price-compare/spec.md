# Spec: Household grocery price comparison (Ahmedabad)

Status: ready-for-agent
Source: assembled 2026-10-19 from the wayfinder map [map.md](map.md) — every decision below links back to the closed ticket that holds its detail and evidence.

## Problem Statement

Keshav's household in Ahmedabad (pin code 380015) buys groceries from several quick-commerce apps — Zepto, Swiggy Instamart, Blinkit, BigBasket and Flipkart Minutes. To find out where a week's basket is cheapest, someone has to search every item in every app, notice pack-size and brand differences, and guess at delivery, handling and small-cart fees that only appear at checkout and change roughly monthly. Big-ticket staples like ghee make the difference worth knowing, but checking by hand across five apps is tedious enough that it mostly doesn't happen. Existing comparison apps (Rozmo, Smartprix and similar) were ruled out.

## Solution

A local web app on Keshav's Mac, used only by Keshav in his browser. The family sends him a list on WhatsApp; he pastes it in. The tool turns it into the household's known **Items** with rough quantities, reads each app's real prices and real all-in cart total for the home address through Keshav's own accounts, and shows one verdict: which app is cheapest all-in, by how much, and what to watch out for. Keshav then orders on his phone — for Instamart and BigBasket the basket is already waiting in his cart; for the others he follows an exact pick list.

Alongside, the tool quietly tracks a short list of staples once a day while the Mac is on, and flags when one of them is noticeably cheaper than usual.

**Domain terms** (use these throughout):
- **Item** — a household product, e.g. "our Amul Cow Ghee", mapped to one confirmed **listing** per app.
- **Listing** — one product as a given app sells it at the home store (name, pack, price, MRP, stock).
- **Basket** — Items plus rough quantities (e.g. Amul salted butter, 500 g).
- **Staple** — an Item Keshav has marked for daily price tracking.
- **All-in total** — items + every fee + discounts the cart applies automatically.

## User Stories

### Entering a basket
1. As Keshav, I want to paste a family WhatsApp message as-is (Hinglish, free-form, e.g. "pyaaz 1 kg", "maggi 1 packet (280g wala)"), so that I don't retype the list.
2. As Keshav, I want each pasted line turned into a known Item with a rough quantity, so that I can compare without searching anything myself.
3. As Keshav, I want lines the tool doesn't recognise flagged as new Items, so that I know what needs a one-time confirmation.
4. As Keshav, I want to edit an Item's quantity before comparing, so that I can fix a misread line.
5. As Keshav, I want to load a saved list (e.g. "Weekly staples"), so that a regular basket takes one click.
6. As Keshav, I want to add a single Item by typing, so that I can check one big-ticket product like ghee on its own.

### Confirming Items (one-time matching)
7. As Keshav, I want Claude's best-guess listing pre-ticked for each app when a new Item appears, so that confirming takes about ten seconds.
8. As Keshav, I want to see the alternative candidates on each app, so that I can correct a wrong guess (e.g. Amul *Pure* Ghee vs Amul *Cow* Ghee).
9. As Keshav, I want my confirmed matches remembered, so that repeat staples never ask again.
10. As Keshav, I want to mark an Item "any brand is fine", so that commodity items compare across brands.
11. As Keshav, I want produce like onions treated as brand-free, so that "fresho! Onion" and "Onion (Dungdi)" count as the same thing.
12. As Keshav, I want to pin a container for an Item (e.g. ghee only in a tin), so that the comparison respects it when it matters to me.
13. As Keshav, I want tin, pouch, jar and carton treated as the same product by default, so that the cheapest container wins.
14. As Keshav, I want to mark an Item as a staple while confirming it, so that tracking costs me no extra step.
15. As Keshav, I want to revisit and change an Item's confirmed listings later, so that I can fix a mistake or a discontinued product.

### Getting the comparison
16. As Keshav, I want one banner naming the cheapest app's all-in total and the gap to the runner-up, so that I get the answer at a glance.
17. As Keshav, I want every app ranked by all-in total with items vs fees split out, so that I can see why the winner won.
18. As Keshav, I want to expand each app's bill line by line, so that I can check the details.
19. As Keshav, I want my quantity filled with the cheapest combination of real packs on each app (e.g. 5 × 100 g butter when no 500 g pack exists), so that the totals reflect what I'd actually buy.
20. As Keshav, I want to see the closest pack and its per-kg price when no combination fits my quantity, so that I'm never shown an invented pack.
21. As Keshav, I want an out-of-stock confirmed listing shown as unavailable on that app, never silently swapped for something else, so that I can trust the match.
22. As Keshav, I want a "Worth knowing" list of caveats (out of stock → different container, closest-pack warnings, notes like "Pasteurised = salted"), so that surprises are visible without cluttering the verdict.
23. As Keshav, I want a per-line grid behind a toggle (Items × apps, cheapest app per line highlighted), so that I can dig in when I want to.
24. As Keshav, I want splitting the order across apps mentioned only as a one-line note with the saving and the number of deliveries, so that I'm not pushed into two orders to save ₹16.
25. As Keshav, I want results to appear app by app as they arrive, so that the ~1–1.5 minute run feels like progress, not a spinner.
26. As Keshav, I want the total to include all fees and whatever the cart applies automatically (Swiggy One and Prime waivers, automatic discounts), so that it matches what the app will charge.
27. As Keshav, I want coupons the app reveals listed next to its total but not counted, so that I can judge them myself.
28. As Keshav, I want an app whose real total couldn't be read to show an estimate, labelled "estimated" with the date of the fee data, so that I never mistake it for a real total.
29. As Keshav, I want an app with no previous real bill to show items only, marked "fees unknown", so that the tool never guesses blindly.
30. As Keshav, I want an app that failed to show "couldn't check" with the reason and a Retry button, so that a partial answer is still useful.

### My real carts
31. As Keshav, I want the tool to check my Instamart and BigBasket carts before pricing and, if they're not empty, ask me to replace them or estimate that app this time, so that it never wipes a cart I'm building.
32. As Keshav, I want the compared basket left in my Instamart and BigBasket carts afterwards, so that I can open the app on my phone and check out.

### Ordering (handoff)
33. As Keshav, I want the tool never to place an order, so that a bug can't cost me a wrong ₹2,000 order.
34. As Keshav, I want an exact pick list for Blinkit, Zepto and Flipkart Minutes (listing, container, pack count — e.g. "Amul Salted Butter 100 g × 5"), so that I add the right packs in the phone app.
35. As Keshav, I want to copy the pick list, so that I can send it on WhatsApp to whoever is ordering.

### Deals
36. As Keshav, I want a small "Deals on your Items" strip at the top of the start screen, so that I spot stock-up moments (e.g. ghee at a six-week low) even when it's not in this week's list.
37. As Keshav, I want a deal badge on basket lines that are currently on a deal, so that I see why a line is cheap.
38. As Keshav, I want "deal" to mean below the Item's own usual price, not the app's "% OFF" against MRP, so that inflated MRPs don't fool me.
39. As Keshav, I want no deals flagged until there's enough history, so that early flags aren't noise.

### Staple tracking
40. As Keshav, I want up to about 15 staples checked once a day in the background while the tool runs, so that the price history builds without effort.
41. As Keshav, I want basket runs to record prices too, so that history fills in for free.
42. As Keshav, I want about six months of history kept on my Mac, so that deals and seasonal patterns are judged on real data.
43. As Keshav, I want days when the Mac was off to just be gaps, so that nothing breaks.

### Logins and gentleness
44. As Keshav, I want a "Log in again" button that opens the app's own login page where I type the OTP myself, so that the tool never handles my OTPs or passwords.
45. As Keshav, I want a heads-up about three days before my Instamart or Zepto login expires, so that a basket run doesn't hit a dead login when I need it.
46. As Keshav, I want the tool to make one request at a time per app with pauses between them, so that my real accounts look like me browsing.
47. As Keshav, I want an app that blocks or blanks to be retried once, then left alone for background checks until tomorrow, so that the tool doesn't provoke it.
48. As Keshav, I want to be told when an app has blocked on three different days in a week, with the choice of a throwaway account for that app or dropping it, so that I decide how to handle a persistent block.
49. As Keshav, I want hard daily caps per app, so that a bug can't hammer a site with my account.

## Implementation Decisions

### Runtime and platform
- Local web app served on `localhost` on Keshav's Mac; single user; no hosting, no server, no always-on machine. Opening it to family phones on home Wi-Fi is a possible later step, not v1. — [household setup](issues/06-household-setup.md)
- All data (Item catalogue, price history, fee memory, cooldown state) is stored locally on the Mac.
- Claude (via the Claude API) is used for two judgement tasks only: parsing pasted free-form lists into Items + quantities, and proposing the best-candidate listing per app for a new Item. Model choice is made at build time.
- Code to borrow: `quick-commerce-mcp` (MIT) for BigBasket, Blinkit and Zepto adapters. `compari5` (no licence) and `sasta-signals` (licence unchecked — check before copying anything) are approach references only. — [data access](issues/07-data-access-approach.md)

### Platform adapters (one module per app, one shared interface)
Every app is reached through an adapter with the same interface, so everything above it is platform-agnostic:
- **search(query) → listings** for the home store: name, brand (if separate), pack size, selling price, MRP, in-stock, app listing id.
- **price basket(lines) → bill**: per-line prices, fee lines, automatically applied discounts, amount to pay, coupons revealed, and whether the bill is real or estimated.
- **cart state** (Instamart and BigBasket only): is the real cart empty? Plus replace-cart.
- **auth status**: logged in, expiring at (if known), expired.

| App | Access | Search | All-in total | Cart side effects |
|---|---|---|---|---|
| Zepto | Official MCP `mcp.zepto.co.in` (OAuth phone OTP, localhost callback, dynamic client registration) | MCP `search_products` at the saved home address | MCP order preview with `confirmOrder:false` (`deliveryFee`, `toPayAmount`) on the MCP session cart | MCP cart is separate from the app cart — no effect, no handoff |
| Instamart | Official MCP `mcp.swiggy.com/im`, Personal Use path (access token 5 days, rotating refresh token 30 days sliding) | MCP `search_products` (MRP, offer price, stock) | `update_cart` → `get_cart` (`billBreakdown`) on Keshav's **real** cart | Replaces the real cart — guarded by the empty-cart check |
| Blinkit | One dedicated automated Chrome profile on the Mac, home address set | The site's own search data | Stateless cart-pricing call made from inside the page (returns delivery, additional charges, free-delivery minimum) | None |
| BigBasket | Same Chrome profile, logged in, home address 380015 | The site's own search data | Checkout preview of Keshav's **real** cart | Uses the real cart — guarded by the empty-cart check |
| Flipkart Minutes | Same Chrome profile, home address set in Minutes (hyperlocal) mode | The site's own search data | Guest cart if it shows fees; otherwise estimate | Rate-limited cart (HTTP 429) — go gently |

- Never call any order-placing tool (e.g. Zepto `create_order` with confirmation); there is no sandbox. — [ordering](issues/13-ordering.md)
- Never scrape zepto.com or swiggy.com directly (AWS bot challenges; terms forbid it). Never use direct internal-endpoint calls with TLS-fingerprint mimicry for the Chrome apps. — [data access](issues/07-data-access-approach.md)
- Accepted risk: reading Blinkit, BigBasket and Flipkart Minutes through the automated Chrome breaches those sites' terms; Keshav accepts this for gentle personal use on his own accounts. — [household setup](issues/06-household-setup.md)
- Location: apps price per dark store with a ~2–3 km radius, so use the exact saved home address (not just the pin code) everywhere. Verified: Blinkit and BigBasket website prices equal their app prices at 380015. — [Blinkit check](issues/10-blinkit-web-vs-app.md), [BigBasket](issues/04-access-bigbasket-amazonfresh.md)

### Request governor (wraps every adapter)
- One request at a time per app; different apps run in parallel.
- Pause between requests to the same app: ~4 s for Chrome apps, ~2 s for MCP apps.
- Caps: ≤ 40 lookups per app per run, ≤ 150 per app per day; beyond that, "couldn't check: daily limit".
- On a block, blank page, or 429: one gentle retry after a short pause, then "couldn't check" with the reason. Honour `Retry-After` (at least that long). Background checks for that app pause until the next day; basket runs still try.
- Count blocked days per app; at 3 different days within a week, raise the start-screen prompt (throwaway account or drop the app).
- Evidence for the numbers: Blinkit blanked after ~6 searches a few seconds apart; Flipkart cart returns 429 (~45 s); Swiggy's gateway returns 429 with `Retry-After` and asks for one session per user and low concurrency. — [logins & pace](issues/16-logins-and-pace.md)

### Auth manager
- Expired login → that app shows "couldn't check: login expired" + **Log in again**, which opens the app's own login page (Swiggy or Zepto OAuth page, or the site inside the automated Chrome window). Keshav types the OTP himself; the tool never sees or stores OTPs or passwords, only the resulting tokens/session.
- For Instamart and Zepto (known token expiry), show a start-screen notice ~3 days before expiry. Chrome sites can't be predicted and rely on the reactive path. — [logins & pace](issues/16-logins-and-pace.md)

### Item catalogue
- An Item has: display name, confirmed listing per app (or "not sold here"), "any brand" flag, pinned container (optional), staple flag. Produce Items are brand-free.
- New Item flow: search each app → Claude ranks candidates → best one pre-ticked → Keshav confirms or corrects once → saved.
- Container (tin, pouch, jar, carton) is ignored unless pinned. Brand is strict unless "any brand" is set. No automatic brand swaps; no cheaper-brand hints.
- Pure rule-based matching was tried in a prototype and misfired: BigBasket's "Amul Pasteurised Butter" is ordinary salted butter; Blinkit's Maggi 420 g/840 g packs lack the word "Masala"; Surf Excel *Matic* vs non-Matic got merged. That's why a human confirms each Item once. Real naming quirks to expect: Gujarati transliterations ("Gaay Nu Ghee", "Dungdi", "Lott"), brand and name as separate fields on BigBasket, multipacks ("2x420 g"), and search wording that matters ("amul ghee" returned nothing on BigBasket; "amul cow ghee" worked). — [matching](issues/08-product-matching.md), prototype data in `prototypes/product-matching/`

### Pack filler
- Input: an Item's confirmed listing family on one app (the same product in all available pack sizes and containers, subject to container pinning) plus the wanted quantity.
- Output: the cheapest combination of real, in-stock packs that covers the quantity; if none fits sensibly, the closest single pack with its ₹/kg·L. Never invents a pack. ml and g are compared directly but flagged.

### Basket pricer and fee memory
- Real all-in total wherever possible (table above). Before touching Instamart or BigBasket, check that the real cart is empty; if it isn't, ask Keshav: replace it, or estimate that app this run.
- The total counts item prices, all fees, and whatever the cart applies automatically (membership waivers, automatic discounts, free items). Coupons and bank/card offers are excluded but listed as a note when the app reveals them (e.g. Instamart `list_coupons`, which is still rolling out).
- Fee memory: after every real bill, store that app's fee lines with the date. An estimate = item prices + the last real fee lines, labelled "estimated (fees as of <date>)". No prior bill → items only, "fees unknown".
- Uses Keshav's own accounts (Swiggy One, Prime). Family members order from their own accounts. — [basket total](issues/11-basket-total.md)

### Comparison and verdict
- Rank apps by all-in total; the winner is the cheapest real-or-estimated total among apps that could be checked, and the banner notes when the runner-up is estimated.
- "Worth knowing" collects per-line caveats from the pack filler, matching and stock.
- Split note: per-line cheapest app across apps, plus each app's fees, compared to the winner alone, shown as one informational line. On real Blinkit + BigBasket prices for the sample basket a split saved ~₹16 for two deliveries.

### Handoff (no ordering)
- Instamart and BigBasket: "Your basket is in your Instamart cart" — the cart syncs to the phone app.
- Blinkit, Zepto, Flipkart Minutes: pick list with exact listing, container and pack count per line; stays on screen; "Copy list" for WhatsApp. No automatic cart filling in v1. — [ordering](issues/13-ordering.md)

### Price history, tracking and deals
- Staples: up to ~15 Items Keshav marks. Every basket run records the prices it saw. Separately, a staple not checked in ~24 h gets a background check while the tool is running, trickled at one lookup about every 30 s.
- History is kept ~6 months per Item per app, for Zepto, Blinkit, BigBasket and Flipkart Minutes. **Instamart is excluded** from background checks and stored history (Swiggy: use data only for "the user's immediate task" and keep it only as long as the session needs it); it is still priced live in every basket.
- Deal = an Item's current price on any tracked app is ≥ 8% below its 6-week median across those apps, or the lowest seen in 6 weeks (tunable). MRP "% OFF" is ignored. No flags until enough history exists. No category sweeps (Swiggy treats "bulk catalogue export" as abuse).
- Deals appear in a start-screen strip (hidden when empty) and as badges on basket lines. — [tracking](issues/15-staple-tracking.md), [deals](issues/14-deal-discovery.md)

### Screens
The main screen is Variant B ("verdict first") from the prototype, with parts taken from Variants A and C (`prototypes/basket-screen/basket_prototype.html`):
- **Start screen:** deal strip on top; login and blocked-app notices; paste box (plus "Load saved list"); a "Needs you" panel listing new Items to confirm.
- **Result:** verdict banner (winner, total, gap to runner-up, handoff action) → ranked apps (all-in total, items vs fees, expandable bill, coupon notes, estimated or couldn't-check tags with reasons and Retry) → "Worth knowing" (caveats + split note) → a "per line" toggle showing the A grid.
- **Item confirmation panel** (from Variant C): per app, the pre-ticked best candidate among alternatives; "any brand is fine"; pin container; mark as staple.
- **Pick list view** for the handoff. — [basket screen](issues/12-basket-screen.md)

## Testing Decisions

- **Good tests check external behaviour only:** given these listings and bills from the apps, does Keshav see the right verdict, totals, caveats, pick list, deal flags and statuses? Tests never assert on internal data shapes or call order.
- **One main seam: the platform adapter interface.** Everything above it (paste → Items, catalogue, pack filler, basket pricer, fee memory, governor, comparison, deals, tracking scheduling) is tested end-to-end through the app's own comparison entry point, using **fake adapters** that replay recorded data. Fakes can also simulate failures: a non-empty real cart, an expired login, a 429 with `Retry-After`, a blank page, an out-of-stock listing, a missing pack size.
- **Fixtures come from real data:** start from the real Blinkit and BigBasket listings captured on 2026-10-19 in `prototypes/product-matching/`. They already contain the hard cases (no 500 g butter, the "Pasteurised" naming, Maggi multipacks, Amul ghee pouches out of stock, Gujarati names). Add Zepto, Instamart and Minutes fixtures as their adapters are built.
- **Behaviours that must have tests:**
  - pack filling, including the closest-pack fallback;
  - never re-matching an out-of-stock Item;
  - the empty-cart guard before touching Instamart or BigBasket;
  - estimate labelling, and "fees unknown" when there's no prior bill;
  - governor caps, pauses (with time faked), cooldowns and the 3-days-in-a-week prompt;
  - Instamart never written to history;
  - deal thresholds;
  - no order-placing call ever being made (assert at the fake-adapter level).
- **Claude-dependent steps** (list parsing, candidate proposals) are faked behind their own small interface in these tests. A handful of recorded real pastes, such as the Hinglish sample in the basket-screen prototype, become a separate, slower check.
- **Adapters themselves** can't run against live sites in CI. Each gets a small manual smoke test Keshav can run on demand: search one Item, price a two-Item basket, report the bill. Run it after setup and whenever an app starts failing.
- **Prior art:** none yet (empty repo). The prototypes' data files are the starting fixtures.

## Out of Scope

- A product for other households, other cities, or the public. — [map](map.md)
- Amazon Fresh (deferred: most brittle — CAPTCHAs, AI-agent robots ban, logged-in fees; used only occasionally). Can be added later as another Chrome adapter. Amazon Now isn't available to the household.
- Placing orders, and filling the Blinkit, Zepto or Minutes carts automatically.
- Family members using the tool from their phones (possible later via home Wi-Fi).
- Category or "deals of the day" browsing, app-wide sales, bank and card offers, and counting coupons in totals.
- Hosting, always-on servers, push or WhatsApp alerts. Tracking only runs while the Mac is on.
- Zepto's app-only "Steal Deals" (₹9/₹19/₹29 stores), which its MCP doesn't expose — a known gap.

## Further Notes

- **Verify early in the build** (each may change a detail, not the design):
  1. Does Zepto's order preview itemise handling and small-cart fees?
  2. Does Flipkart Minutes' guest cart show fees, or is a login needed?
  3. Do Instamart MCP prices match the app at the home address?
  4. Do Zepto's MCP terms have a data-use rule like Swiggy's? If yes, exclude Zepto from history the same way as Instamart.
  5. Does Instamart `update_cart` really replace the cart Keshav sees in the phone app? Test once with an empty cart.
- **One-time setup Keshav does:** OTP login to the Zepto and Instamart MCPs; in the dedicated Chrome profile, log in to BigBasket with address 380015, set the home address on Blinkit, and set the home address on flipkart.com in Minutes mode.
- **Research and evidence** behind every decision is in the closed tickets in `issues/` and the cited findings in `research/` (each claim has a source URL).
- Fees change roughly monthly across these apps, so never hard-code fee rules; always prefer the real bill.
