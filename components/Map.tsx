'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Point = { lat: number; lng: number };

export default function Map({ pickup, dropoff }: { pickup?: Point; dropoff?: Point }) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const pickupMarkerRef = useRef<mapboxgl.Marker | null>(null);
    const dropoffMarkerRef = useRef<mapboxgl.Marker | null>(null);

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // init map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        if (!token) return;

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-77.8600, 40.7934], // default: State College-ish
            zoom: 12,
        });

        mapRef.current = map;

        return () => {
            pickupMarkerRef.current?.remove();
            dropoffMarkerRef.current?.remove();
            map.remove();
            mapRef.current = null;
        };
    }, [token]);

    // update markers/bounds
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        if (pickup) {
            pickupMarkerRef.current?.remove();
            pickupMarkerRef.current = new mapboxgl.Marker({ color: '#2563eb' })
                .setLngLat([pickup.lng, pickup.lat])
                .addTo(map);
        }

        if (dropoff) {
            dropoffMarkerRef.current?.remove();
            dropoffMarkerRef.current = new mapboxgl.Marker({ color: '#ef4444' })
                .setLngLat([dropoff.lng, dropoff.lat])
                .addTo(map);
        }

        if (pickup && dropoff) {
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend([pickup.lng, pickup.lat]);
            bounds.extend([dropoff.lng, dropoff.lat]);
            map.fitBounds(bounds, { padding: 60, maxZoom: 15 });
        } else if (pickup) {
            map.flyTo({ center: [pickup.lng, pickup.lat], zoom: 14 });
        }
    }, [pickup, dropoff]);

    if (!token) {
        return (
            <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-lg border">
                <p className="text-gray-500 font-medium">
                    Mapbox token missing. Add NEXT_PUBLIC_MAPBOX_TOKEN in .env then restart.
                </p>
            </div>
        );
    }

    return <div ref={mapContainerRef} className="h-full w-full rounded-lg overflow-hidden" />;
}
