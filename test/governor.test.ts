import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { FakeClock, nextIstMidnight } from '../src/core/clock.ts';
import { DEFAULT_LIMITS, emptyGovernorState, Governor, type GovernorState } from '../src/core/governor.ts';
import { AdapterError } from '../src/domain/types.ts';
import { MemoryStore } from '../src/store/json-store.ts';
import { bigbasket, blinkit } from './fixtures/household.ts';

const start = new Date('2026-10-19T10:00:00+05:30');
const setup = (state: GovernorState = emptyGovernorState()) => {
  const clock = new FakeClock(start);
  const store = new MemoryStore(state);
  return { clock, store, gov: new Governor(clock, store) };
};

describe('pace', () => {
  test('one request at a time per app, ~4 s apart on Chrome sites', async () => {
    const { clock, gov } = setup();
    const b = gov.wrap(blinkit(), 'basket');
    await Promise.all([b.search('ghee'), b.search('butter'), b.search('atta')]);
    assert.deepEqual(clock.sleeps, [4000, 4000]);
  });

  test('different apps do not wait for each other', async () => {
    const { clock, gov } = setup();
    await Promise.all([gov.wrap(blinkit(), 'basket').search('ghee'), gov.wrap(bigbasket(), 'basket').search('ghee')]);
    assert.deepEqual(clock.sleeps, []);
  });
});

describe('caps', () => {
  test('at most 40 lookups per app per run', async () => {
    const { gov } = setup();
    const b = gov.wrap(blinkit(), 'basket');
    for (let i = 0; i < DEFAULT_LIMITS.maxPerRun; i++) await b.search('ghee');
    await assert.rejects(b.search('ghee'), (e: AdapterError) => e.kind === 'daily-limit' && /per-run/.test(e.message));
  });

  test('at most 150 per app per day, persisted, reset the next day', async () => {
    const state = emptyGovernorState();
    state.daily.blinkit = { day: '2026-10-19', count: 150 };
    const { clock, gov } = setup(state);
    await assert.rejects(gov.wrap(blinkit(), 'basket').search('ghee'), (e: AdapterError) => e.kind === 'daily-limit');
    clock.advance(24 * 3600_000);
    await gov.wrap(blinkit(), 'basket').search('ghee');
  });
});

describe('blocks', () => {
  test('one gentle retry after a pause absorbs a single block', async () => {
    const { clock, gov } = setup();
    const raw = blinkit({ failures: { search: [new AdapterError('blank', 'empty results page')] } });
    await gov.wrap(raw, 'basket').search('ghee');
    assert.equal(raw.called('search'), 2);
    assert.deepEqual(clock.sleeps, [DEFAULT_LIMITS.retryPauseMs]);
  });

  test('Retry-After is honoured before the retry', async () => {
    const { clock, gov } = setup();
    const raw = blinkit({ failures: { search: [new AdapterError('rate-limited', 'HTTP 429', 45)] } });
    await gov.wrap(raw, 'basket').search('ghee');
    assert.ok(clock.sleeps[0] >= 45_000);
  });

  test('blocked twice: gives up after one retry (no third attempt)', async () => {
    const { gov } = setup();
    const raw = blinkit({ failures: { search: [new AdapterError('blocked', 'challenge'), new AdapterError('blocked', 'challenge')] } });
    await assert.rejects(gov.wrap(raw, 'basket').search('ghee'));
    assert.equal(raw.called('search'), 2);
  });

  test('after a block, background checks skip the app until tomorrow; basket runs still try', async () => {
    const { clock, store, gov } = setup();
    const raw = blinkit({ failures: { search: [new AdapterError('blocked', 'challenge')] } });
    await gov.wrap(raw, 'basket').search('ghee');
    assert.equal(store.read().cooldownUntil.blinkit, nextIstMidnight(start).toISOString());

    const background = blinkit();
    await assert.rejects(gov.wrap(background, 'background').search('ghee'), /cooling down/);
    assert.equal(background.called('search'), 0);
    await gov.wrap(blinkit(), 'basket').search('ghee');

    clock.advance(24 * 3600_000);
    await gov.wrap(blinkit(), 'background').search('ghee');
  });

  test('blocked on 3 different days within a week → flagged for the start-screen prompt', async () => {
    const { clock, gov } = setup();
    for (let day = 0; day < 3; day++) {
      const raw = blinkit({ failures: { search: [new AdapterError('blocked', 'challenge')] } });
      await gov.wrap(raw, 'basket').search('ghee');
      assert.deepEqual(gov.persistentlyBlocked(), day < 2 ? [] : ['blinkit']);
      clock.advance(2 * 24 * 3600_000);
    }
    clock.advance(7 * 24 * 3600_000);
    assert.deepEqual(gov.persistentlyBlocked(), []);
  });

  test('login expiry is not retried', async () => {
    const { gov } = setup();
    const raw = blinkit({ failures: { search: [new AdapterError('login-expired', 'session gone')] } });
    await assert.rejects(gov.wrap(raw, 'basket').search('ghee'), (e: AdapterError) => e.kind === 'login-expired');
    assert.equal(raw.called('search'), 1);
  });
});
