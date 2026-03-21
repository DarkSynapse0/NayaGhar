// Photon geocoder (Komoot) — fuzzy search, autocomplete-friendly
const PHOTON_URL = "https://photon.komoot.io/api";

// Nominatim — reverse geocoding (coordinates → address)
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

export interface GeocodingResult {
  name: string;
  city?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

/**
 * Forward geocode: search text → locations.
 * Uses Photon for fuzzy/typo-tolerant search.
 * Biased toward Nepal by default.
 */
export async function geocodeSearch(
  query: string,
  limit = 5
): Promise<GeocodingResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    lang: "en",
    lat: "28.3949", // Bias toward Nepal
    lon: "84.1240",
  });

  const res = await fetch(`${PHOTON_URL}?${params}`, {
    headers: { "User-Agent": "NayaGhar/1.0" },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.features.map(
    (f: {
      properties: { name?: string; city?: string; state?: string; country?: string };
      geometry: { coordinates: [number, number] };
    }) => ({
      name: f.properties.name || "",
      city: f.properties.city,
      state: f.properties.state,
      country: f.properties.country,
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
    })
  );
}

/**
 * Reverse geocode: coordinates → address.
 * Uses Nominatim.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodingResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "json",
  });

  const res = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
    headers: { "User-Agent": "NayaGhar/1.0" },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    name: data.display_name || "",
    city:
      data.address?.city || data.address?.town || data.address?.village,
    state: data.address?.state,
    country: data.address?.country,
    latitude: Number(data.lat),
    longitude: Number(data.lon),
  };
}
