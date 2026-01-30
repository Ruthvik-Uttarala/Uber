import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { computeDistanceKm } from '@/lib/geo';
import { estimateFareCents } from '@/lib/pricing';
import { z } from 'zod';
import { RideType } from '@prisma/client';

const requestSchema = z.object({
    pickup: z.object({ address: z.string(), lat: z.number(), lng: z.number() }),
    dropoff: z.object({ address: z.string(), lat: z.number(), lng: z.number() }),
    rideType: z.enum(['UBERX', 'XL', 'COMFORT']),
});

export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        const body = await req.json();
        const valid = requestSchema.safeParse(body);

        if (!valid.success) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
        }

        const { pickup, dropoff, rideType } = valid.data;

        // Server-side recalculation for security
        const distanceKm = computeDistanceKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
        const fareCents = estimateFareCents(distanceKm, rideType as RideType);

        const ride = await prisma.ride.create({
            data: {
                riderId: user.id,
                rideType: rideType as RideType,
                pickupAddress: pickup.address,
                pickupLat: pickup.lat,
                pickupLng: pickup.lng,
                dropoffAddress: dropoff.address,
                dropoffLat: dropoff.lat,
                dropoffLng: dropoff.lng,
                distanceKm,
                estimatedFareCents: fareCents,
            },
        });

        return NextResponse.json(ride);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create ride request' }, { status: 500 });
    }
}
