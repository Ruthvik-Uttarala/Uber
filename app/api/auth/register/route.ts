import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';
import * as bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate request body
        const validatedData = registerSchema.safeParse(body);
        if (!validatedData.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validatedData.error.flatten() },
                { status: 400 }
            );
        }

        const { email, password, fullName, phone } = validatedData.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user and profile in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash: hashedPassword,
                    role: 'RIDER', // Default role
                    profile: {
                        create: {
                            fullName,
                            phone: phone || null,
                        },
                    },
                },
                include: {
                    profile: true,
                },
            });

            return user;
        });

        return NextResponse.json(
            {
                message: 'User registered successfully',
                user: {
                    id: result.id,
                    email: result.email,
                    role: result.role,
                    fullName: result.profile?.fullName
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
