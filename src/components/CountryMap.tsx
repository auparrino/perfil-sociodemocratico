import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { CompactStats } from '../hooks/useSurveyData';
import { aggregateToGeoRegions } from '../utils/geo';
import { getSequentialColor, COUNTRY_COLORS } from '../utils/colors';

interface CountryMapProps {
  country: string;
  variable: CompactStats | null;
  selectedResponse: string | null;
  regions: string[];
  onRegionClick?: (region: string) => void;
  selectedRegion?: string | null;
}

const COUNTRY_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  AR: { lat: -38.4, lng: -63.6, zoom: 4 },
  PY: { lat: -23.4, lng: -58.4, zoom: 6 },
  UY: { lat: -32.5, lng: -55.8, zoom: 7 },
};

// Cache loaded GeoJSON per country
const geoCache: Record<string, GeoJSON.FeatureCollection> = {};

export function CountryMap({
  country,
  variable,
  selectedResponse,
  regions: _regions,
  onRegionClick,
  selectedRegion,
}: CountryMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);

  // Load GeoJSON for country
  useEffect(() => {
    if (geoCache[country]) {
      setGeoData(geoCache[country]);
      return;
    }
    fetch(`${import.meta.env.BASE_URL}data/regions_${country}.geojson`)
      .then(r => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        geoCache[country] = data;
        setGeoData(data);
      })
      .catch(err => console.error(`Failed to load regions_${country}.geojson:`, err));
  }, [country]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;

    // Remove old map if country changed
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center = COUNTRY_CENTERS[country] || COUNTRY_CENTERS.AR;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
    }).setView([center.lat, center.lng], center.zoom);

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
  }, [country]);

  // Update choropleth
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !geoData) return;

    // Remove previous layer
    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    if (!variable || !selectedResponse) return;

    // Aggregate survey regions to GeoJSON regions
    const aggregated = aggregateToGeoRegions(country, variable.regions, selectedResponse);
    if (aggregated.length === 0) return;

    const valueMap: Record<string, { value: number; n: number }> = {};
    for (const a of aggregated) valueMap[a.geoRegion] = { value: a.value, n: a.n };

    const values = aggregated.map(a => a.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const layer = L.geoJSON(geoData, {
      style: (feature) => {
        const region = feature?.properties?.region;
        const data = valueMap[region];
        const isSelected = selectedRegion === region;
        if (!data) {
          return { fillColor: '#e8dcc4', fillOpacity: 0.3, color: '#d8cbb0', weight: 1 };
        }
        return {
          fillColor: getSequentialColor(data.value, min, max),
          fillOpacity: 0.75,
          color: isSelected ? '#000' : (COUNTRY_COLORS[country] || '#333'),
          weight: isSelected ? 3 : 1.5,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const region = feature.properties?.region;
        const data = valueMap[region];
        if (data) {
          featureLayer.bindTooltip(
            `<strong>${region}</strong><br/>` +
            `${selectedResponse}: ${(data.value * 100).toFixed(1)}%<br/>` +
            `<small>n=${data.n}</small>`,
            { direction: 'center', className: 'country-tooltip' }
          );
          featureLayer.on('click', () => onRegionClick?.(region));
        }
      },
    }).addTo(map);

    layerRef.current = layer;
  }, [geoData, country, variable, selectedResponse, selectedRegion, onRegionClick]);

  // Legend
  const aggregated = variable && selectedResponse
    ? aggregateToGeoRegions(country, variable.regions, selectedResponse)
    : [];
  const hasData = aggregated.length > 0;
  const values = aggregated.map(a => a.value);
  const min = hasData ? Math.min(...values) : 0;
  const max = hasData ? Math.max(...values) : 1;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: 300, borderRadius: 8 }}
      />
      {hasData && (
        <div style={{
          position: 'absolute', bottom: 10, right: 10, background: 'rgba(255,253,248,0.92)',
          borderRadius: 6, padding: '6px 10px', fontSize: 11, border: '1px solid #d8cbb0',
          zIndex: 1000,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{(min * 100).toFixed(0)}%</span>
            <div style={{
              width: 80, height: 12, borderRadius: 3,
              background: `linear-gradient(to right, ${getSequentialColor(min, min, max)}, ${getSequentialColor((min + max) / 2, min, max)}, ${getSequentialColor(max, min, max)})`,
            }} />
            <span>{(max * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
