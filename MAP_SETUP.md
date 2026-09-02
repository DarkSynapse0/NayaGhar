# Map Setup Guide — MapLibre + OpenFreeMap

A portable, keyless, low-bandwidth map layer for a Next.js (App Router) + React app.
This is the **display/config layer only** — it renders whatever your app already
computes (live tracking, routing, navigation). Versions below are known-good on
**Next 16 / React 19**.

---

## 1. Install

```bash
npm install maplibre-gl@^5.20.2 react-map-gl@^8.1.0 supercluster@^8.0.1 use-supercluster@^1.2.0
npm install -D @types/supercluster@^7.1.3
```

- **`maplibre-gl`** — the GL renderer.
- **`react-map-gl`** — React wrapper. ⚠️ Import from the **`react-map-gl/maplibre`**
  subpath, never the bare root (root = Mapbox, needs a token).
- **`supercluster` / `use-supercluster`** — only if you cluster many static markers.
  For ride-share you usually don't (you want each car visible). Skip otherwise.

---

## 2. Base map component (the core config)

Two non-negotiables:

- **Style URL is keyless:** `https://tiles.openfreemap.org/styles/positron`
  No token, account, or billing. Alternatives: `liberty` (full color), `bright`,
  `dark`. Use `positron` (minimal/light) so route lines and markers pop.
- Must be a **client component** (`"use client"`) and you must import the CSS once:
  `import "maplibre-gl/dist/maplibre-gl.css";`

```tsx
"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import Map, {
  NavigationControl,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// Keyless, free tiles. positron = clean base under route lines.
const MAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

export interface BaseMapHandle {
  /** Underlying MapLibre map — call easeTo/flyTo/fitBounds on it. */
  getMap: () => maplibregl.Map | undefined;
}

interface BaseMapProps {
  initialCenter?: { lat: number; lng: number; zoom?: number };
  onBoundsChange?: (b: {
    minLat: number; maxLat: number; minLng: number; maxLng: number;
  }) => void;
  children?: React.ReactNode; // markers, route sources/layers, etc.
}

export const BaseMap = forwardRef<BaseMapHandle, BaseMapProps>(function BaseMap(
  { initialCenter, onBoundsChange, children },
  ref
) {
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    latitude: initialCenter?.lat ?? 27.7172,   // <- your city default
    longitude: initialCenter?.lng ?? 85.3240,
    zoom: initialCenter?.zoom ?? 12,
  });

  // Expose the raw MapLibre instance to parent (tracking loop, follow-driver).
  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current?.getMap(),
  }), []);

  const handleMoveEnd = useCallback((evt: ViewStateChangeEvent) => {
    setViewState(evt.viewState);
    if (onBoundsChange && mapRef.current) {
      const b = mapRef.current.getMap().getBounds();
      onBoundsChange({
        minLat: b.getSouth(), maxLat: b.getNorth(),
        minLng: b.getWest(),  maxLng: b.getEast(),
      });
    }
  }, [onBoundsChange]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(e) => setViewState(e.viewState)}
        onMoveEnd={handleMoveEnd}
        onLoad={(e) => e.target.resize()}   // ⚠️ critical mobile fix (see gotchas)
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-left" />
        {children}
      </Map>
    </div>
  );
});
```

Render it inside a parent that has a **real height**:

```tsx
<div className="h-screen w-full">
  <BaseMap ref={mapRef} initialCenter={{ lat, lng, zoom: 13 }}>
    {/* markers + route layers go here */}
  </BaseMap>
</div>
```

If you hit `window is not defined` / hydration errors, load it client-only:

```tsx
import dynamic from "next/dynamic";
const BaseMap = dynamic(() => import("./BaseMap").then((m) => m.BaseMap), { ssr: false });
```

---

## 3. Markers (driver, pickup, dropoff, rider)

A `Marker` is an HTML element pinned to a coordinate — style it freely.

```tsx
import { Marker } from "react-map-gl/maplibre";

// Driver car, rotated to heading
<Marker longitude={driver.lng} latitude={driver.lat} anchor="center">
  <div style={{ transform: `rotate(${driver.heading}deg)` }} className="text-2xl">🚗</div>
</Marker>

// Pickup / dropoff pins
<Marker longitude={pickup.lng} latitude={pickup.lat} anchor="bottom">
  <PinIcon className="text-green-600" />
</Marker>
```

**Live tracking:** drive the `longitude`/`latitude` props from your WebSocket state;
react-map-gl repositions on re-render. Markers *snap* between updates. For smooth
glide, lerp the coordinate values on `requestAnimationFrame` between server pushes:

```tsx
// pseudo: interpolate from prev -> next over ~1s between ticks
const t = Math.min(1, elapsed / interval);
const lng = prev.lng + (next.lng - prev.lng) * t;
const lat = prev.lat + (next.lat - prev.lat) * t;
```

---

## 4. Route line

Your routing engine (OSRM / Valhalla / Mapbox Directions / GraphHopper) returns a
GeoJSON `LineString`. Render it with `Source` + `Layer` as children of the map:

```tsx
import { Source, Layer } from "react-map-gl/maplibre";

// routeGeoJSON = { type: "Feature", geometry: { type: "LineString", coordinates: [[lng,lat],...] } }
<Source id="route" type="geojson" data={routeGeoJSON}>
  {/* casing underneath for contrast */}
  <Layer id="route-casing" type="line"
    layout={{ "line-join": "round", "line-cap": "round" }}
    paint={{ "line-color": "#0b5138", "line-width": 8 }} />
  <Layer id="route-line" type="line"
    layout={{ "line-join": "round", "line-cap": "round" }}
    paint={{ "line-color": "#16a34a", "line-width": 5 }} />
</Source>
```

Update `routeGeoJSON` state as the trip re-routes; the layer redraws automatically.

---

## 5. Camera control (follow-driver, fit-to-trip)

Grab the raw MapLibre instance and drive it from your tracking loop:

```tsx
const map = mapRef.current?.getMap();
if (!map) return;

// Follow the driver smoothly
map.easeTo({ center: [driver.lng, driver.lat], zoom: 15, duration: 500 });

// Fit pickup + dropoff in view at trip start
map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 600 });

// Snappy jump
map.flyTo({ center: [lng, lat], zoom: 16 });
```

For a "chase cam" during navigation, add `bearing` (to heading) and `pitch: 60` to
`easeTo` for a tilted forward-facing view.

---

## 6. Gotchas (each of these cost real time)

1. **Blank map on mobile** — mobile browsers size the container *after* the map
   inits, leaving a 0-size canvas. `onLoad={(e) => e.target.resize()}` fixes it. Keep it.
2. **Import subpath** — `react-map-gl/maplibre`, never bare `react-map-gl`.
3. **Parent needs explicit height** — map fills its parent; no sized parent = invisible map.
4. **Client component only** — MapLibre touches `window`. Use `"use client"` and, if
   SSR still bites, `next/dynamic` with `{ ssr: false }`.
5. **Don't cluster moving markers** — clustering is for many *static* points. Skip
   `supercluster` for live cars.
6. **OpenFreeMap is community-run** — free, no SLA. Great for MVP/demo. For production
   scale the same code works against any MapLibre style JSON — just swap `MAP_STYLE`
   for MapTiler / Protomaps / self-hosted tiles.

---

## What this gives you vs. what stays yours

| Layer | This guide | Your existing code |
|---|---|---|
| Renderer, tiles, camera, markers, route rendering | ✅ | |
| Live tracking feed, routing engine, turn-by-turn nav | | ✅ |

Wiring: feed driver coords into `<Marker>` props, route GeoJSON into `<Source>`,
and call `easeTo` / `fitBounds` from your tracking loop.
