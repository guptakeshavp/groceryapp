# Research: How can prices be read from Zepto and Blinkit?

Ticket: [issues/02-access-zepto-blinkit.md](../issues/02-access-zepto-blinkit.md)
Researched: 2026-10-19. Every claim has a source link and a date. "Probed" means a single, light, unauthenticated HTTP request made on 2026-10-19 while writing this. No accounts were created and no logins were made.

## TL;DR

| | **Zepto** | **Blinkit** |
|---|---|---|
| Web version | Yes, `www.zepto.com` (formerly zeptonow.com), a JS SPA behind AWS WAF | Yes, `blinkit.com`, a JS SPA behind Cloudflare |
| Official API | **Yes: an official consumer MCP server** (`https://mcp.zepto.co.in/mcp`). You log in with OAuth (phone + OTP). It has tools for location, search, cart, fees/total and orders | **None found.** There is no public, partner or MCP API for consumers |
| Unofficial API | `POST bff-gateway.zepto.com/user-search-service/api/v3/search`. It needs a browser-solved AWS WAF token, a `request-signature` header and CSRF | `POST blinkit.com/v1/layout/search` plus `/v5/carts`. It works without login if the client copies Chrome's TLS fingerprint (impit / curl_cffi) |
| Location key | `storeId`, resolved from lat/long or a saved address | `lat`/`lon` headers, which resolve to a dark-store `merchant_id` |
| Varies by location? | Yes: store-scoped catalog, price and stock | Yes: store-scoped catalog, price and stock |
| Login needed for prices? | Web: no (guest session). MCP: yes (OAuth) | No. Search and cart pricing (including the fee breakdown) work logged out |
| Anti-bot | AWS WAF challenge (`202` + `x-amzn-waf-action: challenge`), signed requests, MCP rate limits | Cloudflare bot management (TLS/JA3 fingerprinting, `cf-mitigated: challenge`, 403). Datacenter IPs are blocked |
| Verdict (personal use) | **Feasible and sanctioned via the official MCP** | **Feasible technically from a home IP, but ToS-prohibited and fragile** |

---

## Zepto

### Web version
- Zepto has a consumer website at `www.zepto.com`. Product search runs client-side in a Next.js SPA through `POST https://bff-gateway.zepto.com/user-search-service/api/v3/search` (investigated 2026-08-29). [tolmol zepto adapter](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/zepto.py)
- `robots.txt` allows `/` but disallows `/search`, `/api/`, `/cart/`, `/location/` and `/account*`. Probed 2026-10-19: [zepto.com/robots.txt](https://www.zepto.com/robots.txt)
- Earlier (Jan 2025) scrapers called `https://api.zeptonow.com/api/v3/search` and `/v1/config/layout`, with `storeId` headers. That older host is the one seen in [Sagargiri1707/quick-commerce-price-compare `api/zepto.js`](https://github.com/Sagargiri1707/quick-commerce-price-compare/blob/main/api/zepto.js) and [`src/services/api.ts`](https://github.com/Sagargiri1707/quick-commerce-price-compare/blob/main/src/services/api.ts) (last pushed 2025-01-06). It is now superseded by `bff-gateway.zepto.com`.

### Official API: the Zepto MCP server
- Zepto publishes an **official MCP server** "for Zepto customers in India with an active Indian mobile number". It offers product search ("real-time product availability, pricing"), cart management, order placement and order history. The README calls it "a **consumer-facing integration** that works with real Zepto accounts and real orders". [zeptonow/mcp README](https://github.com/zeptonow/mcp) (repo created 2025-12-09; last commit 2026-02-18; issues active through 2026-10-17)
- **Authentication:** OAuth. A browser page opens, you enter your Indian mobile number and verify with an OTP. [zeptonow/mcp README](https://github.com/zeptonow/mcp)
- **Allowed OAuth redirect URIs** include `http://localhost`, `http://localhost/callback`, `http://127.0.0.1` and `http://127.0.0.1/callback`, plus Claude, VS Code and Postman callbacks. Any other URI must be requested through a GitHub issue. [zeptonow/mcp README](https://github.com/zeptonow/mcp) Zepto declines "temporary" redirect URIs. [issue #68, 2026-10-03](https://github.com/zeptonow/mcp/issues/68) A laptop-run household script can therefore use the localhost callback without asking Zepto. A hosted web app cannot without allow-listing; compari5 hit `domain_not_whitelisted` on Netlify. [compari5 IMPLEMENTATION.md](https://github.com/ironman-gampala/compari5/blob/main/IMPLEMENTATION.md) (2026-09)
- **OAuth metadata.** Probed 2026-10-19:
  - The MCP endpoint returns `401` with `www-authenticate: Bearer resource_metadata=…, scope="tools:read"`. [mcp.zepto.co.in/mcp](https://mcp.zepto.co.in/mcp)
  - Protected-resource metadata lists `authorization_servers: ["https://auth.zepto.co.in"]` and scopes `tools:read`, `tools:write` and `dev.ucp.shopping.catalog.search:read`, `…catalog.lookup:read`, `…location.search:read`, `…cart:manage`, `…checkout:manage`, `…order:manage`. [oauth-protected-resource](https://mcp.zepto.co.in/.well-known/oauth-protected-resource)
  - The authorization server supports **dynamic client registration** (`registration_endpoint: https://auth.zepto.co.in/register`), `authorization_code` + `refresh_token` grants, PKCE S256, and public clients (`token_endpoint_auth_methods_supported` includes `none`). [auth.zepto.co.in metadata](https://auth.zepto.co.in/.well-known/oauth-authorization-server)
  - **Implication:** a custom script (not just Claude Desktop) can register itself, log in once and refresh tokens. compari5 does exactly this: it registers via DCR with scope `tools:read tools:write`, a localhost redirect and refresh tokens. [compari5 `lib/auth/mcp.js`](https://github.com/ironman-gampala/compari5/blob/main/lib/auth/mcp.js) (2026-09)
- **Tool names seen in the wild.** The official README gives no schema reference ([issue #22](https://github.com/zeptonow/mcp/issues/22): "When you connect to the MCP, through say Postman, you will be able to see detailed tool descriptions", maintainer, 2026-07-30). The following names come from client code and bug reports:
  - `get_location_serviceability(latitude, longitude)` → store ID, then `select_store(storeId, latitude, longitude)`, then `search_products(query, pageNumber)`. [compari5 `lib/platforms/zepto.js`](https://github.com/ironman-gampala/compari5/blob/main/lib/platforms/zepto.js) (2026-09-25)
  - `list_saved_addresses`, `select_saved_address(addressId)` (returns `storeId`), `search_products`, `update_cart`, `get_payment_methods` ("total charges"), `create_order(confirm)`, `list_order_history`, `get_past_order_items`. [prativeshsharmadev27 README](https://github.com/prativeshsharmadev27/Zepto-MCP-Server-Integration-with-Claude-Code) (2026-10-04); [issue #74](https://github.com/zeptonow/mcp/issues/74) (2026-10-09)
  - `search_multiple_products`, `get_user_details`. [issue #33](https://github.com/zeptonow/mcp/issues/33) (2026-08-02)
  - `view_cart`, `create_wallet_order`, `create_online_payment_order`. [issue #62](https://github.com/zeptonow/mcp/issues/62) (2026-09-27); [issue #31](https://github.com/zeptonow/mcp/issues/31) (2026-07-30)
- **Fees and totals are exposed:**
  - In a live demo, `get_payment_methods` returned "Total: ₹79 (Item ₹49 + Delivery Fee ₹30)". [prativeshsharmadev27 README](https://github.com/prativeshsharmadev27/Zepto-MCP-Server-Integration-with-Claude-Code) (2026-10-04)
  - Order previews (`confirmOrder:false`) return `deliveryFee`, `toPayAmount` and `deliverable`. [issue #31](https://github.com/zeptonow/mcp/issues/31) (2026-07-30)
  - **Unknown:** whether handling, small-cart and surge fees are itemised separately. No source showed this.
- **Known gaps and bugs** (all open as of 2026-10-19 unless noted):
  - **Coupons and offers are not exposed.** [#29](https://github.com/zeptonow/mcp/issues/29) (2026-07-19)
  - **App-only "Steal Deals" (₹9/₹19/₹29 stores) are missing from the MCP and the website.** Example: a product at ₹29 in the app was ₹41 via the MCP and on zepto.com (Noida, 2026-10-03). [#67](https://github.com/zeptonow/mcp/issues/67)
  - An earlier MCP-vs-app price discrepancy was reported, and a maintainer said it was fixed on 2026-04-21. [#14](https://github.com/zeptonow/mcp/issues/14)
  - MCP search results were not aligned with the app; the maintainer called it fixed on 2026-04-17. The reporter then said results stop after about 4 pages of 10. [#13](https://github.com/zeptonow/mcp/issues/13)
  - **Rate limiting:** `search_products` returned `429`, and `search_multiple_products` returned `200` with empty `products: []` (indistinguishable from out-of-stock) for one account, starting 2026-08-01. Still open. [#33](https://github.com/zeptonow/mcp/issues/33) compari5 parses a `rate_limit … retry_after_seconds` error from the MCP. [compari5 `lib/platforms/zepto.js`](https://github.com/ironman-gampala/compari5/blob/main/lib/platforms/zepto.js)
  - **The MCP cart is scoped to the MCP session, not the user's app cart**, so you cannot hand off a basket to the app. [#62](https://github.com/zeptonow/mcp/issues/62), [#74](https://github.com/zeptonow/mcp/issues/74), [#21](https://github.com/zeptonow/mcp/issues/21) (all with no maintainer reply)
  - **No sandbox**: "we don't have any sandbox testing is plans right now" (maintainer, 2026-08-26). [#40](https://github.com/zeptonow/mcp/issues/40) Any test order is a real order.
  - Someone building a basket-compare app asked for "sanctioned access to catalogue, pricing & availability" for a third-party app. Unanswered. [#57](https://github.com/zeptonow/mcp/issues/57) (2026-09-21)
  - DCR and OAuth outages occurred in August 2026 and were fixed. [#36](https://github.com/zeptonow/mcp/issues/36), [#43](https://github.com/zeptonow/mcp/issues/43), [#45](https://github.com/zeptonow/mcp/issues/45)

### Unofficial (reverse-engineered) web API
- **Endpoint:** `POST https://bff-gateway.zepto.com/user-search-service/api/v3/search`, with body `{query, pageNumber, mode, userSessionId}`. [shahidirfan100/Zepto-Product-Scraper API_DISCOVERY.md](https://github.com/shahidirfan100/Zepto-Product-Scraper/blob/main/API_DISCOVERY.md) (2026-10-09)
- **Requirements:**
  - a `storeId` header, resolved from lat/long via a serviceability lookup (stored in a `serviceability` cookie)
  - `session_id` and `device_id` cookies
  - an `x-xsrf-token` header matching the `XSRF-TOKEN` cookie
  - an `aws-waf-token` cookie issued by an obfuscated JS challenge

  Source: [tolmol zepto adapter](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/zepto.py) (investigated 2026-08-29). A `request-signature` header is also required; without it or the CSRF headers the endpoint returns `429`. [API_DISCOVERY.md](https://github.com/shahidirfan100/Zepto-Product-Scraper/blob/main/API_DISCOVERY.md)
- **Login:** not required. A guest session works, but until the guest session warms up the API answers `HTTP 299 {"error_code":"LOGIN_REQUIRED"}`. [API_DISCOVERY.md](https://github.com/shahidirfan100/Zepto-Product-Scraper/blob/main/API_DISCOVERY.md)
- **Response fields** (prices in paise):
  - price: `mrp`, `sellingPrice`, `discountedSellingPrice`, `discountPercent`, `superSaverSellingPrice`, `zeptoPassPrice`
  - stock: `availableQuantity`, `outOfStock`
  - pack: `formattedPacksize`
  - store: `storeId`

  [API_DISCOVERY.md](https://github.com/shahidirfan100/Zepto-Product-Scraper/blob/main/API_DISCOVERY.md); [main.js](https://github.com/shahidirfan100/Zepto-Product-Scraper/blob/main/src/main.js) The membership price field matters for the fee model in ticket 05.

### Location
- The **store is the unit of pricing**. Search needs a `storeId` resolved from lat/long ([tolmol](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/zepto.py)). In the MCP you either call `get_location_serviceability(lat, lng)` + `select_store` ([compari5](https://github.com/ironman-gampala/compari5/blob/main/lib/platforms/zepto.js)) or `select_saved_address`, which "automatically locks the serving dark store" ([prativeshsharmadev27](https://github.com/prativeshsharmadev27/Zepto-MCP-Server-Integration-with-Claude-Code)). Searching before selecting returns "Store not selected". (same sources)
- Browser scrapers set the location either by granting browser geolocation with the home lat/long ([compari5 `searchZeptoBrowser`](https://github.com/ironman-gampala/compari5/blob/main/lib/platforms/zepto.js)) or by typing a pincode into the "Select location" modal ([kartbot `zepto.ts`](https://github.com/Hritik-74/kartbot/blob/main/packages/price-engine/src/services/zepto.ts), 2026-06-12).
- **Pincode alone is too coarse.** Dark-store delivery radii are about 2–3 km, smaller than many pincodes, so precise home coordinates should be used. [tolmol `adapters/base.py`](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/base.py) (2026-08-29)
- **Do prices, stock and offers vary by location?** Yes, by store. Third-party trackers report that "each dark store runs its own inventory and promotions" and that Zepto flash deals are visible only in the relevant store's zone. This is a vendor claim, not independently verified. [Actowiz dark-store pricing](https://www.actowizsolutions.com/dark-store-pricing-availability.php); [Syphoon pincode intel (2026)](https://syphoon.com/blog/blinkit-zepto-pincode-competitor-intelligence)
- Prices also **vary by surface**: app-only deal stores ([#67](https://github.com/zeptonow/mcp/issues/67), 2026-10-03), and iPhone vs Android differences reported in Dec 2024–Jan 2025 ([afaqs](https://www.afaqs.com/news/brands/influencers-expose-price-bias-as-q-comm-platforms-levy-apple-tax-8630634); [MediaNama, Jan 2025](https://www.medianama.com/2025/01/223-medianama-analysis-differential-pricing-instamart-blinkit-zepto/)).

### Login needed?
- **Web:** no. Guest sessions see search prices. [API_DISCOVERY.md](https://github.com/shahidirfan100/Zepto-Product-Scraper/blob/main/API_DISCOVERY.md); [compari5 guest browser path](https://github.com/ironman-gampala/compari5/blob/main/lib/platforms/zepto.js) It is unverified whether guests can see cart fees on the web.
- **MCP:** yes, an OAuth/OTP login, which then gives prices, fees and totals for the selected store. [zeptonow/mcp](https://github.com/zeptonow/mcp)

### Anti-bot
- **AWS WAF:**
  - Probed 2026-10-19: `curl https://www.zepto.com/` → `HTTP 202`, `server: CloudFront`, `x-amzn-waf-action: challenge`, empty body.
  - Plain HTTP calls to the search API get `202` + `x-amzn-waf-action: challenge` "regardless of the impit browser profile", so a browser bootstrap is required. [API_DISCOVERY.md](https://github.com/shahidirfan100/Zepto-Product-Scraper/blob/main/API_DISCOVERY.md) (2026-10-09)
  - One builder reproduced cookies and CSRF from inside a real guest tab and still failed, then gave up rather than bypass it. [tolmol](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/zepto.py) (2026-08-29) Another builder "stopped when it became clear that automated requests were being blocked". [#57](https://github.com/zeptonow/mcp/issues/57)
- **MCP:** per-account rate limits (see the MCP gaps above).

### Existing open-source scrapers (Zepto)
| Repo | Approach | Auth / location | Last activity |
|---|---|---|---|
| [zeptonow/mcp](https://github.com/zeptonow/mcp) (official, 50★) | Remote MCP | OAuth OTP; address/store selection | README 2026-02-18; issues to 2026-10-17 |
| [ironman-gampala/compari5](https://github.com/ironman-gampala/compari5) | Personal 5-app compare; Zepto via **official MCP** (DCR + localhost OAuth), fallback to a Puppeteer guest search on a Mac | lat/lng → `get_location_serviceability` → `select_store` | 2026-09-25 |
| [shahidirfan100/Zepto-Product-Scraper](https://github.com/shahidirfan100/Zepto-Product-Scraper) | Apify actor: Playwright Firefox solves the WAF, captures headers, then impit replays pages | Guest; **no location set** (default store) | 2026-10-09 |
| [Hritik-74/kartbot](https://github.com/Hritik-74/kartbot/blob/main/packages/price-engine/src/services/zepto.ts) | Playwright DOM scrape | Types the pincode into the location modal | 2026-06-12 |
| [jemappelleclaude/CartCompare](https://github.com/jemappelleclaude/CartCompare) | Puppeteer DOM scrape, cookies persisted to disk | Location modal once, then a flag file | 2026-05-18 |
| [sutirthaguha/tolmol](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/zepto.py) | Declared Zepto "fallback-only" (deep-link) because of the WAF | n/a | 2026-08-29 |
| [Sagargiri1707/quick-commerce-price-compare](https://github.com/Sagargiri1707/quick-commerce-price-compare) (9★) | Old `api.zeptonow.com` proxy | lat/long → `storeId` header | 2025-01-06 (stale) |

### ToS (Zepto)
- Clause 10.4 (Terms "Last updated: 27th March 2025", archived 2025-05-05): "You agree not to access (or attempt to access) the Platform by any means other than through the interface that is provided by Zepto. You shall not use any deep-link, robot, spider or other automatic device, program, algorithm or methodology … to access, acquire, copy or monitor any portion of the Platform or Content". Clause 10.5.12 forbids reverse engineering. [Archived zeptonow.com/terms-of-service](https://web.archive.org/web/20250505030644/https://www.zeptonow.com/terms-of-service) (the live page returns a WAF challenge to non-browsers, probed 2026-10-19, so a newer version may exist)
- Clause 6.2: fees, "including delivery fee", are shown "at the checkout page". [same archive](https://web.archive.org/web/20250505030644/https://www.zeptonow.com/terms-of-service)
- **Reading:** the MCP is "the interface that is provided by Zepto" for exactly this kind of conversational or automated consumer use ([README](https://github.com/zeptonow/mcp)). Scraping `bff-gateway` with a solved WAF token is what clause 10.4 forbids.

---

## Blinkit

### Web version
- Blinkit has a consumer website at `blinkit.com`. Its JSON APIs sit behind "Cloudflare → Kong gateway → internal services", and the web client sends `app_client: consumer_web`. [yniks/blinkit-mcp RESEARCH.md](https://github.com/yniks/blinkit-mcp/blob/main/RESEARCH.md) (captured live 2026-06-17)

### Official / partner API
- **None found for consumers or catalog/pricing.**
  - Searches for an official Blinkit/Eternal MCP or developer API on 2026-10-19 returned only third-party projects. [glama listing of hereisSwapnil/blinkit-mcp](https://glama.ai/mcp/servers/bv3k394gve)
  - Every "Blinkit MCP" on GitHub is labelled "Unofficial". [hereisSwapnil/blinkit-mcp](https://github.com/hereisSwapnil/blinkit-mcp); [SinghChinmay/bun-blinkit-mcp](https://github.com/SinghChinmay/bun-blinkit-mcp); [yniks/blinkit-mcp](https://github.com/yniks/blinkit-mcp)
  - The only "Blinkit APIs" in public repos are brand-side ads/campaign APIs, which are irrelevant here. [hectorai-live/Blinkit-apis-automation](https://github.com/hectorai-live/Blinkit-apis-automation)
- Paid third-party scrapers exist on Apify, all requiring residential proxies. [axlymxp/blinkit-grocery-scraper](https://apify.com/axlymxp/blinkit-grocery-scraper); [jocular_quisling/blinkit-product-scraper](https://apify.com/jocular_quisling/blinkit-product-scraper) (v1.0 2025-01-11)

### Reverse-engineered internal API
All endpoints are on `https://blinkit.com`. Source: [yniks RESEARCH.md §1–2, 8–9](https://github.com/yniks/blinkit-mcp/blob/main/RESEARCH.md), 2026-06-17.
- **Bootstrap:** `GET /v2/accounts/auth_key/` with a fixed header `req_key: c0e6868e-1180-400c-be51-f473479f1f0a` (from the web bundle) returns a device `auth_key`. No login is involved; a random UUID gets `400`. Confirmed again in [SinghChinmay/bun-blinkit-mcp](https://github.com/SinghChinmay/bun-blinkit-mcp) (2026-10-03).
- **Serviceability:** `GET /visibility?latitude=&longitude=` returns the serving dark-store `merchants[]` (`merchant_id`). `GET /location/info?lat=&lon=` reverse-geocodes.
- **Search:** `POST /v1/layout/search?q=…&search_type=type_to_search` returns server-driven-UI `snippets` containing `product_id`, `name`, `variant` (unit), `mrp`, `normal_price`, `inventory`, `merchant_id`, `eta_tag` and an `atc_action.add_to_cart.cart_item`. Pagination uses `offset`/`limit`.
  - The search fixture also carries `offer` and `offer_tag` keys. Fixture: [mebishp/blinkit-api `tests/fixtures/search_milk_delhi.json`](https://github.com/mebishp/blinkit-api/blob/main/tests/fixtures/search_milk_delhi.json) (2026-10-01)
  - Other read endpoints: category listing `/v1/layout/listing_widgets?l0_cat=&l1_cat=`, product page `/v1/layout/product/{id}` and ETA `/v1/consumerweb/eta`. [mebishp `endpoints.py`](https://github.com/mebishp/blinkit-api/blob/main/app/blinkit/endpoints.py)
- **Cart pricing (fees):** `POST /v5/carts` with `{items:[cart_item…]}` returns `bill_details{total_mrp, payable_amount, delivery_charge, additional_charges}` and `free_delivery_mov`. It is **stateless** (a pricing endpoint, not a persistent cart) and **works logged out**; it just adds a `FORCE_LOGOUT_USER` validation. This means a whole basket's all-in total, including delivery and extra charges, can be priced without logging in.
  - The parsing of `delivery_charge` and `free_delivery_mov` is in [yniks `src/api.ts`](https://github.com/yniks/blinkit-mcp/blob/main/src/api.ts).
  - **Unknown:** whether member pricing (Blinkit's membership, if any) or bank offers appear in it.
- **Login:** `POST /v2/accounts/` (sends the OTP), then `POST /v2/accounts/verify/phone/code/` returns an `access_token` of the form `v2::<uuid>`. Only orders, addresses and checkout need it. "Browsing/search/serviceability/cart all work logged-out."

### Location
- **The key is lat/long, sent as `lat` and `lon` HTTP headers** (also mirrored in `gr_1_lat`/`gr_1_lon` cookies). Blinkit resolves the serving dark store (`merchant_id`) from them. [yniks RESEARCH.md §1](https://github.com/yniks/blinkit-mcp/blob/main/RESEARCH.md); [mebishp `endpoints.py`](https://github.com/mebishp/blinkit-api/blob/main/app/blinkit/endpoints.py) ("Blinkit resolves the serving dark store (merchant) from these headers")
- "Blinkit's web client keys availability and pricing off geographic coordinates, not the pincode string." [tolmol blinkit adapter](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/blinkit.py) (2026-08-29)
- **Do prices, stock and offers vary?** Yes, by dark store:
  - "Prices, stock and assortment depend on the dark store that serves the given location." [mebishp/blinkit-api README](https://github.com/mebishp/blinkit-api) (2026-10-01)
  - "Blinkit is store-scoped. Each delivery point resolves to a store with its own catalog, pricing and stock." [Apify axlymxp](https://apify.com/axlymxp/blinkit-grocery-scraper)
  - iOS vs Android differences were reported in Jan 2025 ([MediaNama](https://www.medianama.com/2025/01/223-medianama-analysis-differential-pricing-instamart-blinkit-zepto/)), but Digit found identical prices on the items it checked ([Digit](https://www.digit.in/news/mobile-phones/android-vs-iphone-we-compared-prices-on-zomato-blinkit-myntra-uber-and-other-apps.html)).
  - **Unknown:** whether web prices differ from app prices. This should be spot-checked for our address.
- Browser-based tools set the location by granting Playwright geolocation, defaulting to fixed coordinates ([hereisSwapnil `src/auth/service.py`](https://github.com/hereisSwapnil/blinkit-mcp/blob/main/src/auth/service.py)), or by typing into the location modal ([hereisSwapnil `location.py`](https://github.com/hereisSwapnil/blinkit-mcp/blob/main/src/order/services/location.py); [CartCompare `blinkit.js`](https://github.com/jemappelleclaude/CartCompare/blob/main/backend/scrapers/blinkit.js)).

### Login needed?
- **No** for search prices, stock or cart fee breakdowns. [yniks RESEARCH.md §1–2](https://github.com/yniks/blinkit-mcp/blob/main/RESEARCH.md); [tolmol](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/blinkit.py) ("no login/session/cookies needed"); [Apify axlymxp](https://apify.com/axlymxp/blinkit-grocery-scraper) ("No login")

### Anti-bot
- **Cloudflare TLS fingerprinting:** "curl and Node fetch/undici get a 403 HTML page regardless of headers, because Cloudflare bot-management blocks on the TLS (JA3/JA4) fingerprint." The fix is a Chrome-impersonating client (`impit`). [yniks RESEARCH.md §0](https://github.com/yniks/blinkit-mcp/blob/main/RESEARCH.md) (2026-06-17)
  - mebishp uses `curl_cffi` impersonation and treats `403/429/503`, "just a moment" and `cf-chl` responses as blocks, resetting the session and backing off. [mebishp `client.py`](https://github.com/mebishp/blinkit-api/blob/main/app/blinkit/client.py) (2026-10-01)
  - Probed 2026-10-19 from this machine: `curl https://blinkit.com/` → `HTTP 403`, `server: cloudflare`, `cf-mitigated: challenge`, `cf-ray …-BOM` (Mumbai edge), page title "blinkit | Error Page". So a plain client from an Indian IP is challenged.
  - **Conflict:** tolmol (2026-08-29) claims plain `httpx` with `lat`/`lon`/`app_client`/`device_id` headers works ([tolmol](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/blinkit.py)). This contradicts the above and my probe; treat it as unreliable.
- **Datacenter IPs are blocked:**
  - "Blinkit's Cloudflare protection blocks datacenter IPs, so a residential proxy is required." [Apify axlymxp](https://apify.com/axlymxp/blinkit-grocery-scraper)
  - "Without proxy, all requests will fail with 403 errors." [Apify jocular_quisling](https://apify.com/jocular_quisling/blinkit-product-scraper)
  - compari5 found "Local Mac Impit usually works", while Netlify/Render need a residential proxy. [compari5 IMPLEMENTATION.md](https://github.com/ironman-gampala/compari5/blob/main/IMPLEMENTATION.md); [blinkit proxy spec, 2026-09-07](https://github.com/ironman-gampala/compari5/blob/main/docs/superpowers/specs/2026-09-07-blinkit-fly-proxy-design.md)
  - **Implication:** run Blinkit fetches from the home network, not a cloud server.
- `__cf_bm` / `cf_clearance` cookies "may challenge non-browser clients at scale". [yniks RESEARCH.md §6](https://github.com/yniks/blinkit-mcp/blob/main/RESEARCH.md)

### Existing open-source scrapers (Blinkit)
| Repo | Approach | Auth / location | Last activity |
|---|---|---|---|
| [hereisSwapnil/blinkit-mcp](https://github.com/hereisSwapnil/blinkit-mcp) (51★, most popular) | Unofficial MCP; Playwright Firefox browser automation; `storage_state` session persistence | OTP login in the browser; geolocation permission or location modal | 2026-09-24 (v1.1.0) |
| [yniks/blinkit-mcp](https://github.com/yniks/blinkit-mcp) | API-only via `impit`; best endpoint documentation ([RESEARCH.md](https://github.com/yniks/blinkit-mcp/blob/main/RESEARCH.md)) | Guest `auth_key`; optional headless OTP; lat/lon headers | 2026-07-07 |
| [SinghChinmay/bun-blinkit-mcp](https://github.com/SinghChinmay/bun-blinkit-mcp) | API-only (Bun + impit), port of the above; no payments | Same | 2026-10-03 |
| [mebishp/blinkit-api](https://github.com/mebishp/blinkit-api) | Read-only REST wrapper (FastAPI + curl_cffi), with caching and block detection | lat/lon headers only; no auth_key | 2026-10-01 |
| [ironman-gampala/compari5](https://github.com/ironman-gampala/compari5/blob/main/lib/platforms/blinkit.js) | Personal compare tool; guest `auth_key` + search via impit | lat/lng from Google Places | 2026-09-25 |
| [sutirthaguha/tolmol](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/blinkit.py) | Plain httpx search (see conflict above) | Pincode → geocoded lat/lon | 2026-08-29 |
| [jemappelleclaude/CartCompare](https://github.com/jemappelleclaude/CartCompare) | Puppeteer DOM scrape with CSS-class selectors (brittle) | Location modal | 2026-05-18 |

### ToS (Blinkit)
Blinkit Terms, "Last updated in February 2026", archived 2026-06-01 ([web.archive.org snapshot](https://web.archive.org/web/20260601143903/https://blinkit.com/terms)). The live page returns a Cloudflare 403 to non-browsers (probed 2026-10-19).
- The licence is "for personal use only". It "does not include/permit … any collection, use or derivative use of the Blinkit Platform, its contents, any product listings, descriptions, or prices; … or any use of data mining, robots, or similar data gathering and extraction tools."
- Users must not use the services in a way that "Decompiles, reverse engineers…" or "bypasses or circumvents other measures employed to prevent or limit access to the Services".
- "Any unauthorized use shall automatically terminate the permission or license".
- **Reading:** even a personal, low-volume use of the internal API with TLS impersonation breaches the price-collection, robots and circumvention clauses. Because it is non-commercial and low-volume, the practical risk is mainly account or IP blocking rather than anything worse. Using it unauthenticated (no account) avoids putting the family's Blinkit account at risk. This is a judgement call, not legal advice.

---

## Feasibility verdict (personal, single-household use)

**Zepto: Feasible, and the recommended path is the official MCP.**
- Use Zepto's own OAuth MCP server from a laptop script with the localhost redirect: DCR, then a one-time phone OTP, then refresh tokens.
- The flow is `get_location_serviceability` / `select_saved_address` for the home location, then `search_products` / `search_multiple_products`, then `update_cart` + `get_payment_methods` or an order preview for fees and the total.
- This is sanctioned, gives store-specific prices, stock and delivery fee for our address, and avoids the WAF.

Limits:
- It needs a logged-in Zepto account.
- Rate limits are opaque (an empty-result-on-throttle bug is open).
- There are no coupons or offers, and app-only deal-store prices are missing.
- The cart is not visible in the app, so there is no handoff.
- There is no sandbox, so never call `create_*_order` with `confirm:true`.
- A hosted (non-localhost) deployment needs Zepto to allow-list a redirect URI, so run it locally or sync tokens from the laptop as compari5 does.

Fallback: guest-browser scraping of zepto.com from a home machine works but violates ToS clause 10.4; avoid it.

**Blinkit: Technically feasible, but unofficial, ToS-prohibited and fragile.**
- There is no official API.
- From a **home (residential) IP**, a Chrome-TLS-impersonating client (`impit` / `curl_cffi`) can call `/v1/layout/search` and the stateless `/v5/carts` with `lat`/`lon` headers. That gives store-specific prices, stock and the full fee breakdown (`delivery_charge`, `additional_charges`, `free_delivery_mov`) **without logging in**. Several repos maintained between July and October 2026 do exactly this.
- Cloud or datacenter hosting will be blocked without a residential proxy.
- Blinkit's Feb-2026 Terms explicitly forbid collecting prices with robots and circumventing access controls.
- Expect breakage when Blinkit changes header and version constants or Cloudflare rules.

If the household accepts that risk: keep volume tiny (a few basket checks a day), stay unauthenticated, run from home, and build in "Blinkit unavailable → open the search deep-link" degradation.

Lower-risk alternative: browser automation of blinkit.com in a real logged-in browser on the home machine. hereisSwapnil/blinkit-mcp is a maintained example. It is still covered by the "robots" clause, but it looks like normal use and is slower and more brittle.

### Open questions for downstream tickets
- Zepto MCP: does the fee breakdown itemise handling, small-cart and surge fees and membership (Zepto Pass) savings? Check by listing tool schemas after login (ticket 05/07).
- Blinkit: do web prices equal app prices for our Ahmedabad store? A manual spot-check of about 5 items is needed (ticket 06/07).
- How precise do the home coordinates need to be? Use the exact address lat/long, not a pincode centroid (ticket 06).
