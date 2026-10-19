// Manual smoke test of a real adapter (spec: Testing Decisions). Read-only.
// Usage: node scripts/smoke.ts zepto|instamart|blinkit|bigbasket|minutes "amul cow ghee"
// Prints the first few listings and saves the raw listings under data/smoke/ for fixtures.
import { mkdirSync, writeFileSync } from 'node:fs';
import { BigBasketAdapter, BlinkitAdapter, ChromeSession, MinutesAdapter } from '../src/adapters/chrome.ts';
import { InstamartAdapter } from '../src/adapters/instamart.ts';
import { ZeptoAdapter } from '../src/adapters/zepto.ts';

const [app = '', query = 'amul cow ghee'] = process.argv.slice(2);
const HOME_PIN = '380015';

const chrome = new ChromeSession();
const adapters = {
  zepto: () => new ZeptoAdapter({ homePincode: HOME_PIN }),
  instamart: () => new InstamartAdapter({ homePincode: HOME_PIN }),
  blinkit: () => new BlinkitAdapter(chrome),
  bigbasket: () => new BigBasketAdapter(chrome),
  minutes: () => new MinutesAdapter(chrome),
};
if (!(app in adapters)) {
  console.error('Usage: node scripts/smoke.ts zepto|instamart|blinkit|bigbasket|minutes "<query>"');
  process.exit(2);
}
const adapter = adapters[app as keyof typeof adapters]();
try {
  const listings = await adapter.search(query);
  mkdirSync('data/smoke', { recursive: true });
  const file = `data/smoke/${app}-${query.replace(/\W+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(file, JSON.stringify(listings, null, 1));
  console.log(`${listings.length} listings for "${query}" on ${app} (saved ${file}):`);
  for (const l of listings.slice(0, 8)) console.log(`- ₹${l.price}${l.mrp ? ` (MRP ₹${l.mrp})` : ''} ${l.name} · ${l.size}${l.inStock ? '' : ' · OUT OF STOCK'}`);
} finally {
  if ('close' in adapter) await adapter.close();
  await chrome.close();
}
