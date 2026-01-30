import { NextResponse } from "next/server";

function parseLngLat(proximity?: string | null) {
    if (!proximity) return null;
    const [lngStr, latStr] = proximity.split(",");
    const lng = Number(lngStr);
    const lat = Number(latStr);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return { lng, lat };
}

function bboxAround(lng: number, lat: number, delta = 0.35) {
    return `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim();
    const proximityStr = searchParams.get("proximity");

    const token =
        process.env.MAPBOX_SECRET_TOKEN ||
        process.env.MAPBOX_TOKEN ||
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!q) return NextResponse.json([]);
    if (!token) return NextResponse.json({ error: "Mapbox token missing" }, { status: 500 });

    const prox = parseLngLat(proximityStr);

    const base = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`;

    const params = new URLSearchParams();
    params.set("access_token", token);
    params.set("autocomplete", "true");
    params.set("limit", "15");
    params.set("country", "us");
    params.set("language", "en");

    // ✅ Force POIs / businesses first
    // IMPORTANT: do NOT omit poi
    params.set("types", "poi,address,place,postcode,neighborhood");

    // ✅ Bias results to proximity, and keep them local
    if (prox) {
        params.set("proximity", `${prox.lng},${prox.lat}`);
        params.set("bbox", bboxAround(prox.lng, prox.lat, 0.35));
    }

    // ✅ Encourage matching full business names
    params.set("fuzzyMatch", "true");

    try {
        const url = `${base}?${params.toString()}`;
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();

        const features = Array.isArray(data?.features) ? data.features : [];

        // ✅ Sort: POIs first, then addresses
        const sorted = features.sort((a: any, b: any) => {
            const aPoi = a?.place_type?.includes("poi") ? 1 : 0;
            const bPoi = b?.place_type?.includes("poi") ? 1 : 0;
            if (aPoi !== bPoi) return bPoi - aPoi;

            // If both same type, prefer higher relevance score
            const aScore = typeof a?.relevance === "number" ? a.relevance : 0;
            const bScore = typeof b?.relevance === "number" ? b.relevance : 0;
            return bScore - aScore;
        });

        const suggestions = sorted
            .map((f: any) => ({
                placeName: f.text || f.place_name,
                address: f.place_name || f.text,
                lat: f.center?.[1],
                lng: f.center?.[0],
                type: f.place_type?.[0] ?? "unknown",
            }))
            .filter((s: any) => Number.isFinite(s.lat) && Number.isFinite(s.lng));

        return NextResponse.json(suggestions);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
    }
}
