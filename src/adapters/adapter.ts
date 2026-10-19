import type { AppId, AuthStatus, Bill, Listing } from '../domain/types.ts';

export interface CartLine {
  listingId: string;
  count: number;
}

/**
 * The one seam between the tool and the apps (spec: "Platform adapters").
 * Deliberately has no way to place an order — the tool never orders.
 */
export interface PlatformAdapter {
  readonly app: AppId;
  /** True when pricing writes to Keshav's real account cart (Instamart, BigBasket). */
  readonly usesRealCart: boolean;

  search(query: string): Promise<Listing[]>;
  /** Current price and stock for confirmed listings. Unknown ids are simply absent. */
  getListings(listingIds: string[]): Promise<Listing[]>;
  /** Real all-in bill for these packs. For real-cart apps this replaces the cart. */
  priceCart(lines: CartLine[]): Promise<Bill>;
  /** Only meaningful when usesRealCart. */
  isCartEmpty(): Promise<boolean>;
  authStatus(): Promise<AuthStatus>;
}
