import { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import type { KeyData, VariablesSlim, CompactStats } from '../hooks/useSurveyData';
import type { KeyTopic } from '../hooks/useKeyTopics';
import { DistributionChart, CompareBar } from './DistributionChart';
import { TimeSeriesChart } from './TimeSeriesChart';
import { CompareMap } from './CompareMap';
import { COUNTRY_COLORS } from '../utils/colors';
import { useSocioeconomic } from '../hooks/useSocioeconomic';
import { orderResponseKeys, shortLabel, isNsNc, isNumericScale, buildOrdinalScoreMap, computeScore, getScoreRange } from '../utils/responses';
import { CountryProfile } from './CountryProfile';
import { ExportButton } from './ExportButton';
import { Dropdown } from './Dropdown';
import { readUrlState, useUrlState } from '../hooks/useUrlState';

const CountryMap = lazy(() => import('./CountryMap').then(m => ({ default: m.CountryMap })));

const P = {
  navy: '#003049', cream: '#FDF0D5', red: '#C1121F', darkRed: '#780000',
  cardBg: 'rgba(0,48,73,0.04)', border: 'rgba(0,48,73,0.12)', borderLight: 'rgba(0,48,73,0.08)',
  textMuted: 'rgba(0,48,73,0.50)', hover: 'rgba(0,48,73,0.06)',
};

type ViewMode = 'pais' | 'region';

interface DashboardProps {
  keyData: KeyData;
  variables: VariablesSlim;
  regions: { [country: string]: string[] };
  keyTopics: KeyTopic[];
}

const COUNTRIES = [
  { code: 'AR', name: 'Argentina' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'UY', name: 'Uruguay' },
];

function Flag({ code, size = 16 }: { code: string; size?: number }) {
  return <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={code} style={{ width: size, height: size * 0.7, objectFit: 'cover', borderRadius: 2, verticalAlign: 'middle' }} />;
}

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

export function Dashboard({ keyData, variables, regions, keyTopics }: DashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>((initialUrl.mode as ViewMode) || 'pais');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(initialUrl.countries || ['AR']);
  const [selectedYear, setSelectedYear] = useState<string | null>(initialUrl.year || null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialUrl.topic || null);
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [selectedRegions, setSelectedRegions] = useState<Record<string, string | null>>({});
  const socioData = useSocioeconomic();

  const distributionRef = useRef<HTMLDivElement>(null);
  const timeSeriesRef = useRef<HTMLDivElement>(null);

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

  const availableTopics = useMemo(() => {
    return keyTopics.filter(t => !!t.codes[year]);
  }, [keyTopics, year]);

  const topicId = selectedTopicId || (availableTopics.length > 0 ? availableTopics[0].id : '');
  const topic = availableTopics.find(t => t.id === topicId) || availableTopics[0] || null;
  const activeVarCode = topic?.codes[year] || null;

  useEffect(() => {
    if (selectedTopicId && availableTopics.length > 0 && !availableTopics.some(t => t.id === selectedTopicId)) {
      setSelectedTopicId(availableTopics[0].id);
    }
  }, [availableTopics, selectedTopicId]);

  // URL state sync
  useUrlState({
    countries: selectedCountries,
    year: selectedYear || undefined,
    topic: selectedTopicId || undefined,
    mode: viewMode,
  });

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

  const countryVarData = useMemo<Record<string, CompactStats | null>>(() => {
    if (!activeVarCode || !year) return {};
    const result: Record<string, CompactStats | null> = {};
    for (const c of selectedCountries) {
      result[c] = keyData[c]?.[year]?.[activeVarCode] || null;
    }
    return result;
  }, [keyData, year, activeVarCode, selectedCountries]);

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

  // Integer score map for ordinal scales (0..N-1). Null for unordered scales
  // or numeric scales — numeric scales already have their own mean path.
  const scoreMap = useMemo(() => {
    if (unifiedOrder.length === 0) return null;
    if (isNumericScale(unifiedOrder)) return null;
    return buildOrdinalScoreMap(unifiedOrder);
  }, [unifiedOrder]);
  const scoreRange = useMemo<[number, number] | undefined>(
    () => (scoreMap ? getScoreRange(scoreMap) : undefined),
    [scoreMap],
  );
  const scoreMax = scoreRange ? scoreRange[1] : 10;

  const mapValues = useMemo(() => {
    const countries = COUNTRIES.filter(c => selectedCountries.includes(c.code));
    if (scoreMap) {
      return countries
        .map(c => {
          const v = countryVarData[c.code];
          const dist = v?.national?.d;
          const score = dist ? computeScore(dist, scoreMap) : null;
          return {
            code: c.code,
            name: c.name,
            value: score ?? 0,
            n: v?.national.n || 0,
            hasScore: score !== null,
          };
        })
        .filter(d => d.hasScore)
        .map(({ code, name, value, n }) => ({ code, name, value, n }));
    }
    if (!topResponse) return [];
    return countries
      .map(c => {
        const v = countryVarData[c.code];
        const val = v?.national?.d ? findResponseValue(v.national.d, topResponse) : 0;
        return { code: c.code, name: c.name, value: val, n: v?.national.n || 0 };
      }).filter(d => d.value > 0);
  }, [countryVarData, topResponse, selectedCountries, scoreMap]);

  const varLabel = useMemo(() => {
    const anyData = selectedCountries.map(c => countryVarData[c]).find(v => v);
    return anyData?.label || varLabelsForYear[activeVarCode || ''] || variables[activeVarCode || '']?.label || topic?.label || '';
  }, [countryVarData, activeVarCode, variables, topic, selectedCountries, varLabelsForYear]);

  const isMultiCountry = selectedCountries.length > 1;
  const isNumeric = isNumericScale(unifiedOrder);

  function getRegionData(countryCode: string, regionName: string | null): { d: Record<string, number>; n: number } | null {
    if (!regionName) return null;
    const vd = countryVarData[countryCode];
    if (!vd?.regions) return null;
    if (vd.regions[regionName]) return vd.regions[regionName];

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
      }
    }

    if (matchingEntries.length === 0) return null;

    const allKeys = new Set<string>();
    for (const e of matchingEntries) for (const k of Object.keys(e.d)) allKeys.add(k);

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

  const responseOptions = useMemo(() => {
    return unifiedOrder.filter(k => !isNsNc(k));
  }, [unifiedOrder]);

  // CSV export data for distribution
  const csvData = useMemo(() => {
    if (!activeVarCode || !topResponse) return undefined;
    const headers = ['Country', ...unifiedOrder.map(k => shortLabel(k))];
    const rows = selectedCountries.map(code => {
      const c = COUNTRIES.find(x => x.code === code)!;
      const vd = countryVarData[code];
      return [c.name, ...unifiedOrder.map(k => {
        const val = vd?.national?.d ? findResponseValue(vd.national.d, k) : 0;
        return Math.round(val * 1000) / 10;
      })];
    });
    return { headers, rows };
  }, [activeVarCode, topResponse, unifiedOrder, selectedCountries, countryVarData]);

  if (keyTopics.length === 0 || availableTopics.length === 0) {
    return (
      <div style={{ color: P.textMuted, padding: 20, textAlign: 'center' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
        Loading topics...
      </div>
    );
  }

  const mapFallback = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
      <div className="loading-spinner" />
    </div>
  );

  const timeSeriesCard = topResponse && topic ? (
    <div ref={timeSeriesRef} className="export-parent fade-in" style={{ background: P.cardBg, borderRadius: 6, border: `1px solid ${P.borderLight}`, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: P.navy }}>Time Series</span>
        <span style={{ fontSize: 11, color: P.textMuted }}>
          {selectedCountries.map(c => COUNTRIES.find(x => x.code === c)?.name).join(', ')}
        </span>
        <ExportButton targetRef={timeSeriesRef} filename={`serie-temporal-${topicId}-${year}`} />
        <div style={{ marginLeft: 'auto' }}>
          <Dropdown
            value={topResponse}
            options={responseOptions.map(key => ({ value: key, label: shortLabel(key) }))}
            onChange={v => setSelectedResponse(v)}
            maxWidth={260}
          />
        </div>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflow: 'auto' }}>
        {/* Controls */}
        <div className="responsive-controls" style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
          padding: '8px 12px', borderBottom: `1px solid ${P.border}`,
        }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {(['pais', 'region'] as ViewMode[]).map(m => (
              <button key={m}
                onClick={() => { setViewMode(m); setSelectedRegions({}); setSelectedResponse(null); }}
                style={{
                  padding: '4px 16px', borderRadius: 100, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  border: viewMode === m ? 'none' : `1px solid ${P.border}`,
                  background: viewMode === m ? P.navy : 'transparent',
                  color: viewMode === m ? P.cream : P.navy,
                }}>
                {m === 'pais' ? 'Country' : 'Region'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {COUNTRIES.map(c => {
              const sel = selectedCountries.includes(c.code);
              return (
                <button key={c.code}
                  onClick={() => toggleCountry(c.code)}
                  style={{
                    padding: '4px 16px', borderRadius: 100, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    color: sel ? P.cream : P.navy,
                    border: sel ? 'none' : `1px solid ${P.border}`,
                    background: sel ? P.navy : 'transparent',
                  }}>
                  <Flag code={c.code} size={14} /> {c.name}
                </button>
              );
            })}
          </div>

          <Dropdown
            value={year}
            options={years.map(y => ({ value: y, label: y }))}
            onChange={v => { setSelectedYear(v); setSelectedResponse(null); }}
          />

          <Dropdown
            value={topicId}
            options={availableTopics.map(t => ({ value: t.id, label: t.label }))}
            onChange={v => { setSelectedTopicId(v); setSelectedResponse(null); }}
            maxWidth={320}
          />
        </div>

        {/* Header */}
        {activeVarCode && (
          <div className="fade-in" style={{
            padding: '6px 0', display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
            borderBottom: `1px solid ${P.border}`,
          }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: P.navy }}>{varLabel}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: P.textMuted }}>{activeVarCode}</span>
            <span style={{ fontSize: 12, color: P.textMuted, marginLeft: 'auto' }}>{year}</span>
          </div>
        )}

        {/* Country profile cards */}
        {viewMode === 'pais' && socioData && (
          <div className="fade-in">
            <CountryProfile socioData={socioData} countries={selectedCountries} year={year} />
          </div>
        )}

        {/* PAIS MODE */}
        {viewMode === 'pais' && activeVarCode && (
          <>
            <div ref={distributionRef} className="export-parent responsive-grid-3 fade-in" style={{
              display: 'grid',
              gridTemplateColumns: isMultiCountry ? `repeat(${selectedCountries.length}, 1fr)` : '1fr',
              gap: 10,
            }}>
              {selectedCountries.map(code => {
                const c = COUNTRIES.find(x => x.code === code)!;
                const vd = countryVarData[code];
                return (
                  <div key={code} style={{
                    background: P.cardBg, borderRadius: 6, border: `1px solid ${P.borderLight}`,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{
                      padding: '6px 10px', borderBottom: `2px solid ${COUNTRY_COLORS[code]}`,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Flag code={c.code} size={14} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: P.navy }}>{c.name}</span>
                      {vd && (
                        <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: P.textMuted, marginLeft: 'auto' }}>
                          n={vd.national.n.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '6px 4px', flex: 1 }}>
                      {vd ? (
                        <DistributionChart
                          distribution={vd.national.d}
                          onSelectResponse={setSelectedResponse}
                          selectedResponse={selectedResponse}
                          orderedKeys={isMultiCountry ? unifiedOrder : undefined}
                          height={isMultiCountry ? 220 : 280}
                        />
                      ) : (
                        <div style={{ color: P.textMuted, padding: 16, textAlign: 'center', fontSize: 12 }}>
                          No data for {year}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Export button for distribution section */}
              {csvData && (
                <div style={{ position: 'absolute', top: 4, right: 4 }}>
                  <ExportButton targetRef={distributionRef} filename={`distribucion-${topicId}-${year}`} csvData={csvData} />
                </div>
              )}
            </div>

            {isMultiCountry && mapValues.length > 0 && (scoreMap || topResponse) && (
              <div className="fade-in" style={{ background: P.cardBg, borderRadius: 6, border: `1px solid ${P.borderLight}`, overflow: 'hidden' }}>
                <div style={{ padding: '6px 10px', borderBottom: `1px solid ${P.border}`, fontWeight: 700, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: P.navy }}>
                  Comparative Map — {year} — {scoreMap ? `Score 0–${scoreMax}` : `"${shortLabel(topResponse!)}"`}
                </div>
                <CompareMap
                  countryValues={mapValues}
                  selectedResponse={topResponse}
                  isScore={!!scoreMap}
                  scoreRange={scoreRange}
                  height={280}
                />
              </div>
            )}

            {timeSeriesCard}
          </>
        )}

        {/* REGION MODE */}
        {viewMode === 'region' && activeVarCode && (
          <>
            <div className="responsive-grid-3 fade-in" style={{
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
                    background: P.cardBg, borderRadius: 6, border: `1px solid ${P.borderLight}`,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{
                      padding: '6px 10px', borderBottom: `2px solid ${COUNTRY_COLORS[code]}`,
                      fontSize: 13, fontWeight: 600, color: P.navy, display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Flag code={c.code} size={14} />
                      <span>{c.name} — {year}</span>
                      {scoreMap ? (
                        <span style={{ fontWeight: 400, color: P.textMuted, fontSize: 11 }}> | Score 0–{scoreMax}</span>
                      ) : topResponse ? (
                        <span style={{ fontWeight: 400, color: P.textMuted, fontSize: 11 }}> | {shortLabel(topResponse)}</span>
                      ) : null}
                    </div>
                    <div style={{ flex: 1, minHeight: 280 }}>
                      <Suspense fallback={mapFallback}>
                        <CountryMap
                          country={code}
                          variable={countryVarData[code] || null}
                          selectedResponse={topResponse}
                          numericMean={isNumeric}
                          scoreMap={scoreMap}
                          scoreRange={scoreRange}
                          regions={regions[code] || []}
                          onRegionClick={(r) => setRegionForCountry(code, r)}
                          selectedRegion={selRegion}
                        />
                      </Suspense>
                    </div>
                    {selRegion && regData && (
                      <div style={{ padding: '4px 10px', borderTop: `1px solid ${P.border}`, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: P.navy }}>
                        <strong>{selRegion}</strong> | {scoreMap ? (() => {
                          const s = computeScore(regData.d, scoreMap);
                          return s !== null ? `Score: ${s.toFixed(2)} / ${scoreMax}` : 'Score: —';
                        })() : isNumeric ? (() => {
                          let mean = 0;
                          for (const [k, v] of Object.entries(regData.d)) { const n = parseFloat(k); if (!isNaN(n)) mean += n * v; }
                          return `Mean: ${mean.toFixed(1)}`;
                        })() : topResponse ? `${shortLabel(topResponse)}: ${((regData.d[topResponse] || 0) * 100).toFixed(1)}%` : ''} | n={regData.n}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="responsive-grid-3 fade-in" style={{
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
                    background: P.cardBg, borderRadius: 6, border: `1px solid ${P.borderLight}`,
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}>
                    <div style={{
                      padding: '6px 10px', borderBottom: `2px solid ${COUNTRY_COLORS[code]}`,
                      display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
                    }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: P.navy }}><Flag code={c.code} size={14} /> {c.name}</span>
                      {selRegion && <span style={{ fontSize: 11, color: P.textMuted }}>| {selRegion}</span>}
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
                          No data for {year}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {(() => {
              const regionCompareData = selectedCountries
                .filter(code => selectedRegions[code] && regionDataByCountry[code])
                .map(code => {
                  const regData = regionDataByCountry[code]!;
                  const c = COUNTRIES.find(x => x.code === code)!;
                  let value: number | null;
                  if (scoreMap) {
                    value = computeScore(regData.d, scoreMap);
                  } else if (topResponse) {
                    value = Math.round(findResponseValue(regData.d, topResponse) * 1000) / 10;
                  } else {
                    value = null;
                  }
                  return {
                    label: `${c.name} - ${selectedRegions[code]}`,
                    value: value ?? 0,
                    hasValue: value !== null && value > 0,
                    color: COUNTRY_COLORS[code],
                  };
                })
                .filter(d => d.hasValue)
                .map(({ label, value, color }) => ({ label, value, color }));

              if (regionCompareData.length < 2 || (!scoreMap && !topResponse)) return null;

              return (
                <div className="fade-in" style={{ background: P.cardBg, borderRadius: 6, border: `1px solid ${P.borderLight}`, padding: '10px 12px' }}>
                  <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase' as const, marginBottom: 4, color: P.navy }}>
                    Region Comparison — {year}
                  </div>
                  <div style={{ fontSize: 11, color: P.textMuted, marginBottom: 6 }}>
                    {scoreMap ? `Ordinal score 0–${scoreMax} (higher = more positive)` : `Response: "${shortLabel(topResponse!)}"`}
                  </div>
                  <CompareBar data={regionCompareData} height={200} isScore={!!scoreMap} scoreRange={scoreRange} />
                </div>
              );
            })()}

            {timeSeriesCard}
          </>
        )}

        {!activeVarCode && (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: P.textMuted, fontSize: 13,
          }}>
            No data for this topic in {year}
          </div>
        )}
      </div>
    </div>
  );
}
