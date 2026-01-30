const { PrismaClient, RideType, UserRole, DriverStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 12);

    // 1. Create Admin
    const adminEmail = 'admin@example.com';
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: hashedPassword,
            role: UserRole.ADMIN,
            profile: {
                create: {
                    fullName: 'Admin User',
                    phone: '+1000000000',
                },
            },
        },
    });
    console.log('✅ Admin user created');

    // 2. Create Ride User
    const riderEmail = 'rider@example.com';
    await prisma.user.upsert({
        where: { email: riderEmail },
        update: {},
        create: {
            email: riderEmail,
            passwordHash: hashedPassword,
            role: UserRole.RIDER,
            profile: {
                create: {
                    fullName: 'John Rider',
                    phone: '+1234567890',
                },
            },
        },
    });
    console.log('✅ Rider user created');

    // 3. Create Drivers
    const drivers = [
        {
            email: 'driver1@example.com',
            fullName: 'David UberX',
            status: DriverStatus.ONLINE,
            lat: 40.785091,
            lng: -73.968285,
            capabilities: [RideType.UBERX, RideType.XL],
        },
        {
            email: 'driver2@example.com',
            fullName: 'Sarah Comfort',
            status: DriverStatus.ONLINE,
            lat: 40.758896,
            lng: -73.985130,
            capabilities: [RideType.UBERX, RideType.COMFORT],
        },
        {
            email: 'driver3@example.com',
            fullName: 'Offline Driver',
            status: DriverStatus.OFFLINE,
            lat: null,
            lng: null,
            capabilities: [RideType.UBERX],
        },
    ];

    for (const d of drivers) {
        await prisma.user.upsert({
            where: { email: d.email },
            update: {
                role: UserRole.DRIVER
            },
            create: {
                email: d.email,
                passwordHash: hashedPassword,
                role: UserRole.DRIVER,
                profile: {
                    create: {
                        fullName: d.fullName,
                        phone: '+1999999999',
                    },
                },
                driver: {
                    create: {
                        status: d.status,
                        currentLat: d.lat,
                        currentLng: d.lng,
                        rideTypeCapabilities: d.capabilities,
                        lastSeenAt: d.status === DriverStatus.ONLINE ? new Date() : null,
                    },
                },
            },
        });
    }
    console.log('✅ Driver users created');

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
