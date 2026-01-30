import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        const user = await requireAuth();

        const rides = await prisma.ride.findMany({
            where: { riderId: user.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(rides);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rides' }, { status: 500 });
    }
}
