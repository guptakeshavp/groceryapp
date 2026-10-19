import type { Item, Quantity } from '../domain/types.ts';

export interface ParsedLine {
  text: string;
  itemId?: string;
  quantity?: Quantity;
}

/** Turns a pasted family message into known Items + quantities (spec: "Entering a basket"). */
export interface ListParser {
  parse(text: string, items: Item[]): Promise<ParsedLine[]>;
}

const ALIASES: Record<string, string> = {
  pyaaz: 'onion', pyaz: 'onion', kanda: 'onion', dungdi: 'onion', aata: 'atta', makhan: 'butter', makkhan: 'butter',
  surf: 'surf', detergent: 'surf', maggie: 'maggi', litre: 'l', liter: 'l', ltr: 'l', gm: 'g', gms: 'g', gram: 'g', grams: 'g', kilo: 'kg',
};
const FILLER = new Set(['bhai', 'order', 'kar', 'de', 'do', 'please', 'pls', 'and', 'aur', 'wala', 'wali', 'packet', 'pkt', 'pack', 'ka', 'ki', 'ke', 'ek', 'one', 'x']);

/**
 * Rule-based fallback: matches lines to Items by shared words (brand or product word) and reads quantities.
 * The Claude-backed parser replaces this for free-form Hinglish; this keeps the tool usable without it.
 */
export class RuleListParser implements ListParser {
  async parse(text: string, items: Item[]): Promise<ParsedLine[]> {
    return text
      .split(/\r?\n|,/)
      .map((l) => l.trim())
      .filter((l) => l && !/:$/.test(l)) // "Bhai, order kar de:" style headers
      .map((line): ParsedLine | undefined => {
        const words = normalise(line);
        const quantity = readQuantity(line);
        let best: { item: Item; score: number } | undefined;
        for (const item of items) {
          const itemWords = new Set(normalise(item.name));
          const score = words.filter((w) => itemWords.has(w)).length;
          if (score > 0 && (!best || score > best.score)) best = { item, score };
        }
        if (!best) return words.length ? { text: line, quantity } : undefined;
        return { text: line, itemId: best.item.id, quantity: quantity ?? best.item.usualQuantity };
      })
      .filter((x): x is ParsedLine => !!x);
  }
}

function normalise(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .split(/[^a-z]+/)
    .map((w) => ALIASES[w] ?? w)
    .filter((w) => w.length > 1 && !FILLER.has(w) && !['kg', 'g', 'ml', 'l', 'pcs'].includes(w));
}

function readQuantity(line: string): Quantity | undefined {
  const m = line.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(kg|kilo|gms?|grams?|g|ltrs?|litres?|liters?|l|ml|pcs)\b/);
  if (!m) return undefined;
  const n = Number(m[1]);
  const u = ALIASES[m[2]] ?? m[2].replace(/s$/, '');
  if (u === 'kg') return { amount: n * 1000, unit: 'g' };
  if (u === 'l') return { amount: n * 1000, unit: 'ml' };
  if (u === 'g' || u === 'ml' || u === 'pcs') return { amount: n, unit: u };
  return undefined;
}
