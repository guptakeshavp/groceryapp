# Grocery compare

A personal tool for one household in Ahmedabad. You paste the family's WhatsApp grocery list, and it tells you which quick-commerce app is cheapest for that basket, comparing item prices only. It covers Zepto, Swiggy Instamart, Blinkit, Flipkart Minutes and BigBasket.

The tool is read-only on every app. It never touches a cart and never places an order. It gives you a pick list to follow in the app.

The spec, research and decisions are in [`.scratch/grocery-price-compare/`](.scratch/grocery-price-compare/), starting from [`map.md`](.scratch/grocery-price-compare/map.md) and [`spec.md`](.scratch/grocery-price-compare/spec.md).

## Run

Requires Node 24 and Google Chrome.

```sh
npm install
npm start            # http://localhost:4321
```

## One-time setup

| App | How it's read | Setup |
|---|---|---|
| Zepto | Official MCP connector, read-only login | `npm run probe zepto`, then log in with phone + OTP |
| Instamart | Official Swiggy MCP connector (Personal Use) | `npm run probe instamart`, then log in with phone + OTP |
| Blinkit, Flipkart Minutes | A dedicated, visible Chrome profile | `npm run chrome-setup`: set the home address on each site, then quit that Chrome |
| BigBasket | **Assisted**: it blocks automated browsers, so you capture its search pages yourself | Open http://localhost:4321/helper and drag the bookmark to your bookmarks bar. When a comparison asks, use "Open BigBasket searches" and click the bookmark on each tab |

Until `chrome-setup` has been run, Blinkit replays prices recorded on 2026-10-19, and the app labels them as recorded.

Logins are stored under `data/`, which is git-ignored. You type OTPs yourself on each app's own page; the tool never sees them.

## Develop

```sh
npm test             # behaviour tests through the adapter seam (fake adapters + real recorded listings)
npm run typecheck
npm run smoke zepto "amul cow ghee"     # live read-only search against a real adapter
```
