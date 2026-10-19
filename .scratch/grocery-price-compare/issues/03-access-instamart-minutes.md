# How can prices be read from Swiggy Instamart and Flipkart Minutes?

Type: research
Status: resolved
Blocked by: —

## Question

Same questions as "How can prices be read from Zepto and Blinkit?", for Swiggy Instamart and Flipkart Minutes: web vs. app-only, APIs (official, partner incl. Swiggy's MCP/developer offerings if any, or reverse-engineered), location handling, login needs, anti-bot measures, existing scrapers.

Findings: `../research/03-access-instamart-minutes.md`

## Answer

Resolved 2026-10-19 by research subagent. Full findings with citations: [research/03-access-instamart-minutes.md](../research/03-access-instamart-minutes.md).

- **Swiggy Instamart — good via official MCP** (`mcp.swiggy.com/im`, launched Apr 2026). Personal use needs no approval; phone-OTP login, session ~30 days. `search_products` → MRP, offer price, stock for the saved address. `get_cart` → fee breakdown (free-text labels). **Catch:** `update_cart` replaces the entire cart, which appears to be the family's real cart — reading exact fees could wipe it (inferred from docs, untested). Swiggy may revoke access for "scraping / bulk catalogue export"; data rules allow use only for "the user's immediate task" — long-term price history fits poorly. ToS §15 explicitly permits AI-agent access; scraping the website breaches ToS and hits an AWS bot challenge. Website = fragile fallback.
- **Flipkart Minutes — moderately feasible, unofficial only.** No official/partner/MCP API. Web exists as hidden `marketplace=HYPERLOCAL` mode of flipkart.com. Working method: a browser on the Mac with the real address set once via Flipkart's address flow, then Flipkart's internal API — prices and stock visible logged out; pin code alone isn't enough. Fee visibility logged out unverified; cart API rate-limits hard. ToS forbids robots/scrapers outright. Fallback: manual or bookmarklet entry (runs in Keshav's own tab).
- **References:** `triggered-exe/sasta-signals` (both platforms, fixed 2026-10-18); `pawan67/instamart-alerts` (Instamart bot check, 2026-09); `jairaj26/flipkart-minutes-deals` (Minutes bookmarklet, 2026-10-03); `DebadityaHait/ShopLense` (live test log, 2026-10-07). Pre-mid-2025 projects are dead.
- **Conflict with "Does an existing app or extension already solve this?":** that research reported Swiggy sessions expire ~5 days and that Swiggy's docs say third-party apps aren't permitted yet; this one reports ~30-day sessions and no approval needed for personal use. Must be reconciled against Swiggy's docs during "How will the tool get prices from each app?".
