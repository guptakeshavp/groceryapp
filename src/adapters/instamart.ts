import type { AuthStatus, Listing } from '../domain/types.ts';
import { AdapterError } from '../domain/types.ts';
import { McpSession } from '../mcp/session.ts';
import type { PlatformAdapter } from './adapter.ts';

/** Read-only tools only. Swiggy also exposes cart, checkout, payment and address-changing tools; none may ever be called. */
export const INSTAMART_ALLOWED_TOOLS = ['get_addresses', 'search_products', 'your_go_to_items'];

interface Variation {
  spinId: string;
  quantityDescription: string;
  displayName: string;
  brandName?: string;
  price: { mrp: number; offerPrice: number };
  isInStockAndAvailable: boolean;
}
interface SearchResult {
  products?: { isPromoted?: boolean; variations?: Variation[] }[];
}
interface Address {
  id: string;
  addressLine?: string;
  addressTag?: string;
}

/**
 * Swiggy Instamart through its official MCP server, Personal Use path. listingId = "instamart:<spinId>".
 * There is no lookup by id, so getListings re-searches by the Item's name and keeps the confirmed spinIds.
 * Never stored in history (Swiggy's "immediate task" rule) — enforced by PriceHistory.
 */
export class InstamartAdapter implements PlatformAdapter {
  readonly app = 'instamart' as const;
  private readonly session: McpSession;
  private readonly homePincode: string;
  private addressId: string | undefined;

  constructor(opts: { homePincode: string; dataDir?: string; session?: McpSession }) {
    this.homePincode = opts.homePincode;
    this.session =
      opts.session ?? new McpSession({ name: 'instamart', url: 'https://mcp.swiggy.com/im', allowedTools: INSTAMART_ALLOWED_TOOLS, dataDir: opts.dataDir, refreshLifetimeDays: 30 }); // Swiggy docs: 30-day sliding refresh
  }

  async authStatus(): Promise<AuthStatus> {
    return this.session.loginStatus();
  }

  private async home(): Promise<string> {
    if (this.addressId) return this.addressId;
    for (let page = 1; page <= 5; page++) {
      const res = await this.session.call<{ addresses?: Address[]; pagination?: { hasMore?: boolean } }>('get_addresses', { page });
      const atHome = (res.addresses ?? []).filter((a) => (a.addressLine ?? '').includes(this.homePincode));
      const pick = atHome.find((a) => /home/i.test(a.addressTag ?? '')) ?? atHome[0];
      if (pick) return (this.addressId = pick.id);
      if (!res.pagination?.hasMore) break;
    }
    throw new AdapterError('error', `no saved Swiggy address with pin code ${this.homePincode}`);
  }

  async search(query: string): Promise<Listing[]> {
    const res = await this.session.call<SearchResult>('search_products', { addressId: await this.home(), query });
    return (res.products ?? [])
      .filter((p) => !p.isPromoted)
      .flatMap((p) => p.variations ?? [])
      .map((v) => ({
        app: 'instamart' as const,
        listingId: `instamart:${v.spinId}`,
        name: v.displayName,
        brand: v.brandName,
        size: v.quantityDescription,
        price: v.price.offerPrice,
        mrp: v.price.mrp,
        inStock: v.isInStockAndAvailable,
      }));
  }

  async getListings(listingIds: string[], query: string): Promise<Listing[]> {
    const wanted = new Set(listingIds);
    return (await this.search(query)).filter((l) => wanted.has(l.listingId));
  }

  close(): Promise<void> {
    return this.session.close();
  }
}
