import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
    try {
        const user = await requireAuth();

        const driver = await prisma.driver.findUnique({
            where: { userId: user.id },
        });

        if (!driver) {
            return NextResponse.json({ error: 'Not a driver' }, { status: 404 });
        }

        return NextResponse.json(driver);
    } catch (error) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
