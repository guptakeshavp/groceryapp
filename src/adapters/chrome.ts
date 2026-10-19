import { join } from 'node:path';
import { type BrowserContext, chromium } from 'playwright-core';
import type { AuthStatus, Listing } from '../domain/types.ts';
import { AdapterError } from '../domain/types.ts';
import type { PlatformAdapter } from './adapter.ts';
import { looksBlocked, parseBigBasketText, parseBlinkitText } from './page-parsers.ts';

export const profileDir = (dataDir = 'data') => join(dataDir, 'chrome-profile');

/**
 * One dedicated Chrome profile on the Mac (spec: Platform adapters) — Keshav's real Chrome, visible, with
 * the home address set once on each site. Shared by the Blinkit, BigBasket and Minutes adapters.
 */
export class ChromeSession {
  private context: Promise<BrowserContext> | undefined;
  private readonly dir: string;

  constructor(dataDir = 'data') {
    this.dir = profileDir(dataDir);
  }

  private open(): Promise<BrowserContext> {
    this.context ??= chromium.launchPersistentContext(this.dir, {
      channel: 'chrome',
      headless: false,
      viewport: { width: 1280, height: 900 },
    });
    return this.context;
  }

  /** Load a page and return its visible text once results (or a block) appear. */
  async pageText(url: string, ready: RegExp, timeoutMs = 15_000): Promise<string> {
    const context = await this.open();
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      await page.waitForFunction((re) => new RegExp(re, 'i').test(document.body?.innerText ?? ''), ready.source, { timeout: timeoutMs }).catch(() => undefined);
      return await page.evaluate(() => document.body?.innerText ?? '');
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.context) await (await this.context).close();
    this.context = undefined;
  }
}

abstract class ChromeSiteAdapter implements PlatformAdapter {
  abstract readonly app: 'blinkit' | 'bigbasket';
  protected readonly chrome: ChromeSession;
  constructor(chrome: ChromeSession) {
    this.chrome = chrome;
  }
  protected abstract url(query: string): string;
  protected abstract parse(text: string): Listing[];
  protected abstract checkLocation(text: string): void;

  async authStatus(): Promise<AuthStatus> {
    return { state: 'ok' }; // logouts surface as errors from search
  }

  async search(query: string): Promise<Listing[]> {
    const text = await this.chrome.pageText(this.url(query), /\bMINS?\b|captcha|access denied/);
    this.checkLocation(text);
    const listings = this.parse(text);
    if (listings.length === 0) {
      const kind = looksBlocked(text);
      if (kind) throw new AdapterError(kind, kind === 'blocked' ? 'challenge page' : 'empty results page');
    }
    return listings;
  }

  async getListings(listingIds: string[], query: string): Promise<Listing[]> {
    const wanted = new Set(listingIds);
    return (await this.search(query)).filter((l) => wanted.has(l.listingId));
  }
}

export class BlinkitAdapter extends ChromeSiteAdapter {
  readonly app = 'blinkit' as const;
  protected url(q: string) {
    return `https://blinkit.com/s/?q=${encodeURIComponent(q)}`;
  }
  protected parse(text: string) {
    return parseBlinkitText(text);
  }
  protected checkLocation(text: string) {
    if (/detect my location|select (your )?location|enter your delivery location/i.test(text) && !/\bMINS?\b/.test(text)) {
      throw new AdapterError('error', 'home address not set on Blinkit in the automated Chrome — run npm run chrome-setup');
    }
  }
}

export class BigBasketAdapter extends ChromeSiteAdapter {
  readonly app = 'bigbasket' as const;
  protected url(q: string) {
    return `https://www.bigbasket.com/ps/?q=${encodeURIComponent(q)}`;
  }
  protected parse(text: string) {
    return parseBigBasketText(text);
  }
  protected checkLocation(text: string) {
    if (/Login\/ Sign Up/.test(text)) throw new AdapterError('login-expired', 'not logged in to BigBasket in the automated Chrome — run npm run chrome-setup');
    if (/^Select Location$/m.test(text)) throw new AdapterError('error', 'home address not set on BigBasket — run npm run chrome-setup');
  }
}
