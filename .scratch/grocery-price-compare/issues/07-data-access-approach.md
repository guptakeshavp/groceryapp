# How will the tool get prices from each app?

Type: grilling
Status: resolved
Blocked by: 02, 03, 04, 06, 09, 10

## Question

Given the access research and the household setup, choose the acquisition approach per platform — internal API calls, headless browser with our logged-in session, existing scraper library, manual-assist, or drop the platform — and accept the trade-offs (fragility, login upkeep, ToS risk for personal use, freshness).

## Answer

Resolved 2026-10-19 by grilling with Keshav.

1. **Zepto — official MCP** (`mcp.zepto.co.in`), OAuth phone-OTP login once from the Mac (localhost callback). Accepted gap: no coupons/offers, some app-only deal prices missing.
2. **Swiggy Instamart — official MCP** (`mcp.swiggy.com/im`), Personal Use path. Per Swiggy's docs: access token 5 days, rotating refresh token 30 days (sliding) → OTP re-login roughly monthly. (The "5 days, no refresh" claim in the existing-tools research came from a third-party repo; the "third-party apps not permitted" manifest line concerns distributed apps, not personal use.) Cart-overwrite risk handled in "How does the tool get each app's all-in basket total?".
3. **Blinkit, BigBasket, Flipkart Minutes — one dedicated automated Chrome profile on the Mac** (Playwright-style), logged in with the home address, capturing the data the sites themselves load. Home connection, human pace, on demand only. Keshav accepts this breaches those sites' ToS. Rejected: direct internal-endpoint calls with TLS-fingerprint mimicry (fragile; BigBasket's location step blocks it). Web prices verified equal to app prices for Blinkit and BigBasket at 380015.
4. **Platforms in v1: five** — Zepto, Instamart, Blinkit, BigBasket, Flipkart Minutes (Minutes confirmed serving 380015). **Amazon Fresh deferred** past v1; addable later via the same Chrome mechanism.
5. **Failure handling:** one gentle retry after a short pause, then show the comparison with the failed app marked "couldn't check" plus the reason (e.g. "login expired"). Never block the whole comparison; never retry-loop.
6. **Code to borrow:** `quick-commerce-mcp` (MIT) for BigBasket/Blinkit/Zepto adapters. `compari5` (no licence) and `sasta-signals` (licence to be checked before any copying) as approach references only.
