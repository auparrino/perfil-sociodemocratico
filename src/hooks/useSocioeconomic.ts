import { useState, useEffect } from 'react';

export interface IndicatorMeta {
  label: string;
  unit: string;
  format: 'number' | 'percent';
  decimals: number;
  values: Record<string, Record<string, number>>; // country → year → value
}

export interface SocioeconomicData {
  countries: string[];
  years: string[];
  indicators: Record<string, IndicatorMeta>;
}

export function useSocioeconomic(): SocioeconomicData | null {
  const [data, setData] = useState<SocioeconomicData | null>(null);

  useEffect(() => {
    fetch('/data/socioeconomic.json')
      .then(r => r.json())
      .then(setData)
      .catch(err => console.error('Failed to load socioeconomic data:', err));
  }, []);

  return data;
}
