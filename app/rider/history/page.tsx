'use client';
import { useEffect, useState } from 'react';
import { formatFare } from '@/lib/pricing';

export default function RideHistoryPage() {
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/rides/mine')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setRides(data);
                } else {
                    console.error('Expected array from /api/rides/mine', data);
                }
                setLoading(false);
            });
    }, []);

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Your Trips</h1>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg"></div>)}
                </div>
            ) : rides.length === 0 ? (
                <div className="card text-center py-12">
                    <p className="text-gray-500">You haven't requested any rides yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rides.map(ride => (
                        <div key={ride.id} className="card hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold uppercase py-1 px-2 bg-primary-100 text-primary-700 rounded mr-2">
                                        {ride.rideType}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500">
                                        {new Date(ride.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="font-bold text-lg">{formatFare(ride.estimatedFareCents)}</p>
                            </div>

                            <div className="space-y-3 relative pl-6">
                                <div className="absolute left-1.5 top-2 bottom-6 w-0.5 bg-gray-200"></div>
                                <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-primary-600 bg-white"></div>
                                <div className="absolute left-0 bottom-5 w-3.5 h-3.5 rounded-full border-2 border-red-500 bg-white"></div>

                                <div>
                                    <p className="text-xs text-gray-400">Pickup</p>
                                    <p className="text-sm font-medium truncate">{ride.pickupAddress}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Destination</p>
                                    <p className="text-sm font-medium truncate">{ride.dropoffAddress}</p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t flex justify-between text-xs text-gray-400">
                                <span>Distance: {ride.distanceKm} km</span>
                                <span className="font-bold uppercase text-primary-500">{ride.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
