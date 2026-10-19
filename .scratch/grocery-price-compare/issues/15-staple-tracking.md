# How does staple price tracking work?

Type: grilling
Status: resolved
Blocked by: —

## Question

Tracking runs only while the Mac is on. Decide which confirmed Items are tracked (all, or ones marked as staples), when checks run (on app open, on a schedule while running, piggy-backing on basket comparisons), how much price history is kept (given Swiggy's "immediate task" data rule), and how a drop is shown to Keshav in the app.

## Answer

Resolved 2026-10-19 by grilling with Keshav.

1. **What's tracked:** Items Keshav marks as **staples** ("track this", ticked at Item confirmation or later), capped at ~15. Big-ticket occasional buys (ghee) qualify — the choice is Keshav's, not frequency-based.
2. **When checks run:** every basket run records prices for its Items. Separately, a staple not checked in ~24 h gets a quiet background check while the tool is running (e.g. on open), spread over several minutes. Days with the Mac off are simply gaps.
3. **Apps:** Zepto, Blinkit, BigBasket, Flipkart Minutes. **Instamart is excluded** from tracking checks and stored history, to respect Swiggy's data rule ("only use Swiggy-originated data to serve the user's immediate task… retain only as long as the session needs it" — mcp.swiggy.com/builders/docs/operate/data-and-compliance.md). Instamart is still priced live in every basket comparison.
4. **History:** ~6 months per Item per app, stored locally on the Mac (covers the 6-week deal rule plus seasonal patterns).
5. **How drops surface:** via "Which deals does the tool surface beyond the basket's coupon note?" — start-screen strip + basket-line badge.
6. **Verify during build:** whether Zepto's MCP terms carry a similar data-use rule; if so, treat Zepto like Instamart.
