import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { GroceryApp } from '../src/app.ts';
import { FakeClock } from '../src/core/clock.ts';
import { RuleMatchProposer } from '../src/core/match-proposer.ts';
import { FileOAuthProvider } from '../src/mcp/oauth.ts';
import { blinkit } from './fixtures/household.ts';

const DAY = 86_400_000;
const providerWith = (stored: object) => {
  const dir = mkdtempSync(join(tmpdir(), 'oauth-test-'));
  mkdirSync(join(dir, 'auth'), { recursive: true });
  writeFileSync(join(dir, 'auth', 'instamart.json'), JSON.stringify(stored));
  return new FileOAuthProvider('instamart', dir);
};

test('Swiggy-style login: 30-day sliding refresh window from the last save', () => {
  const p = providerWith({ tokens: { access_token: 'a', refresh_token: 'r', token_type: 'bearer' }, tokensSavedAt: new Date(Date.now() - 28 * DAY).toISOString() });
  const s = p.loginExpiry(30);
  assert.equal(s.state, 'ok');
  assert.ok(s.expiresAt && Math.abs(s.expiresAt.getTime() - (Date.now() + 2 * DAY)) < 60_000);
  assert.equal(p.loginExpiry(27).state, 'expired');
});

test('unknown refresh lifetime predicts no expiry; no tokens is expired', () => {
  assert.deepEqual(providerWith({ tokens: { access_token: 'a', refresh_token: 'r', token_type: 'bearer' } }).loginExpiry(), { state: 'ok', expiresAt: undefined });
  assert.equal(providerWith({}).loginExpiry(30).state, 'expired');
});

test('the start screen warns within 3 days of a predicted expiry, and on expiry', async () => {
  const now = new Date('2026-10-19T09:00:00+05:30');
  const app = new GroceryApp({
    dataDir: mkdtempSync(join(tmpdir(), 'grocery-test-')),
    clock: new FakeClock(now),
    proposer: new RuleMatchProposer(),
    sources: [
      { adapter: blinkit({ app: 'instamart', auth: { state: 'ok', expiresAt: new Date(now.getTime() + 2 * DAY) } }), source: 'live' },
      { adapter: blinkit({ app: 'zepto', auth: { state: 'expired' } }), source: 'live' },
      { adapter: blinkit({ auth: { state: 'ok', expiresAt: new Date(now.getTime() + 10 * DAY) } }), source: 'live' },
    ],
  });
  assert.deepEqual((await app.logins()).map((l) => [l.app, l.state]), [['instamart', 'expiring'], ['zepto', 'expired']]);
});
