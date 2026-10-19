# How can prices be read from BigBasket and Amazon Fresh?

Type: research
Status: resolved
Blocked by: —

## Question

Same questions as "How can prices be read from Zepto and Blinkit?", for BigBasket (incl. BB Now) and Amazon Fresh / Amazon Now in India: web vs. app-only, APIs (official, affiliate e.g. Amazon PA-API, or reverse-engineered), location handling, login needs, anti-bot measures, existing scrapers. Note whether Amazon Fresh currently serves Ahmedabad.

Findings: `../research/04-access-bigbasket-amazonfresh.md`

## Answer

Resolved 2026-10-19 by research subagent. Full findings with citations: [research/04-access-bigbasket-amazonfresh.md](../research/04-access-bigbasket-amazonfresh.md). Neither platform has a usable official API.

- **BigBasket — feasible, unofficial, against ToS.** Serves Ahmedabad (About page, 2026-10-19); unconfirmed whether our pin code gets BB Now 10-minute delivery or only slots. Internal listing API on bbnow.bigbasket.com returns prices/stock logged out, but for the default Bengaluru location; setting the address hits Akamai bot protection (403s even for real browsers). **Recommended path:** real Chrome on the Mac, logged in with the saved home address, reading fees and total from the checkout preview — `Hardik500/quick-commerce-mcp` (MIT, 2026-10-18) already does this live. ToS clauses 10.9 and 14.2 ban robots and price collection.
- **Amazon Creators API (PA-API 5 successor) — dead end.** No Fresh/Now category, no pin-code parameter, needs 10 affiliate sales in 30 days, licence limited to driving traffic to Amazon.
- **Amazon Fresh — web-readable but most brittle of the six.** Hobby code searches `/s?k=…&i=nowstore` and sets pin code via the "Deliver to" address-change call (QuickComPY). Item prices visible logged out; fees depend on Prime and need a logged-in cart. robots.txt disallows AI agents (subagent fetched no amazon.in pages); text and AWS WAF CAPTCHAs; Conditions of Use ban robots and price collection. Any automation would have to run in Keshav's own logged-in browser.
- **Amazon Now** — documented app-only; web availability in India unverified. **Ahmedabad availability:** sources don't settle it (Fresh launched Nov 2020, analyst report Apr 2026 says Fresh scaled down where Now launches; Ahmedabad on Now's planned list Apr–Jun 2026). Keshav's own account settles it: the household uses Amazon Fresh sometimes and does **not** have Amazon Now.
- **Correction to "Does an existing app or extension already solve this?":** a few small hobby adapters do cover Amazon Fresh/Now; most set location wrongly and none read fees.

- **Update 2026-10-19 (Keshav):** BigBasket offers 10-minute BB Now delivery at our pin code 380015.
- **Update 2026-10-19 (Keshav):** on bigbasket.com in a normal browser, entering pin code 380015 worked and showed the **same prices as the BigBasket app** for the items checked — the website is a faithful price source for our location.
