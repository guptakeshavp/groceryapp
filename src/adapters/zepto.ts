import type { AuthStatus, Listing } from '../domain/types.ts';
import { AdapterError } from '../domain/types.ts';
import { McpSession } from '../mcp/session.ts';
import type { PlatformAdapter } from './adapter.ts';

/** Read-only tools only. Zepto also exposes update_cart and four order-placing tools; none may ever be called. */
export const ZEPTO_ALLOWED_TOOLS = [
  'list_saved_addresses',
  'select_saved_address',
  'search_products',
  'search_multiple_products',
  'get_product_details',
  'get_past_order_items',
];

interface SearchResult {
  products?: {
    productVariantId: string | null;
    name: string;
    price: number | null;
    mrp: number | null;
    packSize: string | null;
    availableQuantity: number | null;
    isAd: boolean;
  }[];
}
interface ProductDetails {
  productVariantId: string;
  name: string;
  brand?: string;
  sellingPrice: number;
  mrp: number;
  isInStock: boolean;
  packSize: string;
}
interface SavedAddress {
  id: string;
  label?: string;
  postalCode?: string;
}

/**
 * Zepto through its official MCP server (spec: Platform adapters). listingId = "zepto:<productVariantId>".
 * Prices: Zepto's cart API uses paisa; search/details are normalised to rupees here (see toRupees).
 */
export class ZeptoAdapter implements PlatformAdapter {
  readonly app = 'zepto' as const;
  private readonly session: McpSession;
  private readonly homePincode: string;
  private addressSelected = false;

  constructor(opts: { homePincode: string; dataDir?: string; session?: McpSession }) {
    this.homePincode = opts.homePincode;
    this.session =
      opts.session ?? new McpSession({ name: 'zepto', url: 'https://mcp.zepto.co.in/mcp', allowedTools: ZEPTO_ALLOWED_TOOLS, dataDir: opts.dataDir });
  }

  async authStatus(): Promise<AuthStatus> {
    return this.session.hasLogin() ? { state: 'ok' } : { state: 'expired' };
  }

  /** Pin the session to the saved home address so prices are the home dark store's. */
  private async ensureHome(): Promise<void> {
    if (this.addressSelected) return;
    const { addresses = [] } = await this.session.call<{ addresses?: SavedAddress[] }>('list_saved_addresses');
    const atHome = addresses.filter((a) => a.postalCode === this.homePincode);
    const id = (atHome.find((a) => /home/i.test(a.label ?? '')) ?? atHome[0])?.id;
    if (!id) throw new AdapterError('error', `no saved Zepto address with pin code ${this.homePincode}`);
    await this.session.call('select_saved_address', { addressId: id });
    this.addressSelected = true;
  }

  async search(query: string): Promise<Listing[]> {
    await this.ensureHome();
    const res = await this.session.call<SearchResult>('search_products', { query });
    return (res.products ?? [])
      .filter((p) => p.productVariantId && p.price != null && !p.isAd)
      .map((p) => ({
        app: 'zepto',
        listingId: `zepto:${p.productVariantId}`,
        name: p.name,
        size: p.packSize ?? '',
        price: toRupees(p.price as number, p.mrp),
        mrp: p.mrp == null ? undefined : toRupees(p.mrp, p.mrp),
        inStock: (p.availableQuantity ?? 1) > 0,
      }));
  }

  async getListings(listingIds: string[]): Promise<Listing[]> {
    await this.ensureHome();
    const out: Listing[] = [];
    for (const id of listingIds) {
      if (!id.startsWith('zepto:')) continue;
      const d = await this.session.call<ProductDetails>('get_product_details', { product_variant_id: id.slice('zepto:'.length) });
      out.push({
        app: 'zepto', listingId: id, name: d.name, brand: d.brand, size: d.packSize,
        price: toRupees(d.sellingPrice, d.mrp), mrp: toRupees(d.mrp, d.mrp), inStock: d.isInStock,
      });
    }
    return out;
  }

  close(): Promise<void> {
    return this.session.close();
  }
}

/**
 * Zepto reports some prices in paisa. Grocery MRPs in rupees are < ₹20,000, so a value ≥ 20,000 on an
 * MRP-scale pair is paisa. Verified against live results by scripts/smoke.ts.
 */
export function toRupees(value: number, mrpHint: number | null | undefined): number {
  const scale = Math.max(value, mrpHint ?? 0);
  return scale >= 20_000 ? Math.round(value) / 100 : value;
}
