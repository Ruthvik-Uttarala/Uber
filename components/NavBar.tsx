'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

type SessionUser = {
    name?: string | null;
    email?: string | null;
    role?: 'RIDER' | 'DRIVER' | 'ADMIN';
};

export default function NavBar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();

    const user = (session?.user ?? null) as SessionUser | null;
    const isAdmin = user?.role === 'ADMIN';

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Rider', href: '/rider', protected: true },
        { name: 'Driver', href: '/driver', protected: true },
        { name: 'Admin', href: '/admin', protected: true, adminOnly: true },
    ];

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-2xl font-bold text-primary-600">
                            UberClone
                        </Link>

                        <div className="hidden md:flex gap-6">
                            {navLinks.map((link) => {
                                if (link.protected && !session) return null;
                                if (link.adminOnly && !isAdmin) return null;

                                const isActive = pathname === link.href;

                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`text-sm font-medium transition-colors hover:text-primary-600 ${isActive ? 'text-primary-600' : 'text-gray-600'
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {status === 'loading' ? (
                            <div className="h-8 w-20 bg-gray-100 animate-pulse rounded" />
                        ) : session ? (
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user?.name ?? 'Guest'}
                                    </p>
                                    <p className="text-xs text-gray-500 uppercase">
                                        {user?.role ?? 'VISITOR'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="btn-secondary text-sm !py-1.5 !px-3"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/auth/login"
                                    className="text-sm font-medium text-gray-600 hover:text-primary-600 px-3 py-1.5"
                                >
                                    Login
                                </Link>
                                <Link href="/auth/register" className="btn-primary text-sm !py-1.5 !px-3">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
