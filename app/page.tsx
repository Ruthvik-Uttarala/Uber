import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function Home() {
    const session = await getServerSession(authOptions);

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                    Welcome to Uber Clone
                </h1>

                {!session ? (
                    <div className="space-y-8">
                        <p className="text-xl text-gray-600 mb-8">
                            Your reliable ride-sharing platform. Get started by creating an account or logging in.
                        </p>

                        <div className="flex gap-4 justify-center">
                            <Link href="/auth/register" className="btn-primary">
                                Get Started
                            </Link>
                            <Link href="/auth/login" className="btn-secondary">
                                Sign In
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
                            <div className="card">
                                <div className="text-4xl mb-4">🚗</div>
                                <h3 className="text-xl font-semibold mb-2">Request Rides</h3>
                                <p className="text-gray-600">Book a ride in seconds and get to your destination safely</p>
                            </div>

                            <div className="card">
                                <div className="text-4xl mb-4">💰</div>
                                <h3 className="text-xl font-semibold mb-2">Drive & Earn</h3>
                                <p className="text-gray-600">Become a driver and earn money on your schedule</p>
                            </div>

                            <div className="card">
                                <div className="text-4xl mb-4">⚡</div>
                                <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
                                <p className="text-gray-600">Real-time tracking and reliable service 24/7</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="card inline-block">
                            <h2 className="text-2xl font-semibold mb-4">
                                Welcome back, {(session.user as any).name}!
                            </h2>
                            <div className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                                Role: {(session.user as any).role}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            {((session.user as any).role === 'RIDER' || (session.user as any).role === 'ADMIN') && (
                                <Link href="/rider" className="card hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="text-4xl mb-4">🚗</div>
                                    <h3 className="text-xl font-semibold mb-2">Rider Dashboard</h3>
                                    <p className="text-gray-600">Request and manage your rides</p>
                                </Link>
                            )}

                            {((session.user as any).role === 'DRIVER' || (session.user as any).role === 'ADMIN') && (
                                <Link href="/driver" className="card hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="text-4xl mb-4">🚙</div>
                                    <h3 className="text-xl font-semibold mb-2">Driver Dashboard</h3>
                                    <p className="text-gray-600">View and accept ride requests</p>
                                </Link>
                            )}

                            {(session.user as any).role === 'ADMIN' && (
                                <Link href="/admin" className="card hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="text-4xl mb-4">⚙️</div>
                                    <h3 className="text-xl font-semibold mb-2">Admin Panel</h3>
                                    <p className="text-gray-600">Manage users and system settings</p>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
