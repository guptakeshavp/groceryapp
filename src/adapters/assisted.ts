import type { Clock } from '../core/clock.ts';
import type { AppId, AuthStatus, Listing } from '../domain/types.ts';
import { AdapterError } from '../domain/types.ts';
import type { Store } from '../store/json-store.ts';
import type { PlatformAdapter } from './adapter.ts';

export interface Capture {
  query: string;
  at: string;
  listings: Listing[];
}
export type AssistedState = { captures: Capture[] };
export const emptyAssisted = (): AssistedState => ({ captures: [] });

/** Captures older than this don't count (prices move during the day). */
export const FRESH_MS = 6 * 3600_000;

export const normaliseQuery = (q: string) => q.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * An app read by Keshav himself (spec revision: BigBasket blocks the automated profile, HTTP 403).
 * He searches in his normal Chrome and clicks the "Send to grocery compare" bookmark; this adapter
 * only serves those captures. It never contacts the app.
 */
export class AssistedAdapter implements PlatformAdapter {
  readonly app: AppId;
  private readonly store: Store<AssistedState>;
  private readonly clock: Clock;

  constructor(app: AppId, store: Store<AssistedState>, clock: Clock) {
    this.app = app;
    this.store = store;
    this.clock = clock;
  }

  /** Record what the bookmark sent. Keeps only fresh captures, newest per query. */
  capture(query: string, listings: Listing[]): Capture {
    const now = this.clock.now();
    const capture: Capture = { query: normaliseQuery(query), at: now.toISOString(), listings };
    const state = this.store.read();
    state.captures = [capture, ...state.captures.filter((c) => c.query !== capture.query && this.isFresh(c, now))];
    this.store.write(state);
    return capture;
  }

  private isFresh(c: Capture, now = this.clock.now()): boolean {
    return now.getTime() - new Date(c.at).getTime() < FRESH_MS;
  }

  private fresh(): Capture[] {
    return this.store.read().captures.filter((c) => this.isFresh(c));
  }

  async authStatus(): Promise<AuthStatus> {
    return { state: 'ok' };
  }

  async search(query: string): Promise<Listing[]> {
    return this.fresh().find((c) => c.query === normaliseQuery(query))?.listings ?? [];
  }

  /** Looks across every fresh capture, so any search wording that showed the product counts. */
  async getListings(listingIds: string[], query: string): Promise<Listing[]> {
    const wanted = new Set(listingIds);
    const seen = new Map<string, Listing>();
    for (const c of this.fresh()) for (const l of c.listings) if (wanted.has(l.listingId) && !seen.has(l.listingId)) seen.set(l.listingId, l);
    if (seen.size === 0) throw new AdapterError('error', `needs your capture: search "${query}" on BigBasket and click the bookmark`);
    return [...seen.values()];
  }
}
