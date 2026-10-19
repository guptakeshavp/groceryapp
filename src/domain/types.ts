// Domain vocabulary — see spec "Domain terms".

export type AppId = 'zepto' | 'instamart' | 'blinkit' | 'bigbasket' | 'minutes';

export const APP_NAMES: Record<AppId, string> = {
  zepto: 'Zepto',
  instamart: 'Instamart',
  blinkit: 'Blinkit',
  bigbasket: 'BigBasket',
  minutes: 'Flipkart Minutes',
};

/** One product as a given app sells it at the home store. */
export interface Listing {
  app: AppId;
  listingId: string;
  name: string;
  brand?: string;
  /** Pack as the app writes it, e.g. "1 L - Pouch", "4 x 70 g". */
  size: string;
  price: number;
  mrp?: number;
  inStock: boolean;
}

export type Unit = 'g' | 'ml' | 'pcs';

export interface Quantity {
  amount: number;
  unit: Unit;
}

/** A household product mapped to its confirmed listings on each app. */
export interface Item {
  id: string;
  name: string;
  anyBrand: boolean;
  /** e.g. "tin" — when set, only listings whose pack mentions it count. */
  pinnedContainer?: string;
  staple: boolean;
  /** Confirmed listing family per app: the same product in each pack size/container Keshav accepted. */
  listings: Partial<Record<AppId, string[]>>;
}

export interface BasketLine {
  itemId: string;
  quantity: Quantity;
}

export type AuthStatus =
  | { state: 'ok'; expiresAt?: Date }
  | { state: 'expired' };

export type FailureKind = 'login-expired' | 'blocked' | 'blank' | 'rate-limited' | 'daily-limit' | 'error';

export class AdapterError extends Error {
  readonly kind: FailureKind;
  readonly retryAfterSec?: number;
  constructor(kind: FailureKind, message: string, retryAfterSec?: number) {
    super(message);
    this.kind = kind;
    this.retryAfterSec = retryAfterSec;
  }
}
