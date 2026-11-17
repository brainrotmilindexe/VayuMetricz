import { CloudAlert, Gauge, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp, useUnits } from '../../context/AppContext';
import {
  confidenceFor,
  fetchEnsemble,
  type ConfidenceLevel,
  type EnsembleSnapshot,
} from '../../services/ensembleApi';
import { formatHour, shortDate, weekdayShort } from '../../utils/time';
import { formatTemperature } from '../../utils/units';
import { Card } from '../common/Card';

interface BandTooltipProps {
  active?: boolean;
  payload?: { payload: { label: string; low: number; median: number; band: number } }[];
  label?: string;
  unit: 'c' | 'f';
}

function BandTooltip({ active, payload, label, unit }: BandTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-[11px] shadow-soft">
      <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-medium tabular">Median {formatTemperature(row.median, unit, 1)}</p>
      <p className="text-[10px] tabular text-muted">
        Range {formatTemperature(row.low, unit, 1)} – {formatTemperature(row.low + row.band, unit, 1)}
      </p>
    </div>
  );
}

/**
 * Forecast confidence from the GFS 0.25° ensemble.
 *
 * The shaded band is the 10th–90th percentile across 30 model members; the line
 * is the median. A narrow band means the models agree, a wide band means the
 * forecast could still go either way. This is measured spread, not a guess.
 */

// Light and dark have separate text colours so the badge keeps AA contrast in both themes.
const LEVEL_STYLES: Record<ConfidenceLevel, string> = {
  high: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300',
  moderate: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:border-amber-400/30 dark:text-amber-300',
  low: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:border-rose-400/30 dark:text-rose-300',
};

export function ForecastConfidence() {
  const { place } = useApp();
  const { temperatureUnit } = useUnits();
  const [data, setData] = useState<EnsembleSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetchEnsemble(place, { signal: controller.signal })
      .then((snapshot) => {
        if (cancelled) return;
        setData(snapshot);
      })
      .catch((cause: Error) => {
        if (cancelled || cause.name === 'AbortError') return;
        setError(cause.message || 'Ensemble forecast unavailable for this location.');
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [place]);

  const chart = useMemo(() => {
    if (!data) return [];
    return data.hours
      .filter((_, index) => index % 3 === 0)
      .slice(0, 56)
      .map((hour) => ({
        label: `${weekdayShort(hour.time)} ${formatHour(hour.time)}`,
        day: weekdayShort(hour.time),
        low: Number(hour.p10.toFixed(1)),
        band: Number((hour.p90 - hour.p10).toFixed(1)),
        median: Number(hour.p50.toFixed(1)),
      }));
  }, [data]);

  const days = useMemo(() => {
    if (!data) return [];
    const grouped = new Map<string, number[]>();
    data.hours.forEach((hour) => {
      const key = hour.time.slice(0, 10);
      const list = grouped.get(key) ?? [];
      list.push(hour.spread);
      grouped.set(key, list);
    });
    return Array.from(grouped.entries())
      .slice(0, 7)
      .map(([date, spreads]) => {
        const mean = spreads.reduce((sum, value) => sum + value, 0) / spreads.length;
        const confidence = confidenceFor(mean);
        return { date, mean, ...confidence };
      });
  }, [data]);

  const overallSpread = useMemo(() => {
    if (!days.length) return null;
    const firstThree = days.slice(0, 3);
    return firstThree.reduce((sum, day) => sum + day.mean, 0) / firstThree.length;
  }, [days]);

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold tracking-tight text-ink">
            <Gauge size={14} className="text-accent" aria-hidden /> Forecast confidence
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {data
              ? `Spread across ${data.memberCount} GFS ensemble members — a narrow band means the models agree`
              : 'How much the models disagree about the next few days'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-[11px] text-muted">
          <Loader2 size={13} className="animate-spin text-accent" /> Loading ensemble members…
        </div>
      ) : error ? (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-line/70 bg-panel/40 p-3 text-[11px] text-muted">
          <CloudAlert size={13} className="mt-0.5 shrink-0 text-amber-300" />
          <span>
            {error} Ensemble data is only available for some regions — the rest of the forecast is unaffected.
          </span>
        </div>
      ) : (
        <>
          {overallSpread != null ? (
            <p className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${LEVEL_STYLES[confidenceFor(overallSpread).level]}`}
              >
                <ShieldCheck size={10} /> {confidenceFor(overallSpread).label}
              </span>
              Next three days average a {overallSpread.toFixed(1)}°C spread between the 10th and 90th percentile
              members.
            </p>
          ) : null}

          <div className="mt-4 h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(var(--line) / 0.4)" strokeDasharray="3 6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }}
                  axisLine={false}
                  tickLine={false}
                  interval={7}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgb(var(--muted))' }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(value: number) => formatTemperature(value, temperatureUnit)}
                />
                <Tooltip content={<BandTooltip unit={temperatureUnit} />} />
                <Area
                  type="monotone"
                  dataKey="low"
                  stackId="band"
                  stroke="none"
                  fill="transparent"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="band"
                  stackId="band"
                  stroke="none"
                  fill="url(#confidenceBand)"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {days.map((day) => (
              <li key={day.date} className="rounded-xl border border-line/70 bg-panel/40 p-2.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  {weekdayShort(`${day.date}T12:00`)}
                </p>
                <p className="mt-0.5 text-[11px] font-medium tabular">{shortDate(`${day.date}T12:00`)}</p>
                <p className={`mt-1.5 inline-flex rounded-md border px-1.5 py-0.5 text-[9.5px] font-medium ${LEVEL_STYLES[day.level]}`}>
                  {day.level === 'high' ? 'High' : day.level === 'moderate' ? 'Moderate' : 'Low'}
                </p>
                <p className="mt-1 text-[9.5px] tabular text-muted">±{(day.mean / 2).toFixed(1)}°C spread</p>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[10px] leading-relaxed text-muted">
            Shaded band: 10th–90th percentile of 30 perturbed GFS runs; line: median. This is a measure of forecast
            uncertainty from model spread, not an official confidence statement.
          </p>
        </>
      )}
    </Card>
  );
}
