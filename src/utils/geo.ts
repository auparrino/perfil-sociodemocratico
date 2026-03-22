// Region centroids for map markers when full GeoJSON is not available
// Argentina uses macro-regions, Paraguay and Uruguay use departments

export interface RegionCentroid {
  name: string;
  lat: number;
  lng: number;
}

export const REGION_CENTROIDS: Record<string, RegionCentroid[]> = {
  AR: [
    { name: 'Capital Federal', lat: -34.61, lng: -58.38 },
    { name: 'Metropolitana', lat: -34.67, lng: -58.70 },
    { name: 'Pampeana/Pampeana', lat: -35.5, lng: -61.0 },
    { name: 'Cuyo/Cuyo', lat: -32.5, lng: -68.5 },
    { name: 'Noroeste/Noroeste', lat: -25.0, lng: -65.5 },
    { name: 'Nordeste/Nordeste', lat: -27.5, lng: -58.5 },
    { name: 'Patagónica/Patagónica', lat: -43.0, lng: -68.0 },
    { name: 'Interior del País', lat: -32.0, lng: -63.0 },
  ],
  PY: [
    { name: 'Asunción', lat: -25.28, lng: -57.63 },
    { name: 'Central', lat: -25.35, lng: -57.50 },
    { name: 'Alto Paraná', lat: -25.52, lng: -54.98 },
    { name: 'Itapúa', lat: -27.03, lng: -56.05 },
    { name: 'Caaguazú', lat: -25.45, lng: -56.02 },
    { name: 'San Pedro', lat: -24.20, lng: -56.63 },
    { name: 'Cordillera', lat: -25.20, lng: -57.03 },
    { name: 'Guairá', lat: -25.75, lng: -56.30 },
    { name: 'Paraguari', lat: -25.77, lng: -57.15 },
    { name: 'Caazapá', lat: -26.20, lng: -56.37 },
    { name: 'Misiones', lat: -26.87, lng: -57.05 },
    { name: 'Ñeembucú', lat: -26.90, lng: -57.95 },
    { name: 'Amambay', lat: -22.55, lng: -56.00 },
    { name: 'Canindeyú', lat: -24.05, lng: -55.10 },
    { name: 'Concepción', lat: -23.40, lng: -57.43 },
    { name: 'Presidente Hayes', lat: -23.35, lng: -59.95 },
    { name: 'Boquerón', lat: -21.50, lng: -60.50 },
  ],
  UY: [
    { name: 'Montevideo', lat: -34.88, lng: -56.18 },
    { name: 'Canelones', lat: -34.52, lng: -56.28 },
    { name: 'Maldonado', lat: -34.65, lng: -54.95 },
    { name: 'Rocha', lat: -33.95, lng: -53.80 },
    { name: 'Treinta y Tres', lat: -33.23, lng: -54.38 },
    { name: 'Cerro Largo', lat: -32.37, lng: -54.18 },
    { name: 'Rivera', lat: -31.38, lng: -55.55 },
    { name: 'Artigas', lat: -30.73, lng: -56.51 },
    { name: 'Salto', lat: -31.38, lng: -57.25 },
    { name: 'Paysandú', lat: -32.00, lng: -57.60 },
    { name: 'Rio Negro', lat: -32.75, lng: -57.42 },
    { name: 'Soriano', lat: -33.50, lng: -57.70 },
    { name: 'Flores', lat: -33.53, lng: -56.85 },
    { name: 'Florida', lat: -33.80, lng: -55.98 },
    { name: 'Durazno', lat: -33.20, lng: -56.00 },
    { name: 'Lavalleja', lat: -33.80, lng: -54.95 },
    { name: 'Tacuarembó', lat: -31.73, lng: -55.98 },
    { name: 'Colonia', lat: -34.46, lng: -57.84 },
    { name: 'San José', lat: -34.30, lng: -56.78 },
  ],
};

// Match survey region name to centroid (fuzzy)
export function findCentroid(
  country: string,
  regionName: string
): RegionCentroid | null {
  const centroids = REGION_CENTROIDS[country];
  if (!centroids) return null;

  // Exact match
  const exact = centroids.find(c => c.name === regionName);
  if (exact) return exact;

  // Normalize for comparison
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[\/]/g, ' ')
      .trim();

  const normalized = normalize(regionName);
  const match = centroids.find(c => {
    const cn = normalize(c.name);
    return cn === normalized || cn.includes(normalized) || normalized.includes(cn);
  });

  return match || null;
}

// Normalize string for region matching (strip accents, lowercase)
function normalizeRegion(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// GeoJSON region names for each country
const GEO_REGION_NAMES: Record<string, string[]> = {
  AR: ['Capital Federal', 'Metropolitana', 'Pampeana', 'Cuyo', 'Noroeste', 'Nordeste', 'Patagónica'],
  PY: ['Asunción', 'Central', 'Alto Paraná', 'Itapúa', 'Caaguazú', 'San Pedro', 'Cordillera',
       'Guairá', 'Paraguari', 'Caazapá', 'Misiones', 'Ñeembucú', 'Amambay', 'Canindeyú',
       'Concepción', 'Presidente Hayes', 'Boquerón', 'Alto Paraguay'],
  UY: ['Montevideo', 'Canelones', 'Maldonado', 'Rocha', 'Treinta y Tres', 'Cerro Largo',
       'Rivera', 'Artigas', 'Salto', 'Paysandú', 'Rio Negro', 'Soriano', 'Colonia',
       'Flores', 'Florida', 'Durazno', 'Lavalleja', 'Tacuarembó', 'San José'],
};

/**
 * Match a survey region name to a GeoJSON region name.
 *
 * Patterns:
 * - Exact match: "Central" → "Central"
 * - Prefix before "-": "Central-San Lorenzo" → "Central"
 * - Prefix before "/": "Cuyo/Mendoza" → "Cuyo"
 * - Accent-insensitive: "Paraguar√≠" → "Paraguari"
 * - "Noreste" ↔ "Nordeste" normalization
 */
function matchSurveyRegionToGeo(country: string, surveyRegion: string): string | null {
  const geoNames = GEO_REGION_NAMES[country];
  if (!geoNames) return null;

  // Skip numeric codes and non-geographic categories
  if (/^\d+$/.test(surveyRegion)) return null;
  const skip = ['Centro', 'Norte', 'Sur', 'Este', 'Cerca Asunción', 'Ciudades Grandes',
                 'Ciudades Medianas', 'Ciudades Pequeñas', 'Interior del País'];
  if (skip.some(s => normalizeRegion(s) === normalizeRegion(surveyRegion))) return null;

  // Exact match
  const exact = geoNames.find(g => g === surveyRegion);
  if (exact) return exact;

  // Extract prefix before "-" (city-level: "Central-San Lorenzo" → "Central")
  const dashIdx = surveyRegion.indexOf('-');
  if (dashIdx > 0) {
    const prefix = surveyRegion.substring(0, dashIdx).trim();
    const match = geoNames.find(g => g === prefix);
    if (match) return match;
    // Accent-insensitive
    const normPrefix = normalizeRegion(prefix);
    const accentMatch = geoNames.find(g => normalizeRegion(g) === normPrefix);
    if (accentMatch) return accentMatch;
  }

  // Extract prefix before "/" (AR macro-region: "Cuyo/Mendoza" → "Cuyo")
  const slashIdx = surveyRegion.indexOf('/');
  if (slashIdx > 0) {
    let prefix = surveyRegion.substring(0, slashIdx).trim();
    // Normalize "Noreste" → "Nordeste"
    if (normalizeRegion(prefix) === 'noreste') prefix = 'Nordeste';
    const match = geoNames.find(g => g === prefix);
    if (match) return match;
    const normPrefix = normalizeRegion(prefix);
    const accentMatch = geoNames.find(g => normalizeRegion(g) === normPrefix);
    if (accentMatch) return accentMatch;
  }

  // Accent-insensitive full match
  const normSurvey = normalizeRegion(surveyRegion);
  // Also handle "Noreste" ↔ "Nordeste"
  const altNorm = normSurvey === 'noreste' ? 'nordeste' : normSurvey === 'nordeste' ? 'noreste' : null;
  const accentMatch = geoNames.find(g => {
    const ng = normalizeRegion(g);
    return ng === normSurvey || (altNorm && ng === altNorm);
  });
  if (accentMatch) return accentMatch;

  return null;
}

export interface AggregatedRegion {
  geoRegion: string;
  value: number; // weighted average proportion
  n: number;     // total n
}

/**
 * Aggregate survey region-level data to GeoJSON regions.
 * Combines sub-regions (cities, provinces) into their parent GeoJSON regions
 * using weighted averages.
 */
export function aggregateToGeoRegions(
  country: string,
  regionsData: Record<string, { d: Record<string, number>; n: number; m?: number }>,
  responseKey: string,
): AggregatedRegion[] {
  // Group survey regions by their GeoJSON region
  const groups: Record<string, { totalN: number; weightedSum: number }> = {};

  for (const [surveyRegion, stats] of Object.entries(regionsData)) {
    const geoRegion = matchSurveyRegionToGeo(country, surveyRegion);
    if (!geoRegion) continue;

    const value = stats.d[responseKey] ?? 0;
    const n = stats.n;

    if (!groups[geoRegion]) {
      groups[geoRegion] = { totalN: 0, weightedSum: 0 };
    }
    groups[geoRegion].totalN += n;
    groups[geoRegion].weightedSum += value * n;
  }

  return Object.entries(groups)
    .filter(([, g]) => g.totalN > 0)
    .map(([geoRegion, g]) => ({
      geoRegion,
      value: g.weightedSum / g.totalN,
      n: g.totalN,
    }));
}
