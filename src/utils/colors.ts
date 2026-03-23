// ─── Fiery Ocean palette ─────────────────────────────────────────────────────
// #780000 (dark red), #C1121F (red), #FDF0D5 (cream), #003049 (navy), #669BBC (steel blue)

export const PALETTE = {
  darkRed: '#780000',
  red: '#C1121F',
  cream: '#FDF0D5',
  navy: '#003049',
  steel: '#669BBC',
  // Derived
  creamDark: '#f0e0b8',
  navyLight: '#0a4060',
  steelLight: '#8fb8d4',
  steelPale: '#c5daea',
  textPrimary: '#003049',
  textSecondary: '#4a6a7f',
  textMuted: '#7a9aad',
  border: '#d8cbb0',
  borderLight: '#e8dcc4',
  cardBg: '#fffdf8',
} as const;

export const COUNTRY_COLORS: Record<string, string> = {
  AR: '#669BBC',  // steel blue
  PY: '#C1121F',  // red
  UY: '#003049',  // navy
};

export const CHART_COLORS = [
  '#003049', '#C1121F', '#669BBC', '#780000', '#8fb8d4',
  '#0a4060', '#e05a5a', '#4a8db0', '#a03030', '#b0c8dc',
];

// Numeric scale gradient for bar charts (0-10 scales)
// Uses a diverging palette: dark red → cream → navy
export function getNumericScaleColor(index: number, total: number): string {
  if (total <= 1) return PALETTE.navy;
  const t = index / (total - 1); // 0 to 1
  if (t <= 0.5) {
    // dark red → cream (0 → 0.5)
    const s = t * 2;
    const r = Math.round(120 + s * 133);
    const g = Math.round(0 + s * 240);
    const b = Math.round(0 + s * 213);
    return `rgb(${r},${g},${b})`;
  } else {
    // cream → navy (0.5 → 1)
    const s = (t - 0.5) * 2;
    const r = Math.round(253 - s * 253);
    const g = Math.round(240 - s * 192);
    const b = Math.round(213 - s * 140);
    return `rgb(${r},${g},${b})`;
  }
}

// Sequential color scale for choropleth (cream → navy)
export function getSequentialColor(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min);
  // Interpolate from cream (#FDF0D5) to navy (#003049)
  const r = Math.round(253 - t * 253);
  const g = Math.round(240 - t * 192);
  const b = Math.round(213 - t * 140);
  return `rgb(${r},${g},${b})`;
}

// Diverging color scale (dark red → cream → navy)
export function getDivergingColor(value: number, min: number, max: number): string {
  const mid = (min + max) / 2;
  if (value <= mid) {
    const t = mid === min ? 0.5 : (value - min) / (mid - min);
    // dark red → cream
    const r = Math.round(120 + t * 133);
    const g = Math.round(0 + t * 240);
    const b = Math.round(0 + t * 213);
    return `rgb(${r},${g},${b})`;
  } else {
    const t = max === mid ? 0.5 : (value - mid) / (max - mid);
    // cream → navy
    const r = Math.round(253 - t * 253);
    const g = Math.round(240 - t * 192);
    const b = Math.round(213 - t * 140);
    return `rgb(${r},${g},${b})`;
  }
}

export function getCategoryColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// Sentiment-based colors using palette
export const SENTIMENT_COLORS: Record<string, string> = {
  // Positive → steel blue tones
  'Muy satisfecho': '#003049',
  'Bastante satisfecho': '#669BBC',
  'Más bien satisfecho': '#669BBC',
  'Está progresando': '#003049',
  'Mucha confianza': '#003049',
  'Algo de confianza': '#669BBC',
  'La democracia es preferible a cualquier otra forma de gobierno': '#003049',
  'Muy buena': '#003049',
  'Buena': '#669BBC',
  'Muy de acuerdo': '#003049',
  'De acuerdo': '#669BBC',
  'Mucho mejor': '#003049',
  'Un poco mejor': '#669BBC',
  'Muy buenas': '#003049',
  'Más bien buenas': '#669BBC',
  'Muy favorable': '#003049',
  'Algo favorable': '#669BBC',
  'Mucha': '#003049',
  'Mucho': '#003049',
  'Bastante': '#669BBC',
  'Completamente garantizadas': '#003049',
  'Algo garantizadas': '#669BBC',
  'Muy a favor': '#003049',
  'Algo a favor': '#669BBC',
  'Muy justa': '#003049',
  'Justa': '#669BBC',

  // Neutral → muted
  'Está estancado': '#8fb8d4',
  'No muy satisfecho': '#b07050',
  'Regular': '#8fb8d4',
  'Igual': '#8fb8d4',
  'Casi igual': '#8fb8d4',
  'Algo': '#8fb8d4',

  // Negative → red tones
  'Para nada satisfecho': '#780000',
  'Nada satisfecho': '#780000',
  'Está en retroceso': '#C1121F',
  'Poca confianza': '#C1121F',
  'Ninguna confianza': '#780000',
  'Muy mala': '#780000',
  'Mala': '#C1121F',
  'En desacuerdo': '#C1121F',
  'Muy en desacuerdo': '#780000',
  'Mucho peor': '#780000',
  'Un poco peor': '#C1121F',
  'Más bien malas': '#C1121F',
  'Muy malas': '#780000',
  'Muy desfavorable': '#780000',
  'Algo desfavorable': '#C1121F',
  'Poca': '#C1121F',
  'Poco': '#C1121F',
  'Ninguna': '#780000',
  'Nada': '#780000',
  'Poco garantizadas': '#C1121F',
  'Para nada garantizadas': '#780000',
  'Algo en contra': '#C1121F',
  'Muy en contra': '#780000',
  'Injusta': '#C1121F',
  'Muy injusta': '#780000',

  // DK/NA → cream tones
  'No sabe': '#d8cbb0',
  'No contesta': '#e8dcc4',
  'No sabe/No contesta': '#d8cbb0',
  'No sabe / No contesta': '#d8cbb0',
  'No responde': '#d8cbb0',
};

export function getResponseColor(response: string, index: number): string {
  // Exact match first
  if (SENTIMENT_COLORS[response]) return SENTIMENT_COLORS[response];

  // Then find the longest matching pattern to avoid "Justa" matching "Injusta"
  let bestMatch = '';
  let bestColor = '';
  for (const [pattern, color] of Object.entries(SENTIMENT_COLORS)) {
    if (response.includes(pattern) && pattern.length > bestMatch.length) {
      bestMatch = pattern;
      bestColor = color;
    }
  }
  if (bestColor) return bestColor;

  return getCategoryColor(index);
}
