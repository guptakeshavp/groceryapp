# Research: How can prices be read from Swiggy Instamart and Flipkart Minutes?

Ticket: [`../issues/03-access-instamart-minutes.md`](../issues/03-access-instamart-minutes.md)
Researched: 2026-10-19. Every finding below carries the date of its source or of my observation. These platforms change their web builds every few weeks, so treat anything older than about a month as possibly stale.

Method: I read Swiggy's developer docs, both platforms' terms and robots.txt, and the source code of the open-source GitHub projects listed below, not only their READMEs. I also sent one plain, logged-out request each to `swiggy.com/instamart` and `flipkart.com/flipkart-minutes-store` to see what an anonymous client gets back. I did not create an account, log in, or send repeated requests.

---

## TL;DR

| | Swiggy Instamart | Flipkart Minutes |
|---|---|---|
| Web version? | **Yes.** `www.swiggy.com/instamart` (plus the app) | **Yes, but hidden.** It is a `marketplace=HYPERLOCAL` mode of flipkart.com behind an address gate (plus the main Flipkart app and a beta standalone app) |
| Official API usable by one household? | **Yes: Swiggy MCP (Builders Club).** OAuth with the household's own account. `search_products` returns MRP and offer price per SKU, and `get_cart` returns the full bill breakdown | **No.** No official consumer, partner or MCP API. The Affiliate API does not cover Minutes |
| Internal web API | `POST /api/instamart/search/v2` behind AWS WAF, needing location cookies | `POST {n}.rome.api.flipkart.com/api/4/page/fetch` with `marketplace=HYPERLOCAL` and `locationContext.pincode`, after the address gate is passed |
| How location is set | Lat/lng → dark store (`storeId`). MCP uses a saved `addressId` | Full address via Google Places → `mypin` and hyperlocal shop. A pincode alone is not reliably enough |
| Prices vary by location? | Yes, per dark store | Stock and listing vary per hyperlocal shop. Price variation is likely but not proven |
| Login needed to see prices? | No for catalogue prices on the web (location only). Yes for MCP and for reading your own cart and fees | No for catalogue prices once an address is set. Not verified for cart and fees |
| Anti-bot | AWS WAF JS challenge (I observed it today), CAPTCHA escalation, IP and session sensitivity, a stale `matcher` header breaks requests | Lighter. Address gate, regional DC redirects (HTTP 406), cart API rate-limits hard (HTTP 429) |
| Feasibility for personal use | **Good via official MCP**, with caveats. Web-API fallback is fragile | **Moderate.** Only a browser session or reverse-engineered API works. It is fragile, and the ToS forbids it |

---

## 1. Swiggy Instamart

### 1.1 Web or app-only?

- There is a web version as well as the app. Swiggy's own Terms of Use refer to "the Instamart website at www.swiggy.com/instamart or the Instamart mobile application (collectively 'Instamart Platforms')". Source: https://www.swiggy.com/terms-and-conditions (fetched 2026-10-19).
- Instamart is operated by a separate legal entity, Swiggy Instamart Private Limited. Source: same ToS page.
- On 2026-10-07, a third-party project searched the web catalogue at `https://www.swiggy.com/instamart/search?custom_back=true&query=…` and got live products back. Source: https://github.com/DebadityaHait/ShopLense/blob/main/docs/LIVE_VENDOR_AUDIT.md

### 1.2 Official and partner APIs: the Swiggy MCP servers ("Builders Club")

**What it is**
- Swiggy launched Builders Club, an MCP and developer programme. Their blog post on the launch is dated 2026-04-17 (https://mcp.swiggy.com/builders/blog/2026-04-17-builders-club-launch.md). Their changelog says v1.0 shipped in "2026-04" with "Instamart (19 tools)" (https://mcp.swiggy.com/builders/docs/operate/changelog.md).
- The servers are Food (`/food`), Instamart (`https://mcp.swiggy.com/im`), Dineout and Scenes. Source: https://mcp.swiggy.com/builders/docs/start/developer/index.md
- Later releases: UPI payments (2026-07-10), `create_address` GA (2026-08-24) and Swiggy Money (2026-09-30). Source: https://mcp.swiggy.com/builders/llms.txt

**Tools relevant to price comparison** (tool index: https://mcp.swiggy.com/builders/docs/reference/instamart/index.md)
- `search_products(query, addressId | latitude+longitude, offset)` is read-only and returns per-variant `price.mrp`, `price.offerPrice`, optional `unitLevelPrice`, `inStock`/`isAvail`, `isInStockAndAvailable`, `quantityDescription`, `maxQuantity`, `isPromoted` and `badges`. Its docs say "Prices may change with coupons, variants, add-ons, or stock updates, so use cart or order totals at checkout." Source: https://mcp.swiggy.com/builders/docs/reference/instamart/search_products.md
- `get_cart()` returns `billBreakdown.lineItems` (free-form `{label, value}` pairs for charges and discounts), `billBreakdown.toPay`, `cartTotalAmount`, `unserviceableItems` and `superData` (membership info). Source: https://mcp.swiggy.com/builders/docs/reference/instamart/get_cart.md
  - Fee labels are not a fixed schema. Swiggy says to read the labels at runtime and not to assume a label exists (same page).
- `update_cart` **"Replaces the entire cart."** Source: https://mcp.swiggy.com/builders/docs/reference/instamart/update_cart.md
  - Carts belong to the user's real Swiggy account. Swiggy says "Addresses, carts, orders are tied to your existing Swiggy account" (https://mcp.swiggy.com/builders/docs/start/consumer/index.md).
  - So pricing a basket through the cart would overwrite whatever the family currently has in their Instamart cart. I infer this from those two docs; I did not test it.
- `list_coupons` lists coupons for the current cart. It is "not completely rolled out yet; it may not appear in tools/list for every user". Source: https://mcp.swiggy.com/builders/docs/reference/instamart/list_coupons.md
- `your_go_to_items(addressId)` returns frequently or recently ordered items with variants and prices. This is useful for "staple tracking". Source: https://mcp.swiggy.com/builders/docs/reference/instamart/your_go_to_items.md
- Instamart has a ₹99 minimum order (`MIN_ORDER_NOT_MET`) and service-area restrictions (`ADDRESS_NOT_SERVICEABLE`). Source: https://mcp.swiggy.com/builders/docs/build/recipes/order-groceries.md

**Auth and access for one household**
- Auth is OAuth 2.1 with PKCE, signing in with phone number and OTP. The client registers itself (Dynamic Client Registration), so there is no client ID to apply for. Source: https://mcp.swiggy.com/builders/docs/start/authenticate.md
- Token lifetimes: access token 5 days, refresh token 30 days (rotating), session expires after 30 days of inactivity (sliding). Same page.
- Redirect URIs must be HTTPS, except that `http://localhost` is allowed. Custom schemes are allowed for known clients (`claude://`, `cursor://`, `vscode://`, `windsurf://`). Same page.
- **Personal use needs no approval.** The Builders Club page has a "Personal Use" path ("no access required") for connecting an AI client (https://mcp.swiggy.com/builders). Claude Desktop, ChatGPT, Cursor, VS Code and Windsurf configs are documented, and sessions may 401 "after a few days" and need re-auth (https://mcp.swiggy.com/builders/docs/start/consumer/use-in-ai-client.md).
- Building on `http://localhost` is "free and without approval" (https://mcp.swiggy.com/builders/docs/start/developer/index.md). Production needs an application, and v1 is "invite-based" (https://mcp.swiggy.com/builders/docs/operate/access.md).
- **Guest mode is ambiguous.** `search_products` and `update_cart` accept `latitude`/`longitude` for "guest" users (https://mcp.swiggy.com/builders/docs/reference/instamart/update_cart.md). But every documented call carries a Bearer token, and a missing token returns 401 (https://mcp.swiggy.com/builders/docs/start/authenticate.md). Assume login is required.
- **Rate limits** are not published. The gateway returns 429 with `Retry-After`. Swiggy asks for one session per user and low concurrency. Source: https://mcp.swiggy.com/builders/docs/operate/rate-limits.md

**Usage conditions that matter for this project**
- Credentials "can be revoked without notice for … Traffic patterns indicative of abuse (scraping, token abuse, bulk catalogue export)." Source: https://mcp.swiggy.com/builders/docs/operate/access.md
  - Checking a family basket of about 30 items, a few times a day, is not bulk export. Sweeping categories for deals could look like it.
- "Your integration can only use Swiggy-originated data to serve the user's immediate task (e.g. placing an order)", and data should be kept only as long as the session needs it. Source: https://mcp.swiggy.com/builders/docs/operate/data-and-compliance.md
  - Keeping a long-term price history for staple tracking sits uneasily with this. For one household using its own account, the practical risk is low, but it is not clearly permitted.
- Swiggy's Terms of Use (fetched 2026-10-19) include §15 "AI-Enabled Access and Automated Interactions". It says Swiggy "may permit users to access certain features of the Platform through … automated agents, including those operated by third parties", and instructions sent through such agents count as the user's own. Source: https://www.swiggy.com/terms-and-conditions
  - This gives the MCP route explicit contractual cover that scraping lacks.

### 1.3 Internal web API (reverse-engineered)

Endpoints, from code in [pawan67/instamart-alerts `instamart.py`](https://github.com/pawan67/instamart-alerts/blob/master/instamart_alerts/instamart.py). The author marks them "verified 2026-08-23", and the last commit was 2026-09-09.

| Step | Endpoint |
|---|---|
| area/pincode → place_id | `GET https://www.swiggy.com/api/instamart/maps/suggestions?input=` |
| place_id → lat/lng | `GET /api/instamart/maps/address-widgets/v2?place_id=` |
| lat/lng → dark store | `POST /api/instamart/home/select-location/v2`. The `storeId` appears only inside `swiggy://…?storeId=<n>` deeplinks in the response |
| search | `POST /api/instamart/search/v2?offset=…&storeId=…`, body `{"query","search_results_offset","page_type":"INSTAMART_SEARCH_PAGE",…}` |

- Prices come back as Google-style Money objects (`units` plus `nanos`), with `mrp`, `offerPrice` and `unitLevelPrice` per variation.
- Pages hold about 32 products. Pagination needs both `pageOffset.nextOffset` and `searchResultsOffset`; otherwise page 1 repeats.
- These details come from the same `instamart.py` file and from the [instamart-alerts README](https://github.com/pawan67/instamart-alerts) (2026-09).
- A second project confirms the same `search/v2` endpoint and required headers (`x-build-version`, `x-device-id`, an optional `matcher`) as of 2026-05-08: https://github.com/DebadityaHait/ShopLense/blob/main/SWIGGY_PROCEDURE.md

### 1.4 Location: how it is set and whether it matters

- Location is lat/lng resolved to a dark store. "Prices are per dark store, so the session is pinned to a store before searching." Source: https://github.com/pawan67/instamart-alerts (2026-09)
- On the web, the location lives in cookies (`lat`, `lng`, `address`, `userLocation`), which ShopLense calls "signed location cookies". Source: https://github.com/DebadityaHait/ShopLense/blob/main/SWIGGY_COOKIE_MANUAL.md (2026-05-08)
- Another scraper notes that Swiggy "does not bind its dark store from anything we can set directly". Its search request carries an empty `storeId` and an opaque `matcher` header, so results are "not guaranteed to be pincode-exact". Source: https://github.com/ubermachine/QuickComPY/blob/main/backend_py/scrapers/instamart.py (last push 2026-09-13)
- On MCP, location is a saved `addressId` from `get_addresses`, and availability is "at an address". Source: https://mcp.swiggy.com/builders/docs/reference/instamart/search_products.md
- For this household, use the real saved home address. Do not approximate it with a pincode centroid.
- Stock is per store too: `inStock` and `isInStockAndAvailable` per variant, and `unserviceableItems` in the cart (MCP docs above).

### 1.5 Login

- **Catalogue prices: no login needed on the web.** ShopLense (2026-10-07): "The user selected a Swiggy delivery location in the persistent browser without logging in. Its public search then returned HTTP 200. This established that an account login was not necessary." Source: https://github.com/DebadityaHait/ShopLense/blob/main/docs/LIVE_VENDOR_AUDIT.md
  - The same report saw a login prompt during unstable sessions.
- **Fees, membership effects and coupons: login needed.** These only show in a cart. MCP `get_cart` gives them for the logged-in user (§1.2).
- A Playwright-based project logs in by OTP and reports that the `_session_tid` cookie "persists for a year". Source: https://github.com/Hardik500/quick-commerce-mcp/blob/main/src/platforms/swiggy-instamart.ts (last push 2026-10-18)

### 1.6 Anti-bot measures

- **AWS WAF JS challenge.** My one plain logged-out request on 2026-10-19 to `https://www.swiggy.com/instamart` got `HTTP 202`, `server: CloudFront`, `x-amzn-waf-action: challenge`, and an empty body.
- instamart-alerts says that plain HTTP gets "a 202 + a challenge page". Its workaround: a headless Chromium solves the challenge once, the `aws-waf-token` is cached, and polls run as plain HTTP until 202 or 403 comes back. Source: https://github.com/pawan67/instamart-alerts/blob/master/instamart_alerts/session.py (2026-09)
- The same `session.py` handles further escalations:
  - an interactive CAPTCHA ("captcha.awswaf.com") that a headless browser cannot solve
  - "max challenge attempts exceeded"
  - outright IP blocks
  - token binding to the exit IP: rotating proxies break the session, so the proxy must stay pinned to one exit IP
- ShopLense (2026-10-07) adds:
  - a headless browser got `x-rate-limit: SignalAutomatedBrowser`
  - a stale `matcher` header broke search
  - the search failed from a Japanese VPN exit IP but worked from India and, intermittently, from a Norwegian VPN exit IP
  - headless Chrome cookies did work for Swiggy

  Source: https://github.com/DebadityaHait/ShopLense/blob/main/docs/LIVE_VENDOR_AUDIT.md
- **Implication:** an Indian residential connection (the home network) plus a real, occasionally refreshed browser session is the realistic setup. Datacenter or cloud hosts are likely to be challenged.

### 1.7 Terms of Use and robots.txt

- Swiggy ToS (fetched 2026-10-19): "You shall not use any 'deep-link', 'page-scrape', 'robot', 'spider' or other automatic device, program, algorithm or methodology, or any similar or equivalent manual process, to access, acquire, copy or monitor any portion of the Platform or any content…". Source: https://www.swiggy.com/terms-and-conditions
  - Web-API scraping breaches this.
  - The MCP route is the sanctioned exception under §15 (§1.2).
- `swiggy.com/robots.txt` (fetched 2026-10-19) disallows `/cart`, `/checkout`, `/auth*` and `/home` among others, and does not disallow `/instamart` or `/api`. Source: https://www.swiggy.com/robots.txt

### 1.8 Existing open-source projects (read in source; dates are last push or commit)

| Repo | Approach | Last activity | Notes |
|---|---|---|---|
| [pawan67/instamart-alerts](https://github.com/pawan67/instamart-alerts) | Headless Chromium mints a WAF token, then plain `httpx` calls to `search/v2` | 2026-09-09 | Best reference for the web API. Handles WAF, CAPTCHA, IP pinning and pagination. Discount alerts sent to Telegram |
| [DebadityaHait/ShopLense](https://github.com/DebadityaHait/ShopLense) | Node HTTP with cookies copied from a browser where the location was set by hand | 2026-10-07 | Live audit doc with VPN and headless experiments (very useful). Also covers Zepto, Blinkit and Flipkart |
| [triggered-exe/sasta-signals](https://github.com/triggered-exe/sasta-signals) | Playwright reads cookies, `storeId` and the `matcher` header, then calls the API | 2026-10-18 | Instamart and Flipkart Minutes price-drop tracker. Fixed for current site state on 2026-10-18 |
| [ubermachine/QuickComPY](https://github.com/ubermachine/QuickComPY) | zendriver (CDP) with a geolocation override plus the location cookie | 2026-09-13 | Hard-codes Ahmedabad 380001 lat/lng. Admits results aren't pincode-exact |
| [Hardik500/quick-commerce-mcp](https://github.com/Hardik500/quick-commerce-mcp) | Playwright UI automation with OTP login. Exposed as an MCP server, also covering Zepto and BigBasket | 2026-10-18 | Can add to cart and check out. Heavy |
| [Cubix33/Grocery-Price-Comparison](https://github.com/Cubix33/Grocery-Price-Comparison) | Playwright page scrape | 2026-09-16 | Single-commit project |
| [HKTITAN/swiggy-cli](https://github.com/HKTITAN/swiggy-cli), [jigar-dhulla/swiggy-mcp-php](https://github.com/jigar-dhulla/swiggy-mcp-php), [pranjal-joshi/ha-swiggy-mcp](https://github.com/pranjal-joshi/ha-swiggy-mcp) | Clients for the **official** Swiggy MCP | 2026-09-05, 2026-09-28, 2026-05-11 | Show that the OAuth/MCP route works for individuals |
| [KshKnsl/QuickCom](https://github.com/KshKnsl/QuickCom), [Sagargiri1707/quick-commerce-price-compare](https://github.com/Sagargiri1707/quick-commerce-price-compare) | Puppeteer page scrape, and a bare proxy to `/api/instamart` | 2025-07-27, 2025-01-06 | Stale. The bare proxy approach is now defeated by WAF |

Paid scraping vendors also sell Instamart data, e.g. https://www.actowizsolutions.com/swiggy-instamart-quick-commerce-data-scraping.php. That is not relevant for a household.

### 1.9 Verdict: Swiggy Instamart, personal use

**Feasible. Use the official Swiggy MCP as the primary path.**
- **What it gives:**
  - `search_products` against the family's saved address gives store-accurate MRP, offer price and stock.
  - It uses a sanctioned, documented interface that the ToS covers (§15).
  - It needs no WAF fighting.
  - OAuth refresh tokens last 30 days, sliding with use.
- **Caveats:**
  - A phone-OTP login is needed roughly monthly, or after any inactivity longer than 30 days.
  - Reading fees exactly needs `update_cart` → `get_cart`. That replaces the family's live Instamart cart, so either run it only when the family has nothing pending, or estimate fees from rules (ticket 05).
  - Fee labels are free text.
  - Keep call volume basket-sized (no category sweeps) to stay clear of the "scraping / bulk catalogue export" revocation clause.
  - Long-term price-history storage is outside the "immediate task" data rule. For one household's own data the risk is low, but note it.
- **Fallback:** the web `search/v2` API, with a browser-minted WAF token on the home connection. It works today, but breaks when the `matcher` or build header changes, when sessions go stale, and from non-residential IPs. It also breaches the anti-scraping ToS clause.

---

## 2. Flipkart Minutes

### 2.1 Web or app-only?

- **Web exists, gated behind an address.** My one plain logged-out request on 2026-10-19 to `https://www.flipkart.com/flipkart-minutes-store?marketplace=HYPERLOCAL` returned HTTP 200, but redirected to `https://www.flipkart.com/hyperlocal-preview-page?marketplace=HYPERLOCAL&originalUrl=…` with the page title "Flipkart Hyperlocal". There were no products or prices.
- On 2026-10-18 the sasta-signals project documented the Minutes web homepage, category URLs of the form `/hyperlocal/<name>/pr?sid=hloc%2F<id>&marketplace=HYPERLOCAL&BU=Minutes`, and an all-products fallback at `/all/pr?sid=all&marketplace=HYPERLOCAL`. Source: https://github.com/triggered-exe/sasta-signals/blob/main/backend/FLIPKART_MINUTES_README.md
- **Apps:** Minutes lives inside the main Flipkart app.
  - A standalone Minutes app launched on Google Play in beta, "only available to a select number of users". Inc42, 2026-09-09: https://inc42.com/buzz/flipkart-debuts-standalone-app-for-quick-commerce-platform-minutes/
- **Ahmedabad coverage:**
  - Ahmedabad is listed among Minutes cities in Flipkart's one-year update (Digital Terminal, 2025-08-19): https://digitalterminal.in/amp/story/e-commerce/flipkart-minutes-marks-one-year-with-50-mom-growth-and-50-million-unique-visitors
  - A CLSA analysis of 10 cities, including Ahmedabad, put Minutes at 627 dark stores and Instamart at 615 as of August 2026 (Franchise India, 2026-08-29): https://www.franchiseindia.com/insights/en/news/flipkart-minutes-overtakes-swiggy-instamart-in-dark-stores-across-top-10-cities.59605
  - Whether the family's address is served still has to be checked.

### 2.2 Official and partner APIs

- **None for consumers or Minutes.**
  - Flipkart's Affiliate API (v1.0) offers product feeds, keyword search, offers and DOTD, with no mention of grocery, hyperlocal, Minutes or pincode-specific pricing. Source: https://affiliate.flipkart.com/api-docs/affiliate_index.html (fetched 2026-10-19)
  - Flipkart's other developer API is the Seller API, which is for merchants. I found no first-party Flipkart MCP server or agentic-commerce programme as of 2026-10-19. Third-party "Flipkart MCP" offerings are scrapers or seller-API wrappers, e.g. https://brightdata.com/ai/mcp-server/flipkart and https://glama.ai/mcp/servers/k2zuahdu4e
- **Commercial third party:** a 2026-09-13 note describes "Anakin Wire" actions for `flipkart-com`: `set_delivery_address`, `list_products` (including `available_quantity`), `add_to_cart` and `view_cart`, with `auth: none` and paid per credit. Source: https://github.com/AshutoshVatsg/Sous_anakin/blob/main/MINUTES-WIRE.md
  - This is a paid proxy over the same internal APIs, not a Flipkart offering.

### 2.3 Internal web API (reverse-engineered)

- **Endpoint:** `POST https://1.rome.api.flipkart.com/api/4/page/fetch?cacheFirst=false`
- **Body:**
  - `pageUri`: a Minutes listing URI with `marketplace=HYPERLOCAL`
  - `requestContext.type`: `"BROWSE_PAGE"`
  - `locationContext`: `{"pincode": <6-digit>, "changed": false}`
- **Headers:** `flipkart_secure: true` and an `x-user-agent` ending in `FKUA/msite/0.0.4/msite/Mobile`.

Sources:
- [jairaj26/flipkart-minutes-deals `bot/config.py`](https://github.com/jairaj26/flipkart-minutes-deals/blob/main/bot/config.py) and [`bot/scraper.py`](https://github.com/jairaj26/flipkart-minutes-deals/blob/main/bot/scraper.py), last commit 2026-10-03
- [sasta-signals FLIPKART_MINUTES_README](https://github.com/triggered-exe/sasta-signals/blob/main/backend/FLIPKART_MINUTES_README.md), 2026-10-18

Response fields:
- Products are in `RESPONSE.slots[].widget` (`PRODUCT_SUMMARY_EXTENDED`, or DLS grid cards).
- Pricing: `pricing.finalPrice.value` (selling price), `pricing.prices[priceType=MRP]` and `pricing.totalDiscount`.
- Stock: `availability.displayState` (`IN_STOCK` / `OUT_OF_STOCK`).
- Pagination: `pageData.paginationContextMap`. Putting `page=2` in the URI alone repeats page 1.

Sources: same files, plus https://github.com/DebadityaHait/ShopLense/blob/main/FLIPKART_PROCEDURE.md (2026-05-08)

- Flipkart sometimes answers `406 DC Change`, pointing to a regional host such as `*.hyd.api.flipkart.com` that doesn't resolve everywhere. Retry across the `*.rome.api.flipkart.com` hosts. Source: sasta-signals README above (2026-10-18)
- **Product links:** listings carry `lid` (listing ID) and `shopId`, and Minutes links need `marketplace=HYPERLOCAL&lid=…&shopId=…` to open in Minutes. Source: https://github.com/jairaj26/flipkart-minutes-deals/blob/main/bot/scraper.py (2026-10-03)
- **Fees:** I found no reverse-engineered endpoint for Minutes delivery or handling fees. The Anakin note says Flipkart's cart API is `1.rome.api.flipkart.com/api/5/cart/browse` and "rate-limits hard" (HTTP 429, 45 s backoff). Source: https://github.com/AshutoshVatsg/Sous_anakin/blob/main/MINUTES-WIRE.md (2026-09-13)

### 2.4 Location: how it is set and whether it matters

- **Setting it requires a real address, not only a pincode.**
  - ShopLense (2026-05 and 2026-10-07): sending a pincode in `locationContext` "is insufficient". Minutes requests returned the address-gate `redirectionObject`, and regular Flipkart worked fine. Sources: https://github.com/DebadityaHait/ShopLense/blob/main/docs/LIVE_VENDOR_AUDIT.md and https://github.com/DebadityaHait/ShopLense/blob/main/FLIPKART_PROCEDURE.md
  - sasta-signals (verified 2026-10-18) sets the location by driving `https://www.flipkart.com/rv/checkout/changeShippingAddress/add?marketplace=HYPERLOCAL&…&isMap=true&addressBSTouchpoint=ENTER_LOCATION_MANUALLY`: type the address into the Google Places autocomplete, click the suggestion, then click Confirm. Flipkart then writes `localStorage.mypin`. Source: https://github.com/triggered-exe/sasta-signals/blob/main/backend/FLIPKART_MINUTES_README.md
  - jairaj26's bot also accepts a `FLIPKART_COOKIE` copied from a browser, alongside the pincode cookies (`snPincode`, `deliveryPincode`, `pincode`). Source: https://github.com/jairaj26/flipkart-minutes-deals/blob/main/bot/scraper.py
- **Does it vary by location?**
  - Stock, and the listing and shop serving you, vary: each listing carries a `shopId`, and stock is reported per listing (sources above).
  - The Anakin note: "Set the delivery address first — everything else is location-scoped." (https://github.com/AshutoshVatsg/Sous_anakin/blob/main/MINUTES-WIRE.md)
  - sasta-signals notes the category count "can vary by location and A/B test" (README above).
  - I found no primary source that proves selling prices differ between Minutes shops. Assume they can, as with every other dark-store model.

### 2.5 Login

- **Catalogue prices: no login needed.** sasta-signals drives an anonymous headless Playwright context. There is no login code in [`FlipkartMinutesController.js`](https://github.com/triggered-exe/sasta-signals/blob/main/backend/src/controllers/FlipkartMinutesController.js) or [`contextManager.js`](https://github.com/triggered-exe/sasta-signals/blob/main/backend/src/utils/contextManager.js) (2026-10-18). jairaj26's bookmarklet calls the Rome API with `credentials: "omit"` (https://github.com/jairaj26/flipkart-minutes-deals/blob/main/FKMinutes_Readable.js, 2026-10-03).
- **Fees: not verified.** On the anonymous path, delivery, handling and other fees only appear in the cart. Anakin's third-party `view_cart` returned `price` and `total_cost` with `auth: none` (2026-09-13 note above), which suggests a guest cart may work. I did not verify this, and the family's account (e.g. Flipkart VIP or SuperCoins) may change fees.

### 2.6 Anti-bot measures

- My single logged-out request on 2026-10-19 saw no challenge page, only the address gate.
- Regular Flipkart search works over plain Node HTTP without a session, including from Japanese and Norwegian VPN exit IPs (ShopLense, 2026-10-07: https://github.com/DebadityaHait/ShopLense/blob/main/docs/LIVE_VENDOR_AUDIT.md).
- **The friction for Minutes is:**
  - the address gate (§2.4)
  - cross-origin `fetch` blocked in some sessions, worked around by using Playwright `page.request`
  - 406 data-centre redirects
  - HTTP 429 rate limits on the cart API

  Sources: sasta-signals README (2026-10-18) and the Anakin note (2026-09-13), both above.
- sasta-signals rotates "real" Chromium user agents and uses "stealth flags" in its Playwright launch (https://github.com/triggered-exe/sasta-signals/blob/main/backend/src/utils/contextManager.js). Some fingerprint-based detection is likely, though not documented.

### 2.7 Terms of Use and robots.txt

- Flipkart Terms of Use (fetched 2026-10-19): "You shall not use any 'deep-link', 'page-scrape', 'robot', 'spider' or other automatic device, program, algorithm or methodology … to access, acquire, copy or monitor any portion of the Platform or any Content … We reserve Our right to bar any such activity." The same terms say content may be used "only for your personal, non-commercial informational purpose". Source: https://www.flipkart.com/pages/terms
  - Personal use does not exempt automated access. There is no sanctioned automated channel.
- `flipkart.com/robots.txt` (fetched 2026-10-19) disallows `/search?`, `*page=*`, `*sort=*` and `*=facets*`. That covers most of the Minutes listing URIs that scrapers use. Source: https://www.flipkart.com/robots.txt

### 2.8 Existing open-source projects

| Repo | Approach | Last activity | Notes |
|---|---|---|---|
| [triggered-exe/sasta-signals](https://github.com/triggered-exe/sasta-signals) | Headless Playwright sets the address through the Places UI, then calls the Rome API via `page.request` | 2026-10-18 (Minutes fix) | Most current, working Minutes reference. Also covers Instamart and Flipkart Grocery |
| [jairaj26/flipkart-minutes-deals](https://github.com/jairaj26/flipkart-minutes-deals) | Bookmarklet that runs inside the user's own flipkart.com tab, plus a Python bot (Rome API with pincode cookies and an optional copied cookie) posting to Telegram via GitHub Actions/cron | 2026-10-03 | Discount-sorted deal discovery by category. The in-tab bookmarklet is the least invasive pattern |
| [DebadityaHait/ShopLense](https://github.com/DebadityaHait/ShopLense) | Plain HTTP to the Rome API with `marketplace=HYPERLOCAL` | 2026-10-07 | **Fails** for Minutes (hits the address gate) and falls back to regular Flipkart. Useful negative result |
| [AshutoshVatsg/Sous_anakin](https://github.com/AshutoshVatsg/Sous_anakin) | Paid Anakin Wire actions | 2026-09-15 | Documents cart 429s and `available_quantity` |

Paid scrapers also exist, e.g. https://www.actowizsolutions.com/flipkart-minutes-data-scraping.php.

### 2.9 Verdict: Flipkart Minutes, personal use

**Moderately feasible, but only by unofficial means.**
- There is no official API.
- **Viable approach:** use a persistent browser profile on the home machine with the family's real address set once through Flipkart's address UI, then call the Rome `page/fetch` API from inside that context (the sasta-signals pattern), or run in-page like jairaj26's bookmarklet. This gets per-shop selling price, MRP and stock without login, at low request volume.
- **Costs:**
  - It breaches Flipkart's anti-scraping ToS clause.
  - The address-gate flow and the response shapes (slots vs. DLS cards) change. sasta-signals needed fixes on 2026-10-18.
  - Fee capture is unverified and the cart API rate-limits.
- **Fallback:** manual or semi-manual entry (e.g. a bookmarklet the family runs on their own phone or laptop) if automation proves too brittle.

---

## 3. Open questions to settle with the family's real setup

1. Does Swiggy MCP `search_products` work at the family's saved Ahmedabad address, and does `update_cart` overwrite the cart the family sees in the app? Test once, with consent, when the cart is empty.
2. Is Flipkart Minutes serviceable at the home address, and are fees visible in a guest cart or only when logged in?
3. Do Instamart prices differ between MCP and the app for the same address? The MCP docs only promise that cart totals are authoritative.
