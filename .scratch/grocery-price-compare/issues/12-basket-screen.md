# What does the basket screen look like?

Type: prototype
Status: resolved
Blocked by: 11

## Question

How does Keshav enter a basket (Items + rough quantities — typed, pasted from a family WhatsApp message, or picked from saved staples?), confirm new Items' matches, and read the result: per-app all-in totals, which lines are unavailable or "couldn't check", and whether a split across apps is ever suggested. Prototype a few rough UI variations against the real listings in `prototypes/product-matching/` and react.

## Answer

Resolved 2026-10-19 by prototype; Keshav accepted Claude's recommendation without reviewing the variants in detail. Prototype: [prototypes/basket-screen/basket_prototype.html](../prototypes/basket-screen/basket_prototype.html) (variants A grid / B verdict first / C step-by-step, switch with `?variant=` or ← →; Blinkit + BigBasket item prices real, everything else tagged sample).

**Main screen = Variant B ("verdict first"), borrowing from A and C:**

1. **Input:** a paste box for the family's WhatsApp message (Hinglish, free-form, e.g. "pyaaz 1 kg", "maggi 1 packet (280g wala)"), parsed into known Items + quantities, with new Items flagged. Saved staple lists can also be loaded.
2. **Verdict banner:** cheapest all-in app and total, how much less than the runner-up (noting if that one is estimated), real/sample tags, and "Open <app>" + "Copy list" actions.
3. **Ranked app list:** every app's all-in total with items vs fees, an expandable bill, coupon notes, and status tags. "Estimated" carries its reason and fee date; "couldn't check" carries its reason plus a Retry button.
4. **"Worth knowing" list:** per-line caveats (out of stock → different container, closest-pack warnings, matching notes like "Pasteurised = salted"), plus the split-across-apps option as a single informational line. Never a recommendation.
5. **New-Item confirmation = Variant C's step 2:** for each app, Claude's best candidate is pre-ticked among the alternatives, with an "Any brand is fine" checkbox and an option to pin a container. Opened from a "Needs you" panel under the paste box.
6. **Per-line grid = Variant A, behind a toggle:** Items × apps with the cheapest app per line highlighted, for when Keshav wants to see why an app won.

**Evidence:** on real Blinkit + BigBasket prices for the sample basket, splitting across both saved only ~₹16 for two deliveries — splits stay informational.
