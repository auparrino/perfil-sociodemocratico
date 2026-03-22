import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
  PieChart, Pie,
} from 'recharts';
import { getResponseColor } from '../utils/colors';
import { shortLabel, orderResponseKeys } from '../utils/responses';
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

export function DistributionChart({
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
    return <div style={{ color: '#7a9aad', padding: 20, textAlign: 'center' }}>Sin datos</div>;
  }

  const truncate = (s: string, max: number) =>
    s.length > max ? s.slice(0, max - 1) + '…' : s;

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
              label={({ short, value }: { short: string; value: number }) => `${truncate(short, 20)} ${value}%`}
              labelLine={false}
              style={{ fontSize: 11 }}
            >
              {entries.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={getResponseColor(entry.name, i)}
                  opacity={selectedResponse && selectedResponse !== entry.name ? 0.3 : 1}
                  cursor="pointer"
                  onClick={() => onSelectResponse?.(entry.name)}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) => `${v}%`}
              labelFormatter={(label: string) => {
                const e = entries.find(x => x.short === label);
                return e ? e.short : label;
              }}
            />
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
          <Tooltip
            formatter={(v: unknown) => `${v}%`}
            labelFormatter={(label: unknown) => {
              const s = String(label);
              const e = entries.find(x => x.short === s);
              return e ? e.short : s;
            }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {entries.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={getResponseColor(entry.name, i)}
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
}

// Small comparison chart for multiple countries/regions
interface CompareBarProps {
  data: { label: string; value: number; color: string }[];
  height?: number;
}

export function CompareBar({ data, height = 200 }: CompareBarProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 5, right: 20 }}>
        <XAxis dataKey="label" fontSize={11} />
        <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} fontSize={11} />
        <Tooltip formatter={(v: unknown) => `${Number(v).toFixed(1)}%`} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
