import { ChevronLeft, ChevronRight, Compass, Droplets, Eye, Gauge, Sun, Thermometer, Wind } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useUnits } from '../../context/AppContext';
import type { HourlyPoint } from '../../types/weather';
import { floorToHour, formatHour } from '../../utils/time';
import {
  formatTemperature,
  formatWind,
  humidityCategory,
  uvCategory,
  windDirectionLabel,
  windSymbol,
} from '../../utils/units';
import { Card } from '../common/Card';
import { WeatherIcon } from './WeatherIcon';

function Detail({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-line/70 bg-panel/50 p-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted">
        {icon} {label}
      </p>
      <p className="mt-1 text-sm font-medium tabular">{value}</p>
    </div>
  );
}

export function HourlyForecast({
  hourly,
  currentTime,
  limit = 24,
}: {
  hourly: HourlyPoint[];
  currentTime: string;
  limit?: number;
}) {
  const { temperatureUnit, windUnit, hour12 } = useUnits();
  const scroller = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState(0);

  const items = useMemo(() => {
    const start = Math.max(0, hourly.findIndex((point) => point.time >= floorToHour(currentTime)));
    return hourly.slice(start, start + limit);
  }, [hourly, currentTime, limit]);

  useEffect(() => {
    setSelected(0);
  }, [items[0]?.time]);

  const active = items[selected];

  // Build the temperature series once in the active display unit.
  const trend = items.map((point) => ({
    label: formatHour(point.time, hour12),
    value:
      point.temperature == null
        ? null
        : temperatureUnit === 'c'
          ? Math.round(point.temperature * 10) / 10
          : Math.round((point.temperature * 1.8 + 32) * 10) / 10,
  }));

  const scrollBy = (direction: 1 | -1) => {
    scroller.current?.scrollBy({ left: direction * 320, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold tracking-tight">Hourly forecast</h2>
          <p className="text-[11px] text-muted">Next {items.length} hours · select an hour for detail</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scroll forecast earlier"
            className="rounded-lg border border-line p-1.5 text-muted transition hover:text-ink"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scroll forecast later"
            className="rounded-lg border border-line p-1.5 text-muted transition hover:text-ink"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="border-b border-line/70 px-4 pt-3">
        <div className="h-20 w-full" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="hourlyTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{
                  background: '#0d1727',
                  border: '1px solid #22354d',
                  borderRadius: 10,
                  fontSize: 11,
                  color: '#e8f1fc',
                }}
                labelStyle={{ color: '#93a7bf' }}
                formatter={(value) => [`${Number(value).toFixed(1)}°`, 'Temperature']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                strokeWidth={1.8}
                fill="url(#hourlyTrend)"
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div ref={scroller} className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-4 py-4">
        {items.map((point, index) => {
          const isActive = index === selected;
          return (
            <button
              key={point.time}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={isActive}
              className={[
                'flex min-w-[74px] snap-start flex-col items-center gap-2 rounded-xl border px-2.5 py-3 text-center transition',
                isActive
                  ? 'border-accent/50 bg-accent/10'
                  : 'border-line/60 bg-panel/30 hover:border-accent/30 hover:bg-panel/60',
              ].join(' ')}
            >
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                {index === 0 ? 'Now' : formatHour(point.time, hour12)}
              </span>
              <WeatherIcon
                code={point.weatherCode}
                isDay={point.isDay ?? true}
                size={22}
                className={isActive ? 'text-accent' : 'text-ink/80'}
              />
              <span className="font-display text-sm font-semibold tabular">
                {formatTemperature(point.temperature, temperatureUnit)}
              </span>
              <span className="flex items-center gap-0.5 text-[10px] tabular text-sky-400">
                <Droplets size={9} aria-hidden />
                {point.precipitationProbability != null ? `${point.precipitationProbability.toFixed(0)}%` : '—'}
              </span>
              <span className="text-[10px] tabular text-muted">
                {formatWind(point.windSpeed, windUnit)} {windSymbol(windUnit)}
              </span>
            </button>
          );
        })}
      </div>

      {active ? (
        <div className="grid grid-cols-2 gap-2 border-t border-line/70 px-4 py-4 sm:grid-cols-3 lg:grid-cols-6">
          <Detail
            label="Feels like"
            value={formatTemperature(active.apparentTemperature, temperatureUnit, 1)}
            icon={<Thermometer size={11} />}
          />
          <Detail
            label="Humidity"
            value={active.humidity != null ? `${active.humidity.toFixed(0)}%` : '—'}
            icon={<Droplets size={11} />}
          />
          <Detail
            label="Wind"
            value={`${formatWind(active.windSpeed, windUnit)} ${windSymbol(windUnit)} ${windDirectionLabel(active.windDirection)}`}
            icon={<Wind size={11} />}
          />
          <Detail
            label="Gusts"
            value={active.windGusts != null ? `${formatWind(active.windGusts, windUnit)} ${windSymbol(windUnit)}` : '—'}
            icon={<Compass size={11} />}
          />
          <Detail
            label="UV index"
            value={active.uvIndex != null ? `${active.uvIndex.toFixed(1)} · ${uvCategory(active.uvIndex).label}` : '—'}
            icon={<Sun size={11} />}
          />
          <Detail
            label="Pressure / humidity"
            value={`${active.pressure != null ? `${active.pressure.toFixed(0)} hPa` : '—'} · ${humidityCategory(active.humidity)}`}
            icon={<Gauge size={11} />}
          />
          <Detail
            label="Visibility"
            value={active.visibility != null ? `${(active.visibility / 1000).toFixed(1)} km` : '—'}
            icon={<Eye size={11} />}
          />
          <Detail
            label="Precipitation"
            value={`${active.precipitation != null ? active.precipitation.toFixed(1) : '0.0'} mm · ${active.precipitationProbability?.toFixed(0) ?? '—'}%`}
            icon={<Droplets size={11} />}
          />
        </div>
      ) : null}
    </Card>
  );
}
