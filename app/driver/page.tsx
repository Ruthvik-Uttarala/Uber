'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Driver, DriverStatus, RideType, RideStatus } from '@prisma/client';
import { formatFare } from '@/lib/pricing';

export default function DriverPage() {
    const { data: session, status: sessionStatus } = useSession();
    const [driver, setDriver] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    const [selectedRideTypes, setSelectedRideTypes] = useState<RideType[]>([RideType.UBERX]);
    const [isTracking, setIsTracking] = useState(false);
    const [incomingRides, setIncomingRides] = useState<any[]>([]);
    const [msg, setMsg] = useState('');

    const getMe = useCallback(async () => {
        try {
            const res = await fetch('/api/driver/me');
            if (res.ok) {
                const data = await res.json();
                setDriver(data);
            } else {
                setDriver(null);
            }
        } catch (e) {
            setDriver(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            getMe();
        } else if (sessionStatus === 'unauthenticated') {
            setLoading(false);
        }
    }, [sessionStatus, getMe]);

    // Status toggle
    const toggleStatus = async () => {
        if (!driver) return;
        const newStatus = driver.status === DriverStatus.ONLINE ? DriverStatus.OFFLINE : DriverStatus.ONLINE;
        try {
            const res = await fetch('/api/driver/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                const updated = await res.json();
                setDriver(updated);
                if (newStatus === DriverStatus.OFFLINE) setIsTracking(false);
            }
        } catch (e) {
            console.error(e);
            setMsg('Failed to update status');
        }
    };

    // Location Tracking
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTracking && driver?.status === DriverStatus.ONLINE) {
            const updateLocation = () => {
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        const { latitude, longitude } = pos.coords;
                        await fetch('/api/driver/location', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ lat: latitude, lng: longitude }),
                        });
                    },
                    (err) => console.error('Geolocation error:', err),
                    { enableHighAccuracy: true }
                );
            };

            updateLocation();
            interval = setInterval(updateLocation, 10000); // 10s
        }
        return () => clearInterval(interval);
    }, [isTracking, driver?.status]);

    // Polling incoming rides
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (driver?.status === DriverStatus.ONLINE) {
            const fetchIncoming = async () => {
                const res = await fetch('/api/driver/incoming');
                if (res.ok) {
                    const data = await res.json();
                    setIncomingRides(data);
                }
            };
            fetchIncoming();
            interval = setInterval(fetchIncoming, 5000); // 5s
        } else {
            setIncomingRides([]);
        }
        return () => clearInterval(interval);
    }, [driver?.status]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsRegistering(true);
        setMsg('');
        try {
            const res = await fetch('/api/driver/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideTypes: selectedRideTypes }),
            });
            if (res.ok) {
                getMe();
            } else {
                const data = await res.json();
                setMsg(data.error || 'Registration failed');
            }
        } catch (e) {
            console.error(e);
            setMsg('Network error');
        } finally {
            setIsRegistering(false);
        }
    };

    const acceptRide = async (rideId: string) => {
        try {
            const res = await fetch('/api/driver/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rideId }),
            });
            if (res.ok) {
                setIncomingRides((prev) => prev.filter((r) => r.id !== rideId));
                setMsg('✅ Ride Accepted!');
                setTimeout(() => setMsg(''), 3000);
            } else {
                const data = await res.json();
                setMsg(data.error || 'Failed to accept ride');
            }
        } catch (e) {
            console.error(e);
            setMsg('Failed to connect');
        }
    };

    if (sessionStatus === 'loading' || loading) {
        return <div className="p-20 text-center">Loading Driver Dashboard...</div>;
    }

    if (sessionStatus === 'unauthenticated') {
        return <div className="p-20 text-center">Please login to access this page.</div>;
    }

    if (!driver) {
        return (
            <div className="container mx-auto px-4 py-20 max-w-md">
                <div className="card">
                    <h1 className="text-2xl font-bold mb-4">Become a Driver</h1>
                    <p className="text-gray-600 mb-6">Start earning by providing rides in your area.</p>
                    {msg && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{msg}</div>}
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">Select Ride Types</label>
                            <div className="flex flex-wrap gap-2">
                                {[RideType.UBERX, RideType.XL, RideType.COMFORT].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            if (selectedRideTypes.includes(type)) {
                                                setSelectedRideTypes(selectedRideTypes.filter((t) => t !== type));
                                            } else {
                                                setSelectedRideTypes([...selectedRideTypes, type]);
                                            }
                                        }}
                                        className={`px-3 py-1 rounded-full border text-sm transition-colors ${selectedRideTypes.includes(type) ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isRegistering || selectedRideTypes.length === 0}
                            className="btn-primary w-full"
                        >
                            {isRegistering ? 'Registering...' : 'Register as Driver'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Driver Dashboard</h1>
                    <p className="text-gray-500 text-sm">Driver ID: {driver.id}</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border w-full md:w-auto">
                    <div className="flex-1 md:flex-none">
                        <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                        <p className={`font-bold ${driver.status === DriverStatus.ONLINE ? 'text-green-600' : 'text-gray-400'}`}>
                            {driver.status}
                        </p>
                    </div>
                    <button
                        onClick={toggleStatus}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${driver.status === DriverStatus.ONLINE ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'btn-primary'
                            }`}
                    >
                        Go {driver.status === DriverStatus.ONLINE ? 'Offline' : 'Online'}
                    </button>
                </div>
            </div>

            {msg && (
                <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${msg.includes('✅') ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {msg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {driver.status === DriverStatus.ONLINE && (
                        <div className="card border-primary-200 bg-primary-50/20">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-xl font-bold">Live Tracking</h2>
                                    <p className="text-sm text-gray-500 italic">Simulated via Geolocation API</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{isTracking ? 'Active' : 'Disabled'}</span>
                                    <button
                                        onClick={() => setIsTracking(!isTracking)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${isTracking ? 'bg-primary-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isTracking ? 'left-7' : 'left-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {isTracking ? 'Updating your current coordinates on our servers every 10 seconds. This allows riders to find you.' : 'Enable tracking to be discoverable by nearby riders.'}
                            </p>
                        </div>
                    )}

                    <div className="card min-h-[300px]">
                        <h2 className="text-xl font-bold mb-6">Incoming Ride Requests</h2>
                        {driver.status === DriverStatus.OFFLINE ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="text-4xl mb-4">💤</div>
                                <p className="text-gray-500 font-medium">You are currently offline.</p>
                                <p className="text-sm text-gray-400">Go online to see requests in your area.</p>
                            </div>
                        ) : incomingRides.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="animate-spin text-4xl mb-4 text-primary-600">⌛</div>
                                <p className="text-gray-500 font-medium">Scanning for riders...</p>
                                <p className="text-sm text-gray-400 italic">This dashboard polls every 5 seconds.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {incomingRides.map((ride) => (
                                    <div key={ride.id} className="p-5 border-2 border-primary-100 rounded-xl bg-white shadow-sm hover:border-primary-300 transition-colors">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded uppercase">{ride.rideType}</span>
                                                    <span className="text-xs text-gray-400">{new Date(ride.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="font-bold text-lg">{ride.rider?.profile?.fullName || 'Anonymous Rider'}</p>
                                            </div>
                                            <p className="text-2xl font-black text-gray-900">{formatFare(ride.estimatedFareCents)}</p>
                                        </div>

                                        <div className="space-y-4 mb-8 pt-4 border-t border-gray-50">
                                            <div className="flex items-start gap-3 text-sm">
                                                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" />
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Pickup</p>
                                                    <p className="font-semibold text-gray-800">{ride.pickupAddress}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3 text-sm">
                                                <div className="mt-1 w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]" />
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Dropoff</p>
                                                    <p className="font-semibold text-gray-800">{ride.dropoffAddress}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => acceptRide(ride.id)}
                                            className="btn-primary w-full py-4 text-base font-bold shadow-lg shadow-primary-200 active:scale-95 transition-transform"
                                        >
                                            Accept Ride
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="card">
                        <h3 className="font-bold text-gray-900 mb-4">Your Capabilities</h3>
                        <div className="flex flex-wrap gap-2">
                            {driver.rideTypeCapabilities.map((cap: string) => (
                                <span key={cap} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-black tracking-wider uppercase">
                                    {cap}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="card bg-gray-900 text-white border-none">
                        <h3 className="font-bold mb-4 opacity-80">Shift Summary</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white/10 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rides</p>
                                <p className="text-2xl font-black">0</p>
                            </div>
                            <div className="p-3 bg-white/10 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                                <p className="text-xl font-black text-primary-400">$0.00</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 text-center">
                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Current Session: 0h 0m</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
