export interface Distribution {
  [value: string]: number;
}

export interface RegionStats {
  distribution: Distribution;
  n: number;
  n_weighted: number;
  mean?: number;
}

export interface VariableStats {
  code: string;
  label: string;
  national: RegionStats;
  regions: { [region: string]: RegionStats };
}

// survey_data.json: country -> year -> variable_code -> VariableStats
export type SurveyData = {
  [country: string]: {
    [year: string]: {
      [variableCode: string]: VariableStats;
    };
  };
};

export interface VariableMeta {
  code: string;
  label: string;
  isKey: boolean;
  values: string[];
}

// variables.json: variable_code -> VariableMeta
export type VariablesMap = { [code: string]: VariableMeta };

// regions.json: country_code -> region_name[]
export type RegionsMap = { [country: string]: string[] };

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  center: [number, number];
  zoom: number;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', center: [-38.4, -63.6], zoom: 4 },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', center: [-23.4, -58.4], zoom: 6 },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', center: [-32.5, -55.8], zoom: 7 },
];

export type ViewMode = 'dashboard' | 'explorer' | 'compare';
