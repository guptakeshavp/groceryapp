# How are logins kept alive, and how gentle is "gently"?

Type: grilling
Status: resolved
Blocked by: —

## Question

Decide how the tool prompts Keshav for re-authentication (Instamart OTP ~monthly, Zepto as needed, the automated Chrome profile for Blinkit/BigBasket/Minutes), and put numbers on "gently": pause between requests, maximum searches per run, and behaviour after a blank/blocked response (Blinkit went blank once after ~6 quick searches; Flipkart cart returns 429s).

## Answer

Resolved 2026-10-19 by grilling with Keshav.

1. **Expired logins:** the app shows "couldn't check: login expired" with a **Log in again** button. It opens that app's own login page (Swiggy/Zepto OAuth OTP page, or the site in the automated Chrome window), and Keshav types the OTP himself. The tool never handles OTPs or passwords.
2. **Advance warning:** for Instamart and Zepto (known token expiry), a start-screen notice ~3 days before expiry. The Chrome sites can't be predicted, so they rely on point 1.
3. **Pace:** one request at a time per app; apps run in parallel. ~4 s between requests on Chrome sites (Blinkit, BigBasket, Minutes); ~2 s on the official MCPs (Zepto, Instamart — Swiggy asks for one session per user and low concurrency). A basket of ~15 Items takes ~1–1.5 min, with results streaming in per app.
4. **Background staple checks:** one lookup every ~30 s, so roughly a 30-minute trickle once a day.
5. **Caps:** ≤ 40 lookups per app per run, ≤ 150 per app per day; beyond that, "couldn't check: daily limit".
6. **Blocks / blanks / 429s:** one gentle retry (per "How will the tool get prices from each app?"), then "couldn't check". Background checks on that app pause until the next day; any `Retry-After` is honoured (at least that long). Basket runs still try. Blocks on 3 different days within a week → a start-screen prompt to switch that app to a throwaway account (the fallback from "How does the household shop today, and where should the tool live?") or drop it.

Evidence: Blinkit returned a blank results page after ~6 searches a few seconds apart during the matching prototype; Flipkart's cart API returns HTTP 429 (~45 s); Swiggy's MCP gateway returns 429 with `Retry-After`.
