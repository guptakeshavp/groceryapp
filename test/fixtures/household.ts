import { FakeAdapter, type FakeAdapterOptions } from '../../src/adapters/fake.ts';
import { catalogue, recordedListings, weeklyBasket } from '../../src/demo/seed.ts';
import type { Item, Listing } from '../../src/domain/types.ts';

export { catalogue, weeklyBasket };
export const realListings = recordedListings;

export const blinkit = (o: Partial<FakeAdapterOptions> = {}) => new FakeAdapter({ app: 'blinkit', listings: realListings('blinkit'), ...o });

export const bigbasket = (o: Partial<FakeAdapterOptions> = {}) => new FakeAdapter({ app: 'bigbasket', listings: realListings('bigbasket'), ...o });

/**
 * Synthetic Instamart: no real Instamart capture exists yet. Mirrors Blinkit's listings
 * with each price changed by `priceDelta(listing)` (default +₹7 per pack).
 */
export const instamart = (o: Partial<FakeAdapterOptions> = {}, priceDelta: (l: Listing) => number = () => 7) =>
  new FakeAdapter({
    app: 'instamart',
    listings: realListings('blinkit').map((l) => ({ ...l, app: 'instamart' as const, listingId: l.listingId.replace('blinkit:', 'instamart:'), price: l.price + priceDelta(l) })),
    ...o,
  });

/** Adds Instamart listing ids (mirrors of Blinkit's) to every Item that Blinkit sells. */
export function withInstamart(cat: Map<string, Item>): Map<string, Item> {
  for (const item of cat.values()) {
    const b = item.listings.blinkit;
    if (b) item.listings.instamart = b.map((id) => id.replace('blinkit:', 'instamart:'));
  }
  return cat;
}
