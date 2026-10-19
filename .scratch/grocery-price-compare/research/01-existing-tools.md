# Research: Does an existing app or extension already solve this?

Ticket: [`../issues/01-existing-tools.md`](../issues/01-existing-tools.md)
Researched: 2026-10-19. Dates in brackets are when a fact was published, or the "updated" or last-push date of the source on the day I checked it.
Method: tools' own sites, Play Store and App Store listings, GitHub repo metadata via the `gh` API, and press. I did not create any accounts, log in or install anything. Where the only source for a feature is the vendor's marketing copy, the text says so.

## TL;DR

- **Several consumer apps claim most of what we want, but none is trustworthy enough to adopt as-is.** Rozmo, Comparify, Comparoo and Smartprix all advertise multi-app comparison by pincode. Rozmo and Smartprix also claim whole-cart totals that include fees. Every one is closed-source, and none publishes how it gets prices. Recent Play Store reviews of every one we could read report prices that don't match the real apps. None says it supports Ahmedabad: Rozmo lists five metros, and Ahmedabad isn't one of them.
- **No single tool covers all six platforms with a fee-inclusive basket.** Amazon Fresh or Now is the platform most often missing.
- **The big change in 2026 is official, account-scoped access.** Swiggy Instamart and Zepto each run an official MCP server that logs in with OAuth and offers search, cart and order tools. Instamart's also returns a cart bill breakdown. Neither exposes coupons or "deals" yet. Blinkit, BigBasket, Flipkart Minutes and Amazon have no official equivalent; the only ways in are reverse-engineered web endpoints or browser automation.
- **Open-source projects are all young, have 0–51 stars, and are maintained by one person.** The two most worth borrowing from are [Hardik500/quick-commerce-mcp](https://github.com/Hardik500/quick-commerce-mcp) (MIT; logged-in browser automation that returns itemised fees) and [ironman-gampala/compari5](https://github.com/ironman-gampala/compari5) (a clear per-platform integration map for five platforms; **no licence**, so we can reuse the ideas but not the code).
- **Recommendation: build, borrowing ideas.** Use the official Zepto and Instamart MCPs for those two apps. For Blinkit, BigBasket and Flipkart Minutes, copy the approaches documented in compari5, blinkit-mcp and quick-commerce-mcp. Fees have to be read from a logged-in cart, because no read-only search shows them. Details are under [Recommendation](#recommendation).

## Why this is hard (context for judging every tool)

- **Prices depend on who is asking.** MediaNama tracked 13 items on Blinkit, Instamart and Zepto from Dec 2024 to Jan 2025 [published 2025-01-21]. Prices varied by city, by device (Android vs iOS), by how often the user orders, and by whether they were logged in. Logged-out prices were "generally cheaper". — https://www.medianama.com/2025/01/223-medianama-analysis-differential-pricing-instamart-blinkit-zepto/
- **A scraper in a data centre sees a different dark store from you.** The author of one open-source extension says this is why comparison apps "have a recurring complaint in their reviews: the prices shown don't match the apps", because prices are tied to the dark store nearest you. — https://github.com/Santhoshsiddhu75/quick-price-compare
- **Datacenter IPs get blocked.** Blinkit and Flipkart Minutes block them, and BigBasket's main site often returns Akamai 403s. — https://github.com/ironman-gampala/compari5/blob/main/IMPLEMENTATION.md

So for our household, "accurate" means asking each platform as *our* account, at *our* address, from a residential connection. Most third-party apps can't do that.

## Coverage matrix

Legend: ✅ claimed or verified · ❌ not supported · ? unclear. "Basket" means a whole list priced per app. "Fees" means delivery, handling or small-cart fees are counted in that basket total.

| Tool | Type | Zepto | Instamart | Blinkit | BigBasket / BB Now | Amazon Fresh / Now | Flipkart Minutes | Basket | Fees in total | Tracking / alerts | Freshness |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Rozmo | Android, iOS, web | ✅ | ✅ | ✅ | ✅ | ✅ (Now) | ✅ | ✅ | ✅ (claimed) | ✅ "inflation creep" alerts (claimed) | Play updated 2026-10-02, 500+ installs |
| Comparify | Android, web | ✅ | ✅ | ✅ | ✅ | ✅ (Now, web only) | ✅ | ✅ shopping list | Fees claimed for food; grocery unclear | ✅ price alerts (app) | Play updated 2026-10-16, 1L+ installs |
| Comparoo | Android | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ "Smart Cart" split | ? | ? | Play updated 2026-09-29, 1L+ installs |
| Smartprix quick-commerce tool | Web, app | ✅ | ✅ | ✅ | ✅ (BB Now) | ✅ (Fresh) | ✅ | ✅ | ✅ (claimed) | Not mentioned for groceries | Article updated 2026-07-24 |
| Quick Compare | Android, iOS | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | "tracking" (vague) | **Play last updated 2025-02-18 (stale)** |
| ShopSwiftly | Android, web | ✅* | ✅ | ✅ | ✅ | ❌ | ❌ | ? | ? | ? | Play updated 2026-10-14 |
| Buyhatke | Android, extension | ? | ? | ? | ? | ? | ? | ? | ? | ✅ (mainly e-commerce) | Play updated 2026-10-16 |
| Swiggy Instamart MCP (official) | API for AI clients | – | ✅ | – | – | – | – | ✅ own cart | ✅ bill breakdown | ❌ | Live 2026 |
| Zepto MCP (official) | API for AI clients | ✅ | – | – | – | – | – | ✅ own cart | ? | ❌ | Live 2026 |
| quick-commerce-mcp (OSS) | MCP, browser automation | ✅ | ✅ (not reverified) | ✅ | ✅ (dev) | ❌ | ❌ | ✅ | ✅ itemised | ❌ | Pushed 2026-10-18 |
| compari5 (OSS) | Next.js web app | ✅ | ✅ | ✅ | ✅ (BB Now) | ❌ | ✅ | ✅ basket | ❌ (says so) | ❌ | Pushed 2026-09-25 |
| ShopLense (OSS) | Next.js dashboard | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ? | ✅ price, drop and restock alerts | Pushed 2026-10-07 |
| grocery-cockpit (OSS) | Local PWA, Python + Playwright | ✅ (probe) | ? | ? | ? | ? | ? | ✅ split-basket logic | ? | ✅ 10- and 30-day value alerts | Pushed 2026-06-07 |

\* ShopSwiftly's Play listing names Instamart, Blinkit and BigBasket. A DesiDime commenter adds Zepto and JioMart. Sources for every cell are in the sections below.

---

## 1. Consumer apps and websites

### Rozmo (Imbine Technologies)
- **Platforms covered:** Zepto, Blinkit, Instamart, BigBasket, DMart Ready, Flipkart Minutes, Milkbasket and Amazon Now. — https://rozmo.in/ and https://play.google.com/store/apps/details?id=in.rozmo.app
- **Basket:** The "Smart Cart" shows "estimated totals across platforms (including delivery fees and platform charges)". The "Multi-Store Basket Optimizer" finds the cheapest single app or a two-item split. — https://play.google.com/store/apps/details?id=in.rozmo.app and https://rozmo.in/
- **Fees and deals:** Rozmo claims a "True Checkout Total" that includes taxes, delivery and packaging, plus live surge and handling-fee tracking for your pin code. — https://rozmo.in/
- **Location:** Uses an address or GPS plus "store-level pricing for your pincode". The site says it serves Delhi NCR, Bengaluru, Mumbai, Hyderabad and Pune. **Ahmedabad is not listed**, although the app has a Gujarati UI. — https://rozmo.in/
- **Tracking:** Alerts when staples such as atta, dal, rice, ghee and oil creep up in price, plus spend analytics. — https://rozmo.in/
- **Cost:** Free. — https://rozmo.in/
- **Freshness:** Play Store updated 2 Oct 2026 with 500+ downloads. The App Store listing exists, with dates in late Sep to Oct 2026. — https://play.google.com/store/apps/details?id=in.rozmo.app and https://apps.apple.com/in/app/rozmo-grocery-price-compare/id6802759929
- **Gotchas:** It is very new and small. Every claim is vendor copy we couldn't verify. "Linked store sessions" suggests it logs into your store accounts on the phone. — https://rozmo.in/
- **Verdict:** On paper it is the closest match to all three jobs. It is worth a hands-on trial before we build, to see whether it serves Ahmedabad and whether its totals match the real checkouts. It can't be adopted as our core: it's closed, unverified, and unlikely to fit our "usual list" workflow.

### Comparify (comparify.pro, built by "Akshat")
- **Platforms covered:** Blinkit, Instamart, Zepto, BigBasket, Flipkart Minutes, JioMart and DMart, according to the Play listing. The website adds MilkBasket and Amazon Now. — https://play.google.com/store/apps/details?id=com.akshat.comparify and https://comparify.pro/
- **Basket:** The web tool compares **one item at a time**, and carts live in the app. — https://comparify.pro/grocery-price-comparison. The app can "build a grocery shopping list and see total savings across stores" and compares unit prices across pack sizes. — https://play.google.com/store/apps/details?id=com.akshat.comparify
- **Fees:** The listing claims "final prices with coupons applied and fees calculated" and "account-specific deals". The fee and coupon wording is clearest for food and cabs; for groceries the web page says only that prices vary with fees and discounts. — https://play.google.com/store/apps/details?id=com.akshat.comparify and https://comparify.pro/grocery-price-comparison
- **Location:** Uses a delivery address matched by pincode. — https://comparify.pro/grocery-price-comparison
- **Tracking:** Price-drop alerts exist, but only in the app and on the phone where you set them. — https://comparify.pro/price-alerts
- **Cost:** Free. — https://comparify.pro/grocery-price-comparison
- **Freshness:** Play Store updated 16 Oct 2026, 1L+ downloads. — https://play.google.com/store/apps/details?id=com.akshat.comparify
- **Gotchas:** A review from 17 Aug 2026 says the app usually shows "no internet" on Jio IP ranges. — https://play.google.com/store/apps/details?id=com.akshat.comparify

### Comparoo
- **Platforms covered:** Blinkit, Zepto, Instamart, BigBasket and Flipkart Minutes. No Amazon. — https://play.google.com/store/apps/details?id=com.automation.jediapp
- **Basket:** "Smart Cart" splits a basket across apps for the lowest total. Fee handling isn't stated. — same listing.
- **Access model:** Comparing needs no account. The listing also says it "reads only the prices shown on screen… You choose which apps to connect", which suggests on-device reading of the real apps. — same listing.
- **Freshness:** Updated 29 Sep 2026, 1L+ downloads. — same listing.
- **Gotchas:** A review from 15 Sep 2026 reports ₹424 shown in Comparoo against ₹524 in the real app, and a forced phone-number redirect. — same listing.

### Smartprix quick-commerce compare
- **Platforms covered:** Amazon Fresh, Flipkart Minutes, Zepto, Blinkit, BB Now and Instamart, plus DMart where it serves the pincode. — https://www.smartprix.com/bytes/smartprixs-new-tool-finally-lets-you-price-compare-blinkit-zepto-and-instamart-before-you-order/ [updated 2026-07-24]
- **Basket and fees:** Shows a cart-level table with one column per store and a total that includes "fees, delivery charges, and discounts". Out-of-stock items are flagged. — same article.
- **Login, cost and freshness:** No login and free. Prices refresh "several times an hour", which means they are cached rather than live. — same article.
- **Tracking:** Not mentioned for groceries. The Play listing (updated 22 Dec 2025) still describes Smartprix as a gadgets tool. — https://play.google.com/store/apps/details?id=com.smartprix.main
- **Gotchas:** Reviews from 20 Apr and 1 Jun 2026 say prices and availability don't match the stores. — https://play.google.com/store/apps/details?id=com.smartprix.main. The `/grocery` page returned 403 to automated fetches, so I couldn't inspect it directly (https://www.smartprix.com/grocery).
- **Verdict:** This is the only tool that names **Amazon Fresh** as well as Minutes. It's fine for a quick manual sanity check, but it has no logged-in pricing and no tracking for groceries.

### Quick Compare (Mobinet Innovations)
- **Platforms covered:** Instamart, Zepto, Blinkit, Flipkart Minutes and BigBasket. It compares price, availability and ETA for each item. — https://play.google.com/store/apps/details?id=com.quickcompare.app and https://apps.apple.com/app/id6737258065
- **Basket:** None. It compares individual items side by side. — https://gadgetstouse.com/blog/2025/05/13/compare-prices-for-zepto-blinkit-instamart-jio-mart/
- **Freshness:** **Play Store last updated 18 Feb 2025**, which is stale, although it has 5L+ downloads. — https://play.google.com/store/apps/details?id=com.quickcompare.app
- **Gotchas:** Reviews from 27 Jun and 22 Jul 2026 say prices "often do not match" and matching fails when product names differ. — same listing. DesiDime users said the prices looked cached and were "not 100% accurate". — https://www.desidime.com/discussions/quick-compare-app-compare-grocery-prices-from-various-quick-commerce-apps-in-real-time
- **Verdict:** Not suitable.

### ShopSwiftly (SoarTech)
- **What it is:** Compares Instamart, Blinkit and BigBasket, and now also sells crypto recharges and gift cards. — https://play.google.com/store/apps/details?id=com.soartech.shopswiftly.shopswiftly [updated 2026-10-14]
- **Gotchas:** Reviews mention ads you must watch before searching (13 Aug 2026) and an update that won't open (7 Sep 2026). — same listing. Some stores fail to load because of API issues. — https://www.desidime.com/discussions/zepto-price-and-discount-based-sorting-hack-on-desktop-site-d7fc5dcf-df27-4a15-8d0b-6e328f6fbe3f?page=2
- **Verdict:** Not suitable.

### Buyhatke
- **What it is:** A general shopping assistant with price history and price-drop alerts. Those are proven for Amazon and Flipkart. It also has a "Grocery Comparison" feature, but the listing doesn't name the platforms it covers. — https://play.google.com/store/apps/details?id=com.buyhatke.assistant [updated 2026-10-16]
- **Gotchas:** A review from 12 Sep 2026 says it shows a product as unavailable elsewhere when it's actually cheaper there. — same listing.
- **Verdict:** Its tracking model is good for e-commerce, but it's unproven for quick commerce.

### Not relevant
- **Saavio:** Android only, with results in separate tabs per app and no side-by-side comparison [2025-05]. — https://gadgetstouse.com/blog/2025/05/13/compare-prices-for-zepto-blinkit-instamart-jio-mart/
- **"Spending Calculator for Zepto & Blinkit" and "Grocery Order Calculator":** Chrome extensions that analyse your own spend, not prices across apps. — https://chromewebstore.google.com/detail/dhemhbgajkjdaeocgmpoenpmohmamfkh and https://chromeboard.com/extension/grocery-order-calculator-albbnlooogghdloekaomigddfleeblfn
- **Actowiz, 42Signals, quickcommerceapi.com and similar:** Commercial B2B data vendors aimed at brands, not households. — https://www.actowizsolutions.com/scrape-blinkit-zepto-instamart-quick-commerce-2026.php and https://quickcommerceapi.com/mcp

---

## 2. Official platform access (new in 2026, highly relevant)

### Swiggy Instamart MCP (official)
- **Endpoint:** `https://mcp.swiggy.com/im`. Tools cover product search at your delivery location, and cart management with "pricing, and bill breakdown with detailed cost analysis". Orders are COD only. — https://github.com/Swiggy/swiggy-mcp-server-manifest (161★, created 2025-12-05, pushed 2026-04-24)
- **Launch:** Launched for consumers on 28 Jan 2026. — https://www.exchange4media.com/industry-briefing-news/swiggy-launches-model-context-protocol-to-enable-orders-via-chatgpt-and-other-ai-tools-151410.html
- **Restrictions:**
  - The manifest says "Third-party app development is not permitted at this time". — https://github.com/Swiggy/swiggy-mcp-server-manifest
  - Builders Club, announced 17 Apr 2026, is "invite-led" and was "launching soon" at the time. — https://mcp.swiggy.com/builders/blog/2026-04-17-builders-club-launch/
  - Localhost redirect URIs are on the allowlist, so a personal local client can log in. — https://github.com/Swiggy/swiggy-mcp-server-manifest
- **Gotchas:**
  - Don't keep the Swiggy app open at the same time, because sessions can conflict. — https://github.com/Swiggy/swiggy-mcp-server-manifest
  - Swiggy tokens last about 5 days with **no refresh token**, so you have to sign in again roughly weekly. — https://github.com/akstlab/food-cli
- **Endpoint check:** `https://mcp.swiggy.com/im` answered 401 "Authentication required" on 2026-10-19. That means it's live and needs OAuth.

### Zepto MCP (official)
- **Endpoint:** `https://mcp.zepto.co.in/mcp`. Tools cover live product search, cart (synced to your account), order placement and order history. Login is OAuth with an Indian mobile number and OTP. — https://github.com/zeptonow/mcp (50★, created 2025-12-09, README pushed 2026-02-18, 53 open issues)
- **Scopes advertised:** The public OAuth metadata lists scopes for catalog search and lookup, location search and lookup, and cart, checkout and order management. — https://mcp.zepto.co.in/.well-known/oauth-protected-resource (fetched 2026-10-19)
- **Tokens:** Last about 7 days and come **with** a refresh token. — https://github.com/akstlab/food-cli
- **Gotchas (open issues):**
  - Coupons and offers aren't exposed. — https://github.com/zeptonow/mcp/issues/29
  - The "Steal Deals" stores aren't exposed. — https://github.com/zeptonow/mcp/issues/67
  - `search_products` has returned 429 errors. — https://github.com/zeptonow/mcp/issues/33
  - MCP cart changes don't always show in the app. — https://github.com/zeptonow/mcp/issues/74 and https://github.com/zeptonow/mcp/issues/62
  - Someone has asked for sanctioned third-party access to pricing. — https://github.com/zeptonow/mcp/issues/57
  - Many third-party apps are queuing for redirect-URI allowlisting, but localhost is already allowed. — https://github.com/zeptonow/mcp/issues
- **Fees not documented:** The README doesn't document a bill or fee breakdown. You'd have to inspect a cart to confirm fees can be read.

### Blinkit, BigBasket, Flipkart Minutes, Amazon
- No official consumer MCP or API turned up in searches. A Bright Data "Flipkart" MCP exists, but it is a commercial scraper. — https://brightdata.com/ai/mcp-server/flipkart
- Community Blinkit MCPs exist (see §3), and a GitHub issue on one of them asks for the same for Zepto, Instamart and Minutes. — https://github.com/hereisSwapnil/blinkit-mcp/issues/3

---

## 3. Open-source projects (GitHub metadata pulled 2026-10-19 via the API)

None of these projects is popular or long-lived. Treat each as a reference implementation, not a dependency.

### Borrow candidates

**[Hardik500/quick-commerce-mcp](https://github.com/Hardik500/quick-commerce-mcp)**: MIT, 3★, created 2026-02-12, pushed 2026-10-18. npm `quick-commerce-mcp` v1.8.0 had 1,675 downloads in the month to 2026-10-16. — https://registry.npmjs.org/quick-commerce-mcp and https://api.npmjs.org/downloads/point/last-month/quick-commerce-mcp
- **Platforms covered:** Zepto, Blinkit and Swiggy Instamart, with BigBasket in development. It drives your own Chrome with a logged-in, OTP-based session.
- **Fees:** Itemised bills list handling, late-night, GST and other fees. One BigBasket check recorded "items ₹126.50, handling ₹8".
- **Basket:** `compare_prices`, `resolve_items` and a "Smart Cart" that suggests how to split across platforms. It also reads order history for Blinkit, Zepto and BigBasket.
- **Status (honest, as of 2026-10-04):** Blinkit and Zepto search and cart were live-verified. **Instamart was not reverified.** The full multi-platform `compare_prices` flow was not reverified.
- **Gaps:** No Amazon and no Minutes.
- Source for everything above unless noted: https://github.com/Hardik500/quick-commerce-mcp
- **Why it matters:** It is the closest existing match to our job 1 (an all-in basket total from logged-in carts). Its bill parser and cart-validation logic are worth borrowing. The browser-automation approach needs a desktop machine with Chrome.

**[ironman-gampala/compari5](https://github.com/ironman-gampala/compari5)**: **no licence**, 0★, created 2026-09-06, pushed 2026-09-25.
- **Platforms covered:** Live search across Blinkit, Instamart, Zepto, BigBasket (BB Now) and Flipkart Minutes, at a geocoded address and pincode.
- **Basket:** Has a per-store basket and saved baskets, but "Delivery fees are not included". — https://github.com/ironman-gampala/compari5
- **What it documents per platform** (all from https://github.com/ironman-gampala/compari5/blob/main/IMPLEMENTATION.md):
  - Blinkit: guest `auth_key` plus lat/lng headers, called through the `impit` Chrome-TLS client.
  - Instamart: guest web search, falling back to the official MCP.
  - Zepto: official MCP (`get_location_serviceability` → `select_store` → `search_products`), falling back to puppeteer.
  - BigBasket: `bbnow.bigbasket.com` `listing-svc/v2/products` with pin cookies.
  - Flipkart Minutes: `rome.api.flipkart.com` serviceability → location update → `page/fetch?marketplace=HYPERLOCAL`.
  - It also notes that Blinkit and Minutes need a residential IP.
- **Why it matters:** This is the best "how to reach each platform" map available. With no licence we can't copy the code, but we can follow the documented approach.

**[yniks/blinkit-mcp](https://github.com/yniks/blinkit-mcp)**: MIT, 2★, created and pushed 2026-07-07.
- **Approach:** API-only Blinkit. It uses `impit` to get past Cloudflare TLS fingerprinting, `auth_key` bootstrap, and headless OTP login. Tools include search, cart, `view_cart`, checkout and order history, and it has a `RESEARCH.md` that documents the endpoints.
- Source: https://github.com/yniks/blinkit-mcp
- **Where it's used:** The read-only Blinkit side of wigeria/grocery-comparison (below) is built on it.

**[hereisSwapnil/blinkit-mcp](https://github.com/hereisSwapnil/blinkit-mcp)**: MIT, 51★, created 2025-12-21, pushed 2026-09-24. Playwright-based Blinkit search, cart, location and checkout, logged in with OTP. — https://github.com/hereisSwapnil/blinkit-mcp

**[wigeria/grocery-comparison](https://github.com/wigeria/grocery-comparison)**: MIT, 0★, created and pushed 2026-10-05.
- **What it is:** A household tool very like ours. You type or photograph a list, Claude builds a Zepto cart through the official MCP, and the app prices the same cart on Blinkit and compares "the actual totals, delivery fees included". It runs on a home laptop and is used from a phone.
- **Gotchas:** Its Blinkit prices come from the website, which "aren't always the same as the app's". It covers only two platforms.
- **Worth borrowing:** The safety design. It fingerprints the cart the user reviewed, and the model never gets the order tools.
- Source: https://github.com/wigeria/grocery-comparison

**[akstlab/food-cli](https://github.com/akstlab/food-cli)**: MIT, 1★, created 2026-08-01, pushed 2026-08-03. A CLI client for the official Swiggy and Zepto MCPs. Its README documents real-world OAuth quirks:
  - Zepto rejects `127.0.0.1` redirects, so use `localhost`.
  - Zepto tokens need RFC 8707 `resource=https://mcp.zepto.co.in`.
  - Swiggy issues no refresh token.
  - Source: https://github.com/akstlab/food-cli

### Ideas or UX to borrow (tracking, deals, basket logic)

- **[suttalogic-hub/grocery-cockpit](https://github.com/suttalogic-hub/grocery-cockpit):** MIT, 0★, created 2026-06-05, pushed 2026-06-07, alpha. A local-first watchlist with exact, same-size, category and unit-price matching modes. It keeps price history with 10- and 30-day value alerts, decides whether splitting a basket is worth the extra orders, and runs as a phone-friendly PWA. Its provider probes use your own browser sessions. It is the closest conceptual match to jobs 2 and 3, but its providers are still experimental. — https://github.com/suttalogic-hub/grocery-cockpit
- **[DebadityaHait/ShopLense](https://github.com/DebadityaHait/ShopLense):** no licence, 0★, pushed 2026-10-07. A portfolio dashboard covering Zepto, Blinkit, Flipkart Minutes and Instamart. It groups matching products and has a worker that sends price-threshold, discount-drop and restock alerts through ntfy.sh or web push. Worth reading for its alert design. — https://github.com/DebadityaHait/ShopLense
- **[smrutiranjanp/Commerce-Price-MCP](https://github.com/smrutiranjanp/Commerce-Price-MCP):** no licence, 0★, pushed 2026-09-12. Its useful idea is a clean adapter contract of `{query, pincode, quantity, unit}` → `{price, mrp, deliveryFee, inStock}`. It ranks by "landed price" and keeps price history in JSONL. It ships no real connectors. — https://github.com/smrutiranjanp/Commerce-Price-MCP
- **[jairaj26/flipkart-minutes-deals](https://github.com/jairaj26/flipkart-minutes-deals):** MIT, 2★, pushed 2026-10-03. A bookmarklet that scans 38+ Minutes categories in the background and sorts them by discount. It is a deal-discovery approach for Minutes. — https://github.com/jairaj26/flipkart-minutes-deals
- **[Harsh-Gopal/CartRadar](https://github.com/Harsh-Gopal/CartRadar):** no licence, 11★, pushed 2026-10-05. Checks one product link for stock and price across nearby dark stores on Zepto, Instamart, BigBasket, Blinkit, Minutes and BB Now. Amazon Fresh is "planned". It isn't a basket tool. — https://github.com/Harsh-Gopal/CartRadar
- **[Santhoshsiddhu75/quick-price-compare](https://github.com/Santhoshsiddhu75/quick-price-compare):** MIT, 0★. A browser extension that simply opens the same search on seven platforms in your own logged-in browser and doesn't scrape anything. It's a zero-maintenance fallback that gives exact prices but makes you read them yourself. — https://github.com/Santhoshsiddhu75/quick-price-compare

### Skip

These are toys, mock data, or abandoned:
- [KshKnsl/QuickCom](https://github.com/KshKnsl/QuickCom): last push 2025-07-27.
- [monizb/trivagro](https://github.com/monizb/trivagro): last push 2024-04-06.
- [poojitha-k-dev/Price-pulse](https://github.com/poojitha-k-dev/Price-pulse): prices are "manually seeded approximations".
- [Hritik-74/kartbot](https://github.com/Hritik-74/kartbot): one-day-old WhatsApp-bot scaffold.
- A long tail of 0★ student projects. — https://github.com/search?q=blinkit+zepto+compare&type=repositories

---

## How well each job is covered today

| Job | Best existing coverage | Gap |
|---|---|---|
| 1. Basket compare, all-in with fees | Rozmo and Smartprix claim it, with unverified accuracy and no Ahmedabad confirmation. quick-commerce-mcp actually reads itemised fees from logged-in carts, but only for Blinkit and Zepto (verified) plus Instamart and BigBasket (unverified or in development). | No tool reliably covers all six platforms with logged-in, fee-inclusive totals. **Amazon Fresh/Now is missing from every OSS project.** Membership perks such as Zepto Pass, Swiggy One and Blinkit's free-delivery thresholds aren't modelled anywhere we found. |
| 2. Deal discovery | The flipkart-minutes-deals bookmarklet (Minutes only) and per-item discount fields in the scrapers. | The official MCPs don't expose coupons or deals: Zepto issues #29 and #67 are open. Bank and card offers aren't covered anywhere. |
| 3. Staple tracking | Rozmo's "inflation creep" alerts (claimed), Comparify's app alerts, and the ShopLense and grocery-cockpit alert workers. | Nothing tracks a household's own usual list, at its own address, using its own logged-in prices. |

## Recommendation

**Build, borrowing ideas and code. Don't adopt an existing tool.**

1. **Don't adopt.** No consumer tool is trustworthy enough to be the family's source of truth:
   - Each has recent reviews reporting price mismatches.
   - All are closed and serve logged-out or cached prices, which MediaNama found differ from what logged-in users pay.
   - None confirms Ahmedabad.
   - None tracks *our* staples.

   Before building, though, spend 10 minutes running one real household list through **Rozmo** and **Smartprix** on the Ahmedabad pincode. If either matches the real checkouts within a few rupees, the scope could shrink a lot. *This needs a human with a phone. I did not install or log into anything.*
2. **Borrow, per platform** (feeds tickets 02–04 and 07):
   - **Zepto:** official MCP (`mcp.zepto.co.in/mcp`) through local OAuth. Take the token-handling lessons from food-cli.
   - **Swiggy Instamart:** official MCP (`mcp.swiggy.com/im`), whose cart gives a bill breakdown. Plan for re-login roughly every 5 days, and note the "third-party apps not permitted" wording. A personal local client is the gray-but-tolerated case here.
   - **Blinkit:** follow yniks/blinkit-mcp (MIT): `impit` plus `auth_key`, OTP login, `view_cart` for fees. Or use the Playwright route in quick-commerce-mcp or hereisSwapnil/blinkit-mcp (both MIT). Must run from a home or residential IP.
   - **BigBasket / BB Now:** follow the `bbnow` listing-svc approach documented in compari5 for prices. Use quick-commerce-mcp's BigBasket work (MIT, in development) for the logged-in cart and fees.
   - **Flipkart Minutes:** follow the rome `HYPERLOCAL` flow documented in compari5, and the jairaj26 bookmarklet (MIT) for deal scanning.
   - **Amazon Fresh/Now:** **no prior art in any OSS project.** This needs original research in ticket 04.
3. **Borrow for the cross-platform layer:**
   - grocery-cockpit's matching modes, unit-price normalisation and "is a split worth it" logic.
   - Commerce-Price-MCP's adapter contract and "landed price" idea.
   - wigeria/grocery-comparison's safety model: the model never orders, and the cart is fingerprinted.
   - ShopLense's ntfy.sh alert worker.
4. **Licence caution:** compari5, ShopLense, CartRadar and Commerce-Price-MCP have **no licence**. Read them for approach only and don't copy their code. quick-commerce-mcp, both blinkit-mcp repos, food-cli, grocery-cockpit, flipkart-minutes-deals and wigeria/grocery-comparison are MIT, so their code can be reused with attribution.
5. **Implication for "where it runs" (map):** Every reliable access path needs a logged-in session from a home IP, through either OAuth tokens or a real Chrome profile. That points to a home machine (laptop or mini-PC) rather than a cloud host, which matches what compari5 and wigeria/grocery-comparison found. — https://github.com/ironman-gampala/compari5/blob/main/IMPLEMENTATION.md and https://github.com/wigeria/grocery-comparison
