# Does an existing app or extension already solve this?

Type: research
Status: resolved
Blocked by: —

## Question

Is there an existing app, website, browser extension or open-source project that compares prices/fees/deals across Zepto, Swiggy Instamart, Blinkit, BigBasket, Amazon Fresh and Flipkart Minutes for a given Indian pin code (ideally Ahmedabad) — and how well does it cover basket comparison, deals and price tracking? Enough to decide build vs. adopt vs. borrow (e.g. reuse an open-source scraper).

Findings: `../research/01-existing-tools.md`

## Answer

Resolved 2026-10-19 by research subagent. Full findings with citations: [research/01-existing-tools.md](../research/01-existing-tools.md).

**Verdict: build, borrowing approaches and some code — pending a quick real-world check of two consumer apps** (see "Do Rozmo or Smartprix give accurate totals for our Ahmedabad basket?").

- **Consumer apps** (Rozmo, Comparify, Comparoo, Smartprix) claim multi-app, pin-code comparison; Rozmo and Smartprix claim whole-cart totals incl. fees. All closed-source; recent (2026) Play Store reviews report prices not matching the real apps; none confirms Ahmedabad (Rozmo lists Delhi NCR, Bengaluru, Mumbai, Hyderabad, Pune). Quick Compare unmaintained since Feb 2025.
- **Official access (new in 2026):** Swiggy Instamart and Zepto run official logged-in MCP connectors (search, cart, ordering; Instamart cart shows a bill breakdown). No deals/coupons exposed yet. Swiggy sessions expire ~5 days with no auto-renewal, and its docs say third-party apps aren't permitted yet. Nothing official for Blinkit, BigBasket, Flipkart Minutes or Amazon.
- **Open source:** all young, single-author (0–51 stars). `quick-commerce-mcp` (MIT, updated 18 Oct 2026) is the best code to reuse — reads itemised fees from logged-in carts; only Blinkit and Zepto live-verified (4 Oct). `compari5` is the best map of endpoints for Blinkit/Instamart/Zepto/BigBasket/Minutes but has no licence — follow its approach, don't copy code. Nothing covers Amazon Fresh/Now.
- **Accuracy:** prices vary by device, city, login state and order history (MediaNama, Jan 2025) — so logged-out, data-centre scraping won't match what we pay; reading from our own logged-in accounts on the Mac is the right shape (consistent with "How does the household shop today, and where should the tool live?").

- **Correction (from "How can prices be read from BigBasket and Amazon Fresh?"):** small hobby adapters for Amazon Fresh/Now do exist; most set location wrongly and none read fees.
