import { comparableUnits, parsePackSize } from '../domain/size.ts';
import type { Listing, Quantity } from '../domain/types.ts';

export interface PackPick {
  listing: Listing;
  count: number;
}

export type FillResult =
  | { kind: 'filled'; packs: PackPick[]; amount: number; cost: number; mixedUnits: boolean }
  | { kind: 'closest'; packs: PackPick[]; amount: number; cost: number; perKg: number; mixedUnits: boolean }
  | { kind: 'unavailable'; reason: 'none-confirmed' | 'out-of-stock' };

/** A fill may overshoot the wanted quantity by at most this factor before we fall back to "closest pack". */
const MAX_OVERSHOOT = 1.5;

/**
 * Fill the wanted quantity with the cheapest combination of real, in-stock packs
 * (spec: "Pack filler"). Never invents a pack.
 */
export function fillQuantity(family: Listing[], wanted: Quantity, pinnedContainer?: string): FillResult {
  if (family.length === 0) return { kind: 'unavailable', reason: 'none-confirmed' };
  const eligible = family.filter(
    (l) => !pinnedContainer || `${l.name} ${l.size}`.toLowerCase().includes(pinnedContainer.toLowerCase()),
  );
  const packs = eligible
    .filter((l) => l.inStock)
    .map((l) => ({ listing: l, q: parsePackSize(l.size) }))
    .filter((p): p is { listing: Listing; q: Quantity } => !!p.q && comparableUnits(p.q.unit, wanted.unit) && p.q.amount > 0);
  if (packs.length === 0) return { kind: 'unavailable', reason: 'out-of-stock' };
  const mixedUnits = packs.some((p) => p.q.unit !== wanted.unit);

  // Unbounded "cover" knapsack over integer amounts: cheapest way to reach >= wanted, <= wanted * MAX_OVERSHOOT.
  const target = Math.round(wanted.amount);
  const limit = Math.round(wanted.amount * MAX_OVERSHOOT);
  const best: (number | undefined)[] = new Array(limit + 1).fill(undefined);
  const via: (number | undefined)[] = new Array(limit + 1).fill(undefined);
  best[0] = 0;
  for (let a = 0; a <= limit; a++) {
    const here = best[a];
    if (here === undefined) continue;
    packs.forEach((p, i) => {
      const next = a + Math.round(p.q.amount);
      if (next > limit) return;
      const cost = here + p.listing.price;
      const current = best[next];
      if (current === undefined || cost < current - 1e-9) {
        best[next] = cost;
        via[next] = i;
      }
    });
  }
  let bestAmount: number | undefined;
  for (let a = target; a <= limit; a++) {
    const cost = best[a];
    if (cost === undefined) continue;
    if (bestAmount === undefined || cost < (best[bestAmount] as number) - 1e-9) bestAmount = a;
  }
  if (bestAmount !== undefined) {
    const counts = new Map<number, number>();
    for (let a = bestAmount; a > 0; ) {
      const i = via[a] as number;
      counts.set(i, (counts.get(i) ?? 0) + 1);
      a -= Math.round(packs[i].q.amount);
    }
    const picks = [...counts].map(([i, count]) => ({ listing: packs[i].listing, count }));
    return { kind: 'filled', packs: picks, amount: bestAmount, cost: best[bestAmount] as number, mixedUnits };
  }

  // Nothing fits sensibly: the single pack closest to the wanted amount (ratio distance), cheapest on ties.
  const closest = packs
    .map((p) => ({ ...p, distance: Math.abs(Math.log(p.q.amount / wanted.amount)) }))
    .sort((x, y) => x.distance - y.distance || x.listing.price - y.listing.price)[0];
  return {
    kind: 'closest',
    packs: [{ listing: closest.listing, count: 1 }],
    amount: closest.q.amount,
    cost: closest.listing.price,
    perKg: (closest.listing.price / closest.q.amount) * 1000,
    mixedUnits,
  };
}
