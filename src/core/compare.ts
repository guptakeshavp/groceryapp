import type { PlatformAdapter } from '../adapters/adapter.ts';
import { formatQuantity, parsePackSize } from '../domain/size.ts';
import { AdapterError, APP_NAMES, type AppId, type BasketLine, type Item, type Listing } from '../domain/types.ts';
import { fillQuantity, type FillResult } from './pack-filler.ts';

/** Within this many rupees the ignored handling fees (~₹4–12) could swing it, so call it a tie. */
export const TIE_RUPEES = 15;

export interface CompareInput {
  basket: BasketLine[];
  catalogue: Map<string, Item>;
  adapters: PlatformAdapter[];
}

export interface LineResult {
  itemId: string;
  fill: FillResult;
}

export type AppResult =
  | { app: AppId; status: 'checked'; lines: LineResult[]; missingItemIds: string[]; basketPrice: number; pickList: string[] }
  | { app: AppId; status: 'couldnt-check'; reason: string };

type Checked = Extract<AppResult, { status: 'checked' }>;

export interface Verdict {
  app: AppId;
  basketPrice: number;
  runnerUp?: { app: AppId; basketPrice: number; gap: number };
  /** Runner-up within TIE_RUPEES. */
  tie: boolean;
  /** No app had every Item; the verdict compares the most complete baskets. */
  incomplete: boolean;
}

export interface Comparison {
  /** Checked apps (most complete first, then cheapest), then the ones that couldn't be checked. */
  apps: AppResult[];
  verdict?: Verdict;
  worthKnowing: string[];
  splitNote?: string;
}

/** Compare a basket across apps by item prices only (spec: "Basket price (no fees)"). Read-only on every app. */
export async function compareBasket(input: CompareInput): Promise<Comparison> {
  const worthKnowing: string[] = [];
  const results = await Promise.all(input.adapters.map((a) => checkOneApp(a, input, worthKnowing)));

  const checked = results.filter((r): r is Checked => r.status === 'checked');
  checked.sort((a, b) => a.missingItemIds.length - b.missingItemIds.length || a.basketPrice - b.basketPrice);
  const apps: AppResult[] = [...checked, ...results.filter((r) => r.status !== 'checked')];

  let verdict: Verdict | undefined;
  if (checked.length > 0) {
    const fewestMissing = checked[0].missingItemIds.length;
    const [win, second] = checked.filter((a) => a.missingItemIds.length === fewestMissing);
    const gap = second ? round2(second.basketPrice - win.basketPrice) : undefined;
    verdict = {
      app: win.app,
      basketPrice: win.basketPrice,
      runnerUp: second && { app: second.app, basketPrice: second.basketPrice, gap: gap as number },
      tie: gap !== undefined && gap <= TIE_RUPEES,
      incomplete: fewestMissing > 0,
    };
  }

  return { apps, verdict, worthKnowing, splitNote: splitNote(input.basket, checked, verdict) };
}

async function checkOneApp(adapter: PlatformAdapter, input: CompareInput, worthKnowing: string[]): Promise<AppResult> {
  const app = adapter.app;
  try {
    const auth = await withOneRetry(() => adapter.authStatus());
    if (auth.state === 'expired') return { app, status: 'couldnt-check', reason: 'login expired' };

    const wantedIds = input.basket.flatMap((line) => input.catalogue.get(line.itemId)?.listings[app] ?? []);
    const current = new Map((await withOneRetry(() => adapter.getListings(wantedIds))).map((l) => [l.listingId, l]));

    const lines: LineResult[] = input.basket.map((line) => {
      const item = mustGet(input.catalogue, line.itemId);
      const family = (item.listings[app] ?? []).map((id) => current.get(id)).filter((l): l is Listing => !!l);
      const fill = fillQuantity(family, line.quantity, item.pinnedContainer);
      noteCaveats(APP_NAMES[app], item, line, family, fill, worthKnowing);
      return { itemId: line.itemId, fill };
    });
    return {
      app,
      status: 'checked',
      lines,
      missingItemIds: lines.filter((l) => l.fill.kind === 'unavailable').map((l) => l.itemId),
      basketPrice: round2(sum(lines.map((l) => (l.fill.kind === 'unavailable' ? 0 : l.fill.cost)))),
      pickList: lines.flatMap((l) =>
        l.fill.kind === 'unavailable' ? [] : l.fill.packs.map((p) => `${p.listing.name} · ${p.listing.size} × ${p.count}`),
      ),
    };
  } catch (e) {
    return { app, status: 'couldnt-check', reason: describe(e) };
  }
}

function noteCaveats(appName: string, item: Item, line: BasketLine, family: Listing[], fill: FillResult, out: string[]): void {
  if (fill.kind === 'unavailable') {
    out.push(`${item.name}: ${fill.reason === 'out-of-stock' ? 'out of stock' : 'not sold'} on ${appName}`);
    return;
  }
  if (fill.kind === 'closest') {
    const factor = fill.amount / line.quantity.amount;
    out.push(
      `${item.name} on ${appName}: closest pack is ${fill.packs[0].listing.size} — ${factor >= 1 ? `${round1(factor)}× what you wanted` : 'less than you wanted'} (₹${Math.round(fill.perKg)}/kg·L)`,
    );
  }
  // A cheaper-per-unit confirmed pack that's out of stock (e.g. the pouch) explains why a different container won.
  const chosenPerUnit = fill.cost / fill.amount;
  for (const l of family) {
    const q = parsePackSize(l.size);
    if (!l.inStock && q && l.price / q.amount < chosenPerUnit - 1e-9) {
      out.push(`${item.name} on ${appName}: ${l.size} is out of stock — using ${fill.packs.map((p) => p.listing.size).join(' + ')}`);
    }
  }
  if (fill.mixedUnits) out.push(`${item.name} on ${appName}: compared ml with g (${formatQuantity(line.quantity)} wanted)`);
}

function splitNote(basket: BasketLine[], checked: Checked[], verdict: Verdict | undefined): string | undefined {
  if (!verdict || verdict.incomplete) return undefined;
  const cheapestPerLine = basket.map((line) => {
    let best: { app: Checked; cost: number } | undefined;
    for (const a of checked) {
      const fill = a.lines.find((l) => l.itemId === line.itemId)?.fill;
      if (fill && fill.kind !== 'unavailable' && (!best || fill.cost < best.cost)) best = { app: a, cost: fill.cost };
    }
    return best;
  });
  if (cheapestPerLine.some((b) => !b)) return undefined;
  const inSplit = new Set(cheapestPerLine.map((b) => (b as { app: Checked }).app));
  const used = checked.filter((a) => inSplit.has(a)); // ranking order
  if (used.length < 2) return undefined;
  const splitPrice = round2(sum(cheapestPerLine.map((b) => (b as { cost: number }).cost)));
  const saving = round2(verdict.basketPrice - splitPrice);
  if (saving <= 0) return undefined;
  return `Splitting across ${used.map((a) => APP_NAMES[a.app]).join(' + ')} would cost ₹${splitPrice} — ₹${saving} less than ${APP_NAMES[verdict.app]} alone, for ${used.length} deliveries.`;
}

/** One gentle retry for blocks/blanks/rate limits (spec: request governor). Login expiry is not retried. */
async function withOneRetry<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (e) {
    if (e instanceof AdapterError && e.kind === 'login-expired') throw e;
    return await call();
  }
}

function describe(e: unknown): string {
  if (e instanceof AdapterError) {
    if (e.kind === 'login-expired') return 'login expired';
    if (e.kind === 'rate-limited') return `rate-limited${e.retryAfterSec ? ` (retry after ${e.retryAfterSec} s)` : ''}`;
    if (e.kind === 'daily-limit') return 'daily limit';
    return `${e.kind}: ${e.message}`;
  }
  return e instanceof Error ? e.message : String(e);
}

function mustGet<K, V>(map: Map<K, V>, key: K): V {
  const v = map.get(key);
  if (v === undefined) throw new Error(`Unknown Item ${String(key)}`);
  return v;
}
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
