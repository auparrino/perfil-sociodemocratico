import { memo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { KeyData } from '../hooks/useSurveyData';
import { COUNTRY_COLORS } from '../utils/colors';

interface TimeSeriesProps {
  keyData: KeyData;
  topicCodes?: { [year: string]: string }; // year → variable code from key_topics.json
  variableCode?: string; // fallback: single code for explorer mode
  responseValue: string;
  countries: string[];
  region?: string | null;
  height?: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina', PY: 'Paraguay', UY: 'Uruguay',
};

// Normalize response text: strip trailing {Label} tags that vary across years
function normalizeResponse(s: string): string {
  return s.replace(/\s*\{[^}]*\}\s*$/, '').trim();
}

// Find matching response key in distribution, tolerating {Label} suffixes
function findResponseValue(dist: Record<string, number>, target: string): number | undefined {
  if (dist[target] !== undefined) return dist[target];
  const normTarget = normalizeResponse(target);
  for (const [key, val] of Object.entries(dist)) {
    if (normalizeResponse(key) === normTarget) return val;
  }
  return undefined;
}

export const TimeSeriesChart = memo(function TimeSeriesChart({
  keyData, topicCodes, variableCode, responseValue, countries, region, height = 300,
}: TimeSeriesProps) {
  // Gather all years from selected countries (union, not intersection)
  const allYears = new Set<string>();
  for (const c of countries) {
    if (keyData[c]) {
      for (const y of Object.keys(keyData[c])) allYears.add(y);
    }
  }
  const sortedYears = [...allYears].sort();

  // Build data points: include a year if ANY selected country has data
  const data = sortedYears.map(year => {
    const point: Record<string, string | number> = { year };
    let anyCountryHasData = false;
    for (const c of countries) {
      const yearData = keyData[c]?.[year];
      if (!yearData) continue;
      const code = topicCodes?.[year] || variableCode || null;
      if (!code || !yearData[code]) continue;
      const varData = yearData[code];
      const stats = region ? varData.regions[region] : varData.national;
      if (!stats) continue;
      const val = findResponseValue(stats.d, responseValue);
      if (val !== undefined) {
        point[c] = Math.round(val * 1000) / 10;
        anyCountryHasData = true;
      }
    }
    return anyCountryHasData ? point : null;
  }).filter((p): p is Record<string, string | number> => p !== null);

  if (data.length === 0) {
    return <div style={{ color: 'rgba(0,48,73,0.50)', padding: 16, textAlign: 'center', fontSize: 12 }}>No data for time series</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ left: 5, right: 20, top: 5, bottom: 5 }}>
        <XAxis dataKey="year" fontSize={12} />
        <YAxis domain={[0, 'auto']} tickFormatter={v => `${v}%`} fontSize={11} />
        <Tooltip
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any) => `${Number(v).toFixed(1)}%`}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          labelFormatter={(label: any) => `${label}`}
        />
        <Legend />
        {countries.map(c => (
          <Line key={c} type="monotone" dataKey={c} name={COUNTRY_NAMES[c] || c}
            stroke={COUNTRY_COLORS[c]} strokeWidth={2.5} dot={{ r: 4 }} connectNulls
            animationDuration={500} animationEasing="ease-out" />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});
