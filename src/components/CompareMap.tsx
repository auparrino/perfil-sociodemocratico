import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getSequentialColor, COUNTRY_COLORS } from '../utils/colors';

interface CountryValue {
  code: string;
  name: string;
  value: number; // 0-1 proportion
  n: number;
}

interface CompareMapProps {
  countryValues: CountryValue[];
  selectedResponse: string | null;
  /** If true, `value` is an ordinal/numeric score instead of a 0-1 proportion. */
  isScore?: boolean;
  /** [min, max] of the score when `isScore` is set. Defaults to [0, 10]. */
  scoreRange?: [number, number];
  height?: number;
}

export function CompareMap({ countryValues, selectedResponse, isScore, scoreRange, height = 340 }: CompareMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<L.GeoJSON | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);

  // Load GeoJSON once
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/countries.geojson`)
      .then(r => r.json())
      .then(setGeoData)
      .catch(err => console.error('Failed to load countries.geojson:', err));
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    }).setView([-30, -59], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      pane: 'overlayPane',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update choropleth
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geoData) return;

    // Remove previous layer
    if (layersRef.current) {
      layersRef.current.remove();
      layersRef.current = null;
    }

    if ((!selectedResponse && !isScore) || countryValues.length === 0) return;

    const valueMap: Record<string, CountryValue> = {};
    for (const cv of countryValues) valueMap[cv.code] = cv;

    const values = countryValues.map(cv => cv.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const layer = L.geoJSON(geoData, {
      style: (feature) => {
        const code = feature?.properties?.code;
        const cv = valueMap[code];
        if (!cv) {
          return { fillColor: 'rgba(0,48,73,0.06)', fillOpacity: 0.3, color: 'rgba(0,48,73,0.12)', weight: 1 };
        }
        return {
          fillColor: getSequentialColor(cv.value, min, max),
          fillOpacity: 0.75,
          color: COUNTRY_COLORS[code] || '#333',
          weight: 2,
        };
      },
      onEachFeature: (feature, layer) => {
        const code = feature.properties?.code;
        const cv = valueMap[code];
        if (cv) {
          const scoreMaxLbl = scoreRange ? scoreRange[1] : 10;
          const valueLabel = isScore
            ? `Score: ${cv.value.toFixed(2)} / ${scoreMaxLbl}`
            : `${selectedResponse}: ${(cv.value * 100).toFixed(1)}%`;
          layer.bindTooltip(
            `<strong>${cv.name}</strong><br/>` +
            `${valueLabel}<br/>` +
            `<small>n=${cv.n}</small>`,
            { direction: 'center', className: 'country-tooltip' }
          );
        }
      },
    }).addTo(map);

    layersRef.current = layer;

    // Fit map to visible countries
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [geoData, countryValues, selectedResponse, isScore]);

  if (countryValues.length === 0 || (!selectedResponse && !isScore)) {
    return null;
  }

  // Legend values
  const values = countryValues.map(cv => cv.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height, borderRadius: 8 }}
      />
      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 10, right: 10, background: 'rgba(253,240,213,0.92)',
        borderRadius: 4, padding: '5px 8px', fontSize: 10, border: '1px solid rgba(0,48,73,0.12)',
        zIndex: 1000,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 3, fontSize: 10 }}>
          {isScore
            ? `Score ${scoreRange ? `${scoreRange[0]}–${scoreRange[1]}` : '0–10'}`
            : `"${selectedResponse}"`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{isScore ? min.toFixed(1) : `${(min * 100).toFixed(0)}%`}</span>
          <div style={{
            width: 80, height: 12, borderRadius: 3,
            background: `linear-gradient(to right, ${getSequentialColor(min, min, max)}, ${getSequentialColor((min + max) / 2, min, max)}, ${getSequentialColor(max, min, max)})`,
          }} />
          <span>{isScore ? max.toFixed(1) : `${(max * 100).toFixed(0)}%`}</span>
        </div>
      </div>
    </div>
  );
}
