import { APP_NAMES, type AppId, type Item } from '../domain/types.ts';
import { istDay } from './clock.ts';
import type { Observation, PriceHistory } from './history.ts';

/** Spec: deal = ≥8% below the Item's 6-week median across apps, or the lowest seen in 6 weeks. Tunable. */
export interface DealRules {
  windowDays: number;
  belowMedianPct: number;
  /** No flags until the Item has observations on at least this many distinct days in the window. */
  minDays: number;
}
export const DEFAULT_DEAL_RULES: DealRules = { windowDays: 42, belowMedianPct: 8, minDays: 10 };

export interface Deal {
  itemId: string;
  itemName: string;
  app: AppId;
  price: number;
  size: string;
  perUnit: number;
  /** % below the window median (positive). */
  belowMedianPct: number;
  lowestInWindow: boolean;
  text: string;
}

export function findDeals(items: Item[], history: PriceHistory, now: Date, rules: DealRules = DEFAULT_DEAL_RULES): Deal[] {
  const today = istDay(now);
  const from = istDay(new Date(now.getTime() - rules.windowDays * 86_400_000));
  const deals: Deal[] = [];
  for (const item of items) {
    const window = history.forItem(item.id).filter((o) => o.day >= from && o.day <= today);
    if (new Set(window.map((o) => o.day)).size < rules.minDays) continue;
    const median = medianOf(window.map((o) => o.perUnit));
    const todays = window.filter((o) => o.day === today);
    const earlier = window.filter((o) => o.day < today);
    const best = todays.sort((a, b) => a.perUnit - b.perUnit)[0];
    if (!best) continue;
    const below = ((median - best.perUnit) / median) * 100;
    const lowest = earlier.length > 0 && best.perUnit < Math.min(...earlier.map((o) => o.perUnit));
    if (below >= rules.belowMedianPct || lowest) deals.push(toDeal(item, best, below, lowest, rules));
  }
  return deals.sort((a, b) => b.belowMedianPct - a.belowMedianPct);
}

function toDeal(item: Item, o: Observation, below: number, lowest: boolean, rules: DealRules): Deal {
  const weeks = Math.round(rules.windowDays / 7);
  const why = lowest ? `lowest in ${weeks} weeks` : `${Math.round(below)}% below usual`;
  return {
    itemId: item.id, itemName: item.name, app: o.app, price: o.price, size: o.size, perUnit: o.perUnit,
    belowMedianPct: Math.round(below * 10) / 10, lowestInWindow: lowest,
    text: `${item.name} ${o.size} ₹${o.price} on ${APP_NAMES[o.app]} — ${why}`,
  };
}

function medianOf(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
