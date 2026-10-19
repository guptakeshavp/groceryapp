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

/** Signs the page is a bot challenge or empty rather than results. */
export function looksBlocked(text: string): 'blocked' | 'blank' | undefined {
  if (/access denied|verify you are human|are you a robot|captcha|request blocked|attention required/i.test(text)) return 'blocked';
  if (!/MINS?\b/i.test(text)) return 'blank';
  return undefined;
}
