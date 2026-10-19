import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fillQuantity } from '../src/core/pack-filler.ts';
import { parsePackSize } from '../src/domain/size.ts';
import type { Listing } from '../src/domain/types.ts';

const pack = (size: string, price: number, inStock = true, name = 'X'): Listing => ({
  app: 'blinkit', listingId: `${name}-${size}`, name, size, price, inStock,
});

test('parses the pack formats seen in real listings', () => {
  assert.deepEqual(parsePackSize('4 x 70 g'), { amount: 280, unit: 'g' });
  assert.deepEqual(parsePackSize('2x420 g - (Multipack)'), { amount: 840, unit: 'g' });
  assert.deepEqual(parsePackSize('1 L - Tin'), { amount: 1000, unit: 'ml' });
  assert.deepEqual(parsePackSize('1L - Carton'), { amount: 1000, unit: 'ml' });
  assert.deepEqual(parsePackSize('1 ltr'), { amount: 1000, unit: 'ml' });
  assert.deepEqual(parsePackSize('5 kg'), { amount: 5000, unit: 'g' });
  assert.deepEqual(parsePackSize('588 g - (28 x 19.9 g)'), { amount: 588, unit: 'g' });
  assert.deepEqual(parsePackSize('50 pcs - Carton'), { amount: 50, unit: 'pcs' });
});

test('mixes pack sizes when that is cheapest', () => {
  // 3 kg wanted: 1 kg @159 + 1 kg... vs 3 kg @488 -> 3 x 1 kg = 477 is cheaper.
  const r = fillQuantity([pack('1 kg', 159), pack('3 kg', 488), pack('5 kg', 639)], { amount: 3000, unit: 'g' });
  assert.equal(r.kind, 'filled');
  if (r.kind === 'filled') assert.equal(r.cost, 477);
});

test('a bigger pack wins when it is cheaper than exact-size combinations, within the overshoot limit', () => {
  // 4 kg wanted: 4 x 1 kg = 636, 1 kg + 3 kg = 647, 5 kg = 639 -> 4 x 1 kg; make 5 kg cheaper to see it win.
  const r = fillQuantity([pack('1 kg', 159), pack('5 kg', 600)], { amount: 4000, unit: 'g' });
  assert.equal(r.kind, 'filled');
  if (r.kind === 'filled') assert.deepEqual(r.packs.map((p) => p.listing.size), ['5 kg']);
});

test('pinned container restricts the family', () => {
  const r = fillQuantity([pack('1 L - Pouch', 660), pack('1 L - Tin', 692)], { amount: 1000, unit: 'ml' }, 'tin');
  assert.equal(r.kind, 'filled');
  if (r.kind === 'filled') assert.equal(r.packs[0].listing.size, '1 L - Tin');
});

test('nothing in stock is unavailable', () => {
  assert.deepEqual(fillQuantity([pack('1 L', 700, false)], { amount: 1000, unit: 'ml' }), { kind: 'unavailable', reason: 'out-of-stock' });
  assert.deepEqual(fillQuantity([], { amount: 1000, unit: 'ml' }), { kind: 'unavailable', reason: 'none-confirmed' });
});

test('flags comparing ml with g', () => {
  const r = fillQuantity([pack('900 g', 806)], { amount: 900, unit: 'ml' });
  assert.equal(r.kind, 'filled');
  if (r.kind === 'filled') assert.equal(r.mixedUnits, true);
});
