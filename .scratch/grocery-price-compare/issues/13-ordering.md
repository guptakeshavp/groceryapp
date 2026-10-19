# Does the tool ever place orders, or stop at handing off?

Type: grilling
Status: resolved
Blocked by: —

## Question

After the verdict, what does "Open <app>" do per app? Options range from compare-only (Keshav orders by hand), through handoff (basket left in the Instamart/BigBasket carts; deep-link or copied list for Blinkit/Zepto/Minutes), to the tool placing the order (Zepto/Instamart MCPs support it; the browser apps would need checkout automation). Decide per app, including any safeguards if ordering is in.

## Answer

Resolved 2026-10-19 by grilling with Keshav.

1. **The tool never places orders in v1.** Keshav places every order himself in the app on his phone. Ordering through the Zepto/Instamart MCPs (with explicit confirmation) is a possible later addition, not v1.
2. **Instamart and BigBasket handoff:** the comparison leaves the basket in Keshav's real account carts, which sync to the phone app. The result screen says so ("Your basket is in your Instamart cart").
3. **Blinkit, Zepto and Flipkart Minutes handoff:** a **pick list** with the exact listing, container and pack count per line (e.g. "Amul Cow Ghee pouch 1 L × 1", "Amul Salted Butter 100 g × 5"). It stays on the Mac screen while Keshav orders on his phone, and "Copy list" works for WhatsApp, e.g. when a family member orders instead. No automatic cart filling in v1.
4. The verdict banner's "Open <app>" action (from "What does the basket screen look like?") becomes this per-app handoff.
