// ─── Design System palette ───────────────────────────────────────────────────
// Data-dense political/economic dashboard aesthetic

export const PALETTE = {
  // Core
  cream: '#FDF0D5',
  navy: '#003049',
  steel: '#669BBC',
  red: '#C1121F',
  darkRed: '#780000',
  // Political/category
  purple: '#7d3c98',
  teal: '#17a589',
  gold: '#d4a800',
  blue: '#1a6fa3',
  // Derived (opacity-based)
  textPrimary: '#003049',
  textMuted: 'rgba(0,48,73,0.50)',
  border: 'rgba(0,48,73,0.12)',
  borderLight: 'rgba(0,48,73,0.08)',
  cardBg: 'rgba(0,48,73,0.04)',
  hover: 'rgba(0,48,73,0.06)',
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
  // Positive → steel blue tones (English + Spanish fallbacks)
  'Very Satisfied': '#003049',
  'Fairly Satisfied': '#669BBC',
  'Rather Satisfied': '#669BBC',
  'A Lot of Trust': '#003049',
  'Some Trust': '#669BBC',
  'Very Good': '#003049',
  'Good': '#669BBC',
  'Very Much': '#003049',
  'Quite a bit': '#669BBC',
  'Completely guaranteed': '#003049',
  'Somewhat guaranteed': '#669BBC',
  'Strongly Agree': '#003049',
  'Agree': '#669BBC',
  'Much better': '#003049',
  'A little better': '#669BBC',
  'Very favorable': '#003049',
  'Somewhat favorable': '#669BBC',
  'Very fair': '#003049',
  'Fair': '#669BBC',
  'Very much in favor': '#003049',
  'Somewhat in favor': '#669BBC',
  // Spanish originals kept for backward compat
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
  'Average': '#8fb8d4',
  'Está estancado': '#8fb8d4',
  'Not Very Satisfied': '#b07050',
  'No muy satisfecho': '#b07050',
  'Regular': '#8fb8d4',
  'Igual': '#8fb8d4',
  'Casi igual': '#8fb8d4',
  'Algo': '#8fb8d4',
  'Somewhat': '#8fb8d4',

  // Negative → red tones
  'Not At All Satisfied': '#780000',
  'Not Satisfied At All': '#780000',
  'Little Trust': '#C1121F',
  'No Trust': '#780000',
  'Very Bad': '#780000',
  'Bad': '#C1121F',
  'Disagree': '#C1121F',
  'Strongly Disagree': '#780000',
  'Much worse': '#780000',
  'A little worse': '#C1121F',
  'Very unfavorable': '#780000',
  'Somewhat unfavorable': '#C1121F',
  'Unfair': '#C1121F',
  'Very unfair': '#780000',
  'Somewhat against': '#C1121F',
  'Strongly against': '#780000',
  // Spanish fallbacks
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

  // DK/NA → muted
  'No sabe': 'rgba(0,48,73,0.20)',
  'No contesta': 'rgba(0,48,73,0.15)',
  'No sabe/No contesta': 'rgba(0,48,73,0.20)',
  'No sabe / No contesta': 'rgba(0,48,73,0.20)',
  'No responde': 'rgba(0,48,73,0.20)',
  "Don't know": 'rgba(0,48,73,0.20)',
  'No answer': 'rgba(0,48,73,0.15)',
  "Don't know/No answer": 'rgba(0,48,73,0.20)',
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
