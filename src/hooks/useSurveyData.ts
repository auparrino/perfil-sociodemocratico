import { useState, useEffect, useCallback } from 'react';

// Types inline to keep it simple
export interface Distribution { [value: string]: number }

export interface CompactStats {
  label: string;
  national: { d: Distribution; n: number; m?: number };
  regions: { [region: string]: { d: Distribution; n: number; m?: number } };
}

export type KeyData = {
  [country: string]: {
    [year: string]: {
      [code: string]: CompactStats;
    };
  };
};

export interface VariableMeta {
  code: string;
  label: string;
  isKey: boolean;
}

export type VariablesSlim = { [code: string]: VariableMeta };
export type RegionsMap = { [country: string]: string[] };

// Full data for a country (loaded on demand)
export interface FullVariableStats {
  code: string;
  label: string;
  national: { distribution: Distribution; n: number; n_weighted: number; mean?: number };
  regions: { [region: string]: { distribution: Distribution; n: number; n_weighted: number; mean?: number } };
}

export type CountryFullData = {
  [year: string]: {
    [code: string]: FullVariableStats;
  };
};

interface DataState {
  keyData: KeyData | null;
  variables: VariablesSlim | null;
  regions: RegionsMap | null;
  fullData: { [country: string]: CountryFullData };
  loading: boolean;
  error: string | null;
}

export function useSurveyData() {
  const [state, setState] = useState<DataState>({
    keyData: null,
    variables: null,
    regions: null,
    fullData: {},
    loading: true,
    error: null,
  });

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/key_data.json`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/variables_slim.json`).then(r => r.json()),
      fetch(`${import.meta.env.BASE_URL}data/regions.json`).then(r => r.json()),
    ])
      .then(([keyData, variables, regions]) => {
        setState({ keyData, variables, regions, fullData: {}, loading: false, error: null });
      })
      .catch(err => {
        setState(s => ({ ...s, loading: false, error: err.message }));
      });
  }, []);

  const loadFullCountry = useCallback(async (country: string) => {
    if (state.fullData[country]) return;
    try {
      const data = await fetch(`${import.meta.env.BASE_URL}data/by_country/${country}.json`).then(r => r.json());
      setState(s => ({
        ...s,
        fullData: { ...s.fullData, [country]: data },
      }));
    } catch (err) {
      console.error(`Failed to load full data for ${country}:`, err);
    }
  }, [state.fullData]);

  return { ...state, loadFullCountry };
}

export function getYearsForCountry(data: KeyData, country: string): string[] {
  if (!data[country]) return [];
  return Object.keys(data[country]).sort();
}

export function getCommonYears(data: KeyData, countries: string[]): string[] {
  const yearSets = countries.map(c => new Set(Object.keys(data[c] || {})));
  if (yearSets.length === 0) return [];
  const common = [...yearSets[0]].filter(y => yearSets.every(s => s.has(y)));
  return common.sort();
}
