import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ROLE_ORDER, ROLE_LABELS } from '@shared/constants';
import type { WeekSnapshot } from '@shared/types';

const ROLE_COLORS = {
  manufacturer: '#00c9b1',
  distributor: '#3dd9c4',
  warehouse: '#6ae08c',
  retailer: '#7ed321',
};

interface Props {
  history: WeekSnapshot[];
}

export function CostChart({ history }: Props) {
  const data = history.map((snap) => {
    const row: Record<string, number> = { week: snap.week };
    for (const role of ROLE_ORDER) {
      row[role] = snap.nodes[role].totalCost;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="week"
          stroke="rgba(255,255,255,0.3)"
          tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.45)' }}
          label={{ value: 'Week', position: 'insideBottomRight', offset: -5, style: { fontSize: 12, fill: 'rgba(255,255,255,0.35)' } }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.3)"
          tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.45)' }}
          label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'rgba(255,255,255,0.35)' } }}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(10, 22, 40, 0.95)',
            border: '1px solid rgba(0, 201, 177, 0.2)',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#fff',
          }}
          labelFormatter={(v) => `Week ${v}`}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value: string) => ROLE_LABELS[value] ?? value}
        />
        {ROLE_ORDER.map((role) => (
          <Line
            key={role}
            type="monotone"
            dataKey={role}
            stroke={ROLE_COLORS[role]}
            strokeWidth={2}
            dot={false}
            name={role}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
