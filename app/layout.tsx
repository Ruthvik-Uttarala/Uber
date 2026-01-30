import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/NavBar';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Uber Clone - Phase 1',
    description: 'Ride-sharing application built with Next.js 14',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <NavBar />
                    <main className="min-h-screen">
                        {children}
                    </main>
                </AuthProvider>
            </body>
        </html>
    );
}
