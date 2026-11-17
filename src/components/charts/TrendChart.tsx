import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  unit?: string;
  kind?: 'line' | 'area' | 'bar';
  rightAxis?: boolean;
  dashed?: boolean;
}

interface TrendChartProps<T extends object> {
  /** Rows must include a `label` key used for the x-axis. */
  data: T[];
  series: ChartSeries[];
  height?: number;
  formatLeft?: (value: number) => string;
  formatRight?: (value: number) => string;
}

interface TooltipItem {
  dataKey?: string | number;
  value?: number | string | null;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  series: ChartSeries[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-[#22354d] bg-[#0d1727] px-3 py-2 text-[11px] text-[#e8f1fc] shadow-xl">
      <p className="mb-1 font-medium text-[#93a7bf]">{label}</p>
      <ul className="space-y-0.5">
        {payload.map((item) => {
          const config = series.find((entry) => entry.key === item.dataKey);
          if (item.value == null) return null;
          return (
            <li key={String(item.dataKey)} className="flex items-center gap-2 tabular">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} aria-hidden />
              <span className="text-[#93a7bf]">{config?.name ?? item.dataKey}</span>
              <span className="ml-auto font-medium">
                {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
                {config?.unit ? ` ${config.unit}` : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TrendChart<T extends object>({
  data,
  series,
  height = 230,
  formatLeft,
  formatRight,
}: TrendChartProps<T>) {
  const hasRight = series.some((entry) => entry.rightAxis);

  return (
    <div style={{ width: '100%', height }} role="img" aria-label={`Chart: ${series.map((entry) => entry.name).join(', ')}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: hasRight ? 0 : 6, left: -20, bottom: 0 }}>
          <defs>
            {series.map((entry) => (
              <linearGradient key={entry.key} id={`fill-${entry.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={entry.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="#7c8ea8" strokeOpacity={0.16} vertical={false} strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#8b9eb8', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            minTickGap={26}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#8b9eb8', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={48}
            domain={['auto', 'auto']}
            tickFormatter={formatLeft}
          />
          {hasRight ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#8b9eb8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={[0, 'auto']}
              tickFormatter={formatRight}
            />
          ) : null}
          <Tooltip content={<ChartTooltip series={series} />} cursor={{ stroke: '#22d3ee', strokeOpacity: 0.25 }} />
          <Legend
            verticalAlign="top"
            align="right"
            height={24}
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ fontSize: 10, color: '#8b9eb8' }}
          />
          {series.map((entry) => {
            if (entry.kind === 'bar') {
              return (
                <Bar
                  key={entry.key}
                  yAxisId={entry.rightAxis ? 'right' : 'left'}
                  dataKey={entry.key}
                  name={entry.name}
                  fill={entry.color}
                  fillOpacity={0.65}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={14}
                />
              );
            }
            if (entry.kind === 'area') {
              return (
                <Area
                  key={entry.key}
                  yAxisId={entry.rightAxis ? 'right' : 'left'}
                  type="monotone"
                  dataKey={entry.key}
                  name={entry.name}
                  stroke={entry.color}
                  strokeWidth={1.8}
                  fill={`url(#fill-${entry.key})`}
                  connectNulls
                />
              );
            }
            return (
              <Line
                key={entry.key}
                yAxisId={entry.rightAxis ? 'right' : 'left'}
                type="monotone"
                dataKey={entry.key}
                name={entry.name}
                stroke={entry.color}
                strokeWidth={2}
                strokeDasharray={entry.dashed ? '4 4' : undefined}
                dot={false}
                activeDot={{ r: 3 }}
                connectNulls
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
