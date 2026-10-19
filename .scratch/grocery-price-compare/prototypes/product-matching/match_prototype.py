#!/usr/bin/env python3
"""PROTOTYPE - throwaway. Answers: "How are the same products matched across apps?"

Run:  python3 match_prototype.py
Data: listings.*.json in this folder (real search results, Ahmedabad, 2026-10-19).

For a basket line like "Amul Cow Ghee 1 L" it sorts every listing on every app into:
  EXACT        same brand, same variant, same size        -> compare price directly
  OTHER SIZE   same brand + variant, different pack size  -> compare per-unit price
  VARIANT?     same brand, a variant word differs          -> ask Keshav
  OTHER BRAND  same kind of product, different brand       -> shown as an alternative
  (anything with a veto word, e.g. "pooja", "cookies", is dropped)
Keshav can confirm/reject pairings; overrides live in memory only.
"""
import glob, json, re, os

HERE = os.path.dirname(os.path.abspath(__file__))

# Words that change WHICH product it is (not just its name).
VARIANT_WORDS = {
    "cow", "pure", "buffalo", "a2", "desi", "premium", "organic", "organically",
    "salted", "unsalted", "chiplet", "chiplets", "lite", "cooking",
    "top", "front", "powder", "liquid", "express", "pods", "shots",
    "shudh", "chakki", "multigrain", "multigrains", "sharbati", "select", "fibre",
    "double", "special", "spicy", "cheesy", "atta", "sambhar", "sambar", "spring",
}
# Words that mean "this is not the thing at all" unless the basket line asks for them.
VETO_WORDS = {"pooja", "puja", "non-edible", "cookies", "buttermilk", "spread",
              "cuppa", "cup", "pazzta", "pasta", "sauce", "ketchup", "sabzi", "peeled"}
STOP = {"with", "made", "quality", "spices", "minute", "minutes", "2", "instant",
        "noodles", "detergent", "for", "load", "the", "of", "and", "by", "nu",
        "gaay", "ghau", "no", "lot", "lott", "dungdi", "100%", "0%", "maida",
        "tuppa", "l", "ltr", "kg", "g", "ml", "pcs", "x", "pack", "multipack"}
SPELLING = {"pasturised": "pasteurised", "multigrains": "multigrain", "sambar": "sambhar",
            "yippee": "yippee", "cow's": "cow", "organically": "organic", "chiplets": "chiplet",
            "masala": "masala"}
DEFAULT_BASKET = [
    ("Amul Cow Ghee 1 L", "ghee"),
    ("Amul Salted Butter 500 g", "amul butter"),
    ("Aashirvaad Shudh Chakki Atta 5 kg", "aashirvaad atta"),
    ("Maggi Masala Noodles 280 g", "maggi"),
    ("Surf Excel Matic Top Load Liquid 5 kg", "surf excel matic"),
    ("Onion 1 kg", "onion"),
]


def load():
    data = {}
    for f in sorted(glob.glob(os.path.join(HERE, "listings.*.json"))):
        d = json.load(open(f))
        data[d["platform"]] = d["searches"]
    return data


def parse_size(s):
    """'4 x 70 g' -> (280, 'g'); '1 L - Tin' -> (1000, 'ml'); '50 pcs' -> (50, 'pcs')."""
    s = s.lower().replace("ltr", "l")
    m = re.search(r"(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b", s)
    if m:
        n, q, u = float(m[1]), float(m[2]), m[3]
    else:
        m = re.search(r"(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pcs)\b", s)
        if not m:
            return None
        n, q, u = 1, float(m[1]), m[2]
    q *= n
    if u == "kg": q, u = q * 1000, "g"
    if u == "l": q, u = q * 1000, "ml"
    return (q, u)


def tokens(text):
    text = text.lower()
    text = re.sub(r"\([^)]*\)", " ", text)          # drop "(Gaay Nu Ghee)", "(Lott)"...
    text = re.sub(r"\d+(\.\d+)?\s*(kg|g|ml|l|ltr|pcs)\b", " ", text)
    out = set()
    for t in re.split(r"[^a-z0-9'%-]+", text):
        t = SPELLING.get(t, t).strip("'-")
        if t and t not in STOP:
            out.add(t)
    return out


def unit_price(price, size):
    if not size: return None, ""
    q, u = size
    if u == "pcs": return price / q, "/pc"
    return price / q * (1000 if q >= 1000 else 100), ("/kg" if u == "g" else "/L") if q >= 1000 else ("/100g" if u == "g" else "/100ml")


def per_kg(price, size):
    if not size or size[1] == "pcs": return None
    return price / size[0] * 1000  # ₹ per kg or per L (g≈ml, flagged)


def classify(query, item, brand_guess, overrides):
    key = (query, item["_platform"], item["name"], item["size"])
    if key in overrides:
        return overrides[key], "you said so"
    q_tok, i_tok = tokens(query), tokens(item["name"])
    if (i_tok & VETO_WORDS) - q_tok:
        return None, f"veto: {', '.join(sorted((i_tok & VETO_WORDS) - q_tok))}"
    brand = item.get("brand") or item["name"].split()[0]
    same_brand = brand_guess is None or brand.lower().startswith(brand_guess)
    core = (q_tok - VARIANT_WORDS) - {brand_guess or ""}
    if core and not core & i_tok:
        return None, "different product"
    v_diff = sorted((q_tok ^ i_tok) & VARIANT_WORDS)
    if not same_brand:
        return "OTHER BRAND", f"brand {brand}" + (f"; differs: {', '.join(v_diff)}" if v_diff else "")
    if v_diff:
        return "VARIANT?", "differs: " + ", ".join(v_diff)
    qs, isz = parse_size(query), parse_size(item["size"])
    if qs and isz and qs == isz:
        return "EXACT", ""
    return "OTHER SIZE", f"{item['size']} vs wanted {query.split()[-2]} {query.split()[-1]}"


def run_line(query, search, data, overrides, show_all=False):
    words = query.split()
    brand_guess = words[0].lower() if words[0].lower() in {
        "amul", "aashirvaad", "maggi", "surf", "gowardhan", "patanjali", "fortune"} else None
    wanted = parse_size(query)
    print(f"\n=== {query}   (search: '{search}', wanted size: {wanted}) ===")
    best = {}
    for plat, searches in data.items():
        items = searches.get(search) or [i for s in searches.values() for i in s]
        rows = []
        for it in items:
            it = dict(it, _platform=plat)
            tier, why = classify(query, it, brand_guess, overrides)
            if tier is None and not show_all:
                continue
            pk = per_kg(it["price"], parse_size(it["size"]))
            rows.append((tier or "dropped", it, why, pk))
        order = {"EXACT": 0, "OTHER SIZE": 1, "VARIANT?": 2, "OTHER BRAND": 3, "dropped": 4, "REJECTED": 5}
        rows.sort(key=lambda r: (order.get(r[0], 9), r[3] or 1e9))
        print(f"\n  [{plat}]")
        if not rows:
            print("    (nothing usable)")
        for i, (tier, it, why, pk) in enumerate(rows[:8]):
            stock = "" if it.get("in_stock", True) else "  ** OUT OF STOCK **"
            pkt = f"₹{pk:7.0f}/kg·L" if pk else "        -   "
            print(f"    {tier:11} ₹{it['price']:>8.2f}  {pkt}  {it['name'][:52]:52} {it['size']:<20} {why}{stock}")
        usable = [r for r in rows if r[0] in ("EXACT", "OTHER SIZE") and r[1].get("in_stock", True)]
        if usable:
            best[plat] = usable[0]
    print("\n  --> verdict")
    exact = {p: r for p, r in best.items() if r[0] == "EXACT"}
    if exact:
        p, r = min(exact.items(), key=lambda kv: kv[1][1]["price"])
        print(f"      cheapest exact match: {p} ₹{r[1]['price']} ({r[1]['name']}, {r[1]['size']})")
    if best:
        p, r = min(best.items(), key=lambda kv: kv[1][3] or 1e9)
        print(f"      cheapest per kg/L (same product, any size): {p} ₹{r[3]:.0f}/kg·L ({r[1]['size']})")
    missing = [p for p in data if p not in best]
    if missing:
        print(f"      no in-stock same-product match on: {', '.join(missing)}")
    return best


def main():
    data = load()
    overrides = {}
    print("PROTOTYPE product matcher — platforms loaded:", ", ".join(data))
    while True:
        print("\nBasket:")
        for i, (q, _) in enumerate(DEFAULT_BASKET, 1):
            print(f"  {i}. {q}")
        print("  a = run all   t <text> = try your own line, e.g. 't Amul Pure Ghee 1 L'")
        print("  v <n> = show dropped listings too   ok/no <platform> <listing text> = confirm/reject a pairing for the last line   q = quit")
        cmd = input("> ").strip()
        if cmd == "q":
            break
        if cmd == "a":
            for q, s in DEFAULT_BASKET:
                run_line(q, s, data, overrides)
            last = None
        elif cmd.isdigit() and 1 <= int(cmd) <= len(DEFAULT_BASKET):
            last = DEFAULT_BASKET[int(cmd) - 1]
            run_line(*last, data, overrides)
        elif cmd.startswith("v ") and cmd[2:].isdigit():
            last = DEFAULT_BASKET[int(cmd[2:]) - 1]
            run_line(*last, data, overrides, show_all=True)
        elif cmd.startswith("t "):
            last = (cmd[2:], "")
            run_line(cmd[2:], "", data, overrides)
        elif cmd.split()[0] in ("ok", "no") and len(cmd.split()) >= 3:
            verb, plat, text = cmd.split(maxsplit=2)
            hits = [it for s in data.get(plat, {}).values() for it in s if text.lower() in it["name"].lower()]
            for it in hits:
                overrides[(last[0], plat, it["name"], it["size"])] = "EXACT" if verb == "ok" else "REJECTED"
            print(f"  {len(hits)} listing(s) marked {'EXACT' if verb == 'ok' else 'REJECTED'} for '{last[0]}'. Overrides now: {len(overrides)}")
            run_line(*last, data, overrides)
        else:
            print("  ?")


if __name__ == "__main__":
    main()
