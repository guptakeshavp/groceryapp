// Manual smoke test of a real adapter (spec: Testing Decisions). Read-only.
// Usage: node scripts/smoke.ts zepto "amul cow ghee"
// Prints the first few listings and saves the raw listings under data/smoke/ for fixtures.
import { mkdirSync, writeFileSync } from 'node:fs';
import { ZeptoAdapter } from '../src/adapters/zepto.ts';

const [app = '', query = 'amul cow ghee'] = process.argv.slice(2);
const HOME_PIN = '380015';

if (app !== 'zepto') {
  console.error('Usage: node scripts/smoke.ts zepto "<query>"');
  process.exit(2);
}
const adapter = new ZeptoAdapter({ homePincode: HOME_PIN });
try {
  const listings = await adapter.search(query);
  mkdirSync('data/smoke', { recursive: true });
  const file = `data/smoke/${app}-${query.replace(/\W+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(file, JSON.stringify(listings, null, 1));
  console.log(`${listings.length} listings for "${query}" on ${app} (saved ${file}):`);
  for (const l of listings.slice(0, 8)) console.log(`- ₹${l.price}${l.mrp ? ` (MRP ₹${l.mrp})` : ''} ${l.name} · ${l.size}${l.inStock ? '' : ' · OUT OF STOCK'}`);
} finally {
  await adapter.close();
}
