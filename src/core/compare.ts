import type { CartLine, PlatformAdapter } from '../adapters/adapter.ts';
import { formatQuantity, parsePackSize } from '../domain/size.ts';
import { AdapterError, APP_NAMES, type AppId, type BasketLine, type Bill, type FeeLine, type Item, type Listing } from '../domain/types.ts';
import type { FeeMemory } from './fee-memory.ts';
import { fillQuantity, type FillResult } from './pack-filler.ts';

export type CartDecision = 'replace' | 'estimate';

export interface CompareInput {
  basket: BasketLine[];
  catalogue: Map<string, Item>;
  adapters: PlatformAdapter[];
  feeMemory: FeeMemory;
  /** Keshav's answer when a real cart (Instamart, BigBasket) wasn't empty. */
  cartDecisions?: Partial<Record<AppId, CartDecision>>;
  now?: Date;
}

export type AppStatus =
  | 'real' // all-in total read from the app
  | 'estimated' // items + fee lines from the last real bill
  | 'fees-unknown' // items only; no earlier bill to borrow fees from
  | 'needs-cart-decision' // real cart not empty; ask Keshav before touching it
  | 'couldnt-check';

export interface LineResult {
  itemId: string;
  fill: FillResult;
}

export type Handoff =
  | { kind: 'cart' } // basket left in Keshav's real cart
  | { kind: 'pick-list'; lines: string[] }
  | { kind: 'none' };

export interface AppResult {
  app: AppId;
  status: AppStatus;
  reason?: string;
  lines: LineResult[];
  missingItemIds: string[];
  itemsTotal?: number;
  fees: FeeLine[];
  autoDiscounts: FeeLine[];
  total?: number;
  feesAsOf?: Date;
  coupons: string[];
  handoff: Handoff;
}

export interface Verdict {
  app: AppId;
  total: number;
  estimated: boolean;
  runnerUp?: { app: AppId; total: number; estimated: boolean; gap: number };
  /** Set when no app had every Item; the verdict compares incomplete baskets. */
  incomplete: boolean;
}

export interface Comparison {
  /** Ranked: comparable apps by total (complete baskets first), then the rest. */
  apps: AppResult[];
  verdict?: Verdict;
  worthKnowing: string[];
  splitNote?: string;
}

const isPriced = (a: AppResult) => a.total !== undefined && (a.status === 'real' || a.status === 'estimated' || a.status === 'fees-unknown');

export async function compareBasket(input: CompareInput): Promise<Comparison> {
  const now = input.now ?? new Date();
  const worthKnowing: string[] = [];
  const results = await Promise.all(input.adapters.map((adapter) => priceOneApp(adapter, input, now, worthKnowing)));

  const priced = results.filter(isPriced);
  const rank = (a: AppResult, b: AppResult) =>
    a.missingItemIds.length - b.missingItemIds.length || (a.total as number) - (b.total as number);
  priced.sort(rank);
  const rest = results.filter((r) => !isPriced(r));
  const apps = [...priced, ...rest];

  let verdict: Verdict | undefined;
  if (priced.length > 0) {
    const fewestMissing = priced[0].missingItemIds.length;
    const contenders = priced.filter((a) => a.missingItemIds.length === fewestMissing && a.status !== 'fees-unknown');
    const pool = contenders.length > 0 ? contenders : priced.filter((a) => a.missingItemIds.length === fewestMissing);
    const [win, second] = pool;
    verdict = {
      app: win.app,
      total: win.total as number,
      estimated: win.status !== 'real',
      incomplete: fewestMissing > 0,
      runnerUp: second && {
        app: second.app,
        total: second.total as number,
        estimated: second.status !== 'real',
        gap: (second.total as number) - (win.total as number),
      },
    };
  }

  return { apps, verdict, worthKnowing, splitNote: splitNote(input, priced, verdict) };
}

async function priceOneApp(adapter: PlatformAdapter, input: CompareInput, now: Date, worthKnowing: string[]): Promise<AppResult> {
  const app = adapter.app;
  const name = APP_NAMES[app];
  const empty: AppResult = { app, status: 'couldnt-check', lines: [], missingItemIds: [], fees: [], autoDiscounts: [], coupons: [], handoff: { kind: 'none' } };

  try {
    const auth = await withOneRetry(() => adapter.authStatus());
    if (auth.state === 'expired') return { ...empty, reason: 'login expired' };

    const wantedIds = input.basket.flatMap((line) => input.catalogue.get(line.itemId)?.listings[app] ?? []);
    const current = new Map((await withOneRetry(() => adapter.getListings(wantedIds))).map((l) => [l.listingId, l]));

    const lines: LineResult[] = input.basket.map((line) => {
      const item = mustGet(input.catalogue, line.itemId);
      const family = (item.listings[app] ?? []).map((id) => current.get(id)).filter((l): l is Listing => !!l);
      const fill = fillQuantity(family, line.quantity, item.pinnedContainer);
      noteCaveats(name, item, line, family, fill, worthKnowing);
      return { itemId: line.itemId, fill };
    });
    const missingItemIds = lines.filter((l) => l.fill.kind === 'unavailable').map((l) => l.itemId);
    const cartLines: CartLine[] = lines.flatMap((l) =>
      l.fill.kind === 'unavailable' ? [] : l.fill.packs.map((p) => ({ listingId: p.listing.listingId, count: p.count })),
    );
    const itemsTotal = sum(lines.map((l) => (l.fill.kind === 'unavailable' ? 0 : l.fill.cost)));
    const base = { ...empty, lines, missingItemIds, itemsTotal };

    if (adapter.usesRealCart) {
      const decision = input.cartDecisions?.[app];
      if (decision !== 'replace' && decision !== 'estimate') {
        const cartEmpty = await withOneRetry(() => adapter.isCartEmpty());
        if (!cartEmpty) {
          return { ...base, status: 'needs-cart-decision', reason: `your ${name} cart isn't empty`, itemsTotal: undefined };
        }
      }
      if (decision === 'estimate') return estimate(base, input.feeMemory, app, lines, `you chose to keep your ${name} cart`);
    }

    let bill: Bill;
    try {
      bill = await withOneRetry(() => adapter.priceCart(cartLines));
    } catch (e) {
      // Prices were read; only the bill failed. Fall back to an estimate rather than nothing.
      return estimate(base, input.feeMemory, app, lines, `couldn't read the bill (${describe(e)})`);
    }
    input.feeMemory.record(app, bill, now);
    return {
      ...base,
      status: 'real',
      itemsTotal: sum(bill.lines.map((l) => l.amount)),
      fees: bill.fees,
      autoDiscounts: bill.autoDiscounts,
      total: bill.toPay,
      coupons: bill.coupons,
      handoff: adapter.usesRealCart ? { kind: 'cart' } : pickList(lines),
    };
  } catch (e) {
    return { ...empty, reason: describe(e) };
  }
}

function estimate(base: AppResult, memory: FeeMemory, app: AppId, lines: LineResult[], why: string): AppResult {
  const remembered = memory.get(app);
  const itemsTotal = base.itemsTotal as number;
  if (!remembered) {
    return { ...base, status: 'fees-unknown', reason: `${why}; fees unknown`, total: itemsTotal, handoff: pickList(lines) };
  }
  return {
    ...base,
    status: 'estimated',
    reason: why,
    fees: remembered.fees,
    total: itemsTotal + sum(remembered.fees.map((f) => f.amount)),
    feesAsOf: remembered.seenAt,
    handoff: pickList(lines),
  };
}

function pickList(lines: LineResult[]): Handoff {
  return {
    kind: 'pick-list',
    lines: lines.flatMap((l) =>
      l.fill.kind === 'unavailable' ? [] : l.fill.packs.map((p) => `${p.listing.name} · ${p.listing.size} × ${p.count}`),
    ),
  };
}

function noteCaveats(appName: string, item: Item, line: BasketLine, family: Listing[], fill: FillResult, out: string[]): void {
  if (fill.kind === 'unavailable') {
    if (fill.reason === 'out-of-stock') out.push(`${item.name}: out of stock on ${appName}`);
    else out.push(`${item.name}: not sold on ${appName}`);
    return;
  }
  if (fill.kind === 'closest') {
    const factor = fill.amount / line.quantity.amount;
    out.push(
      `${item.name} on ${appName}: closest pack is ${fill.packs[0].listing.size} — ${factor >= 1 ? `${round1(factor)}× what you wanted` : `less than you wanted`} (₹${Math.round(fill.perKg)}/kg·L)`,
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

function splitNote(input: CompareInput, priced: AppResult[], verdict: Verdict | undefined): string | undefined {
  if (!verdict || verdict.incomplete) return undefined;
  const usable = priced.filter((a) => a.status !== 'fees-unknown');
  const cheapestPerLine = input.basket.map((line) => {
    let best: { app: AppResult; cost: number } | undefined;
    for (const a of usable) {
      const fill = a.lines.find((l) => l.itemId === line.itemId)?.fill;
      if (fill && fill.kind !== 'unavailable' && (!best || fill.cost < best.cost)) best = { app: a, cost: fill.cost };
    }
    return best;
  });
  if (cheapestPerLine.some((b) => !b)) return undefined;
  const inSplit = new Set(cheapestPerLine.map((b) => (b as { app: AppResult }).app));
  const used = usable.filter((a) => inSplit.has(a)); // ranking order
  if (used.length < 2) return undefined;
  const splitTotal = sum(cheapestPerLine.map((b) => (b as { cost: number }).cost)) + sum(used.map((a) => sum(a.fees.map((f) => f.amount))));
  const saving = verdict.total - splitTotal;
  if (saving <= 0) return undefined;
  return `Splitting across ${used.map((a) => APP_NAMES[a.app]).join(' + ')} would cost ₹${round2(splitTotal)} — ₹${round2(saving)} less than ${APP_NAMES[verdict.app]} alone, for ${used.length} deliveries.`;
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
