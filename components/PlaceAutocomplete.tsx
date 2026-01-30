"use client";
import { useEffect, useMemo, useState } from "react";

interface Suggestion {
    placeName: string;
    address: string;
    lat: number;
    lng: number;
    type?: string;
}

interface Props {
    placeholder: string;
    onSelect: (s: Suggestion) => void;
    defaultValue?: string;
}

export default function PlaceAutocomplete({ placeholder, onSelect, defaultValue }: Props) {
    const [query, setQuery] = useState(defaultValue || "");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const [proximity, setProximity] = useState<{ lng: number; lat: number } | null>(null);

    // ✅ Get user location once
    useEffect(() => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setProximity({ lng: pos.coords.longitude, lat: pos.coords.latitude });
            },
            () => {
                // If user blocks location, we still work (just no proximity)
                setProximity(null);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }, []);

    const proximityParam = useMemo(() => {
        if (!proximity) return "";
        return `&proximity=${encodeURIComponent(`${proximity.lng},${proximity.lat}`)}`;
    }, [proximity]);

    useEffect(() => {
        if (query.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/geo/autocomplete?q=${encodeURIComponent(query.trim())}${proximityParam}`
                );
                const data = await res.json();
                setSuggestions(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
                setSuggestions([]);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query, proximityParam]);

    return (
        <div className="relative">
            <input
                type="text"
                className="input-field"
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
            />

            {isOpen && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-72 overflow-auto">
                    {suggestions.map((s, i) => (
                        <li
                            key={`${s.placeName}-${i}`}
                            className="p-3 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => {
                                onSelect(s);
                                setQuery(s.placeName);
                                setIsOpen(false);
                            }}
                        >
                            <p className="font-semibold">{s.placeName}</p>
                            <p className="text-xs text-gray-500">{s.address}</p>
                            {s.type && <p className="text-[10px] text-gray-400 uppercase mt-1">{s.type}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
