import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { computeDistanceKm } from '@/lib/geo';
import { DriverStatus, RideType } from '@prisma/client';

export async function GET(req: Request) {
    try {
        await requireAuth();
        const { searchParams } = new URL(req.url);
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');
        const rideType = searchParams.get('rideType') as RideType;
        const radiusKm = parseFloat(searchParams.get('radiusKm') || '5');

        if (isNaN(lat) || isNaN(lng) || !rideType) {
            return NextResponse.json({ error: 'Missing coordinates or rideType' }, { status: 400 });
        }

        const cutoff = new Date(Date.now() - 2 * 60 * 1000);

        const healthyDrivers = await prisma.driver.findMany({
            where: {
                status: DriverStatus.ONLINE,
                lastSeenAt: { gte: cutoff },
                currentLat: { not: null },
                currentLng: { not: null },
                rideTypeCapabilities: { has: rideType },
            },
        });

        const availableDrivers = healthyDrivers
            .map((d) => ({
                id: d.id,
                userId: d.userId,
                lat: d.currentLat!,
                lng: d.currentLng!,
                distanceKm: computeDistanceKm(lat, lng, d.currentLat!, d.currentLng!),
            }))
            .filter((d) => d.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm);

        return NextResponse.json(availableDrivers);
    } catch (e) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
