import { Check, Loader2, Scale } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../../context/AppContext';
import { fetchForecast } from '../../services/weatherApi';
import type { Place, WeatherSnapshot } from '../../types/weather';
import { formatTemperature, formatWind, windDirectionLabel, windSymbol } from '../../utils/units';
import { conditionFor } from '../../utils/weatherCodes';
import { Card } from '../common/Card';
import { EmptyState } from '../common/States';

const COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24'];

export function ComparePanel({ candidates }: { candidates: Place[] }) {
  const { settings } = useApp();
  const [selected, setSelected] = useState<string[]>(() => candidates.slice(0, 3).map((place) => place.id));
  const [snapshots, setSnapshots] = useState<Record<string, WeatherSnapshot>>({});
  const [failed, setFailed] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const missing = candidates.filter(
      (place) => selected.includes(place.id) && !snapshots[place.id] && !failed[place.id],
    );
    if (missing.length === 0) return;

    let cancelled = false;
    setLoading(true);
    Promise.allSettled(missing.map((place) => fetchForecast(place, { days: 7 }))).then((results) => {
      if (cancelled) return;
      const nextSnapshots: Record<string, WeatherSnapshot> = {};
      const nextFailures: Record<string, string> = {};
      results.forEach((result, index) => {
        const place = missing[index];
        if (result.status === 'fulfilled') nextSnapshots[place.id] = result.value;
        else nextFailures[place.id] = (result.reason as Error)?.message ?? 'Forecast unavailable';
      });
      setSnapshots((prev) => ({ ...prev, ...nextSnapshots }));
      setFailed((prev) => ({ ...prev, ...nextFailures }));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [candidates, selected, snapshots, failed]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev;
        return prev.filter((entry) => entry !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const chosen = useMemo(
    () => candidates.filter((place) => selected.includes(place.id)),
    [candidates, selected],
  );

  const chartData = chosen
    .map((place, index) => {
      const snapshot = snapshots[place.id];
      if (!snapshot) return null;
      return {
        name: place.name,
        High: snapshot.daily[0]?.temperatureMax ?? null,
        Low: snapshot.daily[0]?.temperatureMin ?? null,
        color: COLORS[index % COLORS.length],
      };
    })
    .filter((row): row is { name: string; High: number | null; Low: number | null; color: string } => row !== null);

  const rows: { label: string; render: (snapshot: WeatherSnapshot) => string }[] = [
    { label: 'Temperature', render: (s) => formatTemperature(s.current.temperature, settings.temperatureUnit, 1) },
    {
      label: 'Feels like',
      render: (s) => formatTemperature(s.current.apparentTemperature, settings.temperatureUnit, 1),
    },
    { label: 'Condition', render: (s) => conditionFor(s.current.weatherCode).label },
    { label: 'Humidity', render: (s) => `${s.current.humidity.toFixed(0)}%` },
    {
      label: 'Wind',
      render: (s) =>
        `${formatWind(s.current.windSpeed, settings.windUnit)} ${windSymbol(settings.windUnit)} ${windDirectionLabel(s.current.windDirection)}`,
    },
    {
      label: 'Rain probability',
      render: (s) =>
        s.daily[0]?.precipitationProbabilityMax != null
          ? `${s.daily[0].precipitationProbabilityMax.toFixed(0)}%`
          : '—',
    },
    {
      label: 'High / low',
      render: (s) =>
        `${formatTemperature(s.daily[0]?.temperatureMax ?? null, settings.temperatureUnit)} / ${formatTemperature(
          s.daily[0]?.temperatureMin ?? null,
          settings.temperatureUnit,
        )}`,
    },
    {
      label: 'Daylight',
      render: (s) =>
        s.daily[0]?.daylightSeconds != null
          ? `${(s.daily[0].daylightSeconds / 3600).toFixed(1)} h`
          : '—',
    },
  ];

  if (candidates.length < 2) {
    return (
      <EmptyState
        icon={<Scale size={20} />}
        title="Save more locations to compare"
        message="Comparison needs at least two saved locations. Search for a city, save it, and it will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-sm font-semibold">Compare locations</h3>
            <p className="text-[11px] text-muted">Pick 2–4 saved locations · current conditions from Open-Meteo</p>
          </div>
          {loading ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-muted">
              <Loader2 size={11} className="animate-spin" /> Loading comparison…
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {candidates.map((place) => {
            const active = selected.includes(place.id);
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => toggle(place.id)}
                aria-pressed={active}
                className={[
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition',
                  active
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-line bg-panel/40 text-muted hover:text-ink',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid h-3 w-3 place-items-center rounded-[3px] border',
                    active ? 'border-accent bg-accent/20' : 'border-line',
                  ].join(' ')}
                >
                  {active ? <Check size={8} /> : null}
                </span>
                {place.name}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <caption className="sr-only">Side-by-side weather comparison for selected locations</caption>
            <thead>
              <tr className="border-b border-line/70 text-left">
                <th className="px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted">Metric</th>
                {chosen.map((place, index) => (
                  <th key={place.id} className="px-4 py-2.5 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: COLORS[index % COLORS.length] }}
                        aria-hidden
                      />
                      <span className="truncate">{place.name}</span>
                    </span>
                    <span className="block text-[10px] font-normal text-muted">
                      {[place.admin1, place.country].filter(Boolean).join(', ')}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60 tabular">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-2 text-[11px] text-muted">{row.label}</td>
                  {chosen.map((place) => {
                    const snapshot = snapshots[place.id];
                    return (
                      <td key={place.id} className="px-4 py-2">
                        {snapshot ? row.render(snapshot) : failed[place.id] ? '—' : '…'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {chartData.length > 0 ? (
        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold">Today's temperature ranges</h3>
          <p className="mb-2 text-[11px] text-muted">
            Daily maximum and minimum in {settings.temperatureUnit === 'c' ? '°C' : '°F'}
          </p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid stroke="#7c8ea8" strokeOpacity={0.16} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#8b9eb8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#8b9eb8', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#0d1727',
                    border: '1px solid #22354d',
                    borderRadius: 10,
                    fontSize: 11,
                    color: '#e8f1fc',
                  }}
                  formatter={(value) =>
                    `${Number(value).toFixed(1)}${settings.temperatureUnit === 'c' ? '°C' : '°F'}`
                  }
                />
                <Bar dataKey="High" radius={[3, 3, 0, 0]} maxBarSize={22}>
                  {chartData.map((row) => (
                    <Cell key={`high-${row.name}`} fill={row.color} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Bar dataKey="Low" radius={[3, 3, 0, 0]} maxBarSize={22}>
                  {chartData.map((row) => (
                    <Cell key={`low-${row.name}`} fill={row.color} fillOpacity={0.35} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
