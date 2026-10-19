import type { AppId, AuthStatus, Listing } from '../domain/types.ts';

/**
 * The one seam between the tool and the apps (spec: "Platform adapters").
 * Read-only by design: no cart, checkout or order operations exist here.
 */
export interface PlatformAdapter {
  readonly app: AppId;
  search(query: string): Promise<Listing[]>;
  /**
   * Current price and stock for one Item's confirmed listings. `query` (the Item's name) lets apps without
   * a lookup-by-id re-find them by search. Unknown ids are simply absent.
   */
  getListings(listingIds: string[], query: string): Promise<Listing[]>;
  authStatus(): Promise<AuthStatus>;
}
