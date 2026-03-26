import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { COUNTRY_COLORS } from '../utils/colors';
import type { SocioeconomicData } from '../hooks/useSocioeconomic';

const P = {
  navy: '#003049', cream: '#FDF0D5', cardBg: '#fffdf8', border: '#d8cbb0',
  borderLight: '#e8dcc4', textSec: '#4a6a7f', textMuted: '#7a9aad',
};

const COUNTRY_NAMES: Record<string, string> = {
  AR: 'Argentina', PY: 'Paraguay', UY: 'Uruguay',
};
const COUNTRY_FLAGS: Record<string, string> = {
  AR: '\u{1F1E6}\u{1F1F7}', PY: '\u{1F1F5}\u{1F1FE}', UY: '\u{1F1FA}\u{1F1FE}',
};

// Indicator display order
const INDICATOR_ORDER = [
  'gdp_per_capita_ppp', 'gdp_growth', 'unemployment', 'inflation',
  'poverty', 'population', 'homicides', 'hdi',
];

function formatValue(value: number, format: string, decimals: number, unit: string): string {
  if (format === 'percent') return `${value.toFixed(decimals)}%`;
  if (unit === 'USD') return `$${value.toLocaleString('en-US', { maximumFractionDigits: decimals })}`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(decimals);
}

// Trend arrow
function trend(curr: number | undefined, prev: number | undefined): string {
  if (curr === undefined || prev === undefined) return '';
  const diff = curr - prev;
  if (Math.abs(diff) < 0.001) return '';
  return diff > 0 ? '\u2191' : '\u2193';
}

interface CountryProfileProps {
  socioData: SocioeconomicData;
  countries: string[];
  year: string;
}

export function CountryProfile({ socioData, countries, year }: CountryProfileProps) {
  const indicators = socioData.indicators;
  const orderedKeys = INDICATOR_ORDER.filter(k => indicators[k]);
  const isMulti = countries.length > 1;
  const prevYear = String(Number(year) - 1);

  if (!isMulti) {
    // Single country: compact card grid
    const cc = countries[0];
    return (
      <div style={{
        background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
      }}>
        <div style={{
          padding: '8px 12px', borderBottom: `2px solid ${COUNTRY_COLORS[cc]}`,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>{COUNTRY_FLAGS[cc]}</span>
          <span style={{ fontWeight: 600, fontSize: 14, color: P.navy }}>
            Ficha {COUNTRY_NAMES[cc]} — {year}
          </span>
        </div>
        <div className="responsive-grid-4" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
          background: P.borderLight,
        }}>
          {orderedKeys.map(key => {
            const ind = indicators[key];
            const val = ind.values[cc]?.[year];
            const pval = ind.values[cc]?.[prevYear];
            const arrow = trend(val, pval);
            return (
              <div key={key} style={{
                background: P.cardBg, padding: '10px 12px',
                display: 'flex', flexDirection: 'column', gap: 2,
              }}>
                <div style={{ fontSize: 11, color: P.textSec, lineHeight: 1.2 }}>{ind.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: P.navy }}>
                  {val !== undefined ? formatValue(val, ind.format, ind.decimals, ind.unit) : '—'}
                  {arrow && (
                    <span style={{
                      fontSize: 12, marginLeft: 4,
                      color: arrow === '\u2191' ? (key === 'unemployment' || key === 'inflation' || key === 'poverty' || key === 'homicides' ? '#c1121f' : '#2e7d32')
                        : (key === 'unemployment' || key === 'inflation' || key === 'poverty' || key === 'homicides' ? '#2e7d32' : '#c1121f'),
                    }}>
                      {arrow}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Multi-country: comparison table + sparklines
  return (
    <div style={{
      background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: `1px solid ${P.borderLight}`,
        fontWeight: 600, fontSize: 14, color: P.navy,
      }}>
        Fichas comparativas — {year}
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `180px repeat(${countries.length}, 1fr)`,
        borderBottom: `1px solid ${P.borderLight}`,
        background: '#faf6ee',
      }}>
        <div style={{ padding: '6px 12px', fontSize: 11, color: P.textMuted, fontWeight: 600 }}>
          Indicador
        </div>
        {countries.map(cc => (
          <div key={cc} style={{
            padding: '6px 8px', fontSize: 12, fontWeight: 600, color: P.navy,
            textAlign: 'center', borderLeft: `1px solid ${P.borderLight}`,
          }}>
            {COUNTRY_FLAGS[cc]} {COUNTRY_NAMES[cc]}
          </div>
        ))}
      </div>

      {/* Rows */}
      {orderedKeys.map((key, ri) => {
        const ind = indicators[key];
        return (
          <div key={key} style={{
            display: 'grid',
            gridTemplateColumns: `180px repeat(${countries.length}, 1fr)`,
            borderBottom: ri < orderedKeys.length - 1 ? `1px solid ${P.borderLight}` : 'none',
            background: ri % 2 === 0 ? P.cardBg : '#fdfaf2',
          }}>
            <div style={{
              padding: '8px 12px', fontSize: 11, color: P.textSec, display: 'flex', alignItems: 'center',
            }}>
              {ind.label}
            </div>
            {countries.map(cc => {
              const val = ind.values[cc]?.[year];
              const pval = ind.values[cc]?.[prevYear];
              const arrow = trend(val, pval);
              return (
                <div key={cc} style={{
                  padding: '8px', textAlign: 'center',
                  borderLeft: `1px solid ${P.borderLight}`,
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: P.navy }}>
                    {val !== undefined ? formatValue(val, ind.format, ind.decimals, ind.unit) : '—'}
                  </span>
                  {arrow && (
                    <span style={{
                      fontSize: 11, marginLeft: 3,
                      color: arrow === '\u2191' ? (key === 'unemployment' || key === 'inflation' || key === 'poverty' || key === 'homicides' ? '#c1121f' : '#2e7d32')
                        : (key === 'unemployment' || key === 'inflation' || key === 'poverty' || key === 'homicides' ? '#2e7d32' : '#c1121f'),
                    }}>
                      {arrow}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Sparkline charts for key indicators */}
      <SparklineSection indicators={indicators} countries={countries} year={year} />
    </div>
  );
}

// Mini line charts for trends
const SPARKLINE_INDICATORS = ['gdp_per_capita_ppp', 'inflation', 'unemployment', 'poverty', 'homicides', 'hdi'];

function SparklineSection({
  indicators,
  countries,
  year,
}: {
  indicators: SocioeconomicData['indicators'];
  countries: string[];
  year: string;
}) {
  const sparkKeys = SPARKLINE_INDICATORS.filter(k => indicators[k]);
  const currentYear = Number(year);
  // Show last 6 years that have data
  const chartYears = Array.from({ length: 10 }, (_, i) => String(2015 + i))
    .filter(y => Number(y) <= currentYear);

  return (
    <div className="sparkline-grid" style={{
      borderTop: `1px solid ${P.borderLight}`,
      display: 'grid', gridTemplateColumns: `repeat(${sparkKeys.length}, 1fr)`, gap: 1,
      background: P.borderLight,
    }}>
      {sparkKeys.map(key => {
        const ind = indicators[key];
        const data = chartYears.map(y => {
          const point: Record<string, string | number> = { year: y };
          for (const cc of countries) {
            const val = ind.values[cc]?.[y];
            if (val !== undefined) point[cc] = val;
          }
          return point;
        });

        return (
          <div key={key} style={{ background: P.cardBg, padding: '8px 4px 4px' }}>
            <div style={{ fontSize: 10, color: P.textMuted, textAlign: 'center', marginBottom: 2 }}>
              {ind.label}
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <XAxis dataKey="year" fontSize={9} tickLine={false} />
                <YAxis fontSize={9} width={40} tickLine={false}
                  tickFormatter={v => ind.format === 'percent' ? `${v}%` : (v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => formatValue(Number(v), ind.format, ind.decimals, ind.unit)}
                  labelStyle={{ fontSize: 11 }}
                  contentStyle={{ fontSize: 11, padding: '4px 8px' }}
                />
                {countries.map(cc => (
                  <Line
                    key={cc}
                    type="monotone"
                    dataKey={cc}
                    stroke={COUNTRY_COLORS[cc]}
                    strokeWidth={2}
                    dot={false}
                    name={COUNTRY_NAMES[cc]}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}
