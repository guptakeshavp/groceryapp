import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ZEPTO_ALLOWED_TOOLS } from '../src/adapters/zepto.ts';
import { parsePackSize } from '../src/domain/size.ts';
import type { Listing } from '../src/domain/types.ts';
import { McpSession } from '../src/mcp/session.ts';

test('the Zepto session refuses every write and order tool before touching the network', async () => {
  const session = new McpSession({ name: 'zepto-test', url: 'https://example.invalid/mcp', allowedTools: ZEPTO_ALLOWED_TOOLS, dataDir: '/nonexistent' });
  for (const tool of ['update_cart', 'create_order', 'create_online_payment_order', 'create_wallet_order', 'create_upi_reserve_pay_order', 'zepto_shop']) {
    await assert.rejects(session.call(tool, { confirmOrder: false }), /not on the read-only allowlist/);
  }
});

test('the allowlist holds read tools only', () => {
  assert.ok(ZEPTO_ALLOWED_TOOLS.every((t) => !/cart|order|pay|shop|update|add_/.test(t) || t === 'get_past_order_items'));
});

test('parses the pack formats Zepto returns (real search, 2026-10-19)', () => {
  const listings = JSON.parse(readFileSync(new URL('./fixtures/real-zepto-ghee-2026-10-19.json', import.meta.url), 'utf8')) as Listing[];
  assert.ok(listings.length > 0);
  for (const l of listings) assert.ok(parsePackSize(l.size), `could not parse "${l.size}"`);
  assert.deepEqual(parsePackSize('1 pc (500 ml)'), { amount: 500, unit: 'ml' });
  assert.deepEqual(parsePackSize('1 pack (1 L)'), { amount: 1000, unit: 'ml' });
});
