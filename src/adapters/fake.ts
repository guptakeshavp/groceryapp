import type { AppId, AuthStatus, Listing } from '../domain/types.ts';
import { AdapterError } from '../domain/types.ts';
import type { PlatformAdapter } from './adapter.ts';

type Method = 'search' | 'getListings' | 'authStatus';

export interface FakeAdapterOptions {
  app: AppId;
  listings: Listing[];
  auth?: AuthStatus;
  /** Errors thrown by successive calls to a method, in order; afterwards calls succeed. */
  failures?: Partial<Record<Method, AdapterError[]>>;
}

/** Replays recorded listings. For tests and offline development. */
export class FakeAdapter implements PlatformAdapter {
  readonly app: AppId;
  readonly calls: { method: Method; args: unknown[] }[] = [];
  private readonly opts: FakeAdapterOptions;

  constructor(opts: FakeAdapterOptions) {
    this.opts = opts;
    this.app = opts.app;
  }

  private enter(method: Method, args: unknown[]): void {
    this.calls.push({ method, args });
    const err = this.opts.failures?.[method]?.shift();
    if (err) throw err;
  }

  async search(query: string): Promise<Listing[]> {
    this.enter('search', [query]);
    const words = query.toLowerCase().split(/\s+/);
    return this.opts.listings.filter((l) => words.every((w) => `${l.brand ?? ''} ${l.name}`.toLowerCase().includes(w)));
  }

  async getListings(ids: string[], query = ''): Promise<Listing[]> {
    this.enter('getListings', [ids, query]);
    return this.opts.listings.filter((l) => ids.includes(l.listingId));
  }

  async authStatus(): Promise<AuthStatus> {
    this.enter('authStatus', []);
    return this.opts.auth ?? { state: 'ok' };
  }

  called(method: Method): number {
    return this.calls.filter((c) => c.method === method).length;
  }
}
