import type { AppId, AuthStatus, Bill, FeeLine, Listing } from '../domain/types.ts';
import { AdapterError } from '../domain/types.ts';
import type { CartLine, PlatformAdapter } from './adapter.ts';

type Method = 'search' | 'getListings' | 'priceCart' | 'isCartEmpty' | 'authStatus';

export interface FakeAdapterOptions {
  app: AppId;
  listings: Listing[];
  usesRealCart?: boolean;
  fees?: FeeLine[];
  autoDiscounts?: FeeLine[];
  coupons?: string[];
  cartEmpty?: boolean;
  auth?: AuthStatus;
  /** Errors thrown by successive calls to a method, in order; afterwards calls succeed. */
  failures?: Partial<Record<Method, AdapterError[]>>;
}

/** Replays recorded listings and computes a bill like the app would. For tests and offline development. */
export class FakeAdapter implements PlatformAdapter {
  readonly app: AppId;
  readonly usesRealCart: boolean;
  readonly calls: { method: Method; args: unknown[] }[] = [];
  /** What the real cart holds after pricing (real-cart apps only). */
  cart: CartLine[] | undefined;
  private readonly opts: FakeAdapterOptions;

  constructor(opts: FakeAdapterOptions) {
    this.opts = opts;
    this.app = opts.app;
    this.usesRealCart = opts.usesRealCart ?? false;
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

  async getListings(ids: string[]): Promise<Listing[]> {
    this.enter('getListings', [ids]);
    return this.opts.listings.filter((l) => ids.includes(l.listingId));
  }

  async priceCart(lines: CartLine[]): Promise<Bill> {
    this.enter('priceCart', [lines]);
    const byId = new Map(this.opts.listings.map((l) => [l.listingId, l]));
    const billLines = lines.map((l) => ({ ...l, amount: (byId.get(l.listingId)?.price ?? 0) * l.count }));
    const fees = this.opts.fees ?? [];
    const autoDiscounts = this.opts.autoDiscounts ?? [];
    const toPay =
      billLines.reduce((s, l) => s + l.amount, 0) + fees.reduce((s, f) => s + f.amount, 0) - autoDiscounts.reduce((s, d) => s + d.amount, 0);
    if (this.usesRealCart) this.cart = lines;
    return { lines: billLines, fees, autoDiscounts, toPay, coupons: this.opts.coupons ?? [] };
  }

  async isCartEmpty(): Promise<boolean> {
    this.enter('isCartEmpty', []);
    return this.opts.cartEmpty ?? true;
  }

  async authStatus(): Promise<AuthStatus> {
    this.enter('authStatus', []);
    return this.opts.auth ?? { state: 'ok' };
  }

  called(method: Method): number {
    return this.calls.filter((c) => c.method === method).length;
  }
}
