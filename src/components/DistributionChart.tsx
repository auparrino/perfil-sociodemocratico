import { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';
import { getResponseColor, getNumericScaleColor, PALETTE } from '../utils/colors';
import { shortLabel, orderResponseKeys, isNumericScale, isNsNc, isResidual } from '../utils/responses';
import type { Distribution } from '../hooks/useSurveyData';

interface DistributionChartProps {
  distribution: Distribution;
  title?: string;
  type?: 'bar' | 'pie';
  height?: number;
  onSelectResponse?: (response: string) => void;
  selectedResponse?: string | null;
  orderedKeys?: string[]; // unified order for cross-chart consistency
}

export const DistributionChart = memo(function DistributionChart({
  distribution,
  title,
  type = 'bar',
  height = 280,
  onSelectResponse,
  selectedResponse,
  orderedKeys,
}: DistributionChartProps) {
  const entries = orderedKeys
    ? orderedKeys
        .map(name => ({ name, short: shortLabel(name), value: Math.round((distribution[name] || 0) * 1000) / 10 }))
        .filter(e => e.value > 0)
    : (() => {
        const keys = Object.keys(distribution);
        const ordered = orderResponseKeys(keys, (k) => distribution[k] || 0);
        return ordered
          .map(name => ({ name, short: shortLabel(name), value: Math.round((distribution[name] || 0) * 1000) / 10 }))
          .filter(e => e.value > 0);
      })();

  if (entries.length === 0) {
    return <div style={{ color: 'rgba(0,48,73,0.50)', padding: 16, textAlign: 'center', fontSize: 12 }}>No data</div>;
  }

  // Detect if this is a numeric scale for gradient coloring
  const allKeys = orderedKeys || Object.keys(distribution);
  const numeric = isNumericScale(allKeys);
  const numericCount = numeric ? entries.filter(e => !isNsNc(e.name) && !isResidual(e.name)).length : 0;

  function getEntryColor(entry: { name: string }, index: number): string {
    if (numeric) {
      if (isNsNc(entry.name) || isResidual(entry.name)) return 'rgba(0,48,73,0.15)';
      return getNumericScaleColor(index, numericCount);
    }
    return getResponseColor(entry.name, index);
  }

  const truncate = (s: string, max: number) =>
    s.length > max ? s.slice(0, max - 1) + '\u2026' : s;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fmtValue = (v: any) => `${v}%`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fmtLabel = (label: any) => {
    const s = String(label);
    const e = entries.find(x => x.short === s);
    return e ? e.short : s;
  };

  if (type === 'pie') {
    return (
      <div>
        {title && <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{title}</div>}
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={entries}
              dataKey="value"
              nameKey="short"
              cx="50%"
              cy="50%"
              outerRadius={height / 3}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={(props: any) => `${truncate(String(props.short ?? ''), 20)} ${props.value}%`}
              labelLine={false}
              style={{ fontSize: 11 }}
            >
              {entries.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={getEntryColor(entry, i)}
                  opacity={selectedResponse && selectedResponse !== entry.name ? 0.3 : 1}
                  cursor="pointer"
                  onClick={() => onSelectResponse?.(entry.name)}
                />
              ))}
            </Pie>
            <Tooltip formatter={fmtValue} labelFormatter={fmtLabel} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div>
      {title && <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 13 }}>{title}</div>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={entries} layout="vertical" margin={{ left: 10, right: 30 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
          <YAxis
            type="category"
            dataKey="short"
            width={180}
            fontSize={11}
            tickFormatter={v => truncate(v, 35)}
          />
          <Tooltip formatter={fmtValue} labelFormatter={fmtLabel} labelStyle={{ fontWeight: 600 }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} animationDuration={400} animationEasing="ease-out">
            {entries.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={getEntryColor(entry, i)}
                opacity={selectedResponse && selectedResponse !== entry.name ? 0.3 : 1}
                cursor="pointer"
                onClick={() => onSelectResponse?.(entry.name)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// Small comparison chart for multiple countries/regions
interface CompareBarProps {
  data: { label: string; value: number; color: string }[];
  height?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fmtCompare = (v: any) => `${Number(v).toFixed(1)}%`;

export const CompareBar = memo(function CompareBar({ data, height = 200 }: CompareBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 5, right: 20 }}>
        <XAxis dataKey="label" fontSize={11} />
        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
        <Tooltip formatter={fmtCompare} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={400} animationEasing="ease-out">
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});
