import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { RideStatus, UserRole } from '@prisma/client';

export async function GET() {
    const user = await requireAuth();
    if (user.role !== UserRole.DRIVER) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const driver = await prisma.driver.findUnique({
        where: { userId: user.id }
    });

    if (!driver) return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });

    const rides = await prisma.ride.findMany({
        where: {
            status: RideStatus.DRIVER_ASSIGNED,
            assignedDriverId: driver.id,
        },
        include: {
            rider: {
                include: {
                    profile: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    return NextResponse.json(rides);
}
