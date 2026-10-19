import type { AppId, Bill, FeeLine } from '../domain/types.ts';

export interface RememberedFees {
  fees: FeeLine[];
  seenAt: Date;
}

/** The fee lines from each app's last real bill (spec: "Basket pricer and fee memory"). */
export interface FeeMemory {
  get(app: AppId): RememberedFees | undefined;
  record(app: AppId, bill: Bill, seenAt: Date): void;
}

export class InMemoryFeeMemory implements FeeMemory {
  private readonly byApp = new Map<AppId, RememberedFees>();
  get(app: AppId): RememberedFees | undefined {
    return this.byApp.get(app);
  }
  record(app: AppId, bill: Bill, seenAt: Date): void {
    this.byApp.set(app, { fees: bill.fees.map((f) => ({ ...f })), seenAt });
  }
}
