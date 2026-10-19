# How does the tool get each app's all-in basket total?

Type: grilling
Status: resolved
Blocked by: 07

## Question

Fees change ~monthly and are mostly unpublished, so the fee research points to reading each app's real logged-in cart total rather than modelling fees. Decide, per platform, how the all-in total (items + all fees, with Prime / Swiggy One applied) is obtained — real cart preview vs. computed estimate — and how to do it without disturbing the family's real carts (e.g. Instamart's `update_cart` replaces the whole cart). Also decide whether coupons and bank/card offers count toward the total.

## Answer

Resolved 2026-10-19 by grilling with Keshav.

1. **Real totals wherever possible:**
   - **Zepto:** official MCP order preview (`confirmOrder:false` → `deliveryFee`, `toPayAmount`) on the MCP session cart, which is separate from the app cart.
   - **Blinkit:** stateless `/v5/carts` pricing call (returns `bill_details` incl. delivery and additional charges, `free_delivery_mov`), made from inside the automated Chrome.
   - **Flipkart Minutes:** guest cart if it shows fees (verify during build), else estimate; go gently because the cart API rate-limits hard (HTTP 429).
   - **Instamart:** MCP `update_cart` → `get_cart` (`billBreakdown`) on Keshav's real cart.
   - **BigBasket:** checkout preview of Keshav's real cart in the automated Chrome.
2. **Accounts:** the tool uses Keshav's own accounts (Swiggy One, Prime). Family members order from their own accounts.
3. **Cart collision (Instamart, BigBasket):** check the cart first. Empty → price. Non-empty → ask Keshav: replace it, or estimate that app this run. The priced basket stays in those carts afterwards as a ready-to-checkout handoff. Zepto's MCP cart doesn't appear in the app, so no handoff there.
4. **What the total counts:** item prices + all fees + whatever the cart applies automatically (membership waivers, automatic discounts, free items). Coupons and bank/card offers are excluded from the total, but listed as a note when the app reveals them (e.g. Instamart `list_coupons`).
5. **Estimates:** item prices + the fee lines from that app's last real bill, labelled "estimated (fees as of <date>)". No prior bill → items only, marked "fees unknown".

**Verify during build:** whether Zepto's preview itemises handling/small-cart fees; whether Minutes' guest cart shows fees; whether Instamart MCP prices match the app.
