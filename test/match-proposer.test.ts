import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import type Anthropic from '@anthropic-ai/sdk';
import { ClaudeMatchProposer, RuleMatchProposer } from '../src/core/match-proposer.ts';
import type { Listing } from '../src/domain/types.ts';
import { realListings } from './fixtures/household.ts';

const zeptoGhee = JSON.parse(readFileSync(new URL('./fixtures/real-zepto-ghee-2026-10-19.json', import.meta.url), 'utf8')) as Listing[];

test('rules: picks every pack/container of the exact product and nothing of a different variant (real listings)', async () => {
  const p = await new RuleMatchProposer().propose({
    itemName: 'Amul Cow Ghee',
    anyBrand: false,
    candidates: { blinkit: realListings('blinkit'), bigbasket: realListings('bigbasket'), zepto: zeptoGhee },
  });
  assert.deepEqual(p.blinkit?.listingIds.sort(), ['blinkit:amul-cow-ghee-pouch-gaay-nu-ghee-1-ltr', 'blinkit:amul-cow-ghee-tin-gaay-nu-ghee-1-ltr']);
  assert.equal(p.bigbasket?.listingIds.length, 4); // 500 ml pouch, 1 L pouch, 500 ml jar, 1 L tin — never "Amul Pure Ghee"
  assert.deepEqual(p.zepto?.listingIds, []); // Zepto only had Amul *Pure* Ghee: leave it to Keshav
});

test('claude: only listings that were actually shown can be ticked', async () => {
  const shown: Listing = { app: 'blinkit', listingId: 'blinkit:1', name: 'Amul Cow Ghee', size: '1 ltr', price: 675, inStock: true };
  const fake = {
    beta: {
      messages: {
        create: async () => ({
          stop_reason: 'end_turn',
          content: [{ type: 'text', text: JSON.stringify({ apps: [{ app: 'blinkit', listingIds: ['blinkit:1', 'blinkit:invented'], notSold: false, note: 'pouch' }, { app: 'zepto', listingIds: [], notSold: true, note: 'only Pure Ghee' }] }) }],
        }),
      },
    },
  } as unknown as Anthropic;
  const p = await new ClaudeMatchProposer(fake).propose({ itemName: 'Amul Cow Ghee', anyBrand: false, candidates: { blinkit: [shown], zepto: [] } });
  assert.deepEqual(p.blinkit, { listingIds: ['blinkit:1'], notSold: false, note: 'pouch' });
  assert.deepEqual(p.zepto, { listingIds: [], notSold: true, note: 'only Pure Ghee' });
});

test('claude: a refusal is surfaced, not silently treated as "no match"', async () => {
  const fake = { beta: { messages: { create: async () => ({ stop_reason: 'refusal', content: [] }) } } } as unknown as Anthropic;
  await assert.rejects(new ClaudeMatchProposer(fake).propose({ itemName: 'x', anyBrand: false, candidates: {} }), /declined/);
});
