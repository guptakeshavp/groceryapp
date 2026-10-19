import { readFileSync } from 'node:fs';
import { FakeAdapter, type FakeAdapterOptions } from '../../src/adapters/fake.ts';
import type { AppId, BasketLine, Item, Listing } from '../../src/domain/types.ts';

const real = JSON.parse(readFileSync(new URL('./real-listings-2026-10-19.json', import.meta.url), 'utf8')) as { listings: Listing[] };

export const realListings = (app: AppId): Listing[] => real.listings.filter((l) => l.app === app).map((l) => ({ ...l }));

/** The household's confirmed Items, as Keshav would have confirmed them against the real listings. */
export function catalogue(): Map<string, Item> {
  const items: Item[] = [
    {
      id: 'ghee', name: 'Amul Cow Ghee', anyBrand: false, staple: true,
      listings: {
        blinkit: ['blinkit:amul-cow-ghee-pouch-gaay-nu-ghee-1-ltr', 'blinkit:amul-cow-ghee-tin-gaay-nu-ghee-1-ltr'],
        bigbasket: ['bigbasket:amul-cow-ghee-500-ml-pouch', 'bigbasket:amul-cow-ghee-1-l-pouch', 'bigbasket:amul-cow-ghee-500-ml-jar', 'bigbasket:amul-cow-ghee-1-l-tin'],
      },
    },
    {
      id: 'butter', name: 'Amul Salted Butter', anyBrand: false, staple: true,
      listings: {
        blinkit: ['blinkit:amul-salted-butter-100-g'],
        // "Pasteurised Butter" is Amul's ordinary salted butter on BigBasket.
        bigbasket: ['bigbasket:amul-pasteurised-butter-100-g-carton', 'bigbasket:amul-pasteurised-butter-200-g-tub'],
      },
    },
    {
      id: 'atta', name: 'Aashirvaad Shudh Chakki Atta', anyBrand: false, staple: true,
      listings: {
        blinkit: ['blinkit:aashirvaad-shudh-chakki-atta-100-atta-0-maida-5-kg-lott-5-kg', 'blinkit:aashirvaad-shudh-chakki-atta-100-atta-0-maida-lott-10-kg'],
        bigbasket: ['bigbasket:aashirvaad-shudh-chakki-atta-ghau-no-lot-5-kg', 'bigbasket:aashirvaad-shudh-chakki-atta-ghau-no-lot-10-kg'],
      },
    },
    {
      id: 'maggi', name: 'Maggi Masala Noodles', anyBrand: false, staple: false,
      listings: {
        blinkit: ['blinkit:maggi-masala-2-minutes-instant-noodles-made-with-quality-spices-280-g', 'blinkit:maggi-2-minutes-instant-noodles-made-with-quality-spices-420-g'],
        bigbasket: ['bigbasket:maggi-2-minute-instant-masala-noodles-2x420-g-multipack'],
      },
    },
    {
      id: 'surf', name: 'Surf Excel Matic Top Load Liquid', anyBrand: false, staple: true,
      listings: {
        blinkit: ['blinkit:surf-excel-matic-top-load-liquid-detergent-1-kg', 'blinkit:surf-excel-matic-top-load-liquid-detergent-3-kg', 'blinkit:surf-excel-matic-top-load-liquid-detergent-5-kg'],
        bigbasket: ['bigbasket:surf-excel-matic-liquid-detergent-for-top-load-5-kg'],
      },
    },
    {
      id: 'onion', name: 'Onion', anyBrand: true, staple: false,
      listings: { blinkit: ['blinkit:onion-dungdi-1-kg'], bigbasket: ['bigbasket:fresho-onion-1-kg'] },
    },
  ];
  return new Map(items.map((i) => [i.id, i]));
}

/** The sample basket from the prototype (the family's WhatsApp list). */
export const weeklyBasket = (): BasketLine[] => [
  { itemId: 'ghee', quantity: { amount: 1000, unit: 'ml' } },
  { itemId: 'butter', quantity: { amount: 500, unit: 'g' } },
  { itemId: 'atta', quantity: { amount: 5000, unit: 'g' } },
  { itemId: 'maggi', quantity: { amount: 280, unit: 'g' } },
  { itemId: 'surf', quantity: { amount: 5000, unit: 'g' } },
  { itemId: 'onion', quantity: { amount: 1000, unit: 'g' } },
];

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
