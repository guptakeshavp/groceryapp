# Which deals does the tool surface beyond the basket's coupon note?

Type: grilling
Status: resolved
Blocked by: —

## Question

Deal discovery was ranked second. Given what each app exposes (no offers on Zepto's MCP; Instamart `list_coupons` partially rolled out; MRP vs offer price visible in listings on all of them), decide which deals the tool surfaces — discounts on confirmed Items, app-wide sales, bank/card offers — and where they appear (basket screen, a separate "deals" view, or not at all in v1).

## Answer

Resolved 2026-10-19 by grilling with Keshav.

1. **Scope:** deals on Keshav's **confirmed Items only**, detected from prices the tool already fetches (basket runs and tracking checks). No category or "deals of the day" sweeps (avoids Swiggy's bulk-export revocation risk and keeps pacing gentle). Bank/card offers and app-wide sales are not covered in v1.
2. **What counts as a deal:** the Item is below its **own usual price** across the five apps. Starting rule: at least 8% below the 6-week median, or the lowest seen in 6 weeks; the builder may tune it. MRP "% OFF" labels are ignored (inflated MRPs; e.g. Blinkit's "23% OFF" Anveshan ghee at ₹1,680). Nothing is flagged until enough history exists.
3. **Where deals show:** a "Deals on your Items" strip at the top of the start screen (above the paste box; hidden when empty), plus a deal badge on matching lines in basket results.
4. **Unchanged:** the per-basket coupon note comes from "How does the tool get each app's all-in basket total?". Zepto's app-only Steal Deals stay invisible (known gap).
5. **Depends on** price-history retention, decided in "How does staple price tracking work?".
