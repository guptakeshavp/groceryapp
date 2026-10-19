// Behaviour tests through the one seam: compareBasket() with fake adapters replaying real listings.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { compareBasket, type AppResult, type Comparison } from '../src/core/compare.ts';
import { AdapterError } from '../src/domain/types.ts';
import { bigbasket, blinkit, catalogue, instamart, realListings, weeklyBasket, withInstamart } from './fixtures/household.ts';

function checked(c: Comparison, id: string): Extract<AppResult, { status: 'checked' }> {
  const r = c.apps.find((a) => a.app === id);
  assert.ok(r && r.status === 'checked', `${id} was not checked`);
  return r;
}
function failed(c: Comparison, id: string): Extract<AppResult, { status: 'couldnt-check' }> {
  const r = c.apps.find((a) => a.app === id);
  assert.ok(r && r.status === 'couldnt-check', `${id} was checked`);
  return r;
}
const line = (c: Comparison, appId: string, itemId: string) => {
  const l = checked(c, appId).lines.find((x) => x.itemId === itemId);
  assert.ok(l);
  return l.fill;
};

describe('weekly basket on real Blinkit + BigBasket listings', () => {
  const run = () => compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit(), bigbasket()] });

  test('verdict: Blinkit cheapest on item prices, BigBasket runner-up, not a tie', async () => {
    const c = await run();
    assert.equal(c.verdict?.app, 'blinkit');
    assert.equal(c.verdict?.basketPrice, 2036);
    assert.equal(c.verdict?.runnerUp?.app, 'bigbasket');
    assert.equal(c.verdict?.runnerUp?.gap, 95);
    assert.equal(c.verdict?.tie, false);
    assert.deepEqual(c.apps.map((a) => a.app), ['blinkit', 'bigbasket']);
  });

  test('fills 500 g butter with five real 100 g packs (no 500 g pack exists)', async () => {
    const fill = line(await run(), 'blinkit', 'butter');
    assert.equal(fill.kind, 'filled');
    if (fill.kind !== 'filled') return;
    assert.deepEqual(fill.packs.map((p) => [p.listing.size, p.count]), [['100 g', 5]]);
    assert.equal(fill.cost, 315);
  });

  test('uses the in-stock tin when the cheaper pouch is out of stock, and says so', async () => {
    const c = await run();
    const fill = line(c, 'bigbasket', 'ghee');
    assert.equal(fill.kind, 'filled');
    if (fill.kind !== 'filled') return;
    assert.equal(fill.packs[0].listing.size, '1 L - Tin');
    assert.ok(c.worthKnowing.some((w) => /BigBasket: 1 L - Pouch is out of stock — using 1 L - Tin/.test(w)), c.worthKnowing.join('\n'));
  });

  test('shows the closest pack, never an invented one, when nothing fits', async () => {
    const c = await run();
    assert.equal(line(c, 'bigbasket', 'maggi').kind, 'closest');
    assert.ok(c.worthKnowing.some((w) => /Maggi Masala Noodles on BigBasket: closest pack is 2x420 g - \(Multipack\) — 3× what you wanted/.test(w)));
  });

  test('split across apps is a note with its saving and delivery count', async () => {
    const c = await run();
    assert.match(c.splitNote ?? '', /Blinkit \+ BigBasket would cost ₹2019.5 — ₹16.5 less than Blinkit alone, for 2 deliveries/);
  });

  test('every app hands off with an exact pick list', async () => {
    const c = await run();
    assert.ok(checked(c, 'blinkit').pickList.includes('Amul Salted Butter · 100 g × 5'));
    assert.ok(checked(c, 'bigbasket').pickList.includes('Amul Cow Ghee · 1 L - Tin × 1'));
  });
});

describe('tie rule', () => {
  test('within ₹15 is "practically a tie" (ignored handling fees could swing it)', async () => {
    const c = await compareBasket({
      basket: weeklyBasket(), catalogue: withInstamart(catalogue()),
      adapters: [blinkit(), instamart({}, (l) => (l.listingId.includes('amul-cow-ghee-pouch') ? 12 : 0))],
    });
    assert.equal(c.verdict?.app, 'blinkit');
    assert.equal(c.verdict?.runnerUp?.gap, 12);
    assert.equal(c.verdict?.tie, true);
  });

  test('more than ₹15 apart is a clear winner', async () => {
    const c = await compareBasket({
      basket: weeklyBasket(), catalogue: withInstamart(catalogue()),
      adapters: [blinkit(), instamart({}, (l) => (l.listingId.includes('amul-cow-ghee-pouch') ? 16 : 0))],
    });
    assert.equal(c.verdict?.tie, false);
  });
});

describe('out of stock', () => {
  test('an Item out of stock everywhere on an app is unavailable there, never re-matched, and that app cannot win by being smaller', async () => {
    const listings = realListings('blinkit').map((l) => (l.listingId.includes('amul-cow-ghee') ? { ...l, inStock: false } : l));
    const c = await compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit({ listings }), bigbasket()] });
    assert.deepEqual(line(c, 'blinkit', 'ghee'), { kind: 'unavailable', reason: 'out-of-stock' });
    assert.deepEqual(checked(c, 'blinkit').missingItemIds, ['ghee']);
    assert.ok(c.worthKnowing.includes('Amul Cow Ghee: out of stock on Blinkit'));
    assert.equal(c.verdict?.app, 'bigbasket');
    assert.deepEqual(c.apps.map((a) => a.app), ['bigbasket', 'blinkit']);
  });
});

describe('failures', () => {
  test("expired login: couldn't check, with the reason", async () => {
    const c = await compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit({ auth: { state: 'expired' } }), bigbasket()] });
    assert.equal(failed(c, 'blinkit').reason, 'login expired');
    assert.equal(c.verdict?.app, 'bigbasket');
  });

  test("a block that survives the governor's retry: couldn't check, with the reason, ranked last", async () => {
    const b = blinkit({ failures: { getListings: [new AdapterError('rate-limited', 'HTTP 429', 45)] } });
    const c = await compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [b, bigbasket()] });
    assert.equal(failed(c, 'blinkit').reason, 'rate-limited (retry after 45 s)');
    assert.equal(c.apps.at(-1)?.app, 'blinkit');
  });
});

test('the adapter seam is read-only: no cart, checkout or order operations', () => {
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(blinkit()));
  assert.ok(!methods.some((m) => /cart|order|checkout|place|pay/i.test(m)), methods.join(', '));
});

test('a confirmed listing that vanished (renamed/delisted) asks for a re-match instead of claiming "not sold"', async () => {
  const listings = realListings('blinkit').filter((l) => !l.listingId.includes('amul-cow-ghee'));
  const c = await compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit({ listings }), bigbasket()] });
  assert.deepEqual(line(c, 'blinkit', 'ghee'), { kind: 'unavailable', reason: 'listing-gone' });
  assert.ok(c.worthKnowing.includes('Amul Cow Ghee: confirmed listing not found (renamed or delisted?) — re-match it on Blinkit'));
});
