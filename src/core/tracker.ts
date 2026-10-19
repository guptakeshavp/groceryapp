import type { PlatformAdapter } from '../adapters/adapter.ts';
import type { Item, Listing } from '../domain/types.ts';
import type { Clock } from './clock.ts';
import type { Governor } from './governor.ts';
import { NOT_STORED, type PriceHistory } from './history.ts';

/** Spec: up to ~15 staples, checked when not seen in ~24 h, trickled one lookup every ~30 s. */
export const MAX_STAPLES = 15;
const STALE_MS = 24 * 3600_000;
const TRICKLE_MS = 30_000;

export interface SweepReport {
  checked: number;
  skipped: { app: string; itemId: string; reason: string }[];
}

/** One quiet background sweep over stale staples. Instamart is never checked in the background. */
export async function backgroundSweep(opts: {
  items: Item[];
  adapters: PlatformAdapter[];
  governor: Governor;
  history: PriceHistory;
  clock: Clock;
}): Promise<SweepReport> {
  const staples = opts.items.filter((i) => i.staple).slice(0, MAX_STAPLES);
  const report: SweepReport = { checked: 0, skipped: [] };
  let first = true;
  for (const raw of opts.adapters) {
    if (NOT_STORED.has(raw.app)) continue;
    const adapter = opts.governor.wrap(raw, 'background');
    for (const item of staples) {
      const ids = item.listings[raw.app];
      if (!ids?.length) continue;
      const last = opts.history.lastChecked(item.id, raw.app);
      if (last && opts.clock.now().getTime() - last.getTime() < STALE_MS) continue;
      if (opts.governor.isCoolingDown(raw.app)) {
        report.skipped.push({ app: raw.app, itemId: item.id, reason: 'cooling down' });
        continue;
      }
      if (!first) await opts.clock.sleep(TRICKLE_MS);
      first = false;
      try {
        const listings: Listing[] = await adapter.getListings(ids);
        opts.history.record(item.id, raw.app, listings, opts.clock.now());
        report.checked++;
      } catch (e) {
        report.skipped.push({ app: raw.app, itemId: item.id, reason: e instanceof Error ? e.message : String(e) });
      }
    }
  }
  return report;
}
