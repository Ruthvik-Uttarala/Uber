type RideType = 'UBERX' | 'XL' | 'COMFORT';

const PRICING_TABLE: Record<RideType, { base: number; perKm: number }> = {
    UBERX: { base: 250, perKm: 120 },
    XL: { base: 350, perKm: 170 },
    COMFORT: { base: 300, perKm: 150 },
};

const MIN_FARE_CENTS = 500;

export function estimateFareCents(distanceKm: number, type: RideType): number {
    const cfg = PRICING_TABLE[type];
    const total = cfg.base + distanceKm * cfg.perKm;
    return Math.max(MIN_FARE_CENTS, Math.round(total));
}

export function formatFare(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}
