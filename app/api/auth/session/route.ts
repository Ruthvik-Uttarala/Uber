import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { authenticated: false },
                { status: 200 }
            );
        }

        const { user } = session;

        return NextResponse.json(
            {
                authenticated: true,
                user: {
                    id: (user as any).id,
                    email: user.email,
                    role: (user as any).role,
                    name: user.name,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Session API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
