'use client';
import { useState, useEffect } from 'react';
import Map from '@/components/Map';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';
import { RideType } from '@prisma/client';

export default function RiderPage() {
    const [pickup, setPickup] = useState<{ address: string; lat: number; lng: number } | null>(null);
    const [dropoff, setDropoff] = useState<{ address: string; lat: number; lng: number } | null>(null);
    const [rideType, setRideType] = useState<RideType>('UBERX');
    const [estimate, setEstimate] = useState<{ fareFormatted: string; distanceKm: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [requested, setRequested] = useState(false);
    const [rideId, setRideId] = useState<string | null>(null);
    const [assignment, setAssignment] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const getEstimate = async () => {
        if (!pickup || !dropoff) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/rides/estimate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pickup, dropoff, rideType }),
            });
            const data = await res.json();
            setEstimate(data);
        } catch (e) {
            console.error(e);
            setError('Failed to get estimate');
        } finally {
            setLoading(false);
        }
    };

    const confirmRide = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/rides/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pickup, dropoff, rideType }),
            });
            const data = await res.json();
            if (res.ok) {
                setRequested(true);
                setRideId(data.id);
                // Automatically try to assign
                assignDriver(data.id);
            } else {
                setError(data.error || 'Failed to request ride');
            }
        } catch (e) {
            console.error(e);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const assignDriver = async (id: string) => {
        try {
            const res = await fetch('/api/rides/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideId: id }),
            });
            const data = await res.json();
            if (res.ok) {
                setAssignment(data);
            } else {
                setError(data.error || 'No drivers available nearby');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to connect to driver matching service');
        }
    };

    if (requested) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <div className="card max-w-md mx-auto py-12">
                    <div className="text-6xl mb-6">{assignment ? '🚙' : '🔍'}</div>
                    <h1 className="text-2xl font-bold mb-2">
                        {assignment ? 'Driver Assigned!' : 'Finding your ride...'}
                    </h1>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
                            {error}
                        </div>
                    )}

                    {assignment ? (
                        <div className="space-y-4 mb-8">
                            <div className="bg-primary-50 p-4 rounded-lg">
                                <p className="text-sm font-bold text-primary-600 uppercase">Driver Found</p>
                                <p className="text-lg font-bold">{assignment.ride.driver.user.profile.fullName}</p>
                                <p className="text-sm text-gray-500">Arriving soon</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 mb-8">
                            <p className="text-gray-600">Matching you with the nearest {rideType} driver...</p>
                            <div className="animate-pulse space-y-4">
                                <div className="h-2 bg-gray-200 rounded"></div>
                                <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        {!assignment && error && (
                            <button
                                onClick={() => assignDriver(rideId!)}
                                className="btn-primary"
                            >
                                Retry Matching
                            </button>
                        )}
                        <button onClick={() => window.location.reload()} className="btn-secondary">
                            Cancel & Start Over
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
            {/* Sidebar Controls */}
            <div className="w-full md:w-[400px] p-6 bg-white shadow-lg z-10 overflow-y-auto">
                <h1 className="text-2xl font-bold mb-6">Where to?</h1>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Pickup</label>
                        <PlaceAutocomplete
                            placeholder="Enter pickup location"
                            onSelect={(s) => {
                                setPickup({ address: s.address, lat: s.lat, lng: s.lng });
                                setEstimate(null);
                            }}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase text-gray-400 mb-1 block">Destination</label>
                        <PlaceAutocomplete
                            placeholder="Where to?"
                            onSelect={(s) => {
                                setDropoff({ address: s.address, lat: s.lat, lng: s.lng });
                                setEstimate(null);
                            }}
                        />
                    </div>
                </div>

                <div className="mb-8">
                    <label className="text-xs font-bold uppercase text-gray-400 mb-3 block">Ride Type</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['UBERX', 'XL', 'COMFORT'].map((type) => (
                            <button
                                key={type}
                                onClick={() => { setRideType(type as RideType); setEstimate(null); }}
                                className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${rideType === type
                                        ? 'border-primary-600 bg-primary-50 text-primary-600'
                                        : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {estimate && (
                    <div className="card bg-gray-50 border-none shadow-none mb-6 p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500">Estimated Fare</p>
                                <p className="text-2xl font-bold text-gray-900">{estimate.fareFormatted}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Distance</p>
                                <p className="font-semibold">{estimate.distanceKm} km</p>
                            </div>
                        </div>
                    </div>
                )}

                {!estimate ? (
                    <button
                        disabled={!pickup || !dropoff || loading}
                        onClick={getEstimate}
                        className="btn-primary w-full disabled:opacity-50"
                    >
                        {loading ? 'Thinking...' : 'Get Estimate'}
                    </button>
                ) : (
                    <button
                        disabled={loading}
                        onClick={confirmRide}
                        className="btn-primary w-full shadow-lg shadow-primary-200"
                    >
                        {loading ? 'Requesting...' : `Confirm ${rideType}`}
                    </button>
                )}
            </div>

            {/* Map Content */}
            <div className="flex-1 relative bg-gray-100">
                <Map pickup={pickup || undefined} dropoff={dropoff || undefined} />
            </div>
        </div>
    );
}
