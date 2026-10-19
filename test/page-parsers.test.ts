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

test('Blinkit cards: stable product ids, and confirmations made under old name-based ids still match', async () => {
  const { parseBlinkitCards, blinkitIdMatches } = await import('../src/adapters/page-parsers.ts');
  const [l] = parseBlinkitCards([{ id: '159', text: '16 MINS\nAmul Salted Butter\n100 g\n₹63\nADD' }]);
  assert.equal(l.listingId, 'blinkit:159');
  assert.ok(blinkitIdMatches(l, new Set(['blinkit:amul-salted-butter-100-g'])));
  assert.ok(blinkitIdMatches(l, new Set(['blinkit:159'])));
  assert.ok(!blinkitIdMatches(l, new Set(['blinkit:999'])));
});

test('Flipkart Minutes cards: MRP first then price, sponsored cards dropped, pid as id (real text, 2026-10-19)', async () => {
  const { parseMinutesCard } = await import('../src/adapters/page-parsers.ts');
  assert.deepEqual(parseMinutesCard('GHEX', 'Best Seller\n2%\nOff\n1 L\nAmul Cow Ghee Pouch\n₹635 \n₹622 \nAdd'), {
    app: 'minutes', listingId: 'minutes:GHEX', name: 'Amul Cow Ghee Pouch', size: '1 L', price: 622, mrp: 635, inStock: true,
  });
  assert.equal(parseMinutesCard('P2', 'AD\n2%\nOff\n1 L\nPATANJALI Pure Danedar Cow Ghee Box\n₹810 \n₹793 \nAdd'), undefined);
  assert.equal(parseMinutesCard('P3', '500 ml\nAABAD Cow Ghee Pouch\n₹391 \nNotify Me')?.inStock, false);
});

test('Flipkart Minutes page: every card parsed, header skipped, pid where a link exists (real text, 2026-10-19)', async () => {
  const { parseMinutesPage } = await import('../src/adapters/page-parsers.ts');
  const ls = parseMinutesPage(page('minutes-amul-cow-ghee-2026-10-19.txt'), { 'AABAD Cow Ghee Pouch': 'GHEG7ZSZMRJYS6RH' });
  assert.deepEqual(ls.map((l) => [l.listingId, l.name, l.size, l.price, l.mrp]), [
    ['minutes:amul-cow-ghee-pouch-1-l', 'Amul Cow Ghee Pouch', '1 L', 622, 635],
    ['minutes:amul-cow-tetrapack-1-l', 'Amul Cow Tetrapack', '1 L', 632, 645],
    ['minutes:GHEG7ZSZMRJYS6RH', 'AABAD Cow Ghee Pouch', '500 ml', 340, 391],
  ]);
});

test('Flipkart Minutes page: repeated cards are de-duplicated', async () => {
  const { parseMinutesPage } = await import('../src/adapters/page-parsers.ts');
  const text = 'Cart\n450 ml\nBaidyanath Pure Desi Ghee Tetrapack\n₹350 \nAdd\n450 ml\nBaidyanath Pure Desi Ghee Tetrapack\n₹350 \nAdd';
  assert.equal(parseMinutesPage(text, {}).length, 1);
});
