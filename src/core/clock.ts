export interface Clock {
  now(): Date;
  sleep(ms: number): Promise<void>;
}

export const systemClock: Clock = {
  now: () => new Date(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
};

/** For tests: sleeping advances time instantly. */
export class FakeClock implements Clock {
  private t: number;
  readonly sleeps: number[] = [];
  constructor(start: Date) {
    this.t = start.getTime();
  }
  now(): Date {
    return new Date(this.t);
  }
  async sleep(ms: number): Promise<void> {
    this.sleeps.push(ms);
    this.t += ms;
  }
  advance(ms: number): void {
    this.t += ms;
  }
}

const IST = 'Asia/Kolkata';

/** Calendar day in Ahmedabad, e.g. "2026-10-19". */
export function istDay(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: IST });
}

/** The next midnight in Ahmedabad (IST is UTC+5:30, no DST). */
export function nextIstMidnight(d: Date): Date {
  const offsetMs = 330 * 60_000;
  const local = new Date(d.getTime() + offsetMs);
  const midnightLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1);
  return new Date(midnightLocal - offsetMs);
}
