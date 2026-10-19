import type { AppId, AuthStatus, Listing } from '../domain/types.ts';

/**
 * The one seam between the tool and the apps (spec: "Platform adapters").
 * Read-only by design: no cart, checkout or order operations exist here.
 */
export interface PlatformAdapter {
  readonly app: AppId;
  search(query: string): Promise<Listing[]>;
  /** Current price and stock for confirmed listings. Unknown ids are simply absent. */
  getListings(listingIds: string[]): Promise<Listing[]>;
  authStatus(): Promise<AuthStatus>;
}
