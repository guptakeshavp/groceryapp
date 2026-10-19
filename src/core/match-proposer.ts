import Anthropic from '@anthropic-ai/sdk';
import type { AppId, Listing } from '../domain/types.ts';

export interface Proposal {
  /** Listings that are this Item (every acceptable pack size / container). Empty = no good candidate. */
  listingIds: string[];
  /** Confident that none of the candidates is this Item. */
  notSold: boolean;
  note?: string;
}

export interface ProposalRequest {
  itemName: string;
  anyBrand: boolean;
  candidates: Partial<Record<AppId, Listing[]>>;
}

/** Pre-ticks the confirm panel (spec: "Claude proposes, Keshav confirms once"). Keshav always has the final say. */
export interface MatchProposer {
  readonly kind: 'claude' | 'rules';
  propose(req: ProposalRequest): Promise<Partial<Record<AppId, Proposal>>>;
}

const FILLER = new Set(['the', 'and', 'with', 'of', 'pack', 'pouch', 'tin', 'jar', 'carton', 'bottle', 'box', 'tetrapack', 'tub', 'gaay', 'nu', 'lott', 'lot', 'ghau', 'no']);
/** Words that mean "a different product" unless the Item's own name has them. */
const VETO = ['pooja', 'puja', 'non-edible', 'cookies', 'buttermilk', 'spread', 'cuppa', 'pasta', 'sauce', 'ketchup', 'unsalted', 'pure', 'buffalo', 'organic', 'a2', 'front', 'powder', 'pods', 'spring', 'sambhar', 'multigrain', 'sharbati', 'lite', 'chiplets'];

const words = (s: string) =>
  s.toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[^a-z0-9-]+/).filter((w) => w.length > 1 && !FILLER.has(w) && !/^\d/.test(w));

/** Conservative fallback: ticks only listings containing every word of the Item's name and no "different product" word. */
export class RuleMatchProposer implements MatchProposer {
  readonly kind = 'rules' as const;
  async propose(req: ProposalRequest): Promise<Partial<Record<AppId, Proposal>>> {
    const want = words(req.itemName);
    const out: Partial<Record<AppId, Proposal>> = {};
    for (const [app, listings] of Object.entries(req.candidates) as [AppId, Listing[]][]) {
      const ids = listings
        .filter((l) => {
          const have = new Set(words(l.name));
          const core = req.anyBrand ? want.slice(1) : want;
          return core.every((w) => have.has(w)) && !VETO.some((v) => have.has(v) && !want.includes(v));
        })
        .map((l) => l.listingId);
      out[app] = { listingIds: ids, notSold: false };
    }
    return out;
  }
}

const SCHEMA = {
  type: 'object',
  properties: {
    apps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          app: { type: 'string' },
          listingIds: { type: 'array', items: { type: 'string' } },
          notSold: { type: 'boolean' },
          note: { type: 'string' },
        },
        required: ['app', 'listingIds', 'notSold', 'note'],
        additionalProperties: false,
      },
    },
  },
  required: ['apps'],
  additionalProperties: false,
} as const;

const INSTRUCTIONS = `You match one household grocery Item to product listings on Indian quick-commerce apps.
For each app, pick every listing that is the SAME product as the Item, in any pack size or container (pouch, tin, jar, carton all count).
A different variant is a different product: Amul Cow Ghee is not Amul Pure Ghee; salted butter is not unsalted; Surf Excel Matic is not plain Surf Excel; top load is not front load; multigrain atta is not chakki atta. Store renames and transliterations (e.g. "Gaay Nu Ghee", "Pasteurised Butter" for Amul's ordinary salted butter) can still be the same product.
If "any brand" is true, the brand may differ but the product type and variant must match.
Set notSold true only when you are confident no candidate on that app is the Item. Leave listingIds empty when unsure rather than guessing.
Keep each note under 15 words, saying what you picked or why nothing.`;

/** Claude proposes; validated against the candidates so it can only tick listings that were actually shown. */
export class ClaudeMatchProposer implements MatchProposer {
  readonly kind = 'claude' as const;
  private readonly client: Anthropic;
  constructor(client = new Anthropic()) {
    this.client = client;
  }

  async propose(req: ProposalRequest): Promise<Partial<Record<AppId, Proposal>>> {
    const shown = Object.fromEntries(
      Object.entries(req.candidates).map(([app, ls]) => [app, (ls ?? []).map((l) => ({ id: l.listingId, name: l.name, size: l.size, price: l.price }))]),
    );
    const response = await this.client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // a rare safety decline is retried server-side on the recommended model
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: INSTRUCTIONS,
      messages: [{ role: 'user', content: JSON.stringify({ item: req.itemName, anyBrand: req.anyBrand, candidates: shown }) }],
    });
    if (response.stop_reason === 'refusal') throw new Error('Claude declined to propose matches');
    const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const parsed = JSON.parse(text) as { apps: { app: string; listingIds: string[]; notSold: boolean; note: string }[] };
    const out: Partial<Record<AppId, Proposal>> = {};
    for (const p of parsed.apps) {
      const valid = new Set((shown[p.app] ?? []).map((l) => l.id));
      if (!valid.size && !p.notSold) continue;
      out[p.app as AppId] = { listingIds: p.listingIds.filter((id) => valid.has(id)), notSold: p.notSold, note: p.note };
    }
    return out;
  }
}

/** Claude when credentials exist (ANTHROPIC_API_KEY / auth token), rules otherwise. */
export function defaultProposer(): MatchProposer {
  return process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN ? new ClaudeMatchProposer() : new RuleMatchProposer();
}
