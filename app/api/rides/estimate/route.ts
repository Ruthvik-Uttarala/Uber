import { NextResponse } from 'next/server';
import { computeDistanceKm } from '@/lib/geo';
import { estimateFareCents, formatFare } from '@/lib/pricing';

const allowed = new Set(['UBERX', 'XL', 'COMFORT']);

export async function POST(req: Request) {
    try {
        const { pickup, dropoff, rideType } = await req.json();

        if (!pickup || !dropoff || !rideType || !allowed.has(rideType)) {
            return NextResponse.json({ error: 'Missing/invalid parameters' }, { status: 400 });
        }

        const distanceKm = computeDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        const fareCents = estimateFareCents(distanceKm, rideType);

        return NextResponse.json({
            distanceKm,
            fareCents,
            fareFormatted: formatFare(fareCents),
        });
    } catch {
        return NextResponse.json({ error: 'Failed to compute estimate' }, { status: 500 });
    }
}
