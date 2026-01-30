import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

const schema = z.object({
    lat: z.number(),
    lng: z.number(),
});

export async function POST(req: Request) {
    const user = await requireAuth();
    if (user.role !== UserRole.DRIVER) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const driver = await prisma.driver.upsert({
        where: { userId: user.id },
        update: {
            currentLat: parsed.data.lat,
            currentLng: parsed.data.lng,
            lastSeenAt: new Date(),
        },
        create: {
            userId: user.id,
            currentLat: parsed.data.lat,
            currentLng: parsed.data.lng,
            lastSeenAt: new Date(),
        },
    });

    return NextResponse.json(driver);
}
