import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { RideStatus, UserRole } from '@prisma/client';

const schema = z.object({
    rideId: z.string(),
});

export async function POST(req: Request) {
    const user = await requireAuth();
    if (user.role !== UserRole.DRIVER) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
    if (!driver) return NextResponse.json({ error: 'Driver not registered' }, { status: 400 });

    // Atomic: only accept if it's assigned to THIS driver and still in DRIVER_ASSIGNED status
    const result = await prisma.ride.updateMany({
        where: {
            id: parsed.data.rideId,
            status: RideStatus.DRIVER_ASSIGNED,
            assignedDriverId: driver.id,
        },
        data: {
            status: RideStatus.ACCEPTED,
            acceptedAt: new Date(),
        },
    });

    if (result.count === 0) {
        return NextResponse.json({ error: 'Ride no longer available or not assigned to you' }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
}
