import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AssistedAdapter, emptyAssisted, FRESH_MS } from '../src/adapters/assisted.ts';
import { FakeClock } from '../src/core/clock.ts';
import { compareBasket } from '../src/core/compare.ts';
import { MemoryStore } from '../src/store/json-store.ts';
import { blinkit, catalogue, realListings, weeklyBasket } from './fixtures/household.ts';

const setup = () => {
  const clock = new FakeClock(new Date('2026-10-19T18:00:00+05:30'));
  return { clock, bb: new AssistedAdapter('bigbasket', new MemoryStore(emptyAssisted()), clock) };
};

test('without a capture, BigBasket says what Keshav needs to do', async () => {
  const { bb } = setup();
  const c = await compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit(), bb] });
  const r = c.apps.find((a) => a.app === 'bigbasket');
  assert.ok(r && r.status === 'couldnt-check');
  assert.match(r.reason, /needs your capture: search "Amul Cow Ghee" on BigBasket/);
  assert.equal(c.verdict?.app, 'blinkit');
});

test('captured pages (any search wording) price the basket', async () => {
  const { bb } = setup();
  bb.capture('everything', realListings('bigbasket'));
  const c = await compareBasket({ basket: weeklyBasket(), catalogue: catalogue(), adapters: [blinkit(), bb] });
  const r = c.apps.find((a) => a.app === 'bigbasket');
  assert.ok(r && r.status === 'checked');
  assert.equal(r.basketPrice, 2131);
});

test('captures go stale after 6 hours', async () => {
  const { bb, clock } = setup();
  bb.capture('amul cow ghee', realListings('bigbasket'));
  clock.advance(FRESH_MS + 1);
  await assert.rejects(bb.getListings(['bigbasket:amul-cow-ghee-1-l-tin'], 'Amul Cow Ghee'), /needs your capture/);
});
