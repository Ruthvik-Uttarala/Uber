import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeDistanceKm } from '@/lib/geo';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { DriverStatus, RideStatus, UserRole } from '@prisma/client';

const schema = z.object({
    rideId: z.string(),
});

export async function POST(req: Request) {
    const user = await requireAuth();
    // Allow admin or the rider themselves to trigger assignment 
    // In Phase 3, we allow the request to be triggered to find a match.
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.RIDER) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const ride = await prisma.ride.findUnique({ where: { id: parsed.data.rideId } });
    if (!ride) return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    if (ride.assignedDriverId) return NextResponse.json({ error: 'Ride already assigned' }, { status: 409 });

    const cutoff = new Date(Date.now() - 2 * 60 * 1000);

    const drivers = await prisma.driver.findMany({
        where: {
            status: DriverStatus.ONLINE,
            lastSeenAt: { gte: cutoff },
            currentLat: { not: null },
            currentLng: { not: null },
            rideTypeCapabilities: { has: ride.rideType },
        },
        select: { id: true, currentLat: true, currentLng: true },
    });

    if (drivers.length === 0) {
        return NextResponse.json({ error: 'No available drivers' }, { status: 409 });
    }

    let bestDist = Number.POSITIVE_INFINITY;
    let best = drivers[0];

    for (const d of drivers) {
        const dist = computeDistanceKm(ride.pickupLat, ride.pickupLng, d.currentLat!, d.currentLng!);
        if (dist < bestDist) {
            bestDist = dist;
            best = d;
        }
    }

    const updated = await prisma.ride.update({
        where: { id: ride.id },
        data: {
            status: RideStatus.DRIVER_ASSIGNED,
            assignedDriverId: best.id,
            assignedAt: new Date()
        },
        include: {
            driver: {
                include: {
                    user: {
                        include: {
                            profile: true
                        }
                    }
                }
            }
        }
    });

    return NextResponse.json({ ride: updated, assignedDriverId: best.id, distanceKm: bestDist });
}
