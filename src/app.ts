import { join } from 'node:path';
import type { PlatformAdapter } from './adapters/adapter.ts';
import { FakeAdapter } from './adapters/fake.ts';
import { InstamartAdapter } from './adapters/instamart.ts';
import { ZeptoAdapter } from './adapters/zepto.ts';
import { type Clock, systemClock } from './core/clock.ts';
import { type Comparison, compareBasket } from './core/compare.ts';
import { type Deal, findDeals } from './core/deals.ts';
import { emptyGovernorState, Governor, type GovernorState } from './core/governor.ts';
import { emptyHistory, type HistoryState, PriceHistory } from './core/history.ts';
import { type ListParser, type ParsedLine, RuleListParser } from './core/list-parser.ts';
import { MAX_STAPLES } from './core/tracker.ts';
import { catalogue as seedCatalogue, RECORDED_ON, recordedListings } from './demo/seed.ts';
import { APP_NAMES, type AppId, type BasketLine, type Item, type Listing, type Quantity } from './domain/types.ts';
import { JsonFileStore, type Store } from './store/json-store.ts';

export const HOME_PIN = '380015';

export interface AppSource {
  adapter: PlatformAdapter;
  /** "live", or a note that prices are replayed from a recording. */
  source: string;
}

export interface CompareResponse {
  comparison: Comparison;
  newLines: ParsedLine[];
  /** Lines matched to an Item but with no quantity and no usual quantity. */
  needQuantity: ParsedLine[];
  deals: Deal[];
  sources: Record<string, string>;
}

/** Wires stores, adapters, governor and parser together for the local web app. */
export class GroceryApp {
  readonly clock: Clock;
  private readonly catalogueStore: Store<{ items: Item[] }>;
  readonly history: PriceHistory;
  readonly governor: Governor;
  private readonly parser: ListParser;
  readonly sources: AppSource[];

  constructor(opts: { dataDir?: string; clock?: Clock; sources?: AppSource[]; parser?: ListParser } = {}) {
    const dataDir = opts.dataDir ?? 'data';
    this.clock = opts.clock ?? systemClock;
    this.catalogueStore = new JsonFileStore(join(dataDir, 'catalogue.json'), { items: [...seedCatalogue().values()] });
    this.history = new PriceHistory(new JsonFileStore<HistoryState>(join(dataDir, 'history.json'), emptyHistory()));
    this.governor = new Governor(this.clock, new JsonFileStore<GovernorState>(join(dataDir, 'governor.json'), emptyGovernorState()));
    this.parser = opts.parser ?? new RuleListParser();
    this.sources = opts.sources ?? defaultSources(dataDir);
  }

  /** Live apps go through the governor; recorded replays touch no site, so they aren't paced. */
  private governed(s: AppSource): PlatformAdapter {
    return s.source === 'live' ? this.governor.wrap(s.adapter, 'basket') : s.adapter;
  }

  /** Apps this tool currently checks. */
  apps(): AppId[] {
    return this.sources.map((s) => s.adapter.app);
  }

  items(): Item[] {
    return this.catalogueStore.read().items;
  }

  async compare(text: string): Promise<CompareResponse> {
    const items = this.items();
    const parsed = await this.parser.parse(text, items);
    const basket: BasketLine[] = parsed
      .filter((l): l is ParsedLine & { itemId: string; quantity: Quantity } => !!l.itemId && !!l.quantity)
      .map((l) => ({ itemId: l.itemId, quantity: l.quantity }));
    const comparison = await compareBasket({
      basket,
      catalogue: new Map(items.map((i) => [i.id, i])),
      adapters: this.sources.map((s) => this.governed(s)),
      history: this.history,
      now: this.clock.now(),
    });
    return {
      comparison,
      newLines: parsed.filter((l) => !l.itemId),
      needQuantity: parsed.filter((l) => l.itemId && !l.quantity),
      deals: this.deals(),
      sources: Object.fromEntries(this.sources.map((s) => [s.adapter.app, s.source])),
    };
  }

  deals(): Deal[] {
    return findDeals(this.items(), this.history, this.clock.now());
  }

  async notices(): Promise<string[]> {
    const out: string[] = [];
    for (const s of this.sources) {
      if ((await s.adapter.authStatus()).state === 'expired') out.push(`${APP_NAMES[s.adapter.app]}: login expired — log in again`);
      if (s.source !== 'live') out.push(`${APP_NAMES[s.adapter.app]}: ${s.source}`);
    }
    for (const app of this.governor.persistentlyBlocked()) {
      out.push(`${APP_NAMES[app]} keeps blocking (3+ days this week). Switch it to a throwaway account, or drop it?`);
    }
    const unmatched = this.sources.filter((s) => this.items().some((i) => i.listings[s.adapter.app] === undefined));
    for (const s of unmatched) out.push(`${APP_NAMES[s.adapter.app]}: some Items aren't matched yet — confirm them to include this app`);
    return out;
  }

  /** Per-app candidates for a new or unmatched Item (spec: Item confirmation panel). */
  async candidates(query: string): Promise<Record<string, { listings: Listing[]; error?: string }>> {
    const out: Record<string, { listings: Listing[]; error?: string }> = {};
    await Promise.all(
      this.sources.map(async (s) => {
        try {
          out[s.adapter.app] = { listings: (await this.governed(s).search(query)).slice(0, 8) };
        } catch (e) {
          out[s.adapter.app] = { listings: [], error: e instanceof Error ? e.message : String(e) };
        }
      }),
    );
    return out;
  }

  /** Save a confirmed Item (new, or more apps for an existing one). */
  saveItem(input: { id?: string; name: string; anyBrand: boolean; staple: boolean; pinnedContainer?: string; usualQuantity?: Quantity; listings: Partial<Record<AppId, string[]>> }): Item {
    const state = this.catalogueStore.read();
    const existing = input.id ? state.items.find((i) => i.id === input.id) : undefined;
    const staples = state.items.filter((i) => i.staple && i.id !== existing?.id).length;
    if (input.staple && staples >= MAX_STAPLES) throw new Error(`At most ${MAX_STAPLES} staples are tracked; untick one first`);
    const item: Item = {
      id: existing?.id ?? slug(input.name, state.items),
      name: input.name,
      anyBrand: input.anyBrand,
      staple: input.staple,
      pinnedContainer: input.pinnedContainer || undefined,
      usualQuantity: input.usualQuantity ?? existing?.usualQuantity,
      listings: { ...existing?.listings, ...input.listings },
    };
    state.items = [...state.items.filter((i) => i.id !== item.id), item];
    this.catalogueStore.write(state);
    return item;
  }
}

function defaultSources(dataDir: string): AppSource[] {
  const recorded = `replaying prices recorded on ${RECORDED_ON} until the automated Chrome is set up`;
  return [
    { adapter: new ZeptoAdapter({ homePincode: HOME_PIN, dataDir }), source: 'live' },
    { adapter: new InstamartAdapter({ homePincode: HOME_PIN, dataDir }), source: 'live' },
    { adapter: new FakeAdapter({ app: 'blinkit', listings: recordedListings('blinkit') }), source: recorded },
    { adapter: new FakeAdapter({ app: 'bigbasket', listings: recordedListings('bigbasket') }), source: recorded },
  ];
}

function slug(name: string, items: Item[]): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
  let id = base;
  for (let n = 2; items.some((i) => i.id === id); n++) id = `${base}-${n}`;
  return id;
}
