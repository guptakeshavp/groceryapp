# Research: How can prices be read from BigBasket and Amazon Fresh?

Ticket: [issues/04-access-bigbasket-amazonfresh.md](../issues/04-access-bigbasket-amazonfresh.md)
Researched: 2026-10-19. Every claim has a source link and a date. "Probed" means a single, light, unauthenticated HTTP request made on 2026-10-19 while writing this. No accounts were created and no logins were made. Every amazon.in page was left unfetched, because `www.amazon.in/robots.txt` disallows `Claude-User` and `ClaudeBot` (see [Amazon anti-bot](#anti-bot-amazon)). Amazon facts below therefore come from Amazon's press, affiliate and docs sites, from search-engine snippets, and from GitHub code.

## TL;DR

| | **BigBasket (incl. BB Now / "quick delivery")** | **Amazon Fresh / Amazon Now (India)** |
|---|---|---|
| Serves Ahmedabad? | **Yes**, BigBasket's own site lists Ahmedabad (2026-10-19). No source confirms whether 10-minute (BB Now) delivery covers our pincode | **Fresh: probably**, launched there Nov 2020, but no 2026 confirmation. **Now: not confirmed.** Ahmedabad was on the April 2026 rollout list, but no report shows it live by 2026-10-19. **Check the home pincode in the app** |
| Web version | Yes. `www.bigbasket.com` (Next.js), plus `bbnow.bigbasket.com`, which serves the same storefront. Legacy `/bbnow/` page says bbnow is "only on the bigbasket mobile app" | **Fresh: yes**: app, desktop and mobile web (`/s?k=…&i=nowstore`). **Now:** Amazon only documents the app ("Now" banner). Web access in India is unverified |
| Official API | **None.** No developer portal, docs or MCP | **Creators API** (successor to PA-API 5) covers amazon.in, but it is **not usable here**: no pincode parameter, no Fresh/Now index, needs 10 affiliate sales in 30 days, and its licence restricts use to sending traffic to Amazon |
| Unofficial API | `GET /listing-svc/v2/products?type=ps&slug=<q>&page=N` (JSON). It worked anonymously in a probe on 2026-10-19. Location is set via `PUT /member-svc/v2/member/current-delivery-address/` | No JSON API in use. OSS reads the server-rendered search page and sets the pincode via `POST /portal-migration/hz/glow/address-change` |
| Location key | Cookies `_bb_cid`, `_bb_sa_ids`, `_bb_pin_code` (city, service area, pincode). Anonymous default is Bengaluru | Session "Deliver to" pincode (glow address-change) |
| Varies by location? | **Yes**: prices, availability, vouchers and promos are "city specific"; fees "may vary by location" | **Yes** for Fresh/Now: availability is pincode-gated. No source confirms whether item prices differ by pincode |
| Login for prices? | **No** for item prices. **Fees only at checkout**, which needs a logged-in cart | **No** for item prices on search pages. Fees/totals only at checkout (logged in) |
| Anti-bot | **Akamai Bot Manager** (`_abck`/`bm_sz`, "Access Denied" 403). It intermittently blocks the listing API and the address-setting PUT, even in real Chrome | robots.txt blocks AI agents and Scrapy; text CAPTCHA and AWS WAF CAPTCHA |
| ToS | Clause 10.9 and 14.2 explicitly forbid scraping, robots and "any collection and use of … prices" | Conditions of Use: same licence wording (no "data mining, robots", no "collection and use of … prices") |
| Verdict (personal use) | **Feasible but unofficial**: logged-in browser automation from home is the reliable route | **Fresh: feasible but unofficial** via browser automation. **Now: blocked until Ahmedabad is confirmed live and web access is checked** |

---

## BigBasket

### Web version, BB Now and the merged storefront
- BigBasket has a website and app. Its About page says "Open the bigbasket app or website" and "choose quick delivery for instant needs, or pick a delivery slot that suits your schedule". Probed 2026-10-19: [bigbasket.com/about-us](https://www.bigbasket.com/about-us/)
- BB Now (10-minute) and slotted delivery were merged into one interface in Aug 2024, with quick commerce as the default. [Business Standard, 2024-08-27](https://www.business-standard.com/companies/start-ups/tata-owned-e-grocer-bigbasket-makes-10-minute-delivery-default-option-124082701047_1.html) (headline and search snippet only; the page returned 403 to fetch)
- A 2026 roundup calls it "Instant Delivery service (earlier BB Now)", promising 10–30 min. The cities it lists do not include Ahmedabad. [DesiDime, "last updated 14 days ago" as of 2026-10-19](https://www.desidime.com/news/top-5-instant-10-min-grocery-delivery-apps-in-india)
- The legacy `/bbnow/` landing page's meta description still says "bbnow service is available only on the bigbasket mobile app and in select cities", with 15–30 min delivery. Probed 2026-10-19: [bigbasket.com/bbnow/](https://www.bigbasket.com/bbnow/) This is an old AngularJS page and probably stale. Hobby code calls the web listing API with `x-entry-context: bbnow` / `x-entry-context-id: 10`, which suggests quick-delivery inventory is reachable from the web. [compari5 `lib/platforms/bigbasket.js`](https://github.com/ironman-gampala/compari5/blob/main/lib/platforms/bigbasket.js) (2026-09-25)
- `https://bbnow.bigbasket.com/` returned HTTP 200 with the Next.js BigBasket storefront. In the same session, `https://www.bigbasket.com/` returned an Akamai "Access Denied" 403 to the same plain `curl`. Probed 2026-10-19.

### Does BigBasket serve Ahmedabad?
- **Yes.** "We currently operate in … Kolkata, **Ahmedabad**, Gurgaon … Surat, Vadodara, Rajkot …" Probed 2026-10-19: [bigbasket.com/about-us](https://www.bigbasket.com/about-us/)
- **Unknown:** whether 10-minute quick delivery (vs. slotted) is offered at our pincode. No source names Ahmedabad for BB Now: [DesiDime 2026](https://www.desidime.com/news/top-5-instant-10-min-grocery-delivery-apps-in-india), [bbnow page](https://www.bigbasket.com/bbnow/) ("select cities"). Check this in the app with the home address.

### Official / partner API
- **None.** "bigbasket operates as a consumer app rather than an API platform: it publishes no public developer portal, API documentation, or client SDKs." [API Evangelist profile `apis.yml`](https://github.com/api-evangelist/bigbasket/blob/main/apis.yml) (generated 2026-07/08). No BigBasket MCP or partner programme turned up in searches either. [GitHub search "bigbasket mcp"](https://github.com/search?q=bigbasket+mcp&type=repositories) (2026-10-19)

### Reverse-engineered internal API
- **Listing/search:** `GET https://www.bigbasket.com/listing-svc/v2/products/?type=<ps|pc|pb|cl>&slug=<query-or-category>&page=N`. `ps` = search, `pc`/`pb`/`cl` = category/brand listings.
  - It returns JSON under `tabs[0].product_info.products[]`, with `pricing.discount.prim_price.sp` (selling price), `pricing.discount.mrp`, `availability.avail_status` (`"001"` = in stock), `availability.not_for_sale`, `w` (pack size), and `visibility.sa_id`/`fc_id` (service area / fulfilment centre).
  - Headers it sends: `x-channel: BB-WEB`, `x-entry-context: bb-b2c`, `x-entry-context-id: 100`, `x-tracker: <uuid>`.
  - The source code notes: "BigBasket's Akamai configuration currently rejects the non-trailing-slash route with HTTP 403".
  - [erenmyeager15/bigbasket-grocery-scraper `src/bigbasket.ts`](https://github.com/erenmyeager15/bigbasket-grocery-scraper/blob/main/src/bigbasket.ts) (last commit 2026-10-06)
- **Probe (2026-10-19):** one anonymous `GET https://bbnow.bigbasket.com/listing-svc/v2/products?type=ps&slug=amul%20ghee&page=1` (cookies from one homepage load, `x-channel: BB-WEB`) returned **HTTP 200 and 12 products with prices**. Example: "Ghee/Tuppa 500 ml", sp 323.38, MRP 325, `sa_id 19224`, `fc_id 1820`. The cookies set were `_bb_cid=1`, `_bb_sa_ids=19224`, `_bb_locSrc=default`, with `_bb_pin_code` empty. "Tuppa" (Kannada for ghee) indicates the Bengaluru default catalogue. **No login is needed to read item prices**, but the anonymous default is not Ahmedabad.
- **Location context readback:** `GET /ui-svc/v2/header/?send_door_info=true&send_address_set_by_user=true` returns the selected address's `pin`, `city_name`, `city_id` and `sa_list`. [erenmyeager15 `src/location.ts` and `src/bigbasket.ts`](https://github.com/erenmyeager15/bigbasket-grocery-scraper/blob/main/src/location.ts) (2026-10-06)
- **Autocomplete:** `/listing-svc/v1/product/term-completion` is used by the search box. [Hardik500/quick-commerce-mcp `src/platforms/bigbasket.ts`](https://github.com/Hardik500/quick-commerce-mcp/blob/main/src/platforms/bigbasket.ts) (2026-10-18)
- **Server-rendered fallback:** category pages embed the same product objects in a `__NEXT_DATA__` JSON blob, so a plain GET with location cookies can read listings. [hritikraghuwanshi/Blinkit-bigbasket-scraper `scrapers/bigbasket_scraper.py`](https://github.com/hritikraghuwanshi/Blinkit-bigbasket-scraper/blob/main/scrapers/bigbasket_scraper.py) (2026-09-07)

### Location
- **Prices, stock and promos vary by city.** Site copy shown on city change: "Product Prices, availability, vouchers and promos are city specific and may change accordingly." Probed 2026-10-19: [bigbasket.com/terms-and-conditions](https://www.bigbasket.com/terms-and-conditions/) (page chrome)
- **Fees vary by location.** "The Services … may be subject to certain charges such as delivery, handling, convenience, surge, small cart … These charges may vary by location and will be displayed at checkout." [General T&Cs §4.1 and §7.8](https://www.bigbasket.com/terms-and-conditions/) (fetched 2026-10-19)
- **Fresh produce prices move daily**, and the final charge follows a True Weight Policy: "some of the commodities and fresh food prices do change on a daily basis". [T&Cs §5.1–5.2](https://www.bigbasket.com/terms-and-conditions/) (fetched 2026-10-19)
- **Mechanism.** The listing API reads location from cookies (`_bb_pin_code`, `_bb_lat_long`, `_bb_cid`, `_bb_sa_ids`). Those are set correctly only by `PUT /member-svc/v2/member/current-delivery-address/`.
  - On 2026-08-29 that PUT returned an Akamai "Access Denied" 403, both from a real browser tab and from headless Playwright.
  - tolmol therefore marks BigBasket "unavailable" rather than return results for the wrong pincode.
  - [sutirthaguha/tolmol `backend/adapters/bbnow.py`](https://github.com/sutirthaguha/tolmol/blob/main/backend/adapters/bbnow.py) (2026-08-29)
- **Working alternatives seen:**
  - Drive the "Select Location" UI in a **real installed Chrome** (Playwright `channel="chrome"`), then reuse the cookies. Bundled headless Chromium is blocked. [hritikraghuwanshi scraper](https://github.com/hritikraghuwanshi/Blinkit-bigbasket-scraper/blob/main/scrapers/bigbasket_scraper.py) (2026-09-07)
  - Log in and pick a **saved address**. [quick-commerce-mcp README, "BigBasket development support (2026-10-04)"](https://github.com/Hardik500/quick-commerce-mcp/blob/main/README.md)
  - compari5 hand-writes `_bb_pin_code`/`_bb_lat_long`/`_bb_cid` cookies [compari5](https://github.com/ironman-gampala/compari5/blob/main/lib/platforms/bigbasket.js), but tolmol's finding above suggests this may not re-bind the service area. Treat it as unverified.
  - The erenmyeager15 actor does **not** select a location. Its `expectedPincode` "does not select a delivery location", and its sample run reported pincode 560004 (Bengaluru). [REPAIR-2026-10-06.md](https://github.com/erenmyeager15/bigbasket-grocery-scraper/blob/main/REPAIR-2026-10-06.md)

### Login needed?
- **Item prices: no** (probe above; anonymous sessions in [erenmyeager15](https://github.com/erenmyeager15/bigbasket-grocery-scraper/blob/main/src/bigbasket.ts)).
- **Fees and payable total: effectively yes.** Fees "will be displayed at checkout". [T&Cs §4.1](https://www.bigbasket.com/terms-and-conditions/) The only OSS tool that reads them does so from a logged-in checkout preview: "actual payable total of ₹133.94 (items ₹126.50, handling ₹8, checkout discount ₹0.56)", Bengaluru, verified live. [quick-commerce-mcp README](https://github.com/Hardik500/quick-commerce-mcp/blob/main/README.md) (2026-10-04 section; repo pushed 2026-10-18)
- Published fee tables conflict and are undated or old (e.g. ₹50 below ₹600, free above ₹1,000), so read fees live. [bigbasket.com/delivery-charge-new](https://www.bigbasket.com/delivery-charge-new/) (search snippet, undated); [Tata Neu support (2022)](https://support.tatadigital.com/support/solutions/articles/81000406102-do-i-get-free-delivery-in-bigbasket-with-neupass-)

### Anti-bot
- **Akamai Bot Manager.** The probe set Akamai cookies `_abck` and `bm_sz`. `www.bigbasket.com/` returned an Akamai `errors.edgesuite.net` "Access Denied" page to plain curl. Probed 2026-10-19.
- Listing-API 403s are intermittent:
  - An Oct 2026 run "received an HTTP 403 from the listing API on attempt one, recovered on retry" via an India residential proxy. [REPAIR-2026-10-06.md](https://github.com/erenmyeager15/bigbasket-grocery-scraper/blob/main/REPAIR-2026-10-06.md)
  - compari5 (2026-09-25) says "`www.bigbasket.com/listing-svc` is now Akamai-blocked (even for real Chrome). `bbnow.bigbasket.com` still serves the same listing API". [compari5](https://github.com/ironman-gampala/compari5/blob/main/lib/platforms/bigbasket.js)
  - Even a **logged-in** native browser saw "BigBasket's full listing service and product detail pages still return access refusals", so that tool switched to the search-box autocomplete UI. [quick-commerce-mcp README](https://github.com/Hardik500/quick-commerce-mcp/blob/main/README.md) (2026-10)
- Headless bundled Chromium is fingerprinted and blocked. Installed Chrome passes. [hritikraghuwanshi](https://github.com/hritikraghuwanshi/Blinkit-bigbasket-scraper/blob/main/scrapers/bigbasket_scraper.py) (2026-09-07)
- `robots.txt` allows `/` but disallows `/ps/` (search pages), `/p/`, `/product/`, `/_next/data/`, `/avengers-svc/` and `/choose-city/`. `/listing-svc/` is not listed. Probed 2026-10-19: [bigbasket.com/robots.txt](https://www.bigbasket.com/robots.txt)

### Existing open-source scrapers (BigBasket)
| Repo | Last push | Approach | Location | Notes |
|---|---|---|---|---|
| [Hardik500/quick-commerce-mcp](https://github.com/Hardik500/quick-commerce-mcp) (MIT, 3★) | 2026-10-18 | Drives your own Chrome, logged in (OTP) | Saved address | Only one with **fees/total from checkout preview**. BigBasket is "development support", verified live in Bengaluru |
| [erenmyeager15/bigbasket-grocery-scraper](https://github.com/erenmyeager15/bigbasket-grocery-scraper) (Apify actor) | 2026-10-06 | `got-scraping` → `listing-svc/v2/products/` + residential proxy | None (default Bengaluru) | Actively repaired for 403s; TypeScript tests |
| [ironman-gampala/compari5](https://github.com/ironman-gampala/compari5) | 2026-09-25 | Direct HTTP to `bbnow.bigbasket.com` listing-svc | Hand-set cookies (unverified) | Personal multi-app comparer |
| [hritikraghuwanshi/Blinkit-bigbasket-scraper](https://github.com/hritikraghuwanshi/Blinkit-bigbasket-scraper) | 2026-09-07 | Real Chrome sets location via UI → `__NEXT_DATA__` | UI picker → `_bb_pin_code` | Clear write-up of Akamai behaviour |
| [sutirthaguha/tolmol](https://github.com/sutirthaguha/tolmol) | 2026-08-29 | Gave up (fallback link only) | n/a | Documents the 403 on the address PUT |
| [ubermachine/QuickComPY](https://github.com/ubermachine/QuickComPY) | 2026-09-13 | Zendriver (stealth CDP) intercepts `listing-svc/v2/products` | "`bb_pincode` cookie family" | Its README claims it handles Akamai |

Older Selenium scrapers (2021–2025, e.g. [Gaurang105/BigBasket_Scraper](https://github.com/Gaurang105/BigBasket_Scraper), 2023) predate the Next.js site and Akamai changes. Treat them as unmaintained. [GitHub search, 2026-10-19](https://github.com/search?q=bigbasket+scraper&type=repositories&s=updated)

### ToS (BigBasket)
From the [General T&Cs](https://www.bigbasket.com/terms-and-conditions/) (fetched 2026-10-19; no "last updated" date shown):
- **§10.9:** "You shall not use any 'deep-link', 'page-scrape', 'robot', 'spider' or other automatic device, program, algorithm or methodology … to access, acquire, copy or monitor any portion of the Platform or any content…"
- **§14.2:** the licence is for "personal use of the Platform" and "does not include … **any collection and use of any product listings, descriptions, or prices** … or any use of data mining, robots, or similar data gathering and extraction tools."
- **§10.4:** the Platform is for "end-consumers … for domestic/self-consumption". The household qualifies as a consumer, but automated price collection is still outside the licence.

---

## Amazon Fresh / Amazon Now (India)

### What exists in 2026
- **Amazon Fresh** is Amazon's slotted grocery store (2-hour slots, 4–24 h service). In 2025 Amazon said Fresh was in "more than 270 cities". [About Amazon India, Fresh expansion](https://www.aboutamazon.in/news/retail/amazon-fresh-expansion-grocery-delivery-india) (undated; references the 2025 Great Indian Festival)
- **Amazon Now** is the quick-commerce (minutes) service, launched mid-2025 in Bengaluru.
  - Plan: 100 cities in 2026, announced 2026-04-27. [Inc42](https://inc42.com/buzz/amazon-to-expand-quick-commerce-service-to-100-cities-in-india/), [Indian Retailer](https://www.indianretailer.com/news/amazon-expand-amazon-now-100-cities-across-india)
  - Then "over 300 cities", June 2026. [About Amazon India](https://www.aboutamazon.in/news/retail/amazon-now-300-cities-delivery-in-minutes); [press release, 2026-06-18](https://press.aboutamazon.com/in/2026/6/amazon-doubles-down-on-expansion-of-amazon-now-plans-to-launch-over-100-urban-fulfillment-centers-offering-4x-more-selection-delivered-in-minutes)
  - "More than 120 cities" by 2026-10-01. [Indian Retailer](https://www.indianretailer.com/news/amazon-now-expands-120-cities-across-india-doubles-reach-two-weeks); [Retail Insight Network](https://www.retail-insight-network.com/newsletters/amazon-now-120-indian-cities)
- **Fresh is being wound down where Now launches.** A UBS note (Apr 2026) says Amazon plans to "wind down its 4–24 hour delivery service, Amazon Fresh, in 10–15 major Indian cities … Amazon Fresh will be scaled down in cities where AmazonNow is launched." [Entrackr, 2026-04-06](https://entrackr.com/snippets/amazon-to-cut-fresh-presence-expand-amazonnow-across-10-to-15-cities-ubs-report-11457860) Amazon "has not officially confirmed". [Storyboard18, 2026-04-08](https://www.storyboard18.com/brand-marketing/amazon-to-phase-out-fresh-in-top-cities-shift-focus-to-amazon-now-quick-commerce-report-94529.htm)

### Does Amazon Fresh / Now serve Ahmedabad?
- **Amazon Fresh: launched in Ahmedabad on 2020-11-05**, "currently available in select pin-codes". [Amazon India press release, 2020-11-05](https://press.aboutamazon.com/in/2020/11/amazon-india-launches-amazon-fresh-in-kolkata-ahmedabad-pune-chennai) Ahmedabad was among 14 cities with dedicated Fresh sites in Sept 2021. [Business Today, 2021-09-30](https://www.businesstoday.in/amp/latest/corporate/story/amazon-raises-fresh-capacity-to-35-sites-in-delhi-gurugram-12-other-cities-308037-2021-09-30) No 2026 source confirms or denies Fresh in Ahmedabad. If Now launches there, Fresh may be scaled down (UBS note above).
- **Amazon Now: planned, not confirmed live.**
  - Ahmedabad is on the 2026-04-27 rollout list ("Chandigarh, Ahmedabad, Meerut, Mysore"). [Indian Retailer, 2026-04-27](https://www.indianretailer.com/news/amazon-expand-amazon-now-100-cities-across-india)
  - A 2026-06-27 local piece says "Amazon prepares to introduce its quick-delivery service in the city". [Urban Acres](https://urbanacres.in/ahmedabad-quick-commerce-expands-with-amazon-entry/)
  - None of the Sept–Oct 2026 expansion reports name Ahmedabad: [Urban Acres, 2026-09-15](https://urbanacres.in/amazon-nows-expansion-turns-indian-cities-into-quick-commerce-hubs/), [Indian Retailer, 2026-10-01](https://www.indianretailer.com/news/amazon-now-expands-120-cities-across-india-doubles-reach-two-weeks), [About Amazon India](https://www.aboutamazon.in/news/retail/amazon-now-india-ultra-fast-delivery)
- **Action:** in the Amazon app, set the home address and look for the "Now" banner. Amazon's own guidance: "go to your Amazon shopping app and look for the 'Now' banner on top". [About Amazon India](https://www.aboutamazon.in/news/retail/amazon-now-india-ultra-fast-delivery) Also check whether Fresh slots are offered.

### Web version
- **Fresh: yes.** "Customers can find the store on the Amazon.in app, desktop, or mobile browser." [press release, 2020-11-05](https://press.aboutamazon.com/in/2020/11/amazon-india-launches-amazon-fresh-in-kolkata-ahmedabad-pune-chennai) Confirmed for 2021: "Fresh icon on the Amazon.in app, desktop or mobile browser". [press release, 2021-02](https://press.aboutamazon.com/in/2021/2/amazon-in-integrates-pantry-within-fresh-customers-can-now-enjoy-2-hr-convenience-and-save-more-in-a-single-online-grocery-store)
  - Hobby code in 2026 searches the Fresh store on the web with `https://www.amazon.in/s?k=<q>&i=nowstore`, documented as "The 'i=nowstore' parameter filters to Amazon Fresh products only". [rishi-sit/pricehunt-api-deploy `amazon_fresh.py`](https://github.com/rishi-sit/pricehunt-api-deploy/blob/main/app/scrapers/amazon_fresh.py) (2026-02-20); also [SinkAnkit/saveqart](https://github.com/SinkAnkit/saveqart/blob/main/backend/src/providers/adapters/amazon_fresh.js) (2026-07-24), [yashnaiduu/OmniCart](https://github.com/yashnaiduu/OmniCart/blob/main/backend/src/connectors/amazonfresh.connector.ts) (2026-05-23)
  - The Fresh storefront link uses `almBrandId=ctnow`. [DesiDime deal, expired 2026-03-07](https://www.desidime.com/deals/amazon-fresh-upto-51-2082120)
- **Amazon Now: app documented, web unverified.**
  - The Indian guidance mentions only the app. [About Amazon India](https://www.aboutamazon.in/news/retail/amazon-now-india-ultra-fast-delivery) An Amazon Now launch report (2025-09) describes it as "integrated within the Amazon.in app" with a "10 mins" icon. [MobiGyaan](https://www.mobigyaan.com/amazon-now-10-minute-delivery-mumbai)
  - In the **US**, Amazon Now is reachable on "Amazon App / Desktop / Mobile Browser". [amazon.com help](https://www.amazon.com/gp/help/customer/display.html?nodeId=TExRrve49DViWzroWn) (search snippet) That does not prove the same for India.
  - pritm7748/qcomm-compare labels its `i=nowstore` scraper "Amazon Now" [amazon_now.js](https://github.com/pritm7748/qcomm-compare/blob/main/backend/platforms/amazon_now.js) (2026-03-22), so whether `nowstore` now shows Now or Fresh inventory is ambiguous.

### Official / affiliate APIs
- **PA-API 5 is retired** and replaced by the **Creators API**. The old endpoint returns 403 with a migration pointer. [Creators API: PA-API 5 deprecation](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation) (page © 1996-2025; no date given). A third-party mirror cites a 2026-05-15 deprecation date. [webservices.amazon.ca locale page](https://webservices.amazon.ca/paapi5/documentation/locale-reference/india.html) (search snippet)
- **India is supported**, but eligibility is a blocker: "Have at least 10 qualifying sales within the past 30 days to access the PA API through the Creators API". Supported marketplaces include India. [Creators API introduction](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction) (fetched 2026-10-19)
- **No Fresh/Now coverage, and no location parameter:**
  - India's search indexes include `GroceryAndGourmetFood` but **no `AmazonFresh`/`Fresh`/Now index**. [Locale reference, India](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/locale-reference/india)
  - `GetItems` and `SearchItems` have **no pincode/postal-code or delivery-location parameter**. `deliveryFlags` accepts only `AmazonGlobal`, `FreeShipping`, `FulfilledByAmazon` and `Prime`. Offers come back as `offersV2.listings.price/availability/merchantInfo/dealDetails`.
  - [GetItems](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/get-items), [SearchItems](https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/search-items) (fetched 2026-10-19)
  - So the API cannot return Fresh/Now, pincode-specific prices or stock for our address.
- **Licence restrictions (Associates India Operating Agreement, "Updated: November, 2021"):**
  - Use Product Advertising Content "solely to send end users and sales to the Amazon Site".
  - No use "for the purpose of aggregating, analyzing, extracting, or repurposing any Product Advertising Content".
  - Prices shown need a date/time stamp. Images may not be cached.
  - [affiliate-program.amazon.in operating agreement](https://affiliate-program.amazon.in/help/operating/agreement) (fetched 2026-10-19)
  - A private price-tracker for one household does not fit this licence.
- **Verdict on official APIs: not usable** for this project.

### Reverse-engineered / scraping approach
- **No JSON product API is used by OSS.** Amazon search results are server-rendered, so tools read the DOM (`[data-component-type="s-search-result"]`). [ubermachine/QuickComPY README](https://github.com/ubermachine/QuickComPY/blob/main/README.md) (2026-09-13)
- **Setting the pincode:** from inside a browser page, `POST /portal-migration/hz/glow/address-change?actionSource=glow` with form fields including `zipCode=<pincode>`. The response includes `isAddressUpdated`, `isValidAddress` and `address.city`, so you can verify the city Amazon resolved. "Amazon's delivery pincode is genuinely settable." [QuickComPY `backend_py/scrapers/amazon.py`](https://github.com/ubermachine/QuickComPY/blob/main/backend_py/scrapers/amazon.py) (2026-09-13). The same endpoint appears in other repos: [omkarcloud/amazon-scraper `amazon/fetch.py`](https://github.com/omkarcloud/amazon-scraper/blob/main/amazon/fetch.py), [iceywil/amazon-web-scraper](https://github.com/iceywil/amazon-web-scraper/blob/main/scraper/session.py)
- **Fresh-scoped search:** `/s?k=<q>&i=nowstore` (repos above). QuickComPY instead uses the general grocery index `&i=grocery`, which mixes non-Fresh marketplace offers. [QuickComPY README](https://github.com/ubermachine/QuickComPY/blob/main/README.md)
- **Caution about hobby code:** some 2026 repos set a cookie `ubid-acbin=<pincode>` to pick the store [saveqart](https://github.com/SinkAnkit/saveqart/blob/main/backend/src/providers/adapters/amazon_fresh.js) or `random-session` [qcomm-compare](https://github.com/pritm7748/qcomm-compare/blob/main/backend/platforms/amazon_now.js). That cookie is a session ID, not a location. Their Fresh results are likely not for the intended pincode. Use the glow address-change method and verify the city it returns.

### Location
- **Availability is pincode-gated.** Fresh launched "in select pin-codes". [press release, 2020-11-05](https://press.aboutamazon.com/in/2020/11/amazon-india-launches-amazon-fresh-in-kolkata-ahmedabad-pune-chennai) The hobby scraper checks page text for "not available in your area" / "fresh is not available" to detect unserviceable pincodes. [saveqart](https://github.com/SinkAnkit/saveqart/blob/main/backend/src/providers/adapters/amazon_fresh.js) (2026-07-24)
- **Fees depend on Prime and slot type.** The amazon.in "Information about Amazon Fresh Deliveries" help page lists:
  - Scheduled: minimum order ₹249; free above ₹249 (Prime) or ₹499 (non-Prime).
  - Unscheduled: minimum ₹300; free above ₹799; otherwise ₹30 (Prime) or ₹59 (non-Prime).
  - [amazon.in help node G6K5JRE64PMCDR2Z](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z) (via search snippet, 2026-10-19; not fetched because of robots.txt; undated, verify live)
- **No source found on Amazon Now India fees** (handling, small-cart, minimum order). [About Amazon India](https://www.aboutamazon.in/news/retail/amazon-now-india-ultra-fast-delivery) gives none.
- **Unknown:** whether the same ASIN's Fresh price differs between pincodes or cities. No source addresses this. Amazon's "Now" selection is store-based (micro-fulfilment centres [press release, 2026-06-18](https://press.aboutamazon.com/in/2026/6/amazon-doubles-down-on-expansion-of-amazon-now-plans-to-launch-over-100-urban-fulfillment-centers-offering-4x-more-selection-delivered-in-minutes)), so stock at least is local.

### Login needed?
- **Item prices: no.** QuickComPY reads amazon.in search results and sets the pincode in an anonymous browser session. [QuickComPY](https://github.com/ubermachine/QuickComPY/blob/main/backend_py/scrapers/amazon.py) (2026-09-13)
- **Fees/total: yes, in practice.** Cart and checkout are behind sign-in, and `robots.txt` disallows `/gp/cart` and `/ap/signin`. [amazon.in/robots.txt](https://www.amazon.in/robots.txt) (probed 2026-10-19) Prime status changes the fee (table above), so fees must be read from the family's own logged-in account. No OSS tool reads Amazon Fresh/Now checkout totals. [research/01-existing-tools.md](01-existing-tools.md)

### Anti-bot (Amazon)
- **`robots.txt`** disallows `/` for `Claude-User`, `ClaudeBot`, `Claude-SearchBot`, `GPTBot`, `ChatGPT-User`, `PerplexityBot`, `Scrapy` and many other agents, and disallows `/gp/cart` and `/ap/signin` for all agents. Probed 2026-10-19: [amazon.in/robots.txt](https://www.amazon.in/robots.txt) So **an AI agent (Claude) should not browse amazon.in directly**. Any automation must run as the family's own browser session.
- **CAPTCHAs:**
  - The classic text CAPTCHA (`/errors/validateCaptcha`) is solved by [a-maliarov/amazoncaptcha](https://github.com/a-maliarov/amazoncaptcha) (493★, pushed 2026-04-02; last dated news 2023-05-05).
  - Newer **AWS WAF visual CAPTCHAs** are also in use. [zerlokker/amazon-WAF-captcha-model](https://github.com/zerlokker/amazon-WAF-captcha-model) (2026-03-10)
  - Commercial unblockers advertise Amazon CAPTCHA solving. [bright-data-de/amazon-captcha-solver](https://github.com/bright-data-de/amazon-captcha-solver) (2026-01)
- QuickComPY reports "AWS WAF challenges" on these sites and uses Zendriver with stealth CDP to pass them. [QuickComPY README](https://github.com/ubermachine/QuickComPY/blob/main/README.md) (2026-09-13)

### Existing open-source scrapers (Amazon Fresh / Now)
Correction to [01-existing-tools.md](01-existing-tools.md), which said Amazon Fresh/Now had "no prior art in any OSS project": a few small, low-quality hobby adapters exist. None reads fees.

| Repo | Last push | Approach | Location handling | Quality |
|---|---|---|---|---|
| [ubermachine/QuickComPY](https://github.com/ubermachine/QuickComPY) | 2026-09-13 | Zendriver DOM read, `&i=grocery` | glow address-change, verified via city echo | Best location handling, but **not Fresh-scoped** |
| [SinkAnkit/saveqart](https://github.com/SinkAnkit/saveqart) | 2026-07-24 | Puppeteer, `&i=nowstore` | Wrong (`ubid-acbin` cookie) | Has serviceability detection |
| [yashnaiduu/OmniCart](https://github.com/yashnaiduu/OmniCart) | 2026-05-23 | DOM, `&i=nowstore` | None | Toy |
| [pritm7748/qcomm-compare](https://github.com/pritm7748/qcomm-compare) | 2026-03-22 | Puppeteer, `&i=nowstore` ("Amazon Now") | None effective | Toy |
| [rishi-sit/pricehunt-api-deploy](https://github.com/rishi-sit/pricehunt-api-deploy) | 2026-02-20 | `&i=nowstore` | Default pincode 560087 | Toy |

All have 0 stars. [GitHub API, 2026-10-19](https://github.com/search?q=nowstore+amazon+fresh&type=code)

### ToS (Amazon)
- amazon.in Conditions of Use (Amazon's standard licence clause): a "limited … license to access and make personal and non-commercial use". It "does not include … **any collection and use of any product listings, descriptions, or prices** … or any use of data mining, robots, or similar data gathering and extraction tools." Text quoted via [ConductAtlas record of Amazon Conditions of Use](https://conductatlas.com/platform/amazon/amazon-conditions-of-use/provision/CA-P-018441/prohibition-on-data-mining-and-scraping-tools/) (third-party). The amazon.in copy ([Conditions of Use](https://www.amazon.in/gp/help/customer/display.html?nodeId=200545940)) was not fetched because of robots.txt. Verify the exact wording manually.
- The Associates/Creators API licence restricts API data to sending traffic to Amazon. [operating agreement, Nov 2021](https://affiliate-program.amazon.in/help/operating/agreement)

---

## Feasibility verdict (personal, single-household use)

**BigBasket: Feasible but unofficial and ToS-prohibited. Recommended path is logged-in browser automation from the home machine.**
- BigBasket serves Ahmedabad. Item prices are readable **without login** from the JSON `listing-svc/v2/products` API: verified in a probe on 2026-10-19, though only for the Bengaluru default location.
- The hard part is **pinning the Ahmedabad address**. The address-setting endpoint is Akamai-protected and has 403'd even real browsers. Three options:
  - **Preferred:** a real installed Chrome profile where a family member has logged in once (OTP) and picked the saved home address. Read the listing JSON or `__NEXT_DATA__` through that session, and read **fees and payable total from the checkout preview**. Hardik500/quick-commerce-mcp has done this live (items + handling + discount) and is MIT-licensed to borrow from.
  - **Fallback:** drive the "Select Location" UI in installed Chrome without login. That gives prices, but no fees.
  - **Always:** verify the location via `/ui-svc/v2/header/` (pin = home pincode) before trusting any price.
- Expect intermittent Akamai 403s on `www`. `bbnow.bigbasket.com` was more permissive on 2026-10-19. Keep volume tiny and run from a residential IP.
- ToS §10.9/§14.2 explicitly forbid this. The household should accept that risk knowingly.
- Open: does our pincode get 10-minute delivery or only slots? Check in the app.

**Amazon Fresh: Feasible only as household-run browser automation; no usable official API. Amazon Now: not yet feasible to plan for.**
- The Creators API is a dead end: no Fresh index, no pincode, 10-sales/30-day eligibility, and a licence limited to sending affiliate traffic.
- Amazon's robots.txt bars AI agents (including Claude) from amazon.in, and its Conditions of Use bar robots and price collection. Any automation should therefore be a script running in the family's own logged-in browser on the home machine:
  - set the pincode via the "Deliver to" control (or the glow `address-change` call it makes) and confirm the returned city;
  - search `&i=nowstore`;
  - read the cart or checkout for Prime-dependent fees.
- Expect text or WAF CAPTCHAs. Treat Amazon as the **most brittle** of the six platforms and the one most likely to need a "couldn't check — open Amazon" fallback.
- **Ahmedabad status must be checked by hand first:**
  - Fresh launched there in 2020, but 2026 status is unconfirmed, and it is being scaled down where Now arrives.
  - Now was "planned" for Ahmedabad in Apr–Jun 2026 and is not confirmed live as of 2026-10-19.
  - If neither serves the home pincode, drop Amazon from scope.

### Open questions for downstream tickets
- Manual check (5 minutes, family phone): with the home address set, does the Amazon app show the **Now** banner and/or **Fresh** slots? Does BigBasket offer 10-minute delivery or only slots at our pincode?
- Do BigBasket web prices equal app prices for the same item and address? Spot-check about 5 items.
- Does amazon.in `&i=nowstore` show Now (minutes) inventory, Fresh (slots), or both, where both exist? Check after the pincode is confirmed served.
- Fee model (ticket on fees): BigBasket "Delivery & Handling" plus surge/small-cart; Amazon Fresh Prime vs non-Prime thresholds; Amazon Now fees unknown.
