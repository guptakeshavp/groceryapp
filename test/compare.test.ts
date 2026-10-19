// Behaviour tests through the one seam: compareBasket() with fake adapters replaying real listings.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { compareBasket, type Comparison } from '../src/core/compare.ts';
import { InMemoryFeeMemory } from '../src/core/fee-memory.ts';
import { AdapterError } from '../src/domain/types.ts';
import { bigbasket, blinkit, catalogue, instamart, weeklyBasket, withInstamart } from './fixtures/household.ts';

const app = (c: Comparison, id: string) => {
  const r = c.apps.find((a) => a.app === id);
  assert.ok(r, `no result for ${id}`);
  return r;
};
const line = (c: Comparison, appId: string, itemId: string) => {
  const l = app(c, appId).lines.find((x) => x.itemId === itemId);
  assert.ok(l);
  return l.fill;
};
const now = new Date('2026-10-19T10:00:00+05:30');

describe('weekly basket on real Blinkit + BigBasket listings', () => {
  const run = () =>
    compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit(), bigbasket()], feeMemory: new InMemoryFeeMemory(), now });

  test('verdict: Blinkit cheapest all-in, BigBasket runner-up', async () => {
    const c = await run();
    assert.equal(c.verdict?.app, 'blinkit');
    assert.equal(c.verdict?.total, 2045); // 2036 items + ₹9 handling
    assert.equal(c.verdict?.estimated, false);
    assert.equal(c.verdict?.runnerUp?.app, 'bigbasket');
    assert.equal(c.verdict?.runnerUp?.gap, 86);
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
    const fill = line(c, 'bigbasket', 'maggi');
    assert.equal(fill.kind, 'closest');
    assert.ok(c.worthKnowing.some((w) => /Maggi Masala Noodles on BigBasket: closest pack is 2x420 g - \(Multipack\) — 3× what you wanted/.test(w)));
  });

  test('split across apps is a note with its saving and delivery count', async () => {
    const c = await run();
    assert.match(c.splitNote ?? '', /Blinkit \+ BigBasket would cost ₹2028.5 — ₹16.5 less than Blinkit alone, for 2 deliveries/);
  });

  test('handoff: pick list for Blinkit, real cart for BigBasket', async () => {
    const c = await run();
    const h = app(c, 'blinkit').handoff;
    assert.equal(h.kind, 'pick-list');
    if (h.kind === 'pick-list') assert.ok(h.lines.includes('Amul Salted Butter · 100 g × 5'));
    assert.deepEqual(app(c, 'bigbasket').handoff, { kind: 'cart' });
  });
});

describe('out of stock', () => {
  test('an Item out of stock everywhere on an app is unavailable there, never re-matched', async () => {
    const listings = (await import('./fixtures/household.ts')).realListings('blinkit').map((l) =>
      l.listingId.includes('amul-cow-ghee') ? { ...l, inStock: false } : l,
    );
    const c = await compareBasket({
      basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit({ listings }), bigbasket()], feeMemory: new InMemoryFeeMemory(), now,
    });
    assert.deepEqual(line(c, 'blinkit', 'ghee'), { kind: 'unavailable', reason: 'out-of-stock' });
    assert.deepEqual(app(c, 'blinkit').missingItemIds, ['ghee']);
    assert.ok(c.worthKnowing.includes('Amul Cow Ghee: out of stock on Blinkit'));
    // A basket missing ghee must not win just for being smaller.
    assert.equal(c.verdict?.app, 'bigbasket');
  });
});

describe('real carts (Instamart, BigBasket)', () => {
  const setup = (o: Parameters<typeof instamart>[0], decision?: 'replace' | 'estimate', memory = new InMemoryFeeMemory()) => {
    const im = instamart(o);
    const result = compareBasket({
      basket: weeklyBasket(), catalogue: withInstamart(catalogue()), adapters: [blinkit(), im], feeMemory: memory, now,
      cartDecisions: decision ? { instamart: decision } : undefined,
    });
    return { im, result, memory };
  };

  test('a non-empty cart is never touched without asking', async () => {
    const { im, result } = setup({ cartEmpty: false });
    const r = app(await result, 'instamart');
    assert.equal(r.status, 'needs-cart-decision');
    assert.equal(im.called('priceCart'), 0);
    assert.equal(im.cart, undefined);
  });

  test('"estimate" uses the last real bill\'s fees, labelled with their date', async () => {
    const memory = new InMemoryFeeMemory();
    const seen = new Date('2026-10-12T09:00:00+05:30');
    memory.record('instamart', { lines: [], fees: [{ label: 'Handling', amount: 12 }], autoDiscounts: [], toPay: 0, coupons: [] }, seen);
    const { im, result } = setup({ cartEmpty: false }, 'estimate', memory);
    const r = app(await result, 'instamart');
    assert.equal(r.status, 'estimated');
    assert.equal(r.feesAsOf, seen);
    assert.equal(r.total, (r.itemsTotal as number) + 12);
    assert.equal(im.called('priceCart'), 0);
  });

  test('"estimate" with no earlier bill shows items only, fees unknown', async () => {
    const r = app(await setup({ cartEmpty: false }, 'estimate').result, 'instamart');
    assert.equal(r.status, 'fees-unknown');
    assert.equal(r.total, r.itemsTotal);
  });

  test('an empty cart is priced for real, remembered, and left holding the basket', async () => {
    const { im, result, memory } = setup({ cartEmpty: true });
    const r = app(await result, 'instamart');
    assert.equal(r.status, 'real');
    assert.ok(im.cart && im.cart.length > 0);
    assert.deepEqual(r.handoff, { kind: 'cart' });
    assert.deepEqual(memory.get('instamart')?.fees, [{ label: 'Delivery', amount: 0 }, { label: 'Handling', amount: 9 }]);
  });
});

describe('what the total counts', () => {
  test('automatic discounts count; coupons are listed, not counted', async () => {
    const c = await compareBasket({
      basket: weeklyBasket(), catalogue: catalogue(),
      adapters: [blinkit({ autoDiscounts: [{ label: 'Store offer', amount: 50 }], coupons: ['FLAT75 — ₹75 off above ₹499'] })],
      feeMemory: new InMemoryFeeMemory(), now,
    });
    const r = app(c, 'blinkit');
    assert.equal(r.total, 2045 - 50);
    assert.deepEqual(r.coupons, ['FLAT75 — ₹75 off above ₹499']);
  });
});

describe('failures', () => {
  test('expired login: couldn\'t check, with the reason', async () => {
    const c = await compareBasket({
      basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit({ auth: { state: 'expired' } }), bigbasket()], feeMemory: new InMemoryFeeMemory(), now,
    });
    assert.equal(app(c, 'blinkit').status, 'couldnt-check');
    assert.equal(app(c, 'blinkit').reason, 'login expired');
    assert.equal(c.verdict?.app, 'bigbasket');
  });

  test('one gentle retry: a single block is absorbed', async () => {
    const b = blinkit({ failures: { getListings: [new AdapterError('blank', 'empty results page')] } });
    const c = await compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [b], feeMemory: new InMemoryFeeMemory(), now });
    assert.equal(app(c, 'blinkit').status, 'real');
    assert.equal(b.called('getListings'), 2);
  });

  test('blocked twice: couldn\'t check, and no third attempt', async () => {
    const block = () => new AdapterError('rate-limited', 'HTTP 429', 45);
    const b = blinkit({ failures: { getListings: [block(), block()] } });
    const c = await compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [b, bigbasket()], feeMemory: new InMemoryFeeMemory(), now });
    assert.equal(app(c, 'blinkit').status, 'couldnt-check');
    assert.equal(app(c, 'blinkit').reason, 'rate-limited (retry after 45 s)');
    assert.equal(b.called('getListings'), 2);
    assert.equal(c.apps.at(-1)?.app, 'blinkit');
  });

  test('prices read but bill blocked: falls back to a labelled estimate', async () => {
    const memory = new InMemoryFeeMemory();
    memory.record('blinkit', { lines: [], fees: [{ label: 'Handling', amount: 9 }], autoDiscounts: [], toPay: 0, coupons: [] }, new Date('2026-10-15'));
    const err = () => new AdapterError('blocked', 'challenge page');
    const c = await compareBasket({
      basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit({ failures: { priceCart: [err(), err()] } })], feeMemory: memory, now,
    });
    const r = app(c, 'blinkit');
    assert.equal(r.status, 'estimated');
    assert.equal(r.total, 2045);
    assert.match(r.reason ?? '', /couldn't read the bill/);
  });
});

test('the adapter seam has no way to place an order', () => {
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(blinkit()));
  assert.ok(!methods.some((m) => /order|checkout|place/i.test(m)), methods.join(', '));
});
