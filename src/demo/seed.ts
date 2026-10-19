import { readFileSync } from 'node:fs';
import type { AppId, BasketLine, Item, Listing } from '../domain/types.ts';

/**
 * Demo/seed data: the 6 Items confirmed against real listings captured 2026-10-19 at the Ahmedabad (380015)
 * stores, and those recorded listings. Used to seed data/catalogue.json and to replay Blinkit/BigBasket until
 * their Chrome adapters are set up.
 */
export const RECORDED_ON = '2026-10-19';
const recorded = JSON.parse(readFileSync(new URL('../../test/fixtures/real-listings-2026-10-19.json', import.meta.url), 'utf8')) as { listings: Listing[] };
export const recordedListings = (app: AppId): Listing[] => recorded.listings.filter((l) => l.app === app).map((l) => ({ ...l }));

/** The household's confirmed Items, as Keshav would have confirmed them against the real listings. */
export function catalogue(): Map<string, Item> {
  const items: Item[] = [
    {
      id: 'ghee', usualQuantity: { amount: 1000, unit: 'ml' }, name: 'Amul Cow Ghee', anyBrand: false, staple: true,
      listings: {
        blinkit: ['blinkit:amul-cow-ghee-pouch-gaay-nu-ghee-1-ltr', 'blinkit:amul-cow-ghee-tin-gaay-nu-ghee-1-ltr'],
        bigbasket: ['bigbasket:amul-cow-ghee-500-ml-pouch', 'bigbasket:amul-cow-ghee-1-l-pouch', 'bigbasket:amul-cow-ghee-500-ml-jar', 'bigbasket:amul-cow-ghee-1-l-tin'],
      },
    },
    {
      id: 'butter', usualQuantity: { amount: 500, unit: 'g' }, name: 'Amul Salted Butter', anyBrand: false, staple: true,
      listings: {
        blinkit: ['blinkit:amul-salted-butter-100-g'],
        // "Pasteurised Butter" is Amul's ordinary salted butter on BigBasket.
        bigbasket: ['bigbasket:amul-pasteurised-butter-100-g-carton', 'bigbasket:amul-pasteurised-butter-200-g-tub'],
      },
    },
    {
      id: 'atta', usualQuantity: { amount: 5000, unit: 'g' }, name: 'Aashirvaad Shudh Chakki Atta', anyBrand: false, staple: true,
      listings: {
        blinkit: ['blinkit:aashirvaad-shudh-chakki-atta-100-atta-0-maida-5-kg-lott-5-kg', 'blinkit:aashirvaad-shudh-chakki-atta-100-atta-0-maida-lott-10-kg'],
        bigbasket: ['bigbasket:aashirvaad-shudh-chakki-atta-ghau-no-lot-5-kg', 'bigbasket:aashirvaad-shudh-chakki-atta-ghau-no-lot-10-kg'],
      },
    },
    {
      id: 'maggi', usualQuantity: { amount: 280, unit: 'g' }, name: 'Maggi Masala Noodles', anyBrand: false, staple: false,
      listings: {
        blinkit: ['blinkit:maggi-masala-2-minutes-instant-noodles-made-with-quality-spices-280-g', 'blinkit:maggi-2-minutes-instant-noodles-made-with-quality-spices-420-g'],
        bigbasket: ['bigbasket:maggi-2-minute-instant-masala-noodles-2x420-g-multipack'],
      },
    },
    {
      id: 'surf', usualQuantity: { amount: 5000, unit: 'g' }, name: 'Surf Excel Matic Top Load Liquid', anyBrand: false, staple: true,
      listings: {
        blinkit: ['blinkit:surf-excel-matic-top-load-liquid-detergent-1-kg', 'blinkit:surf-excel-matic-top-load-liquid-detergent-3-kg', 'blinkit:surf-excel-matic-top-load-liquid-detergent-5-kg'],
        bigbasket: ['bigbasket:surf-excel-matic-liquid-detergent-for-top-load-5-kg'],
      },
    },
    {
      id: 'onion', usualQuantity: { amount: 1000, unit: 'g' }, name: 'Onion', anyBrand: true, staple: false,
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

