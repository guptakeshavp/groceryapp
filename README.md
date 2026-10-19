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

Logins are stored under `data/`, which is git-ignored. You type OTPs yourself on each app's own page; the tool never sees them. When a login has expired, or will within 3 days (Instamart: 30 days after last use), the start screen shows **Log in again**.

### Optional: Claude match suggestions

When you match an Item, the panel arrives with a best guess already ticked. With Anthropic credentials (`ANTHROPIC_API_KEY` in the environment when you `npm start`), Claude (`claude-opus-5-5`) makes the guess. It's good with renames and variants, such as "Pasteurised Butter" being Amul's ordinary salted butter. Without credentials, simple word-matching rules make it instead. Either way you confirm every match.

### Daily staple checks

While the app is running, staples not checked in about 24 hours are re-checked quietly, about once a day, on Zepto, Blinkit and Flipkart Minutes. Instamart is excluded by Swiggy's data rule, and BigBasket needs your captures. This builds the price history that the "Deals on your Items" strip uses. Set `NO_SWEEP=1` to turn it off.

## Develop

```sh
npm test             # behaviour tests through the adapter seam (fake adapters + real recorded listings)
npm run typecheck
npm run smoke zepto "amul cow ghee"     # live read-only search against a real adapter
```
