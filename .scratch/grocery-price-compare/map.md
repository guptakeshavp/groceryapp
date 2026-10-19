# Map: Household grocery price comparison (Ahmedabad)

Label: wayfinder:map

## Destination

A build-ready spec for a household tool that compares grocery prices, fees and deals across Zepto, Swiggy Instamart, Blinkit, BigBasket and Flipkart Minutes for our Ahmedabad address (Amazon Fresh deferred past v1) — nothing left to decide before Claude starts building it under Keshav's guidance.

## Status

**Destination reached 2026-10-19** — no open tickets, no fog. Every decision a builder needs is in the closed tickets below; assembled into [spec.md](spec.md) (ready-for-agent).

## Notes

- **Users:** Keshav's household only — and in v1 only Keshav operates the tool, on his Mac; the family relays lists to him. Not a product. Personal logged-in accounts and the home pin code are fair game.
- **Jobs, ranked:** (1) **Basket compare** — "for this list, which app is cheapest all-in, including delivery/handling/small-cart fees?"; a single big-ticket item (e.g. ghee) is a basket of one. (2) **Deal discovery** — what's on offer across apps. (3) **Staple tracking** — notice when usual items drop in price.
- **Home location:** Ahmedabad, pin code 380015 (exact coordinates needed later — dark stores serve ~2–3 km).
- **Platforms (v1):** Zepto + Instamart via official MCP; Blinkit, BigBasket, Flipkart Minutes via one automated Chrome profile on the Mac. Amazon Fresh deferred.
- **Domain terms:** an **Item** is a household product ("our Amul Cow Ghee") mapped to one confirmed **listing** per app; a **basket** is Items + rough quantities.
- **Builder:** Claude builds, Keshav guides — so the spec must be precise enough for an agent to execute without re-deciding.
- **Skills:** `/grilling` + `/domain-modeling` for HITL tickets; `/research` for research tickets; `/prototype` for prototype tickets.
- **Tracker:** local markdown — tickets in `issues/`, research findings in `research/`.

## Decisions so far

<!-- one line per resolved ticket: [title](issues/NN-slug.md) — gist -->

- [How does the household shop today, and where should the tool live?](issues/06-household-setup.md) — local web app on Keshav's Mac, Keshav-only; Prime + Swiggy One held; v1 = Blinkit/Zepto/Instamart/BigBasket (Fresh/Minutes if easy); real accounts read gently; tracking only while Mac is on.
- [Does an existing app or extension already solve this?](issues/01-existing-tools.md) — nothing reliable covers all six for Ahmedabad; build, borrowing from quick-commerce-mcp (MIT) and compari5's approach; Zepto and Instamart now have official logged-in MCP connectors; Rozmo/Smartprix worth a real-basket check first.
- [How can prices be read from Zepto and Blinkit?](issues/02-access-zepto-blinkit.md) — Zepto: official MCP with OTP login from the Mac, prices + fees but no offers and some app-only deals missing; Blinkit: no API, internal endpoints from home IP work but are fragile and against ToS; both need exact home coordinates.
- [How can prices be read from Swiggy Instamart and Flipkart Minutes?](issues/03-access-instamart-minutes.md) — Instamart: official MCP with OTP login, prices + cart fees, but cart writes may clobber the family's real cart and price history fits Swiggy's data rules poorly; Minutes: no API, browser-session scraping only (against ToS), bookmarklet as fallback.
- [How can prices be read from BigBasket and Amazon Fresh?](issues/04-access-bigbasket-amazonfresh.md) — no usable official API for either; BigBasket via a logged-in Chrome on the Mac (precedent in quick-commerce-mcp), against ToS; Amazon Fresh web-readable but the most brittle (CAPTCHAs, AI-agent robots ban, ToS); Amazon Now not available to us.
- [What fees and memberships change the all-in basket price on each app?](issues/05-fees-and-memberships.md) — free delivery ≈ ₹199 on the big three; handling ₹4–12 on Instamart/Blinkit; Swiggy One waives fees above ₹199; fees change ~monthly and are mostly unpublished, so read real logged-in cart totals rather than model fees.
- [Do Rozmo or Smartprix give accurate totals for our Ahmedabad basket?](issues/09-check-existing-apps.md) — not checked; Keshav ruled out adopting an existing app — we build. BigBasket does 10-minute delivery at 380015, and its website shows the same prices as the app there.
- [Do Blinkit's web prices match the app for our home store?](issues/10-blinkit-web-vs-app.md) — yes, same item prices on web and app; cart fees not compared.
- [How will the tool get prices from each app?](issues/07-data-access-approach.md) — Zepto + Instamart via official MCP (OTP login; Instamart ~monthly); Blinkit, BigBasket, Minutes via one automated logged-in Chrome on the Mac; Amazon Fresh deferred; on failure retry once, then mark "couldn't check".
- [How are the same products matched across apps?](issues/08-product-matching.md) — Claude proposes, Keshav confirms each Item's listing per app once and it's remembered; quantities filled with cheapest real packs; container ignored unless pinned; brand-strict unless marked "any brand"; out-of-stock shown, never re-matched.
- [How does the tool get each app's all-in basket total?](issues/11-basket-total.md) — real cart totals everywhere (Zepto MCP preview, Blinkit stateless pricing, Minutes guest cart if possible, Instamart/BigBasket real carts after an empty-cart check); auto-applied discounts count, coupons/bank offers listed only; estimates use last real bill's fees, labelled.
- [What does the basket screen look like?](issues/12-basket-screen.md) — paste the family's WhatsApp list → verdict banner (cheapest all-in app) + ranked apps + "Worth knowing" caveats; new Items confirmed in a per-app pick panel; per-line grid behind a toggle; splits only an informational note.
- [Does the tool ever place orders, or stop at handing off?](issues/13-ordering.md) — never in v1; Instamart/BigBasket hand off via the already-filled real cart, Blinkit/Zepto/Minutes via an exact pick list (pack + container) Keshav follows on his phone.
- [Which deals does the tool surface beyond the basket's coupon note?](issues/14-deal-discovery.md) — confirmed Items only, from prices already fetched; a deal = ≥8% below the Item's 6-week median or a 6-week low (MRP % ignored); shown as a start-screen strip + basket-line badge.
- [How does staple price tracking work?](issues/15-staple-tracking.md) — ~15 Items Keshav marks as staples; daily background check while the tool runs + basket runs; 6 months local history on Zepto/Blinkit/BigBasket/Minutes; Instamart excluded (Swiggy data rule), still live in baskets.
- [How are logins kept alive, and how gentle is "gently"?](issues/16-logins-and-pace.md) — Keshav re-logs in via each app's own OTP page (advance warning for Instamart/Zepto); one request at a time per app, ~4 s/~2 s pauses, ~1–1.5 min per basket; caps 40/run and 150/day per app; blocks → retry once, cool down until tomorrow, suggest a throwaway account after 3 bad days in a week.

## Not yet specified

<!-- all fog graduated into tickets on 2026-10-19 -->

## Out of scope

- **Amazon Fresh** — deferred past v1 by Keshav: the most brittle platform (CAPTCHAs, AI-agent robots ban, logged-in fees), used only occasionally. Returns as a follow-up effort via the same automated-Chrome mechanism. See [How will the tool get prices from each app?](issues/07-data-access-approach.md).
- A product for other households, other cities, or the public — this is for one household.
