import { useMemo, useState, type ReactNode } from 'react';
import { useUnits } from '../../context/AppContext';
import type { WeatherSnapshot } from '../../types/weather';
import { floorToHour, formatHour, formatHourShort, weekdayShort } from '../../utils/time';
import { convertTemperature, convertWind, formatWind, uvCategory, windDirectionLabel, windSymbol } from '../../utils/units';
import { Card } from '../common/Card';
import { Segmented } from '../common/Segmented';
import { TrendChart, type ChartSeries } from './TrendChart';

type Range = '24' | '48' | '168';

interface Row {
  label: string;
  temperature: number | null;
  apparent: number | null;
  precipitationProbability: number | null;
  precipitation: number | null;
  wind: number | null;
  gust: number | null;
  humidity: number | null;
  pressure: number | null;
  uv: number | null;
  direction: number | null;
}

function ChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold tracking-tight">{title}</h3>
          <p className="text-[11px] text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function AnalyticsCharts({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { temperatureUnit, windUnit, hour12 } = useUnits();
  const [range, setRange] = useState<Range>('24');

  const rows = useMemo<Row[]>(() => {
    const hours = Number(range);
    const start = Math.max(0, snapshot.hourly.findIndex((point) => point.time >= floorToHour(snapshot.current.time)));
    return snapshot.hourly.slice(start, start + hours).map((point) => ({
      label:
        hours <= 48
          ? formatHour(point.time, hour12)
          : `${weekdayShort(point.time)} ${formatHourShort(point.time, hour12)}`,
      temperature: point.temperature != null ? Math.round(convertTemperature(point.temperature, temperatureUnit) * 10) / 10 : null,
      apparent:
        point.apparentTemperature != null
          ? Math.round(convertTemperature(point.apparentTemperature, temperatureUnit) * 10) / 10
          : null,
      precipitationProbability:
        point.precipitationProbability != null ? Math.round(point.precipitationProbability) : null,
      precipitation: point.precipitation != null ? Math.round(point.precipitation * 10) / 10 : null,
      wind: point.windSpeed != null ? Math.round(convertWind(point.windSpeed, windUnit) * 10) / 10 : null,
      gust: point.windGusts != null ? Math.round(convertWind(point.windGusts, windUnit) * 10) / 10 : null,
      humidity: point.humidity != null ? Math.round(point.humidity) : null,
      pressure: point.pressure != null ? Math.round(point.pressure * 10) / 10 : null,
      uv: point.uvIndex != null ? Math.round(point.uvIndex * 10) / 10 : null,
      direction: point.windDirection != null ? Math.round(point.windDirection) : null,
    }));
  }, [snapshot, range, temperatureUnit, windUnit, hour12]);

  const temperatureSeries: ChartSeries[] = [
    { key: 'temperature', name: `Temperature (${temperatureUnit === 'c' ? '°C' : '°F'})`, color: '#22d3ee', kind: 'area' },
    { key: 'apparent', name: `Feels like (${temperatureUnit === 'c' ? '°C' : '°F'})`, color: '#a78bfa', dashed: true },
  ];
  const precipitationSeries: ChartSeries[] = [
    { key: 'precipitation', name: 'Precipitation (mm)', color: '#38bdf8', kind: 'area' },
    { key: 'precipitationProbability', name: 'Probability (%)', color: '#60a5fa', kind: 'bar', rightAxis: true },
  ];
  const windSeries: ChartSeries[] = [
    { key: 'wind', name: `Wind (${windSymbol(windUnit)})`, color: '#2dd4bf' },
    { key: 'gust', name: `Gusts (${windSymbol(windUnit)})`, color: '#f472b6', dashed: true },
  ];
  const humiditySeries: ChartSeries[] = [{ key: 'humidity', name: 'Relative humidity (%)', color: '#38bdf8', kind: 'area' }];
  const pressureSeries: ChartSeries[] = [{ key: 'pressure', name: 'MSL pressure (hPa)', color: '#a78bfa' }];
  const uvSeries: ChartSeries[] = [{ key: 'uv', name: 'UV index', color: '#fbbf24', kind: 'bar' }];
  const directionSeries: ChartSeries[] = [{ key: 'direction', name: 'Wind direction (°)', color: '#5eead4' }];

  const temps = rows.map((row) => row.temperature).filter((value): value is number => value != null);
  const uvPeak = Math.max(...rows.map((row) => row.uv ?? 0), 0);
  const rainTotal = rows.reduce((sum, row) => sum + (row.precipitation ?? 0), 0);
  const pressureValues = rows.map((row) => row.pressure).filter((value): value is number => value != null);
  const windPeak = Math.max(...rows.map((row) => row.wind ?? 0), 0);
  const prevailing = snapshot.current.windDirection;

  const unitSuffix = temperatureUnit === 'c' ? '°' : '°';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">Atmospheric analytics</h2>
          <p className="text-xs text-muted">
            Hourly model data from Open-Meteo · {rows.length} hours · {temperatureUnit === 'c' ? '°C' : '°F'} and{' '}
            {windSymbol(windUnit)}
          </p>
        </div>
        <Segmented
          ariaLabel="Analytics time range"
          value={range}
          onChange={(value) => setRange(value)}
          options={[
            { value: '24', label: '24 h' },
            { value: '48', label: '48 h' },
            { value: '168', label: '7 days' },
          ]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Temperature"
          subtitle={
            temps.length
              ? `Range ${Math.min(...temps).toFixed(1)}${unitSuffix} to ${Math.max(...temps).toFixed(1)}${unitSuffix} · feels-like comparison`
              : 'No temperature data in this window'
          }
        >
          <TrendChart
            data={rows}
            series={temperatureSeries}
            formatLeft={(value) => `${value.toFixed(0)}${unitSuffix}`}
          />
        </ChartCard>

        <ChartCard
          title="Precipitation"
          subtitle={`${rainTotal.toFixed(1)} mm accumulated · probability on the right axis`}
        >
          <TrendChart
            data={rows}
            series={precipitationSeries}
            formatLeft={(value) => `${value.toFixed(1)}`}
            formatRight={(value) => `${value.toFixed(0)}%`}
          />
        </ChartCard>

        <ChartCard
          title="Wind"
          subtitle={`Peak ${formatWind(windPeak, windUnit)} ${windSymbol(windUnit)} · prevailing ${windDirectionLabel(prevailing)}`}
        >
          <TrendChart data={rows} series={windSeries} formatLeft={(value) => `${value.toFixed(0)}`} />
        </ChartCard>

        <ChartCard title="Wind direction" subtitle="Meteorological bearing the wind arrives from (0–360°)">
          <TrendChart
            data={rows}
            series={directionSeries}
            formatLeft={(value) => `${value.toFixed(0)}°`}
          />
        </ChartCard>

        <ChartCard title="Humidity" subtitle="Relative humidity at 2 m, hourly">
          <TrendChart data={rows} series={humiditySeries} formatLeft={(value) => `${value.toFixed(0)}%`} />
        </ChartCard>

        <ChartCard
          title="Atmospheric pressure"
          subtitle={
            pressureValues.length
              ? `MSL pressure ${Math.min(...pressureValues).toFixed(0)}–${Math.max(...pressureValues).toFixed(0)} hPa`
              : 'Pressure unavailable in this window'
          }
        >
          <TrendChart data={rows} series={pressureSeries} formatLeft={(value) => `${value.toFixed(0)}`} />
        </ChartCard>

        <ChartCard
          title="UV index"
          subtitle={`Peak ${uvPeak.toFixed(1)} · ${uvCategory(uvPeak).label.toLowerCase()} exposure`}
          action={
            <span className="rounded-md border border-line px-2 py-1 text-[10px] text-muted">
              Guidance: {uvPeak >= 6 ? 'protection required' : uvPeak >= 3 ? 'protection advised' : 'low risk'}
            </span>
          }
        >
          <TrendChart data={rows} series={uvSeries} formatLeft={(value) => `${value.toFixed(0)}`} />
        </ChartCard>

        <Card className="p-4">
          <h3 className="font-display text-sm font-semibold tracking-tight">How to read these charts</h3>
          <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-muted">
            <li>
              All series come from the Open-Meteo hourly forecast for this location. Gaps mean the provider returned no
              value for that hour — the line breaks instead of interpolating.
            </li>
            <li>
              Precipitation probability is a separate axis from accumulated millimetres, so the two series stay on honest
              scales.
            </li>
            <li>
              Feels-like temperature uses the provider's apparent-temperature model, which combines wind chill, humidity
              and radiation.
            </li>
            <li>
              Pressure is mean sea level pressure (hPa). UV index is the clear-sky modelled value at ground level.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
