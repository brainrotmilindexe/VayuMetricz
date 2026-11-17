import { Wind } from 'lucide-react';
import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../../context/AppContext';
import { europeanAqiCategory, usAqiCategory } from '../../utils/units';
import { formatHour, formatTime } from '../../utils/time';
import type { AirQualitySnapshot } from '../../types/weather';
import { Card } from '../common/Card';
import { EmptyState } from '../common/States';

const POLLUTANTS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', detail: 'Fine particles below 2.5 µm' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³', detail: 'Coarse particles below 10 µm' },
  { key: 'ozone', label: 'O₃', unit: 'µg/m³', detail: 'Ground-level ozone' },
  { key: 'nitrogenDioxide', label: 'NO₂', unit: 'µg/m³', detail: 'Traffic and combustion' },
  { key: 'carbonMonoxide', label: 'CO', unit: 'µg/m³', detail: 'Incomplete combustion' },
  { key: 'sulphurDioxide', label: 'SO₂', unit: 'µg/m³', detail: 'Fuel sulphur emissions' },
] as const;

export function AirQualityPanel({ air }: { air: AirQualitySnapshot | null }) {
  const { settings, airError } = useApp();
  const aqi = air?.current.europeanAqi ?? null;
  const category = europeanAqiCategory(aqi);
  const usCategory = usAqiCategory(air?.current.usAqi ?? null);

  const trend = useMemo(() => {
    if (!air) return [];
    const nowIndex = air.hourly.findIndex((point) => point.time >= air.current.time.slice(0, 13));
    const start = nowIndex === -1 ? 0 : Math.max(0, nowIndex - 12);
    return air.hourly.slice(start, start + 36).map((point) => ({
      label: formatHour(point.time, settings.hour12),
      aqi: point.europeanAqi != null ? Math.round(point.europeanAqi) : null,
      pm25: point.pm25 != null ? Math.round(point.pm25 * 10) / 10 : null,
    }));
  }, [air, settings.hour12]);

  if (!air) {
    return (
      <Card className="p-4">
        <h2 className="font-display text-sm font-semibold tracking-tight">Air quality</h2>
        <p className="mb-3 text-[11px] text-muted">CAMS European AQI via Open-Meteo</p>
        <EmptyState
          title="Air quality is unavailable here"
          message={
            airError ??
            'The air quality service did not return data for this location. Open-Meteo covers global CAMS model output, but some coordinates — especially remote ocean areas — have no analysis.'
          }
          icon={<Wind size={20} />}
        />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-sm font-semibold tracking-tight">Air quality</h2>
          <p className="text-[11px] text-muted">CAMS European AQI · Open-Meteo Air Quality API</p>
        </div>
        <span className="rounded-lg border border-line px-2 py-1 text-[10px] text-muted tabular">
          {formatTime(air.current.time || null, settings.hour12)} observation
        </span>
      </div>

      <div className="mt-4 flex items-end gap-4">
        <div>
          <p className="font-display text-4xl font-semibold leading-none tabular" style={{ color: category.color }}>
            {aqi != null ? aqi.toFixed(0) : '—'}
          </p>
          <p className={`mt-1 text-xs font-medium ${category.tone}`}>{category.label}</p>
          <p className="text-[10px] text-muted">European AQI (0–100+)</p>
        </div>
        <div className="mb-1 border-l border-line pl-4 text-[11px] leading-relaxed text-muted">
          <p>
            US AQI <span className="font-medium text-ink tabular">{air.current.usAqi ?? '—'}</span> ·{' '}
            {usCategory.label}
          </p>
          <p className="mt-1 max-w-[15rem]">
            The two scales differ in breakpoints and averaging, so values are not interchangeable.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {POLLUTANTS.map((pollutant) => {
          const value = air.current[pollutant.key];
          return (
            <div key={pollutant.key} className="rounded-lg border border-line/60 bg-panel/40 px-3 py-2">
              <p className="flex items-baseline justify-between text-[10px] uppercase tracking-wider text-muted">
                {pollutant.label}
                <span className="text-[9px] normal-case tracking-normal">{pollutant.unit}</span>
              </p>
              <p className="mt-0.5 text-sm font-medium tabular">{value != null ? value.toFixed(1) : '—'}</p>
              <p className="text-[9px] leading-tight text-muted/80">{pollutant.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 h-32" aria-label="Air quality trend chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#7c8ea8" strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#8b9eb8', fontSize: 9 }} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis tick={{ fill: '#8b9eb8', fontSize: 9 }} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: '#0d1727', border: '1px solid #22354d', borderRadius: 10, fontSize: 11, color: '#e8f1fc' }}
              labelStyle={{ color: '#93a7bf' }}
            />
            <Area type="monotone" dataKey="aqi" name="European AQI" stroke="#a78bfa" strokeWidth={1.8} fill="url(#aqiGradient)" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-muted">
        Modelled hourly AQI from 12 hours before the latest observation through the next 24 hours. Values are model
        output, not measurements from a local monitoring station.
      </p>
    </Card>
  );
}
