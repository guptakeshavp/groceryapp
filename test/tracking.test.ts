import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { FakeClock } from '../src/core/clock.ts';
import { compareBasket } from '../src/core/compare.ts';
import { findDeals } from '../src/core/deals.ts';
import { emptyGovernorState, Governor } from '../src/core/governor.ts';
import { emptyHistory, PriceHistory } from '../src/core/history.ts';
import { backgroundSweep } from '../src/core/tracker.ts';
import type { Listing } from '../src/domain/types.ts';
import { MemoryStore } from '../src/store/json-store.ts';
import { bigbasket, blinkit, catalogue, instamart, realListings, weeklyBasket, withInstamart } from './fixtures/household.ts';

const day0 = new Date('2026-09-01T09:00:00+05:30');
const DAY = 86_400_000;
const newHistory = () => new PriceHistory(new MemoryStore(emptyHistory()));
const ghee = (price: number, inStock = true): Listing => ({
  app: 'blinkit', listingId: 'blinkit:amul-cow-ghee-pouch-gaay-nu-ghee-1-ltr', name: 'Amul Cow Ghee (Pouch)', size: '1 ltr', price, inStock,
});
const items = () => [...catalogue().values()];

describe('price history', () => {
  test('records the cheapest in-stock pack per kg/L, one observation per Item/app/day', () => {
    const h = newHistory();
    h.record('ghee', 'blinkit', [ghee(703), { ...ghee(690, false), listingId: 'x' }], day0);
    h.record('ghee', 'blinkit', [ghee(700)], new Date(day0.getTime() + 3600_000));
    const obs = h.forItem('ghee');
    assert.equal(obs.length, 1);
    assert.equal(obs[0].perUnit, 700);
  });

  test('Instamart is never stored (Swiggy data rule)', () => {
    const h = newHistory();
    h.record('ghee', 'instamart', [{ ...ghee(703), app: 'instamart' }], day0);
    assert.deepEqual(h.forItem('ghee'), []);
  });

  test('keeps about six months', () => {
    const h = newHistory();
    h.record('ghee', 'blinkit', [ghee(703)], day0);
    h.record('ghee', 'blinkit', [ghee(705)], new Date(day0.getTime() + 190 * DAY));
    assert.equal(h.forItem('ghee').length, 1);
  });

  test('basket runs record prices for free — except Instamart', async () => {
    const h = newHistory();
    await compareBasket({ basket: weeklyBasket(), catalogue: withInstamart(catalogue()), adapters: [blinkit(), bigbasket(), instamart()], history: h, now: day0 });
    const apps = new Set(h.forItem('ghee').map((o) => o.app));
    assert.deepEqual([...apps].sort(), ['bigbasket', 'blinkit']);
  });
});

describe('deals', () => {
  const build = (prices: number[]) => {
    const h = newHistory();
    prices.forEach((p, i) => h.record('ghee', 'blinkit', [ghee(p)], new Date(day0.getTime() + i * DAY)));
    return { h, now: new Date(day0.getTime() + (prices.length - 1) * DAY) };
  };

  test('nothing is flagged until there is enough history', () => {
    const { h, now } = build([703, 703, 703, 600]);
    assert.deepEqual(findDeals(items(), h, now), []);
  });

  test('≥8% below the 6-week median is a deal', () => {
    const { h, now } = build([...Array(12).fill(703), 640]);
    const [deal] = findDeals(items(), h, now);
    assert.equal(deal.itemId, 'ghee');
    assert.equal(deal.price, 640);
    assert.match(deal.text, /Amul Cow Ghee 1 ltr ₹640 on Blinkit — lowest in 6 weeks/);
  });

  test('a new 6-week low counts even when under 8%', () => {
    const { h, now } = build([...Array(12).fill(703), 699]);
    const [deal] = findDeals(items(), h, now);
    assert.equal(deal.lowestInWindow, true);
  });

  test('an ordinary day is not a deal; MRP "% OFF" is irrelevant', () => {
    const { h, now } = build([...Array(12).fill(703), 703]);
    assert.deepEqual(findDeals(items(), h, now), []);
  });
});

describe('background sweep', () => {
  test('checks stale staples on every app except Instamart, trickled ~30 s apart', async () => {
    const clock = new FakeClock(day0);
    const gov = new Governor(clock, new MemoryStore(emptyGovernorState()));
    const h = newHistory();
    const b = blinkit();
    const im = instamart();
    const cat = withInstamart(catalogue());
    const report = await backgroundSweep({ items: [...cat.values()], adapters: [b, im], governor: gov, history: h, clock });
    const staples = [...cat.values()].filter((i) => i.staple).length;
    assert.equal(report.checked, staples);
    assert.equal(im.called('getListings'), 0);
    assert.ok(clock.sleeps.filter((ms) => ms === 30_000).length === staples - 1);

    // Fresh within 24 h: a second sweep does nothing.
    const again = await backgroundSweep({ items: [...cat.values()], adapters: [b], governor: gov, history: h, clock });
    assert.equal(again.checked, 0);
  });

  test('an app cooling down after a block is skipped without a request', async () => {
    const clock = new FakeClock(day0);
    const state = emptyGovernorState();
    state.cooldownUntil.blinkit = new Date(day0.getTime() + 3600_000).toISOString();
    const gov = new Governor(clock, new MemoryStore(state));
    const b = blinkit({ listings: realListings('blinkit') });
    const report = await backgroundSweep({ items: items(), adapters: [b], governor: gov, history: newHistory(), clock });
    assert.equal(b.called('getListings'), 0);
    assert.ok(report.skipped.every((s) => s.reason === 'cooling down'));
  });
});
