// One-time setup of the dedicated Chrome profile (spec: Further Notes → one-time setup Keshav does).
// Opens Blinkit, BigBasket and Flipkart in the profile. In that window:
//   - Blinkit: set the home delivery address
//   - BigBasket: log in, set the 380015 home address
//   - Flipkart: set the home address in Minutes mode
// Then close the Chrome window. The tool reuses this profile.
import { chromium } from 'playwright-core';
import { profileDir } from '../src/adapters/chrome.ts';

const context = await chromium.launchPersistentContext(profileDir(), { channel: 'chrome', headless: false, viewport: null });
const urls = ['https://blinkit.com', 'https://www.bigbasket.com', 'https://www.flipkart.com/flipkart-minutes-store?marketplace=HYPERLOCAL'];
const [first] = context.pages();
await first.goto(urls[0]);
for (const url of urls.slice(1)) await (await context.newPage()).goto(url);
console.log('Set your home address on each tab (and log in to BigBasket), then close the Chrome window.');
await new Promise<void>((resolve) => context.on('close', () => resolve()));
console.log('Saved. The tool will reuse this profile.');
