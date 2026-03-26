import { useState, useMemo, useEffect, useRef } from 'react';
import type { KeyData, VariablesSlim, CompactStats, CountryFullData } from '../hooks/useSurveyData';
import { DistributionChart, CompareBar } from './DistributionChart';
import { TimeSeriesChart } from './TimeSeriesChart';
import { COUNTRY_COLORS } from '../utils/colors';
import { isNsNc, orderResponseKeys, shortLabel } from '../utils/responses';
import { ExportButton } from './ExportButton';
import { readUrlState, useUrlState } from '../hooks/useUrlState';

const P = {
  navy: '#003049', steel: '#669BBC', cream: '#FDF0D5', red: '#C1121F',
  cardBg: '#fffdf8', border: '#d8cbb0', borderLight: '#e8dcc4',
  textSec: '#4a6a7f', textMuted: '#7a9aad',
};

interface VariableExplorerProps {
  keyData: KeyData;
  variables: VariablesSlim;
  fullData: { [country: string]: CountryFullData };
  loadFullCountry: (country: string) => void;
}

const COUNTRIES = [
  { code: 'AR', name: 'Argentina', flag: '\u{1F1E6}\u{1F1F7}' },
  { code: 'PY', name: 'Paraguay', flag: '\u{1F1F5}\u{1F1FE}' },
  { code: 'UY', name: 'Uruguay', flag: '\u{1F1FA}\u{1F1FE}' },
];

function normalizeResponse(s: string): string {
  return s.replace(/\s*\{[^}]*\}\s*$/, '').trim();
}

function findResponseValue(dist: Record<string, number>, target: string): number {
  if (dist[target] !== undefined) return dist[target];
  const normTarget = normalizeResponse(target);
  for (const [key, val] of Object.entries(dist)) {
    if (normalizeResponse(key) === normTarget) return val;
  }
  return 0;
}

const initialUrl = readUrlState();

export function VariableExplorer({ keyData, variables, fullData, loadFullCountry }: VariableExplorerProps) {
  const [selectedYear, setSelectedYear] = useState<string | null>(initialUrl.year || null);
  const [search, setSearch] = useState('');
  const [selectedVar, setSelectedVar] = useState<string | null>(initialUrl.variable || null);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [showAllVars, setShowAllVars] = useState(false);

  const distributionRef = useRef<HTMLDivElement>(null);
  const timeSeriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAllVars) {
      COUNTRIES.forEach(c => {
        if (!fullData[c.code]) loadFullCountry(c.code);
      });
    }
  }, [showAllVars, fullData, loadFullCountry]);

  const years = useMemo(() => {
    const yearSet = new Set<string>();
    for (const c of COUNTRIES) {
      if (keyData[c.code]) {
        for (const y of Object.keys(keyData[c.code])) yearSet.add(y);
      }
    }
    return [...yearSet].sort();
  }, [keyData]);

  const year = selectedYear || years[years.length - 1] || '';

  // URL state sync
  useUrlState({
    view: 'explorer',
    year: selectedYear || undefined,
    variable: selectedVar || undefined,
  });

  useEffect(() => {
    if (selectedVar) {
      const exists = COUNTRIES.some(c => {
        if (showAllVars && fullData[c.code]?.[year]) return !!fullData[c.code][year][selectedVar];
        return !!keyData[c.code]?.[year]?.[selectedVar];
      });
      if (!exists) { setSelectedVar(null); setSelectedResponse(null); }
    }
  }, [year, selectedVar, keyData, fullData, showAllVars]);

  const availableVars = useMemo(() => {
    const codeSet = new Set<string>();
    for (const c of COUNTRIES) {
      if (showAllVars && fullData[c.code]?.[year]) {
        for (const code of Object.keys(fullData[c.code][year])) codeSet.add(code);
      } else if (keyData[c.code]?.[year]) {
        for (const code of Object.keys(keyData[c.code][year])) codeSet.add(code);
      }
    }
    return [...codeSet].sort();
  }, [keyData, fullData, year, showAllVars]);

  const filteredVars = useMemo(() => {
    if (!search) return availableVars;
    const q = search.toLowerCase();
    return availableVars.filter(code => {
      const meta = variables[code];
      if (!meta) return code.toLowerCase().includes(q);
      return code.toLowerCase().includes(q) || meta.label.toLowerCase().includes(q);
    });
  }, [availableVars, search, variables]);

  const countryVarData = useMemo<Record<string, CompactStats | null>>(() => {
    if (!selectedVar || !year) return {};
    const result: Record<string, CompactStats | null> = {};
    for (const c of COUNTRIES) {
      const full = fullData[c.code]?.[year]?.[selectedVar];
      if (full) {
        result[c.code] = {
          label: full.label,
          national: { d: full.national.distribution, n: full.national.n, m: full.national.mean },
          regions: Object.fromEntries(
            Object.entries(full.regions).map(([r, s]) => [r, { d: s.distribution, n: s.n, m: s.mean }])
          ),
        };
      } else {
        result[c.code] = keyData[c.code]?.[year]?.[selectedVar] || null;
      }
    }
    return result;
  }, [keyData, fullData, year, selectedVar]);

  const topResponse = useMemo(() => {
    if (selectedResponse) return selectedResponse;
    const anyData = COUNTRIES.map(c => countryVarData[c.code]).find(v => v);
    if (!anyData) return null;
    const entries = Object.entries(anyData.national.d)
      .filter(([k]) => !isNsNc(k));
    if (entries.length === 0) return Object.keys(anyData.national.d)[0] || null;
    return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [countryVarData, selectedResponse]);

  const compareData = useMemo(() => {
    if (!topResponse) return [];
    return COUNTRIES.map(c => {
      const v = countryVarData[c.code];
      const val = v?.national?.d ? findResponseValue(v.national.d, topResponse) : 0;
      return { label: c.name, value: Math.round(val * 1000) / 10, color: COUNTRY_COLORS[c.code] };
    }).filter(d => d.value > 0);
  }, [countryVarData, topResponse]);

  const varLabel = useMemo(() => {
    const anyData = COUNTRIES.map(c => countryVarData[c.code]).find(v => v);
    return anyData?.label || variables[selectedVar || '']?.label || selectedVar || '';
  }, [countryVarData, selectedVar, variables]);

  const unifiedOrder = useMemo(() => {
    const allKeys = new Set<string>();
    for (const c of COUNTRIES) {
      const vd = countryVarData[c.code];
      if (vd?.national?.d) {
        for (const key of Object.keys(vd.national.d)) allKeys.add(key);
      }
    }
    const keys = [...allKeys];
    return orderResponseKeys(keys, (key) => {
      let sum = 0, count = 0;
      for (const c of COUNTRIES) {
        const d = countryVarData[c.code]?.national?.d;
        if (d && d[key] !== undefined) { sum += d[key]; count++; }
      }
      return count > 0 ? sum / count : 0;
    });
  }, [countryVarData]);

  const isKeyVar = selectedVar ? variables[selectedVar]?.isKey : false;
  const allFullLoaded = COUNTRIES.every(c => fullData[c.code]);

  // CSV export data
  const csvData = useMemo(() => {
    if (!selectedVar || !topResponse) return undefined;
    const headers = ['País', ...unifiedOrder.map(k => shortLabel(k))];
    const rows = COUNTRIES.map(c => {
      const vd = countryVarData[c.code];
      return [c.name, ...unifiedOrder.map(k => {
        const val = vd?.national?.d ? findResponseValue(vd.national.d, k) : 0;
        return Math.round(val * 1000) / 10;
      })];
    });
    return { headers, rows };
  }, [selectedVar, topResponse, unifiedOrder, countryVarData]);

  return (
    <div className="responsive-explorer" style={{ display: 'flex', gap: 14, height: '100%' }}>
      {/* Left panel: variable browser */}
      <div className="responsive-sidebar" style={{
        width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`, overflow: 'hidden',
      }}>
        <div style={{ padding: 12, borderBottom: `1px solid ${P.borderLight}` }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <select value={year} onChange={e => setSelectedYear(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 5, border: `1px solid ${P.border}`, fontSize: 12, background: P.cardBg, color: P.navy }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <label style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: P.navy }}>
              <input type="checkbox" checked={showAllVars}
                onChange={e => { setShowAllVars(e.target.checked); setSelectedVar(null); setSelectedResponse(null); }} />
              Todas
            </label>
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar variable..."
            style={{
              width: '100%', padding: '6px 10px', borderRadius: 5,
              border: `1px solid ${P.border}`, fontSize: 12, boxSizing: 'border-box',
              background: P.cardBg, color: P.navy,
            }} />
          <div style={{ fontSize: 11, color: P.textMuted, marginTop: 4 }}>
            {filteredVars.length} variables
            {showAllVars && !allFullLoaded && ' (cargando...)'}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredVars.map(code => {
            const meta = variables[code];
            const isKey = meta?.isKey;
            return (
              <div key={code}
                onClick={() => { setSelectedVar(code); setSelectedResponse(null); }}
                style={{
                  padding: '8px 12px', borderBottom: `1px solid ${P.borderLight}`, cursor: 'pointer',
                  background: selectedVar === code ? P.navy + '0a' : undefined,
                  borderLeft: selectedVar === code ? `3px solid ${P.navy}` : '3px solid transparent',
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: P.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {code}
                  {isKey && (
                    <span style={{ background: P.steel + '30', color: P.navy, padding: '1px 5px', borderRadius: 3, fontSize: 9, fontWeight: 600 }}>
                      CLAVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, marginTop: 2, lineHeight: 1.3, color: P.navy }}>
                  {meta?.label || code}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflow: 'auto' }}>
        {!selectedVar ? (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`, color: P.textMuted, fontSize: 14,
          }}>
            Selecciona una variable de la lista
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="fade-in" style={{
              background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
              padding: '10px 16px', display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
            }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: P.navy }}>{varLabel}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: P.textMuted }}>{selectedVar}</span>
              <span style={{ fontSize: 12, color: P.textSec, marginLeft: 'auto' }}>{year}</span>
            </div>

            {/* 3-column distribution comparison */}
            <div ref={distributionRef} className="export-parent responsive-grid-3 fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, position: 'relative' }}>
              {COUNTRIES.map(c => {
                const vd = countryVarData[c.code];
                return (
                  <div key={c.code} className="card-hover" style={{
                    background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{
                      padding: '8px 12px', borderBottom: `2px solid ${COUNTRY_COLORS[c.code]}`,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 14 }}>{c.flag}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: P.navy }}>{c.name}</span>
                      {vd && (
                        <span style={{ fontSize: 11, color: P.textMuted, marginLeft: 'auto' }}>
                          n={vd.national.n.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '8px 4px', flex: 1 }}>
                      {vd ? (
                        <DistributionChart
                          distribution={vd.national.d}
                          onSelectResponse={setSelectedResponse}
                          selectedResponse={selectedResponse}
                          orderedKeys={unifiedOrder}
                          height={220}
                        />
                      ) : (
                        <div style={{ color: P.textMuted, padding: 20, textAlign: 'center', fontSize: 12 }}>
                          Sin datos para {year}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {csvData && (
                <div style={{ position: 'absolute', top: 4, right: 4 }}>
                  <ExportButton targetRef={distributionRef} filename={`explorer-${selectedVar}-${year}`} csvData={csvData} />
                </div>
              )}
            </div>

            {/* CompareBar */}
            {topResponse && compareData.length > 0 && (
              <div className="fade-in" style={{ background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`, padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: P.navy }}>
                  Comparación entre países — {year}
                </div>
                <div style={{ fontSize: 12, color: P.textSec, marginBottom: 8 }}>
                  Respuesta: "{topResponse}"
                </div>
                <CompareBar data={compareData} height={160} />
              </div>
            )}

            {/* Time Series */}
            {topResponse && isKeyVar ? (
              <div ref={timeSeriesRef} className="export-parent fade-in" style={{ background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: P.navy }}>Serie temporal</span>
                  <ExportButton targetRef={timeSeriesRef} filename={`serie-${selectedVar}`} />
                </div>
                <div style={{ fontSize: 12, color: P.textSec, marginBottom: 8 }}>
                  "{topResponse}" — AR, PY, UY
                </div>
                <TimeSeriesChart
                  keyData={keyData}
                  variableCode={selectedVar}
                  responseValue={topResponse}
                  countries={['AR', 'PY', 'UY']}
                  height={250}
                />
              </div>
            ) : topResponse && !isKeyVar ? (
              <div style={{
                background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
                padding: 16, color: P.textMuted, fontSize: 13, textAlign: 'center',
              }}>
                Serie temporal disponible solo para variables clave
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
