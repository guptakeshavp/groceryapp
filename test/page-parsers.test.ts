import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { looksBlocked, parseBigBasketText, parseBlinkitText } from '../src/adapters/page-parsers.ts';
import { recordedListings } from '../src/demo/seed.ts';

const page = (f: string) => readFileSync(new URL(`./fixtures/pages/${f}`, import.meta.url), 'utf8');

test('Blinkit: parses cards, skips "related products", ids match the recorded catalogue', () => {
  const ls = parseBlinkitText(page('blinkit-amul-butter-2026-10-19.txt'));
  assert.equal(ls.length, 6);
  assert.deepEqual(ls[0], { app: 'blinkit', listingId: 'blinkit:amul-salted-butter-100-g', name: 'Amul Salted Butter', size: '100 g', price: 63, mrp: undefined, inStock: true });
  assert.equal(ls[4].mrp, 305);
  assert.ok(!ls.some((l) => /Gold Full Cream Milk/.test(l.name)));
  const known = new Set(recordedListings('blinkit').map((l) => l.listingId));
  assert.ok(known.has(ls[0].listingId));
});

test('BigBasket: brand + name, ratings skipped, "Notify Me" = out of stock, ids match the recorded catalogue', () => {
  const ls = parseBigBasketText(page('bigbasket-amul-cow-ghee-2026-10-19.txt'));
  assert.deepEqual(ls.map((l) => [l.name, l.size, l.price, l.inStock]), [
    ['Amul Cow Ghee', '500 ml - Pouch', 348.25, false],
    ['Amul Cow Ghee', '1 L - Pouch', 660, false],
    ['Amul Cow Ghee', '1 L - Tin', 692, true],
    ['Amul Pure Ghee', '1 L - Pouch', 627, true],
  ]);
  const known = new Set(recordedListings('bigbasket').map((l) => l.listingId));
  assert.ok(known.has(ls[2].listingId), ls[2].listingId);
});

test('detects challenge pages and blank results', () => {
  assert.equal(looksBlocked('Attention Required! | Cloudflare'), 'blocked');
  assert.equal(looksBlocked('!\np\nr\nMy Cart'), 'blank');
  assert.equal(looksBlocked(page('blinkit-amul-butter-2026-10-19.txt')), undefined);
});
