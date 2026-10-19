import { parsePackSize } from '../domain/size.ts';
import type { AppId, Listing } from '../domain/types.ts';
import type { Store } from '../store/json-store.ts';
import { istDay } from './clock.ts';

/** One day's best price for an Item on an app, normalised per kg / L / piece so pack sizes compare. */
export interface Observation {
  itemId: string;
  app: AppId;
  day: string;
  at: string;
  perUnit: number;
  price: number;
  listingId: string;
  size: string;
}

export type HistoryState = { observations: Observation[] };
export const emptyHistory = (): HistoryState => ({ observations: [] });

/** Swiggy's data rule: Instamart data serves only the immediate task, so it is never stored (spec: tracking). */
export const NOT_STORED: ReadonlySet<AppId> = new Set<AppId>(['instamart']);
const RETENTION_DAYS = 183;

export function perUnitPrice(l: Listing): number | undefined {
  const q = parsePackSize(l.size);
  if (!q || q.amount <= 0) return undefined;
  return q.unit === 'pcs' ? l.price / q.amount : (l.price / q.amount) * 1000;
}

export class PriceHistory {
  private readonly store: Store<HistoryState>;
  constructor(store: Store<HistoryState>) {
    this.store = store;
  }

  /** Record what an app offers for an Item right now: the cheapest in-stock pack per unit. One observation per Item/app/day. */
  record(itemId: string, app: AppId, family: Listing[], at: Date): void {
    if (NOT_STORED.has(app)) return;
    const best = family
      .filter((l) => l.inStock)
      .map((l) => ({ l, perUnit: perUnitPrice(l) }))
      .filter((x): x is { l: Listing; perUnit: number } => x.perUnit !== undefined)
      .sort((a, b) => a.perUnit - b.perUnit)[0];
    if (!best) return;
    const day = istDay(at);
    const cutoff = istDay(new Date(at.getTime() - RETENTION_DAYS * 86_400_000));
    const state = this.store.read();
    state.observations = state.observations.filter(
      (o) => o.day >= cutoff && !(o.itemId === itemId && o.app === app && o.day === day),
    );
    state.observations.push({
      itemId, app, day, at: at.toISOString(),
      perUnit: Math.round(best.perUnit * 100) / 100, price: best.l.price, listingId: best.l.listingId, size: best.l.size,
    });
    this.store.write(state);
  }

  forItem(itemId: string): Observation[] {
    return this.store.read().observations.filter((o) => o.itemId === itemId);
  }

  lastChecked(itemId: string, app: AppId): Date | undefined {
    const at = this.forItem(itemId).filter((o) => o.app === app).map((o) => o.at).sort().at(-1);
    return at ? new Date(at) : undefined;
  }
}
