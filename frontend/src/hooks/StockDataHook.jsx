// Simple client for your market_data GET
const BASE_URL = "http://localhost:5000";

export async function getPrices({ symbol, timeframe = "1d", start, end }) {
    const params = new URLSearchParams({ symbol, timeframe });
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const res = await fetch(`${BASE_URL}/api/market_data?${params.toString()}`);

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to fetch prices (${res.status}) ${text}`);
    }

    const json = await res.json();

    if (!json?.success) {
        throw new Error(json?.message || "Backend returned an error");
    }

    // Backend shape: { success, data: { prices: [...] } }
    return json.data;
}