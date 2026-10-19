# Fees and memberships on the six apps (as of 2026-10-19)

Ticket: [`../issues/05-fees-and-memberships.md`](../issues/05-fees-and-memberships.md)
Researched: 2026-10-19. No accounts were created and nothing was logged into.

## How to read this

- Every data point carries the **date of its source**, not today's date. Today is 2026-10-19.
- Source tiers, marked in brackets:
  - **[P]**: primary. The company's own help, FAQ, terms, press release or public endpoint.
  - **[N]**: reputable news. Used only where no primary source exists.
  - **[C]**: community or aggregator, such as DesiDime threads, coupon sites or fee-guide sites. Low confidence; included only to fill gaps, and always labelled.
- **Very few apps publish a quick-commerce fee schedule.** Zepto, Blinkit and Instamart publish none. They only reserve the right to charge, in their terms, and show the actual fees in the in-app bill. BigBasket and Amazon Fresh do publish schedules. Everything else comes from news coverage or user reports.

---

## 1. Headline findings

1. **The free-delivery threshold has settled at about ₹199 on the big three.** This applies to Zepto, Blinkit and Instamart, and the threshold rises at peak times. In Aug 2026, Zepto moved to ₹199 in normal hours and **up to ₹299 in high demand**. That reversed its Nov 2025 cut to ₹99 ([Telangana Today/IANS, 2026-08-19](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) [N]; [Angel One, 2026-08-19](https://www.angelone.in/news/market-updates/zepto-adjusts-free-delivery-threshold-to-199-aligning-with-rivals) [N]). The same report says Blinkit and Instamart are also at ₹199 ([Telangana Today, 2026-08-19](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) [N]).
2. **Amazon Now and Flipkart Minutes are cheaper on delivery.** Both offer free delivery from **₹99**. For Amazon Now this needs Prime ([Amazon press release, 2026-05-05](https://press.aboutamazon.com/in/2026/5/amazon-prime-day-returns-to-india-this-july) [P]). For Flipkart Minutes it is the advertised offer on the new standalone beta app ([Inc42, 2026-09-09](https://inc42.com/buzz/flipkart-debuts-standalone-app-for-quick-commerce-platform-minutes/) [N]). Neither may be live in Ahmedabad yet (see §6).
3. **Handling fees are back on Instamart and still exist on Blinkit.**
   - **Instamart:** reported at about ₹5–12 per order since about Feb 2026 ([DesiDime user thread, ~2026-02-01](https://www.desidime.com/discussions/swiggy-again-started-charging-handling-fee-for-instamart-orders) [C]).
   - **Blinkit:** ₹4–11 ([Storyboard18, 2026-06-04](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm) [N]).
   - **Zepto:** scrapped its handling fee in Nov 2025 ([Business Today, 2025-11-03](https://www.businesstoday.in/amp/tech-today/news/story/zepto-halves-free-delivery-threshold-and-scraps-surge-charges-in-major-pricing-overhaul-500675-2025-11-03) [N]). I found no report that it has come back.
4. **Every app's terms allow a long list of extra charges, shown only in the bill.**
   - **Blinkit** lists delivery, handling, convenience, platform, small-cart, "high demand surge" and "rain surge" charges ([blinkit.com/terms, last updated Feb 2026](https://blinkit.com/terms) [P]).
   - **Zepto** lists rain, peak-hour, surge, late-night, handling, convenience, platform and small-cart fees ([zepto.com/terms-of-service, v1.1, 2025-03-27](https://www.zepto.com/terms-of-service) [P]).
   - **BigBasket** lists delivery, handling, convenience, surge and small-cart charges ([bigbasket.com/terms-and-conditions](https://www.bigbasket.com/terms-and-conditions/) [P]).

   **Implication for the tool:** fees cannot be computed from a published rate card. The tool has to read the app's own bill or total.
5. **Memberships mostly lower the free-delivery threshold and remove surge fees. None is clearly worth it for one household on fees alone.** The exception is if the family already pays for **Amazon Prime**: the ₹399/yr Shopping Edition is enough to get free Amazon Now delivery from ₹99 and free Fresh delivery from ₹249.
6. **GST on fees is in flux.** Delivery through a platform has been taxed at 18% since 2025-09-22 ([A2Z Taxcorp citing CBIC FAQ, 2025-09-17](https://a2ztaxcorp.net/gst-alert-local-delivery-services-to-attract-18-tax-from-september-22-says-cbic/) [N]). On 2026-10-08, the 57th GST Council **recommended cutting this to 5%** for delivery by unregistered riders, but it has **not yet been notified** ([FoxMandal, 2026-10-13](https://foxmandal.in/?p=60825) [N]).
7. **Fees must now be disclosed earlier in the flow.** In Dec 2025 the CCPA fined Zepto ₹7 lakh. Zepto had shown handling fees only at cart or checkout ("drip pricing") and pre-ticked a paid Zepto Pass. The order directs it to disclose all charges upfront ([MediaNama, 2025-12-30](https://www.medianama.com/2025/12/223-explained-zepto-checkout-design-flouting-mrp-dark-pattern-rules-ccpa-probe/) [N]).

---

## 2. Comparison table (best available data, each point dated)

"—" means no source was found. Treat every cell as volatile; see §7.

| | **Zepto** | **Swiggy Instamart** | **Blinkit** | **BigBasket (bbnow / slotted)** | **Amazon Now / Fresh** | **Flipkart Minutes** |
|---|---|---|---|---|---|---|
| **Free-delivery threshold** | ₹199 in normal hours; up to ₹299 in high demand (2026-08-19) [[N]](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) | ₹199 (2026-08-19) [[N]](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) | ₹199 (2026-08-19 [[N]](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours); 2026-06-04 [[N]](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm)) | **bbnow:** fee "based on order value, time of day, weather" with no figure [[P]](https://www.bigbasket.com/delivery-charge/); users report ₹199 [[C]](https://www.desidime.com/discussions/bigbasket-increased-mov-from-99-to-199-for-free-delivery). **Slotted (Ahmedabad falls under the default schedule):** free above ₹1,000 [[P]](https://www.bigbasket.com/delivery-charge/) | **Now:** ₹99 for Prime (2026-05-05) [[P]](https://press.aboutamazon.com/in/2026/5/amazon-prime-day-returns-to-india-this-july); non-Prime ₹149 [[C]](https://rozmo.in/delivery-charges/amazon-now/). **Fresh scheduled (Ahmedabad is listed):** ₹249 Prime, ₹499 non-Prime [[P]](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z) | ₹99 (2026-09-09, standalone beta app) [[N]](https://inc42.com/buzz/flipkart-debuts-standalone-app-for-quick-commerce-platform-minutes/) |
| **Delivery fee below threshold** | ₹30 below ₹99 (2025-11-03) [[N]](https://www.businesstoday.in/amp/tech-today/news/story/zepto-halves-free-delivery-threshold-and-scraps-surge-charges-in-major-pricing-overhaul-500675-2025-11-03); ₹30 below ₹199 [[C]](https://rozmo.in/delivery-charges/zepto/) | ₹30 below ₹199 (2025, per a 2026-06 article) [[N]](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm) | Up to ₹30 (2025, per a 2026-06 article) [[N]](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm); ₹30 below ₹199 and ₹16 above it (undated) [[N]](https://arjuns-marginmayhem.beehiiv.com/p/swiggys-ipo-life-changing-for-you) | **Slotted (default schedule):** ₹50 below ₹600; ₹10 from ₹600–1,000 [[P]](https://www.bigbasket.com/delivery-charge/). **bbnow:** ₹30 [[C]](https://www.desidime.com/discussions/bigbasket-increased-mov-from-99-to-199-for-free-delivery) | **Fresh scheduled:** non-Prime pays ₹59 between ₹249 and ₹499; Prime pays ₹0, or ₹29 for rush delivery [[P]](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z). **Now:** ₹30 [[C]](https://rozmo.in/delivery-charges/amazon-now/) | ₹30 below ₹99 [[C]](https://rozmo.in/delivery-charges/flipkart-minutes/) |
| **Handling / platform fee** | Handling scrapped on all orders (2025-11-03) [[N]](https://www.businesstoday.in/amp/tech-today/news/story/zepto-halves-free-delivery-threshold-and-scraps-surge-charges-in-major-pricing-overhaul-500675-2025-11-03). The ₹2 platform fee was rolled back in 2025 [[N]](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm) | Handling ₹5 to ₹11.56 per order, reintroduced about Feb 2026 [[C]](https://www.desidime.com/discussions/swiggy-again-started-charging-handling-fee-for-instamart-orders). Platform fee ₹2–10 (2025) [[N]](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm) | Handling ₹4–11; no platform fee (2026-06-04) [[N]](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm) | bbnow: users report ₹6 handling even on a ₹1,000 order [[C]](https://www.desidime.com/discussions/bigbasket-increased-mov-from-99-to-199-for-free-delivery) | **Fresh:** a "Marketplace Fee" applies to all prepaid orders [[P]](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z). Amazon's marketplace fee is ₹5 flat, tax-inclusive, and Now and Fresh were exempt "at launch" [[P]](https://www.aboutamazon.in/news/company-news/amazon-introduces-marketplace-fee-on-orders) | "Zero platform fees" on the beta app (2026-09-09) [[N]](https://inc42.com/buzz/flipkart-debuts-standalone-app-for-quick-commerce-platform-minutes/). An earlier platform fee was ₹5 [[N]](https://bwdisrupt.com/article/flipkart-introduces-platform-fees-on-quick-commerce-arm-529884) |
| **Small-cart fee** | None (2025-11-03) [[N]](https://www.businesstoday.in/amp/tech-today/news/story/zepto-halves-free-delivery-threshold-and-scraps-surge-charges-in-major-pricing-overhaul-500675-2025-11-03); the terms allow one [[P]](https://www.zepto.com/terms-of-service) | ₹15 below ₹100 [[C]](https://www.desidime.com/news/top-5-instant-10-min-grocery-delivery-apps-in-india) | The terms allow one [[P]](https://blinkit.com/terms); no current amount found | The terms allow one [[P]](https://www.bigbasket.com/terms-and-conditions/) | Amazon Now: — | — |
| **Surge / rain / late-night** | Surge and rain removed (2025-11-03) [[N]](https://www.businesstoday.in/amp/tech-today/news/story/zepto-halves-free-delivery-threshold-and-scraps-surge-charges-in-major-pricing-overhaul-500675-2025-11-03). The surge now shows up as the **higher ₹299 threshold** (2026-08) [[N]](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours). The terms allow all three [[P]](https://www.zepto.com/terms-of-service) | Late-night ₹10 (~2026-02) [[C]](https://www.desidime.com/discussions/swiggy-again-started-charging-handling-fee-for-instamart-orders). Rain ₹15 on orders below ₹600 [[C]](https://www.desidime.com/news/top-5-instant-10-min-grocery-delivery-apps-in-india). Swiggy One waives surge [[C]](https://www.desidime.com/stores/swiggy-one-lite) | A surcharge exists but its amount is not published (2026-06) [[N]](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm). The terms name "high demand surge" and "rain surge" [[P]](https://blinkit.com/terms) | bbnow fee varies by "time of day, weather" [[P]](https://www.bigbasket.com/delivery-charge/) | — | — |
| **Minimum order value** | None found (orders below the threshold just pay the fee) | None found | None found | Slotted: none (fee-banded) [[P]](https://www.bigbasket.com/delivery-charge/) | **Fresh scheduled:** ₹249 MOV for everyone [[P]](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z) | None found |
| **Membership and what it waives** | **Zepto Club**, invite-only. About ₹99/month intro price; free delivery above ₹99; 5% back as Z-Coins; priority delivery (2026-07) [[N]](https://www.newsbytesapp.com/news/business/zepto-launches-invite-only-zepto-club-at-rs99-monthly/tldr) | **Swiggy One**: free Instamart delivery above ₹199; waives the delivery fee, late-night surcharge and surge fee [[P, 2023 card T&C]](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/swiggy-rupay-card-tnc.pdf). Current price **unverified** | **No paid membership found** | **bbstar**: ₹299, shown struck from ₹599. "No delivery charge on orders above Rs 199", ₹300 cashback, priority slots [[P]](https://www.bigbasket.com/bbstar/plan-spec/) | **Prime**: ₹1,499/yr, Lite ₹799, Shopping Edition ₹399. Now: free delivery from ₹99 and ₹200 cashback above ₹1,399 [[P]](https://press.aboutamazon.com/in/2026/5/amazon-prime-day-returns-to-india-this-july). Fresh: lower thresholds [[P]](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z) | **Flipkart BLACK**: ₹499 for 3 months. 5% SuperCoins, capped at 25 per order, **including Minutes orders**. **No delivery-fee waiver stated** [[P]](https://flipkart.com/pages/fk-black-faq) |
| **Fees disclosed** | In the "View Bill" section before checkout [[P]](https://www.zepto.com/terms-of-service); CCPA ordered upfront disclosure [[N]](https://www.medianama.com/2025/12/223-explained-zepto-checkout-design-flouting-mrp-dark-pattern-rules-ccpa-probe/) | In the app bill. The official Instamart MCP `get_cart` returns a `billBreakdown`, but **needs an authenticated session** [[P]](https://mcp.swiggy.com/builders/docs/reference/instamart/get_cart.md) | "Informed … prior to placing your order" [[P]](https://blinkit.com/terms) | "Displayed at checkout" [[P]](https://www.bigbasket.com/terms-and-conditions/). The slotted schedule is public with no login [[P]](https://www.bigbasket.com/delivery-charge/) | The Fresh fee table is public with no login [[P]](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z) | No official fee page found |

---

## 3. Per-app detail, with timelines

### 3.1 Zepto

**Free-delivery threshold timeline. This is the most volatile item in the whole research.**

| Date | Threshold and fees | Source |
|---|---|---|
| 2023–2024 | ₹2 platform fee, ₹15 late-night fee and ₹5–28 delivery fees reported | [Storyboard18, 2026-06-04](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm) [N] |
| 2025-11-03 | "All New Zepto Experience": free delivery at ₹99 or more (down from ₹199) and ₹30 below that. **Handling fee scrapped, surge scrapped, "zero rain charges", no small-cart fee** | [Business Today](https://www.businesstoday.in/amp/tech-today/news/story/zepto-halves-free-delivery-threshold-and-scraps-surge-charges-in-major-pricing-overhaul-500675-2025-11-03) [N]; [Apparel Resources, 2026-01-17](https://in.apparelresources.com/business-news/retail/blinkit-cuts-delivery-charges-select-markets-counter-rising-competition/) [N] |
| Late 2025 to mid-2026 | Threshold raised from ₹99 to ₹149 "for several users" | [Angel One, 2026-08-19](https://www.angelone.in/news/market-updates/zepto-adjusts-free-delivery-threshold-to-199-aligning-with-rivals) [N] |
| 2026-08-19 | **₹199 in normal hours and up to ₹299 in high-demand periods.** Not every user is affected | [Telangana Today/IANS](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) [N]; [Angel One](https://www.angelone.in/news/market-updates/zepto-adjusts-free-delivery-threshold-to-199-aligning-with-rivals) [N] |

**What the terms allow.** Zepto's Terms of Use (v1.1, last updated 2025-03-27) say the following ([zepto.com/terms-of-service](https://www.zepto.com/terms-of-service) [P]; the page is bot-protected, and its text was read from a copy retrieved 2026-10-19):

- Fees "for rain, peak hours, high demand or surge periods, late-night delivery, handling, convenience, platform usage, small cart fees, or other charges may apply".
- These "will be displayed in the 'View Bill' section before the checkout page".
- Zepto issues a separate tax invoice for its own services.

**Memberships timeline.** Zepto has changed its programme three times in two years.

- **Zepto Pass** (2024 pilot): ₹99/month, free delivery above ₹99, and up to 20% off some orders ([Inc42](https://inc42.com/buzz/zepto-launches-new-experiment-called-zepto-pass) [N]). Angel One gives a conflicting launch price of ₹799 ([Angel One, 2026-02-20](https://oga-prod.angelone.in/news/ipos/zepto-discontinues-zepto-daily-membership-service-ahead-of-ipo) [N]). The CCPA found that a ₹1 Zepto Pass was pre-ticked in carts ([MediaNama, 2025-12-30](https://www.medianama.com/2025/12/223-explained-zepto-checkout-design-flouting-mrp-dark-pattern-rules-ccpa-probe/) [N]).
- **Zepto Daily** (late 2024): replaced Pass. It cost ₹1/month in some cities and gave free delivery above a threshold. It was **discontinued by 2026-02-20** ([Angel One](https://oga-prod.angelone.in/news/ipos/zepto-discontinues-zepto-daily-membership-service-ahead-of-ipo) [N]).
- **Zepto Club** (July 2026): invite-only, at an introductory ₹99/month ([NewsBytes, 2026-07-17](https://www.newsbytesapp.com/news/business/zepto-launches-invite-only-zepto-club-at-rs99-monthly/tldr) [N]). Benefits:
  - unlimited free delivery above ₹99;
  - 5% back as Z-Coins, capped at 2,000 per cycle;
  - priority packing and delivery.

  A user deal post shows an effective ₹49 price; that offer expired 2026-08-15 ([DesiDime](https://www.desidime.com/deals/zepto-club-invite-only-2138546) [C]). **No source says Club waives anything other than the delivery fee.**
- **SuperSaver** is a bulk-buy mode, not a membership: free delivery above ₹1,000 and 20–30 minute delivery, launched in Bengaluru in 2025 ([Outlook Business](https://www.outlookbusiness.com/news/zepto-to-lauch-supersaver-to-propel-its-average-order-value) [N]). One user reported "Item Handling Cost" and "Fulfillment Fee" lines on SuperSaver orders ([DesiDime](https://www.desidime.com/discussions/zepto-hiding-charges) [C]).

### 3.2 Swiggy Instamart

- **Threshold:** ₹199 ([Telangana Today, 2026-08-19](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) [N]). An earlier analysis said ₹99 for some users and ₹199 for others ([Beehiiv analysis, undated](https://arjuns-marginmayhem.beehiiv.com/p/swiggys-ipo-life-changing-for-you) [C]).
- **Fees, timeline:**
  - **2025:** handling about ₹9.8, platform fee ₹2–10, and ₹30 delivery ([Storyboard18, 2026-06-04](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm) [N]).
  - **Late 2025:** fee waivers matching Zepto's ([Apparel Resources, 2026-01-17](https://in.apparelresources.com/business-news/retail/blinkit-cuts-delivery-charges-select-markets-counter-rising-competition/) [N]).
  - **About Feb 2026:** handling fee back at ₹5, with one user seeing ₹11.56, plus a new ₹10 late-night fee ([DesiDime user thread](https://www.desidime.com/discussions/swiggy-again-started-charging-handling-fee-for-instamart-orders) [C]).

  A Lapaas Voice article reported a universal ₹7–10 handling fee, with surge waivers limited to Swiggy One. It was surfaced in search, but the page is now gone (HTTP 410), so it is unverified ([lapaasvoice.com](https://lapaasvoice.com/swiggy-brings-back-handling-fees-on-instamart/) [N, dead link]).
- **Other reported fees (Mumbai research, "updated ~14 days ago"; mixed vintage):** ₹4 handling, ₹15 rain fee below ₹600, ₹15 small-cart fee below ₹100, and delivery ₹10–64 ([DesiDime roundup](https://www.desidime.com/news/top-5-instant-10-min-grocery-delivery-apps-in-india) [C]).
- **Holi 2025:** a one-off "festive handling" fee of ₹8.90–20 ([Inc42](https://inc42.com/buzz/swiggy-instamart-introduces-festive-handling-fee-for-holi-week/) [N]). Treat festival periods as fee-spike periods.
- **Swiggy One:**
  - **What it waives:** "Free delivery covers all the delivery charges such as delivery fee, late night surcharge & surge fee", and Instamart free delivery applies above ₹199. Source: card-partner T&C, [SBI Card, offer period Dec 2023](https://www.sbicard.com/sbi-card-en/assets/docs/pdf/swiggy-rupay-card-tnc.pdf) [P, old]. An Axis co-brand T&C repeats the ₹199 Instamart threshold ([Axis Bank](https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/terms-and-conditions-for-swiggy-one-membership-credit-card.pdf) [P]). **Handling and small-cart fees are not listed as waived.**
  - **Oct 2026 listing:** "unlimited free deliveries on Instamart orders over Rs. 199" and "no surge fee at peak hours" ([DesiDime store page, Oct 2026](https://www.desidime.com/stores/swiggy-one-lite) [C]).
  - **One Lite:** ₹99 for 3 months at launch, with 10 free Instamart deliveries above ₹199 ([Swiggy blog, 2023-10-09](https://blog.swiggy.com/news/swiggy-launches-swiggy-one-lite-membership-for-consumers-free-delivery-extra-benefits-in-food-grocery-and-more-at-rs-99/) [P, old]).
  - **One BLCK:** invite-only, ₹299 for 3 months at launch ([Business Standard, 2024-12](https://www.business-standard.com/companies/news/food-delivery-app-swiggy-launches-invite-only-one-blck-premium-membership-124121100736_1.html) [N]).
  - **Current Swiggy One price: unverified.** Blogs disagree: ₹299 for 3 months or ₹1,499/yr ([Coolztricks, 2026-07-11](https://www.coolztricks.com/2026/04/swiggy-one-membership.html) [C]). Pricing appears to be personalised per user.
- **Note:** the Swiggy food platform-fee hike to ₹17.58 before GST ([Telangana Today, 2026-08-19](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) [N]) is for **food delivery**. There is no evidence that it applies to Instamart.

### 3.3 Blinkit

- **Charges the terms allow** ([blinkit.com/terms, "Last updated in February 2026"](https://blinkit.com/terms) [P]; blinkit.com returned a bot-block page to me, and the text was read from a copy retrieved 2026-10-19): "delivery charges, handling charges, convenience charges, platform charges, small cart charges, high demand surge charges, rain surge charge, print charges, gift charges … You shall be informed of such Service Charges prior to placing your order".
- **Amounts:**
  - Handling ₹4–11 and delivery up to ₹30; no platform fee; free delivery above ₹199. A surcharge exists, and fees are "unchanged since 2025" ([Storyboard18, 2026-06-04](https://www.storyboard18.com/brand-marketing/blinkit-zepto-instamart-raise-fees-as-quick-commerce-goes-mainstream-ws-l-99758.htm) [N]). The same article also says "up to ₹30 on orders above ₹199", so it contradicts itself.
  - One analysis says ₹30 below ₹199 and ₹16 above ([Beehiiv analysis, undated](https://arjuns-marginmayhem.beehiiv.com/p/swiggys-ipo-life-changing-for-you) [C]).
  - A Dec 2024 social post claimed Blinkit had removed free delivery above ₹199 ([X post, 2024-12](https://x.com/FI_InvestIndia/status/1864877030598414423) [C]).
- **City variation:** in Jan 2026 Blinkit cut delivery charges only in select micro-markets of Gurgaon, Bengaluru and Mumbai ([Apparel Resources, 2026-01-17](https://in.apparelresources.com/business-news/retail/blinkit-cuts-delivery-charges-select-markets-counter-rising-competition/) [N]). This is direct evidence that fees are set per micro-market.
- **Membership:** no reliable source for any current paid Blinkit membership. Aggregator mentions ("Blinkit Prime", "Smart Bachat Club") are unsourced ([Brineweb](https://www.brineweb.com/blog/blinkit-business-model-revenue-model-explained-2026) [C]).
- **Ahmedabad:** blinkit.com lists Ahmedabad among the cities it serves (footer text, retrieved 2026-10-19, [blinkit.com](https://blinkit.com/faq) [P]).

### 3.4 BigBasket (bbnow quick and slotted bigbasket)

- **Published delivery-charge FAQ** ([bigbasket.com/delivery-charge](https://www.bigbasket.com/delivery-charge/) [P]; retrieved 2026-10-19, undated, page copyright 2025–2027):
  - **Slotted bigbasket / bb Express, default schedule:** ₹50 below ₹600; ₹10 from ₹600–1,000 (₹15 in Mumbai); free above ₹1,000.
  - **Exceptions:** Lucknow and Patna, and a list of tier-2 cities including **Vadodara, Surat and Rajkot**: ₹60 below ₹250, ₹30 up to ₹1,000 (₹1,200 in Lucknow/Patna), free above that.
  - **Ahmedabad is not in either exception list**, so the default schedule should apply.
  - **bbnow:** "Delivery charges will be applied for bbnow orders based on various factors such as order value, time of day, weather etc." No figures.
  - Add-on orders in the same slot carry no extra delivery charge.
- **Terms:** §4.1 and §7.8 allow "delivery, handling, convenience, surge, small cart, or other applicable charges based on factors like order value, time of day, demand, or item type. These charges may vary by location and will be displayed at checkout" ([bigbasket.com/terms-and-conditions](https://www.bigbasket.com/terms-and-conditions/) [P]).
- **User reports:** the bbnow free-delivery threshold rose from ₹99 to ₹199, with a ₹30 fee below it, and ₹599/₹999 thresholds by city and slot. Separately, a ₹6 handling charge on a ₹1,000 order ([DesiDime](https://www.desidime.com/discussions/bigbasket-increased-mov-from-99-to-199-for-free-delivery) [C]).
- **Free-delivery tokens:** the site promises that "free delivery tokens … [are] automatically used each time a delivery charge is due" ([bigbasket.com/delivery-charge](https://www.bigbasket.com/delivery-charge/) [P]).
- **bbstar.** BigBasket's public endpoint returned the following with no login, using the site's default city in an anonymous session ([bigbasket.com/bbstar/plan-spec/](https://www.bigbasket.com/bbstar/plan-spec/) [P], retrieved 2026-10-19):
  - fee ₹299, shown struck from ₹599;
  - `duration: "year"`, but `display_period: "6 months"`. These are ambiguous; confirm in the app;
  - "No Delivery Charge – On orders above Rs 199" via free-delivery tokens (unlimited);
  - "Rs 300 Cashback – Rs 100 Cashback on first order of any 3 months";
  - priority slots;
  - full refund if cancelled within 15 days.

  The bbstar terms say "Taxes may apply" on the fee and that BigBasket can change benefits without notice ([bigbasket.com/bbstar-terms](https://www.bigbasket.com/bbstar-terms/) [P]). **Whether bbstar covers bbnow orders, or handling and surge fees, is not stated.**

### 3.5 Amazon Now and Amazon Fresh

- **Amazon Fresh** ([amazon.in help "Information about Amazon Fresh Deliveries"](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z) [P], retrieved 2026-10-19, undated). Scheduled delivery runs in **Ahmedabad**, Delhi NCR, Jaipur, Kolkata, Pune, Mumbai, Thane, Bangalore, Hyderabad, Chennai, Mysore and Indore.

  | Fresh scheduled | Prime | Non-Prime |
  |---|---|---|
  | Minimum order | ₹249 | ₹249 |
  | Free-delivery threshold | ₹249 | ₹499 |
  | Fee between MOV and threshold | ₹0 | ₹59 |
  | Rush (2-hour) fee | ₹29 | Not offered |

  - Unscheduled delivery (other cities): ₹300 MOV and free above ₹799. The prose says Prime gets free delivery above ₹300, which contradicts the table.
  - "Temporary promotions and related discounts on delivery fees are not shown in these tables."
  - "A Marketplace Fee will apply on all prepaid Amazon Fresh orders." Pay-on-Delivery fees apply to cash orders.
- **Marketplace fee:** ₹5 flat per order, inclusive of all taxes, charged to Prime members too. At launch in 2025, Amazon Now and Fresh were exempt ([aboutamazon.in](https://www.aboutamazon.in/news/company-news/amazon-introduces-marketplace-fee-on-orders) [P]). **The Fresh help page now says Fresh is charged**, so the exemption has lapsed for Fresh. Amazon Now's status is unknown.
- **Amazon Now:** Prime members get free delivery on orders of ₹99 or more and ₹200 extra cashback above ₹1,399 ([Amazon India press release, 2026-05-05](https://press.aboutamazon.com/in/2026/5/amazon-prime-day-returns-to-india-this-july) [P]; also [Tribune/Amazon, 2026-02-12](https://www.tribuneindia.com/news/business/amazon-prime-delivered-fastest-delivery-speeds-with-savings-for-customers-in-india-in-2025/amp) [N]). Non-Prime terms are not published. One aggregator claims free above ₹149, ₹30 below, ₹0 handling, rain ₹15–30 and late-night ₹20–35 ([Rozmo](https://rozmo.in/delivery-charges/amazon-now/) [C]). **I could not find an amazon.in help page for Amazon Now fees.** Amazon's US Amazon Now page has a different, US-only fee model ([amazon.com](https://www.amazon.com/gp/help/customer/display.html?nodeId=TiTegZnk8aeToAd9Z4) [P, US]).
- **Prime prices (India):** Prime ₹1,499/yr, Prime Lite ₹799/yr, Prime Shopping Edition ₹399/yr ([Amazon India press release, 2026-05-05](https://press.aboutamazon.com/in/2026/5/amazon-prime-day-returns-to-india-this-july) [P]). A monthly plan at ₹299 and a quarterly at ₹599 are also reported ([Zoutons, 2026](https://zoutons.com/news/amazon-prime-membership-price-india-2026) [C]).
- **Amazon Now coverage:** Ahmedabad was on the planned rollout list in Apr 2026 ([Inc42, 2026-04-27](https://inc42.com/buzz/amazon-to-expand-quick-commerce-service-to-100-cities-in-india/) [N]). By 2026-10-01 Amazon Now was in 120+ cities, but **Ahmedabad was not named** ([Indian Retailer, 2026-10-01](https://www.indianretailer.com/news/amazon-now-expands-120-cities-across-india-doubles-reach-two-weeks) [N]).

### 3.6 Flipkart Minutes

- **Standalone beta app** (select parts of Delhi NCR): "zero platform fees" and free delivery above ₹99 ([Inc42, 2026-09-09](https://inc42.com/buzz/flipkart-debuts-standalone-app-for-quick-commerce-platform-minutes/) [N]; [Digg relay of Inc42, 2026-09-10](https://digg.com/tech/4dd9590a-f040-4cef-a8df-b398028f469f) [N]).
- **Earlier fees:**
  - a ₹5 platform fee on Minutes, alongside a ₹3 fee on main Flipkart ([BW Disrupt](https://bwdisrupt.com/article/flipkart-introduces-platform-fees-on-quick-commerce-arm-529884) [N]);
  - users reported ₹30 delivery below ₹99, plus about ₹5–9 platform fee and a convenience fee, despite a "zero fees above ₹99" banner ([DesiDime launch thread](https://www.desidime.com/discussions/flipkart-minutes-launched) [C]; [DesiDime "zero platform fees" thread](https://www.desidime.com/discussions/flipkart-minutes-zero-platform-fees) [C]).
- **Aggregator claim (undated):** ₹0 handling, rain ₹15–35, late-night ₹20 ([Rozmo](https://rozmo.in/delivery-charges/flipkart-minutes/) [C]).
- **Memberships:**
  - **Flipkart BLACK** ([flipkart.com/pages/fk-black-faq](https://flipkart.com/pages/fk-black-faq) [P]):
    - 3-month pack ₹499; new 12-month subscriptions "paused temporarily";
    - 5% SuperCoins back, up to 25 per order on Flipkart **and Minutes**, max 200 a month;
    - 90 days of YouTube Premium, early sale access, and Cleartrip perks;
    - non-refundable;
    - **no delivery or platform fee waiver is mentioned.**
  - **VIP** (₹499/yr in 2024; [Flipkart Stories, 2024-04-22](https://stories.flipkart.com/join-flipkart-vip-program-subscription) [P, old]) appears to have been rebranded as BLACK ([Technofino thread](https://www.technofino.in/community/threads/flipkart-vip-price-going-up-from-%E2%82%B9499-to-%E2%82%B9799-wef-02-04-2025.39615/) [C]).
  - **Plus** is a free tier earned via SuperCoins ([Zoutons, 2026](https://zoutons.com/news/flipkart-supercoins-plus-black-membership-2026) [C]).
- **Ahmedabad:** not confirmed. Minutes was in about 130 cities as of June 2026 ([Inc42, 2026-09-09](https://inc42.com/buzz/flipkart-debuts-standalone-app-for-quick-commerce-platform-minutes/) [N]).

---

## 4. GST on fees

- **Delivery fees, since 2025-09-22:** local delivery through an e-commerce operator is taxed at **18%**. The platform pays under s.9(5) when the rider is unregistered ([A2Z Taxcorp citing CBIC FAQ, 2025-09-17](https://a2ztaxcorp.net/gst-alert-local-delivery-services-to-attract-18-tax-from-september-22-says-cbic/) [N]). Notification 17/2025-Central Tax (Rate) is summarised by [EY, 2025-09](https://www.ey.com/en_in/technical/alerts-hub/2025/09/cbic-issues-notifications-giving-effect-to-the-recommendations-made) [N]. A May 2026 ruling confirmed 18% on Flipkart's delivery charges ([Inc42, 2026-05-13](https://inc42.com/buzz/flipkart-faces-18-gst-on-delivery-charges-after-relief-bid-fails/) [N]).
- **Pending change:** the 57th GST Council (2026-10-08) recommended moving delivery services supplied through an operator by unregistered persons to **5% without ITC**. This takes effect only once notified, and no date has been set ([FoxMandal, 2026-10-13](https://foxmandal.in/?p=60825) [N]). **Delivery-fee totals may change slightly in the coming weeks.**
- **Handling, platform and convenience fees** are the platform's own service and carry their own tax invoice. Zepto's terms list "Supply of services, if any, by Zepto – Tax Invoice issued by Zepto" ([zepto.com/terms-of-service](https://www.zepto.com/terms-of-service) [P]); Blinkit's terms are similar ([blinkit.com/terms](https://blinkit.com/terms) [P]). One report says Instamart's fees carry 18% GST, but its URL is dead ([lapaasvoice.com](https://lapaasvoice.com/swiggy-brings-back-handling-fees-on-instamart/) [N, dead link]). Amazon's ₹5 marketplace fee is "inclusive of all applicable taxes" ([aboutamazon.in](https://www.aboutamazon.in/news/company-news/amazon-introduces-marketplace-fee-on-orders) [P]).
- **Practical point:** news figures such as "₹17.58 pre-GST" show that some fees are quoted before GST ([Telangana Today, 2026-08-19](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) [N]). The tool should compare the app's final **"To Pay" / grand total**, not add up quoted fees.

---

## 5. Do fees vary by city or time? Yes, on every quick-commerce app

- **By city or micro-market:**
  - BigBasket publishes different schedules for different city groups ([bigbasket.com/delivery-charge](https://www.bigbasket.com/delivery-charge/) [P]).
  - Blinkit cut fees only in select micro-markets ([Apparel Resources, 2026-01-17](https://in.apparelresources.com/business-news/retail/blinkit-cuts-delivery-charges-select-markets-counter-rising-competition/) [N]).
  - BigBasket's terms say charges "may vary by location" ([bigbasket.com/terms-and-conditions](https://www.bigbasket.com/terms-and-conditions/) [P]).
  - Amazon Fresh differs between scheduled cities and other cities ([amazon.in help](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z) [P]).
- **By time and demand:**
  - Zepto's threshold rises to ₹299 at peak ([Telangana Today, 2026-08-19](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) [N]).
  - The bbnow fee depends on "time of day, weather" ([bigbasket.com/delivery-charge](https://www.bigbasket.com/delivery-charge/) [P]).
  - Blinkit's terms name "high demand surge" and "rain surge" ([blinkit.com/terms](https://blinkit.com/terms) [P]).
  - Zepto's terms name "rain, peak hours … late-night" ([zepto.com/terms-of-service](https://www.zepto.com/terms-of-service) [P]).
  - Instamart late-night fee ([DesiDime, ~2026-02](https://www.desidime.com/discussions/swiggy-again-started-charging-handling-fee-for-instamart-orders) [C]).
  - Festival fees, e.g. Instamart at Holi 2025 ([Inc42](https://inc42.com/buzz/swiggy-instamart-introduces-festive-handling-fee-for-holi-week/) [N]).
- **By user:** several changes rolled out "for several users" or "select users":
  - Zepto ₹149 and ₹199 ([Angel One, 2026-08-19](https://www.angelone.in/news/market-updates/zepto-adjusts-free-delivery-threshold-to-199-aligning-with-rivals) [N]);
  - Instamart ₹99 vs ₹199 ([Beehiiv analysis](https://arjuns-marginmayhem.beehiiv.com/p/swiggys-ipo-life-changing-for-you) [C]);
  - invite-only memberships such as Zepto Club and Swiggy One BLCK (sources above).

  **Two family members' accounts at the same address may see different fees.**

---

## 6. Are fees visible before checkout or without login?

| App | Published fee schedule, no login? | Fees shown in-app before paying? | Notes |
|---|---|---|---|
| Zepto | No | Yes, in the "View Bill" section before checkout ([terms](https://www.zepto.com/terms-of-service) [P]) | In Dec 2025 the CCPA ordered upfront disclosure of all charges after finding handling fees added only at cart or checkout ([MediaNama](https://www.medianama.com/2025/12/223-explained-zepto-checkout-design-flouting-mrp-dark-pattern-rules-ccpa-probe/) [N]) |
| Instamart | No | Yes, in the bill | The official Swiggy MCP `get_cart` returns `billBreakdown` line items and `toPay`, but requires an authenticated session ([mcp.swiggy.com](https://mcp.swiggy.com/builders/docs/reference/instamart/get_cart.md) [P]) |
| Blinkit | No | Yes, "prior to placing your order" ([terms](https://blinkit.com/terms) [P]) | Between 24 and 28 Nov 2025 the CCPA reportedly sent dark-pattern clarification notices to 15 platforms, including Blinkit, Swiggy, Amazon and Flipkart ([MediaNama, 2025-12-06](https://www.medianama.com/2025/12/223-zepto-fined-7-lakh-dark-patterns-ahead-ipo/) [N]). blinkit.com bot-blocks scripted requests (observed 2026-10-19) |
| BigBasket | **Yes** for slotted delivery ([delivery-charge](https://www.bigbasket.com/delivery-charge/) [P]); bbnow is formula-only. The **bbstar** plan JSON is public ([plan-spec](https://www.bigbasket.com/bbstar/plan-spec/) [P]) | Yes, "displayed at checkout" ([terms](https://www.bigbasket.com/terms-and-conditions/) [P]) | The web mini-cart notes "Actual Delivery Charges computed at checkout" (page markup of [bigbasket.com/terms-and-conditions](https://www.bigbasket.com/terms-and-conditions/), 2026-10-19 [P]) |
| Amazon Fresh / Now | **Yes** for Fresh ([help page](https://www.amazon.in/gp/help/customer/display.html?nodeId=G6K5JRE64PMCDR2Z) [P]); Now: only the Prime ₹99 headline ([press](https://press.aboutamazon.com/in/2026/5/amazon-prime-day-returns-to-india-this-july) [P]) | Yes, at checkout | The help page warns that promos are not shown |
| Flipkart Minutes | No | Yes, at checkout | Users report banners that did not match the charges at checkout ([DesiDime](https://www.desidime.com/discussions/flipkart-minutes-zero-platform-fees) [C]) |

**Not verified in this research:** whether each app's **web** cart shows the bill breakdown to a logged-out visitor with only a pin code set. That needs a hands-on check, which fits a prototype ticket. Given user-specific thresholds (§5), **logged-in bills are the only reliable all-in number**, which matches the map's note that "personal logged-in accounts … are fair game".

---

## 7. Volatility: how often these change

Changes found in roughly the last 12 months:

| Date | Change | Source |
|---|---|---|
| 2025-09-22 | 18% GST on platform-arranged local delivery begins | [A2Z Taxcorp](https://a2ztaxcorp.net/gst-alert-local-delivery-services-to-attract-18-tax-from-september-22-says-cbic/) [N] |
| 2025-11-03 | Zepto: ₹99 threshold; handling, surge, rain and small-cart fees removed | [Business Today](https://www.businesstoday.in/amp/tech-today/news/story/zepto-halves-free-delivery-threshold-and-scraps-surge-charges-in-major-pricing-overhaul-500675-2025-11-03) [N] |
| Late 2025 | Instamart: matching fee waivers | [Apparel Resources](https://in.apparelresources.com/business-news/retail/blinkit-cuts-delivery-charges-select-markets-counter-rising-competition/) [N] |
| 2025-12-30 | CCPA order against Zepto on drip pricing | [MediaNama](https://www.medianama.com/2025/12/223-explained-zepto-checkout-design-flouting-mrp-dark-pattern-rules-ccpa-probe/) [N] |
| 2026-01-17 | Blinkit: micro-market delivery-fee cuts | [Apparel Resources](https://in.apparelresources.com/business-news/retail/blinkit-cuts-delivery-charges-select-markets-counter-rising-competition/) [N] |
| ~2026-02-01 | Instamart: handling fee back; ₹10 late-night fee | [DesiDime](https://www.desidime.com/discussions/swiggy-again-started-charging-handling-fee-for-instamart-orders) [C] |
| 2026-02-20 | Zepto Daily membership discontinued | [Angel One](https://oga-prod.angelone.in/news/ipos/zepto-discontinues-zepto-daily-membership-service-ahead-of-ipo) [N] |
| 2026-05-05 | Amazon: Prime prices and Amazon Now ₹99 Prime benefit published | [Amazon](https://press.aboutamazon.com/in/2026/5/amazon-prime-day-returns-to-india-this-july) [P] |
| 2026-07-17 | Zepto Club launched (invite-only) | [NewsBytes](https://www.newsbytesapp.com/news/business/zepto-launches-invite-only-zepto-club-at-rs99-monthly/tldr) [N] |
| 2026-08-19 | Zepto: ₹199 normal, ₹299 peak | [Telangana Today](https://telanganatoday.com/zepto-raises-free-delivery-threshold-to-rs-199-during-normal-hours) [N] |
| 2026-09-09 | Flipkart Minutes app: ₹99 threshold, zero platform fee (beta) | [Inc42](https://inc42.com/buzz/flipkart-debuts-standalone-app-for-quick-commerce-platform-minutes/) [N] |
| 2026-10-08 | GST Council recommends 5% on rider delivery (pending) | [FoxMandal](https://foxmandal.in/?p=60825) [N] |

**What this means:**

- Expect a material fee or threshold change on **at least one of the six apps roughly every month**, plus intraday changes from peak, rain and late-night fees, and per-user experiments.
- **Any fee figures hard-coded in the tool will go stale within weeks.** Published schedules (BigBasket slotted, Amazon Fresh) are the most stable, but even those carry a "promotions not shown" caveat.

---

## 8. Implications for the "fee and total-cost model" (input to the map, not a decision)

1. Treat the **app's own final payable total for this account, address and time** as ground truth. Fees should be an **observed output**, not a modelled input.
2. If a model is needed anyway, for estimates or "add ₹X more to unlock free delivery" hints, keep these as **dated, per-app config with a "last verified" stamp**:
   - free-delivery threshold (normal and peak);
   - below-threshold delivery fee;
   - handling fee;
   - small-cart fee;
   - the membership flag held by the household.
3. Basket compare should flag when a basket is **just under a threshold**: ₹199 on Zepto, Instamart, Blinkit and bbnow; ₹99 on Amazon Now (Prime) and Flipkart Minutes; ₹249/₹499 on Fresh; ₹600/₹1,000 on slotted BigBasket. Adding a staple can be cheaper than paying the fee.
4. **Membership facts the household must supply:** Prime yes/no and which tier; Swiggy One; bbstar; Zepto Club; Flipkart BLACK. These change thresholds and waivers per account.
5. **Time of check matters.** Peak, rain and late-night fees mean a comparison run at 9 pm may differ from one at 11 am.

## 9. Open questions and gaps (could not be resolved from public sources)

- **Instamart and Blinkit:** exact current handling, small-cart, rain and late-night amounts. There is no official source, and community figures conflict.
- **Swiggy One:** current price in Ahmedabad, and whether it waives handling and small-cart fees (the 2023 T&C covers only delivery, late-night and surge).
- **Amazon Now:** the non-Prime fee schedule, whether the ₹5 marketplace fee now applies, and whether it is live in Ahmedabad.
- **Flipkart Minutes:** whether it is live in Ahmedabad, and whether the "zero platform fee, ₹99" offer applies outside the Delhi NCR beta.
- **bbstar:** whether the plan is 6 or 12 months, and whether it covers bbnow.
- **All apps:** whether logged-out web carts with a pin code set show the full bill. This needs a hands-on prototype check.
- **GST:** when the 5% rider-delivery rate is notified, and whether platforms pass the cut on.

## Sources consulted that yielded nothing usable

- **Swiggy:** [swiggy.com/swiggy-one](https://www.swiggy.com/swiggy-one) returned 404; [swiggy.com/terms-and-conditions](https://www.swiggy.com/terms-and-conditions) rendered no text.
- **Zepto:** [zepto.com/faqs](https://www.zepto.com/faqs) rendered no text.
- **Amazon:** [Marketplace Fee FAQ](https://www.amazon.in/gp/help/customer/display.html?nodeId=TF3RSudjie3qn1Q5y9) returned 503/403.
- **NewsBytes and Business Standard:** some pages returned 403.
