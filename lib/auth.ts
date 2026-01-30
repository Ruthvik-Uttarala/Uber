import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password are required');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { profile: true },
                });

                if (!user) {
                    throw new Error('Invalid email or password');
                }

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                if (!isValid) {
                    throw new Error('Invalid email or password');
                }

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.profile?.fullName || user.email,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

// Helper functions
export async function requireAuth() {
    const { getServerSession } = await import('next-auth/next');
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        throw new Error('Unauthorized');
    }

    return session.user as { id: string; email: string; role: UserRole; name: string };
}

export async function requireRole(role: UserRole) {
    const user = await requireAuth();

    if (user.role !== role) {
        throw new Error('Forbidden: Insufficient permissions');
    }

    return user;
}
