# How does the household shop today, and where should the tool live?

Type: grilling
Status: resolved
Blocked by: —

## Question

Who in the family orders, on which devices, and how often? Which memberships do we hold on which apps? Where would the family actually use the tool — a phone web page, a WhatsApp bot, a laptop script, something else? Is there an always-on machine available? Which apps are used most, and is any of the six droppable?

## Answer

Resolved 2026-10-19 by grilling with Keshav.

1. **Ordering pattern** — one or two people order. A bigger basket roughly weekly plus frequent small top-ups. The tool is for the big basket; small top-ups aren't worth comparing.
2. **Memberships held** — Amazon Prime and Swiggy One. No others (no Zepto Pass, BB Star, Flipkart VIP/Plus). Fee logic must account for these two.
3. **Form & user** — a web app running locally on Keshav's Mac (`localhost`), used only by Keshav in his browser. The family relays what they need; Keshav compares and orders. Opening it to family phones over home Wi-Fi is a possible later step, not v1.
4. **Always-on machine** — none. Staple tracking runs only while the Mac is on (on app open / while running); gaps in price history are acceptable. No server.
5. **Platforms** — ranked Blinkit, Zepto, Instamart (core), then BigBasket. **v1 must-have:** those four. **Nice-to-have:** Amazon Fresh and Flipkart Minutes, only if reading their prices is easy.
6. **Account risk** — read prices through Keshav's real logged-in accounts, gently (human pace, on demand). Fall back to a throwaway account for any one app that proves aggressive about blocking.
