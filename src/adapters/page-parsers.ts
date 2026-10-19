import type { Listing } from '../domain/types.ts';

/** Same id scheme as the recorded fixtures: "<app>:<slug of name + size>". */
export function listingId(app: string, nameAndSize: string): string {
  return `${app}:${nameAndSize.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

const rupees = (s: string) => Number(s.replace(/[₹,\s]/g, ''));
const isPrice = (s: string) => /^₹\s?[\d,]+(\.\d+)?$/.test(s);
const isEta = (s: string) => /^\d+\s*MINS?$/i.test(s);

/**
 * Blinkit search page text (document.body.innerText). Each card:
 *   [n% OFF] · "11 MINS" · name · size · ₹price · [₹mrp] · "ADD" | "Out of Stock"
 * Stops at "Showing related products" — those aren't results for the query.
 */
export function parseBlinkitText(text: string): Listing[] {
  const all = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const end = all.findIndex((l) => /^Showing related products/i.test(l));
  const lines = end >= 0 ? all.slice(0, end) : all;
  const out: Listing[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isEta(lines[i])) continue;
    const name = lines[i + 1];
    const size = lines[i + 2];
    const prices: number[] = [];
    let j = i + 3;
    while (j < lines.length && isPrice(lines[j])) prices.push(rupees(lines[j++]));
    const action = lines[j] ?? '';
    if (!name || !size || prices.length === 0) continue;
    out.push({
      app: 'blinkit', listingId: listingId('blinkit', `${name} ${size}`), name, size,
      price: prices[0], mrp: prices[1], inStock: !/out of stock|notify/i.test(action),
    });
  }
  return out;
}

/**
 * Blinkit cards read from the DOM: each search result is a [role=button] element whose id is Blinkit's
 * product id — stable across renames, unlike the name. Cards after "Showing related products" are excluded
 * by the page script.
 */
export function parseBlinkitCards(cards: { id: string; text: string }[]): Listing[] {
  return cards.flatMap(({ id, text }) => parseBlinkitText(text).slice(0, 1).map((l) => ({ ...l, listingId: `blinkit:${id}` })));
}

/** Ids confirmed before Blinkit's product ids were used were name+size slugs; keep honouring them. */
export function blinkitIdMatches(l: Listing, wanted: ReadonlySet<string>): boolean {
  return wanted.has(l.listingId) || wanted.has(listingId('blinkit', `${l.name} ${l.size}`));
}

/**
 * BigBasket search page text. Each card:
 *   [Out Of Stock] · [₹n OFF | n% OFF] · "10 MINS" · brand · name · [rating] · [N Ratings] · size ·
 *   ₹price · [₹mrp] · [Har Din Sasta!] · "Add" | "Notify Me"
 */
export function parseBigBasketText(text: string): Listing[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: Listing[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!isEta(lines[i])) continue;
    const brand = lines[i + 1];
    const name = lines[i + 2];
    let j = i + 3;
    while (j < lines.length && (/^\d(\.\d)?$/.test(lines[j]) || /Ratings?$/.test(lines[j]))) j++;
    const size = lines[j++];
    const prices: number[] = [];
    while (j < lines.length && isPrice(lines[j])) prices.push(rupees(lines[j++]));
    while (j < lines.length && !/^(Add|Notify Me)$/i.test(lines[j]) && !isEta(lines[j])) j++;
    if (!brand || !name || !size || prices.length === 0) continue;
    const full = `${brand} ${name}`;
    out.push({
      app: 'bigbasket', listingId: listingId('bigbasket', `${full} ${size}`), name: full, brand, size,
      price: prices[0], mrp: prices[1], inStock: !/^Notify Me$/i.test(lines[j] ?? ''),
    });
  }
  return out;
}

/**
 * One Flipkart Minutes card's text: [AD] · [Best Seller] · ["n%" · "Off"] · size · name · ₹mrp · ₹price · "Add".
 * The struck-through MRP comes first; the lower price is what you pay. Sponsored ("AD") cards are dropped.
 */
export function parseMinutesCard(pid: string, text: string): Listing | undefined {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.includes('AD')) return undefined;
  const body = lines.filter((l) => !/^(Best Seller|Off|\d+%|Bestseller|New)$/i.test(l));
  const prices = body.filter(isPrice).map(rupees);
  const words = body.filter((l) => !isPrice(l) && !/^(Add|Notify Me|Out of Stock|Sold Out|Coming Soon)$/i.test(l));
  const sizeAt = words.findIndex((l) => /^\d+(\.\d+)?\s*(x\s*\d+(\.\d+)?\s*)?(kg|g|ml|l|pcs|pc|units?)\b/i.test(l));
  const size = sizeAt >= 0 ? words[sizeAt] : '';
  const name = words.filter((_, k) => k !== sizeAt).join(' ');
  if (!name || prices.length === 0) return undefined;
  return {
    app: 'minutes', listingId: `minutes:${pid}`, name, size,
    price: Math.min(...prices), mrp: prices.length > 1 ? Math.max(...prices) : undefined,
    inStock: !/Notify Me|Out of Stock|Sold Out/i.test(text),
  };
}

/**
 * Whole Minutes results page. Cards end at "Add"/"Notify Me"; the header ends at "Cart". Some cards (the
 * top "Best Seller" block) have no product link, so `pidByName` (from links that exist) supplies Flipkart's
 * pid where it can, and a name+size slug otherwise.
 */
export function parseMinutesPage(text: string, pidByName: Record<string, string>): Listing[] {
  const all = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const start = all.indexOf('Cart') + 1;
  const out: Listing[] = [];
  let card: string[] = [];
  for (const line of all.slice(start)) {
    card.push(line);
    if (!/^(Add|Notify Me|Out of Stock|Sold Out)$/i.test(line)) continue;
    const draft = parseMinutesCard('', card.join('\n'));
    card = [];
    if (!draft) continue;
    const pid = pidByName[draft.name];
    const id = pid ? `minutes:${pid}` : listingId('minutes', `${draft.name} ${draft.size}`);
    if (out.some((l) => l.listingId === id)) continue; // Flipkart repeats some cards
    out.push({ ...draft, listingId: id });
  }
  return out;
}

/** Signs the page is a bot challenge or empty rather than results. */
export function looksBlocked(text: string): 'blocked' | 'blank' | undefined {
  if (/access denied|verify you are human|are you a robot|captcha|request blocked|attention required/i.test(text)) return 'blocked';
  if (!/MINS?\b/i.test(text)) return 'blank';
  return undefined;
}
