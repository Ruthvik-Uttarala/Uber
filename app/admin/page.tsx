import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminPage() {
    const user = await requireRole('ADMIN');

    // Minimal data fetch for Phase 1 demo
    const stats = {
        totalUsers: await prisma.user.count(),
        totalDrivers: await prisma.driver.count(),
        totalProfiles: await prisma.userProfile.count(),
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">System Administration</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="card text-center">
                        <p className="text-sm text-gray-500 uppercase font-semibold">Total Users</p>
                        <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-sm text-gray-500 uppercase font-semibold">Active Drivers</p>
                        <p className="text-4xl font-bold mt-2">{stats.totalDrivers}</p>
                    </div>
                    <div className="card text-center">
                        <p className="text-sm text-gray-500 uppercase font-semibold">User Profiles</p>
                        <p className="text-4xl font-bold mt-2">{stats.totalProfiles}</p>
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-xl font-bold mb-6">Recent User Registrations</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-600">User ID</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-600">Role</th>
                                    <th className="py-3 px-4 text-sm font-semibold text-gray-600">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr className="hover:bg-gray-50">
                                    <td className="py-3 px-4 text-sm font-mono text-gray-500">{user.id.substring(0, 8)}...</td>
                                    <td className="py-3 px-4 text-sm font-medium">{user.email} (YOU)</td>
                                    <td className="py-3 px-4">
                                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-500">Just now</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
