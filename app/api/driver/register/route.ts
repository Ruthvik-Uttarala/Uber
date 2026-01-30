import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { DriverStatus, UserRole } from "@prisma/client";

export async function POST() {
    try {
        const user = await requireAuth();

        // Atomic check and creation
        const driver = await prisma.$transaction(async (tx) => {
            // Ensure role is DRIVER
            if (user.role !== UserRole.DRIVER) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { role: UserRole.DRIVER },
                });
            }

            const existing = await tx.driver.findUnique({ where: { userId: user.id } });
            if (existing) return existing;

            return await tx.driver.create({
                data: {
                    userId: user.id,
                    status: DriverStatus.OFFLINE,
                    rideTypeCapabilities: ["UBERX"],
                },
            });
        });

        return NextResponse.json(driver);
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e?.message ?? "Failed to register driver" }, { status: 500 });
    }
}
