import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { DriverStatus, UserRole } from '@prisma/client';

const schema = z.object({
    status: z.enum(['ONLINE', 'OFFLINE']),
});

export async function PUT(req: Request) {
    const user = await requireAuth();
    if (user.role !== UserRole.DRIVER) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const status = parsed.data.status === 'ONLINE' ? DriverStatus.ONLINE : DriverStatus.OFFLINE;

    const driver = await prisma.driver.upsert({
        where: { userId: user.id },
        update: {
            status,
            lastSeenAt: status === DriverStatus.ONLINE ? new Date() : undefined
        },
        create: {
            userId: user.id,
            status,
            lastSeenAt: status === DriverStatus.ONLINE ? new Date() : undefined
        },
    });

    return NextResponse.json(driver);
}
