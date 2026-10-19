# How can prices be read from Zepto and Blinkit?

Type: research
Status: resolved
Blocked by: —

## Question

For Zepto and Blinkit: is there a web version, a public/partner API, or a documented/reverse-engineered internal API? How is location (pin code / lat-long / store) set, and do prices, stock and offers vary by it? Is login required to see prices and fees? What anti-bot measures are known? What do existing open-source scrapers do, and how recently were they maintained?

Findings: `../research/02-access-zepto-blinkit.md`

## Answer

Resolved 2026-10-19 by research subagent. Full findings with citations: [research/02-access-zepto-blinkit.md](../research/02-access-zepto-blinkit.md).

- **Zepto — feasible and sanctioned.** Official MCP server at `mcp.zepto.co.in` (source: github.com/zeptonow/mcp). OAuth via phone + OTP; accepts a `http://localhost` callback and dynamic client registration, so a Mac app can log in once and refresh. Location by lat/long or saved address picks the dark store; search returns that store's prices and stock; payment-methods / order-preview returns delivery fee and total. **Gaps:** no coupons/offers; app-only deal prices missing (e.g. ₹29 in app vs ₹41 via MCP, reported 2026-10-03); unclear rate limits (an open bug returns empty results when throttled); MCP carts don't sync to the app; no sandbox — the tool must never confirm an order. **Avoid** scraping zepto.com (AWS WAF challenge; ToS clause 10.4 forbids automated access).
- **Blinkit — technically feasible, unofficial, against ToS, fragile.** No official/partner API. From a home connection, a client with a Chrome-like TLS fingerprint can call internal search and cart-pricing endpoints without login (lat/long in headers), returning store prices, stock and full fee breakdown (delivery, extra charges, free-delivery minimum). Cloudflare blocks plain requests (403 seen today); data-centre IPs blocked without residential proxies. Feb 2026 ToS forbids robots, price collection and circumventing access limits. Several open-source projects (Jul–Oct 2026) do this anyway; the most popular (hereisSwapnil/blinkit-mcp, 51★) drives a real browser via Playwright instead.
- **Location:** both price per dark store with ~2–3 km radii — the tool needs exact home coordinates, not just a pin code.
- **Open:** whether Zepto itemises handling/small-cart/surge fees and reflects membership savings; whether Blinkit web prices match the app for our store (see "Do Blinkit's web prices match the app for our home store?").
