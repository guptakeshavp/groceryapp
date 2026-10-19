import type { PlatformAdapter } from '../adapters/adapter.ts';
import { AdapterError, type AppId } from '../domain/types.ts';
import type { Store } from '../store/json-store.ts';
import { type Clock, istDay, nextIstMidnight } from './clock.ts';

/** Spec: "Request governor". Numbers from the logins & pace decision. */
export interface Limits {
  pauseMs: Record<AppId, number>;
  maxPerRun: number;
  maxPerDay: number;
  /** Pause before the single retry when the app gave no Retry-After. */
  retryPauseMs: number;
  /** Distinct blocked days within the last 7 that trigger the start-screen prompt. */
  blockedDaysAlert: number;
}

export const DEFAULT_LIMITS: Limits = {
  pauseMs: { blinkit: 4000, bigbasket: 4000, minutes: 4000, zepto: 2000, instamart: 2000 },
  maxPerRun: 40,
  maxPerDay: 150,
  retryPauseMs: 10_000,
  blockedDaysAlert: 3,
};

export interface GovernorState {
  daily: Partial<Record<AppId, { day: string; count: number }>>;
  /** Background checks skip the app until this time. */
  cooldownUntil: Partial<Record<AppId, string>>;
  /** Earliest time any request may go out (from Retry-After). */
  notBefore: Partial<Record<AppId, string>>;
  blockedDays: Partial<Record<AppId, string[]>>;
}

export const emptyGovernorState = (): GovernorState => ({ daily: {}, cooldownUntil: {}, notBefore: {}, blockedDays: {} });

export type Mode = 'basket' | 'background';

const BLOCK_KINDS = new Set(['blocked', 'blank', 'rate-limited']);

export class Governor {
  private readonly clock: Clock;
  private readonly store: Store<GovernorState>;
  private readonly limits: Limits;
  /** Per-app chain so one app only ever has one request in flight. */
  private readonly queues = new Map<AppId, Promise<unknown>>();
  private readonly lastRequestAt = new Map<AppId, number>();

  constructor(clock: Clock, store: Store<GovernorState>, limits: Limits = DEFAULT_LIMITS) {
    this.clock = clock;
    this.store = store;
    this.limits = limits;
  }

  /** A paced, capped view of an adapter for one run (a basket comparison or one background sweep). */
  wrap(adapter: PlatformAdapter, mode: Mode): PlatformAdapter {
    let usedThisRun = 0;
    const call = <T>(fn: () => Promise<T>): Promise<T> =>
      this.enqueue(adapter.app, async () => {
        if (usedThisRun >= this.limits.maxPerRun) throw new AdapterError('daily-limit', 'per-run limit reached');
        usedThisRun++;
        return this.governed(adapter.app, mode, fn);
      });
    return {
      app: adapter.app,
      search: (q) => call(() => adapter.search(q)),
      getListings: (ids, query) => call(() => adapter.getListings(ids, query)),
      authStatus: () => adapter.authStatus(), // local check of stored tokens/session; not a request to the app
    };
  }

  /** Apps that blocked on enough distinct days this week to ask Keshav what to do. */
  persistentlyBlocked(): AppId[] {
    const state = this.store.read();
    const weekAgo = istDay(new Date(this.clock.now().getTime() - 6 * 86_400_000));
    return (Object.keys(state.blockedDays) as AppId[]).filter(
      (app) => (state.blockedDays[app] ?? []).filter((d) => d >= weekAgo).length >= this.limits.blockedDaysAlert,
    );
  }

  isCoolingDown(app: AppId): boolean {
    const until = this.store.read().cooldownUntil[app];
    return !!until && new Date(until) > this.clock.now();
  }

  private enqueue<T>(app: AppId, task: () => Promise<T>): Promise<T> {
    const prev = this.queues.get(app) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(task);
    this.queues.set(app, next);
    return next;
  }

  private async governed<T>(app: AppId, mode: Mode, fn: () => Promise<T>): Promise<T> {
    if (mode === 'background' && this.isCoolingDown(app)) {
      throw new AdapterError('blocked', 'cooling down after a block; background checks resume tomorrow');
    }
    try {
      return await this.attempt(app, fn);
    } catch (e) {
      if (!(e instanceof AdapterError) || !BLOCK_KINDS.has(e.kind)) throw e;
      this.recordBlock(app, e);
      await this.clock.sleep(e.retryAfterSec ? e.retryAfterSec * 1000 : this.limits.retryPauseMs);
      try {
        return await this.attempt(app, fn); // the one gentle retry
      } catch (e2) {
        if (e2 instanceof AdapterError && BLOCK_KINDS.has(e2.kind)) this.recordBlock(app, e2);
        throw e2;
      }
    }
  }

  /** Pause, respect Retry-After, count against the daily cap, then call. */
  private async attempt<T>(app: AppId, fn: () => Promise<T>): Promise<T> {
    const state = this.store.read();
    const now = this.clock.now();
    const today = istDay(now);
    const daily = state.daily[app]?.day === today ? (state.daily[app] as { day: string; count: number }) : { day: today, count: 0 };
    if (daily.count >= this.limits.maxPerDay) throw new AdapterError('daily-limit', 'daily limit reached');

    const last = this.lastRequestAt.get(app);
    const notBefore = state.notBefore[app] ? new Date(state.notBefore[app] as string).getTime() : 0;
    const earliest = Math.max(last === undefined ? 0 : last + this.limits.pauseMs[app], notBefore);
    const wait = earliest - now.getTime();
    if (wait > 0) await this.clock.sleep(wait);

    daily.count++;
    const fresh = this.store.read();
    fresh.daily[app] = daily;
    this.store.write(fresh);
    this.lastRequestAt.set(app, this.clock.now().getTime());
    return fn();
  }

  private recordBlock(app: AppId, e: AdapterError): void {
    const state = this.store.read();
    const now = this.clock.now();
    const day = istDay(now);
    state.blockedDays[app] = [...new Set([...(state.blockedDays[app] ?? []), day])].slice(-14);
    state.cooldownUntil[app] = nextIstMidnight(now).toISOString();
    if (e.retryAfterSec) state.notBefore[app] = new Date(now.getTime() + e.retryAfterSec * 1000).toISOString();
    this.store.write(state);
  }
}
