import { useState, useMemo, useEffect } from 'react';
import type { KeyData, VariablesSlim, CompactStats } from '../hooks/useSurveyData';
import type { KeyTopic } from '../hooks/useKeyTopics';
import { DistributionChart, CompareBar } from './DistributionChart';
import { TimeSeriesChart } from './TimeSeriesChart';
import { CountryMap } from './CountryMap';
import { CompareMap } from './CompareMap';
import { COUNTRY_COLORS } from '../utils/colors';
import { useSocioeconomic } from '../hooks/useSocioeconomic';
import { orderResponseKeys, shortLabel, isNsNc, isNumericScale } from '../utils/responses';
import { CountryProfile } from './CountryProfile';

const P = {
  navy: '#003049', steel: '#669BBC', cream: '#FDF0D5', red: '#C1121F', darkRed: '#780000',
  cardBg: '#fffdf8', border: '#d8cbb0', borderLight: '#e8dcc4',
  textSec: '#4a6a7f', textMuted: '#7a9aad',
};

type ViewMode = 'pais' | 'region';

interface DashboardProps {
  keyData: KeyData;
  variables: VariablesSlim;
  regions: { [country: string]: string[] };
  keyTopics: KeyTopic[];
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

export function Dashboard({ keyData, variables, regions, keyTopics }: DashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('pais');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['AR']);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<Record<string, string | null>>({});
  const socioData = useSocioeconomic();

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(code)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== code);
      }
      return [...prev, code];
    });
    setSelectedResponse(null);
    setSelectedRegions({});
  };

  const setRegionForCountry = (country: string, region: string) => {
    setSelectedRegions(prev => ({
      ...prev,
      [country]: prev[country] === region ? null : region,
    }));
  };

  // Years: intersection of ALL 3 countries
  const years = useMemo(() => {
    const allCodes = COUNTRIES.map(c => c.code);
    const yearSets = allCodes.filter(c => keyData[c]).map(c => new Set(Object.keys(keyData[c])));
    if (yearSets.length === 0) return [];
    return [...yearSets[0]].filter(y => yearSets.every(s => s.has(y))).sort();
  }, [keyData]);

  const year = selectedYear || years[years.length - 1] || '';

  useEffect(() => {
    if (year && years.length > 0 && !years.includes(year)) {
      setSelectedYear(years[years.length - 1]);
    }
  }, [years, year]);

  // Filter topics to only those with data for the selected year
  const availableTopics = useMemo(() => {
    return keyTopics.filter(t => !!t.codes[year]);
  }, [keyTopics, year]);

  const topicId = selectedTopicId || (availableTopics.length > 0 ? availableTopics[0].id : '');
  const topic = availableTopics.find(t => t.id === topicId) || availableTopics[0] || null;
  const activeVarCode = topic?.codes[year] || null;

  // Reset topic if current selection is not available for this year
  useEffect(() => {
    if (selectedTopicId && availableTopics.length > 0 && !availableTopics.some(t => t.id === selectedTopicId)) {
      setSelectedTopicId(availableTopics[0].id);
    }
  }, [availableTopics, selectedTopicId]);

  // Year-aware labels
  const varLabelsForYear = useMemo<Record<string, string>>(() => {
    const labels: Record<string, string> = {};
    for (const c of COUNTRIES.map(x => x.code)) {
      const src = keyData[c]?.[year];
      if (src) {
        for (const [code, stats] of Object.entries(src)) {
          if (!labels[code] && stats?.label) labels[code] = stats.label;
        }
      }
    }
    return labels;
  }, [keyData, year]);

  // Get variable data per country
  const countryVarData = useMemo<Record<string, CompactStats | null>>(() => {
    if (!activeVarCode || !year) return {};
    const result: Record<string, CompactStats | null> = {};
    for (const c of selectedCountries) {
      result[c] = keyData[c]?.[year]?.[activeVarCode] || null;
    }
    return result;
  }, [keyData, year, activeVarCode, selectedCountries]);

  // Unified response order: ordinal if detected, otherwise by average value desc
  const unifiedOrder = useMemo(() => {
    const allKeys = new Set<string>();
    for (const c of selectedCountries) {
      const vd = countryVarData[c];
      if (vd?.national?.d) {
        for (const key of Object.keys(vd.national.d)) allKeys.add(key);
      }
    }
    const keys = [...allKeys];
    return orderResponseKeys(keys, (key) => {
      let sum = 0, count = 0;
      for (const c of selectedCountries) {
        const d = countryVarData[c]?.national?.d;
        if (d && d[key] !== undefined) { sum += d[key]; count++; }
      }
      return count > 0 ? sum / count : 0;
    });
  }, [countryVarData, selectedCountries]);

  // Auto-select top response (validate selectedResponse exists in current data)
  const topResponse = useMemo(() => {
    if (selectedResponse) {
      const exists = selectedCountries.some(c => {
        const d = countryVarData[c]?.national?.d;
        return d && findResponseValue(d, selectedResponse) > 0;
      });
      if (exists) return selectedResponse;
    }
    const anyData = selectedCountries.map(c => countryVarData[c]).find(v => v);
    if (!anyData) return null;
    const entries = Object.entries(anyData.national.d)
      .filter(([k]) => !isNsNc(k));
    if (entries.length === 0) return Object.keys(anyData.national.d)[0] || null;
    return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [countryVarData, selectedResponse, selectedCountries]);

  // Heatmap data for CompareMap
  const mapValues = useMemo(() => {
    if (!topResponse) return [];
    return COUNTRIES
      .filter(c => selectedCountries.includes(c.code))
      .map(c => {
        const v = countryVarData[c.code];
        const val = v?.national?.d ? findResponseValue(v.national.d, topResponse) : 0;
        return { code: c.code, name: c.name, value: val, n: v?.national.n || 0 };
      }).filter(d => d.value > 0);
  }, [countryVarData, topResponse, selectedCountries]);

  const varLabel = useMemo(() => {
    const anyData = selectedCountries.map(c => countryVarData[c]).find(v => v);
    return anyData?.label || varLabelsForYear[activeVarCode || ''] || variables[activeVarCode || '']?.label || topic?.label || '';
  }, [countryVarData, activeVarCode, variables, topic, selectedCountries, varLabelsForYear]);

  const isMultiCountry = selectedCountries.length > 1;
  const isNumeric = isNumericScale(unifiedOrder);

  // Region data helper
  function getRegionData(countryCode: string, regionName: string | null): { d: Record<string, number>; n: number } | null {
    if (!regionName) return null;
    const vd = countryVarData[countryCode];
    if (!vd?.regions) return null;
    if (vd.regions[regionName]) return vd.regions[regionName];

    const allKeys = new Set<string>();
    const matchingEntries: { d: Record<string, number>; n: number }[] = [];
    const normalize = (s: string) =>
      s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const normRegion = normalize(regionName);

    for (const [surveyRegion, stats] of Object.entries(vd.regions)) {
      const prefix = surveyRegion.includes('-')
        ? surveyRegion.substring(0, surveyRegion.indexOf('-')).trim()
        : surveyRegion.includes('/')
        ? surveyRegion.substring(0, surveyRegion.indexOf('/')).trim()
        : surveyRegion;

      const normPrefix = normalize(prefix);
      const matches = normPrefix === normRegion
        || (normPrefix === 'noreste' && normRegion === 'nordeste')
        || (normPrefix === 'nordeste' && normRegion === 'noreste')
        || normalize(surveyRegion) === normRegion;

      if (matches) {
        matchingEntries.push(stats);
        for (const k of Object.keys(stats.d)) allKeys.add(k);
      }
    }

    if (matchingEntries.length === 0) return null;

    const totalN = matchingEntries.reduce((s, e) => s + e.n, 0);
    const aggDist: Record<string, number> = {};
    for (const key of allKeys) {
      let weightedSum = 0;
      for (const entry of matchingEntries) {
        weightedSum += (entry.d[key] || 0) * entry.n;
      }
      aggDist[key] = weightedSum / totalN;
    }

    return { d: aggDist, n: totalN };
  }

  const regionDataByCountry = useMemo<Record<string, { d: Record<string, number>; n: number } | null>>(() => {
    const result: Record<string, { d: Record<string, number>; n: number } | null> = {};
    for (const c of selectedCountries) {
      result[c] = getRegionData(c, selectedRegions[c] || null);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegions, countryVarData, selectedCountries]);

  // Response options for time series selector (exclude NS/NC)
  const responseOptions = useMemo(() => {
    return unifiedOrder.filter(k => !isNsNc(k));
  }, [unifiedOrder]);

  if (keyTopics.length === 0 || availableTopics.length === 0) {
    return <div style={{ color: P.textMuted, padding: 20, textAlign: 'center' }}>Cargando temas...</div>;
  }

  // Shared time series card with response selector
  const timeSeriesCard = topResponse && topic ? (
    <div style={{ background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: P.navy }}>Serie temporal</span>
        <span style={{ fontSize: 12, color: P.textSec }}>
          {selectedCountries.map(c => COUNTRIES.find(x => x.code === c)?.name).join(', ')}
        </span>
        <select
          value={topResponse}
          onChange={e => setSelectedResponse(e.target.value)}
          style={{
            marginLeft: 'auto', padding: '4px 8px', borderRadius: 6,
            border: `1px solid ${P.border}`, fontSize: 12,
            background: P.cardBg, color: P.navy, maxWidth: 300,
          }}
        >
          {responseOptions.map(key => (
            <option key={key} value={key}>{shortLabel(key)}</option>
          ))}
        </select>
      </div>
      <TimeSeriesChart
        keyData={keyData}
        topicCodes={topic.codes}
        responseValue={topResponse}
        countries={selectedCountries}
        height={250}
      />
    </div>
  ) : null;

  return (
    <div style={{ display: 'flex', gap: 14, height: '100%' }}>
      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflow: 'auto' }}>
        {/* Controls */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
          padding: '10px 16px', background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
        }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: `1px solid ${P.border}` }}>
            {(['pais', 'region'] as ViewMode[]).map(m => (
              <button key={m}
                onClick={() => { setViewMode(m); setSelectedRegions({}); setSelectedResponse(null); }}
                style={{
                  padding: '5px 12px', border: 'none', cursor: 'pointer', fontSize: 12,
                  background: viewMode === m ? P.navy : P.cardBg,
                  color: viewMode === m ? '#fff' : P.navy,
                  fontWeight: viewMode === m ? 600 : 400,
                }}>
                {m === 'pais' ? 'País' : 'Región'}
              </button>
            ))}
          </div>

          {/* Country buttons */}
          <div style={{ display: 'flex', gap: 4 }}>
            {COUNTRIES.map(c => {
              const sel = selectedCountries.includes(c.code);
              return (
                <button key={c.code}
                  onClick={() => toggleCountry(c.code)}
                  style={{
                    padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: P.navy,
                    border: sel ? `2px solid ${COUNTRY_COLORS[c.code]}` : `1px solid ${P.border}`,
                    background: sel ? COUNTRY_COLORS[c.code] + '18' : P.cardBg,
                    fontWeight: sel ? 700 : 400,
                  }}>
                  {c.flag} {c.name}
                </button>
              );
            })}
          </div>

          {/* Year */}
          <select value={year} onChange={e => { setSelectedYear(e.target.value); setSelectedResponse(null); }}
            style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${P.border}`, fontSize: 12, background: P.cardBg, color: P.navy }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* Topic */}
          <select value={topicId} onChange={e => { setSelectedTopicId(e.target.value); setSelectedResponse(null); }}
            style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${P.border}`, fontSize: 12, maxWidth: 300, background: P.cardBg, color: P.navy }}>
            {availableTopics.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {/* Header */}
        {activeVarCode && (
          <div style={{
            background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
            padding: '8px 16px', display: 'flex', alignItems: 'baseline', gap: 8,
          }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: P.navy }}>{varLabel}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: P.textMuted }}>{activeVarCode}</span>
            <span style={{ fontSize: 12, color: P.textSec, marginLeft: 'auto' }}>{year}</span>
          </div>
        )}

        {/* Country profile cards */}
        {viewMode === 'pais' && socioData && (
          <CountryProfile socioData={socioData} countries={selectedCountries} year={year} />
        )}

        {/* PAIS MODE */}
        {viewMode === 'pais' && activeVarCode && (
          <>
            {/* Distribution charts */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMultiCountry ? `repeat(${selectedCountries.length}, 1fr)` : '1fr',
              gap: 10,
            }}>
              {selectedCountries.map(code => {
                const c = COUNTRIES.find(x => x.code === code)!;
                const vd = countryVarData[code];
                return (
                  <div key={code} style={{
                    background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{
                      padding: '8px 12px', borderBottom: `2px solid ${COUNTRY_COLORS[code]}`,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 14 }}>{c.flag}</span>
                      <span style={{ fontWeight: 600, fontSize: 13, color: P.navy }}>{c.name}</span>
                      {vd && (
                        <span style={{ fontSize: 11, color: P.textMuted, marginLeft: 'auto' }}>
                          n={vd.national.n}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '8px 4px', flex: 1 }}>
                      {vd ? (
                        <DistributionChart
                          distribution={vd.national.d}
                          onSelectResponse={setSelectedResponse}
                          selectedResponse={selectedResponse}
                          orderedKeys={isMultiCountry ? unifiedOrder : undefined}
                          height={isMultiCountry ? 220 : 280}
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
            </div>

            {/* Heatmap */}
            {isMultiCountry && topResponse && mapValues.length > 0 && (
              <div style={{ background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', borderBottom: `1px solid ${P.borderLight}`, fontWeight: 600, fontSize: 13, color: P.navy }}>
                  Mapa comparativo — {year} — "{shortLabel(topResponse)}"
                </div>
                <CompareMap
                  countryValues={mapValues}
                  selectedResponse={topResponse}
                  height={280}
                />
              </div>
            )}

            {/* Time Series */}
            {timeSeriesCard}
          </>
        )}

        {/* REGION MODE */}
        {viewMode === 'region' && activeVarCode && (
          <>
            {/* Maps */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${selectedCountries.length}, 1fr)`,
              gap: 10,
            }}>
              {selectedCountries.map(code => {
                const c = COUNTRIES.find(x => x.code === code)!;
                const selRegion = selectedRegions[code] || null;
                const regData = regionDataByCountry[code];
                return (
                  <div key={code} style={{
                    background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{
                      padding: '8px 12px', borderBottom: `2px solid ${COUNTRY_COLORS[code]}`,
                      fontSize: 13, fontWeight: 600, color: P.navy, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span>{c.flag}</span>
                      <span>{c.name} — {year}</span>
                      {topResponse && <span style={{ fontWeight: 400, color: P.textSec, fontSize: 11 }}> | {shortLabel(topResponse)}</span>}
                    </div>
                    <div style={{ flex: 1, minHeight: 280 }}>
                      <CountryMap
                        country={code}
                        variable={countryVarData[code] || null}
                        selectedResponse={topResponse}
                        numericMean={isNumeric}
                        regions={regions[code] || []}
                        onRegionClick={(r) => setRegionForCountry(code, r)}
                        selectedRegion={selRegion}
                      />
                    </div>
                    {selRegion && regData && (
                      <div style={{ padding: '6px 12px', borderTop: `1px solid ${P.borderLight}`, fontSize: 11, background: P.cream, color: P.navy }}>
                        <strong>{selRegion}</strong> | {isNumeric ? (() => {
                          let mean = 0;
                          for (const [k, v] of Object.entries(regData.d)) { const n = parseFloat(k); if (!isNaN(n)) mean += n * v; }
                          return `Promedio: ${mean.toFixed(1)}`;
                        })() : `${shortLabel(topResponse!)}: ${((regData.d[topResponse!] || 0) * 100).toFixed(1)}%`} | n={regData.n}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Distribution charts per country */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${selectedCountries.length}, 1fr)`,
              gap: 10,
            }}>
              {selectedCountries.map(code => {
                const c = COUNTRIES.find(x => x.code === code)!;
                const selRegion = selectedRegions[code] || null;
                const regData = regionDataByCountry[code];
                const vd = countryVarData[code];
                const dist = selRegion && regData ? regData.d : vd?.national?.d;
                const n = selRegion && regData ? regData.n : vd?.national?.n || 0;
                return (
                  <div key={code} style={{
                    background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{
                      padding: '8px 12px', borderBottom: `2px solid ${COUNTRY_COLORS[code]}`,
                      display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
                    }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: P.navy }}>{c.flag} {c.name}</span>
                      {selRegion && <span style={{ fontSize: 11, color: P.textSec }}>| {selRegion}</span>}
                      <span style={{ fontSize: 11, color: P.textMuted, marginLeft: 'auto' }}>n={n}</span>
                    </div>
                    <div style={{ padding: '8px 4px', flex: 1 }}>
                      {dist ? (
                        <DistributionChart
                          distribution={dist}
                          onSelectResponse={setSelectedResponse}
                          selectedResponse={selectedResponse}
                          orderedKeys={isMultiCountry ? unifiedOrder : undefined}
                          height={isMultiCountry ? 200 : 260}
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
            </div>

            {/* Region comparison bar */}
            {(() => {
              const regionCompareData = selectedCountries
                .filter(code => selectedRegions[code] && regionDataByCountry[code])
                .map(code => {
                  const regData = regionDataByCountry[code]!;
                  const c = COUNTRIES.find(x => x.code === code)!;
                  const val = topResponse ? findResponseValue(regData.d, topResponse) : 0;
                  return {
                    label: `${c.name} - ${selectedRegions[code]}`,
                    value: Math.round(val * 1000) / 10,
                    color: COUNTRY_COLORS[code],
                  };
                }).filter(d => d.value > 0);

              if (regionCompareData.length < 2 || !topResponse) return null;

              return (
                <div style={{ background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`, padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: P.navy }}>
                    Comparación entre regiones — {year}
                  </div>
                  <div style={{ fontSize: 12, color: P.textSec, marginBottom: 8 }}>
                    Respuesta: "{shortLabel(topResponse)}"
                  </div>
                  <CompareBar data={regionCompareData} height={200} />
                </div>
              );
            })()}

            {/* Time Series */}
            {timeSeriesCard}
          </>
        )}

        {/* No variable selected */}
        {!activeVarCode && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: P.cardBg, borderRadius: 10, border: `1px solid ${P.border}`, color: P.textMuted, fontSize: 14,
          }}>
            Sin datos para este tema en {year}
          </div>
        )}
      </div>
    </div>
  );
}
