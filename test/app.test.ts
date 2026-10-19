import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { GroceryApp } from '../src/app.ts';
import { FakeClock } from '../src/core/clock.ts';
import { RuleMatchProposer } from '../src/core/match-proposer.ts';
import { blinkit, instamart } from './fixtures/household.ts';

const tmp = () => mkdtempSync(join(tmpdir(), 'grocery-test-'));

test('the app sweep checks staples on live apps only, and never overlaps itself', async () => {
  const b = blinkit();
  const im = instamart();
  const app = new GroceryApp({
    dataDir: tmp(),
    clock: new FakeClock(new Date('2026-10-19T09:00:00+05:30')),
    proposer: new RuleMatchProposer(),
    sources: [{ adapter: b, source: 'live' }, { adapter: im, source: 'live' }, { adapter: blinkit(), source: 'recorded' }],
  });
  const [first, overlapping] = await Promise.all([app.sweep(), app.sweep()]);
  assert.ok(first && first.checked > 0);
  assert.equal(overlapping, undefined);
  assert.equal(im.called('getListings'), 0); // Instamart excluded (Swiggy data rule)
  assert.ok(app.lastSweep);
});

test('candidates come back with proposals pre-ticked', async () => {
  const app = new GroceryApp({ dataDir: tmp(), proposer: new RuleMatchProposer(), sources: [{ adapter: blinkit(), source: 'recorded' }] });
  const r = await app.candidates('Amul Cow Ghee');
  assert.equal(r.proposer, 'rules');
  assert.ok((r.proposals.blinkit?.listingIds.length ?? 0) >= 1);
});
