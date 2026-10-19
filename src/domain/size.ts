import type { Quantity } from './types.ts';

/**
 * Parse an app's pack text into a total quantity.
 * "4 x 70 g" -> 280 g, "2x420 g - (Multipack)" -> 840 g, "1 L - Tin" -> 1000 ml,
 * "1 ltr" -> 1000 ml, "5 kg" -> 5000 g, "50 pcs - Carton" -> 50 pcs.
 */
export function parsePackSize(text: string): Quantity | undefined {
  const s = text.toLowerCase().replace(/\bltrs?\b/g, 'l');
  const multi = s.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*(kg|g|ml|l)\b/);
  const single = s.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pcs)\b/);
  let count = 1;
  let amount: number;
  let unit: string;
  // "588 g - (28 x 19.9 g)": a stated total before the breakdown wins.
  if (multi && !(single && (single.index as number) < (multi.index as number))) {
    count = Number(multi[1]);
    amount = Number(multi[2]);
    unit = multi[3];
  } else if (single) {
    amount = Number(single[1]);
    unit = single[2];
  } else {
    return undefined;
  }
  amount *= count;
  if (unit === 'kg') return { amount: amount * 1000, unit: 'g' };
  if (unit === 'l') return { amount: amount * 1000, unit: 'ml' };
  return { amount, unit: unit as Quantity['unit'] };
}

/** g and ml are compared directly (flagged by callers); pcs only with pcs. */
export function comparableUnits(a: Quantity['unit'], b: Quantity['unit']): boolean {
  return a === b || (a !== 'pcs' && b !== 'pcs');
}

export function formatQuantity(q: Quantity): string {
  if (q.unit === 'pcs') return `${q.amount} pcs`;
  if (q.amount >= 1000) return `${q.amount / 1000} ${q.unit === 'g' ? 'kg' : 'L'}`;
  return `${q.amount} ${q.unit}`;
}
