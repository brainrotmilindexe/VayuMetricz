import {
  ArrowDown,
  Cloud,
  Droplets,
  Eye,
  Gauge,
  Navigation,
  Sun,
  Thermometer,
  Umbrella,
  Wind,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { WeatherSnapshot } from '../../types/weather';
import {
  formatTemperature,
  formatWind,
  humidityCategory,
  pressureCategory,
  uvCategory,
  visibilityCategory,
  windDirectionLabel,
  windSymbol,
} from '../../utils/units';
import { useUnits } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Unavailable } from '../common/States';

interface MetricProps {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  progress?: number;
  accent?: string;
  unavailable?: boolean;
}

function Metric({ icon, label, value, unit, sub, progress, accent = '#22d3ee', unavailable }: MetricProps) {
  return (
    <Card className="group relative overflow-hidden p-4">
      <div className="flex items-center justify-between text-muted">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em]">{label}</span>
        <span className="text-muted/80 transition-colors group-hover:text-accent">{icon}</span>
      </div>
      {unavailable ? (
        <div className="mt-3">
          <Unavailable />
          <p className="mt-2 text-[11px] leading-snug text-muted/80">{sub}</p>
        </div>
      ) : (
        <>
          <p className="mt-2 flex items-baseline gap-1 font-display text-2xl font-semibold tracking-tight tabular">
            {value}
            {unit ? <span className="text-xs font-medium text-muted">{unit}</span> : null}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted">{sub}</p>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-line/60" aria-hidden>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(2, Math.min(100, progress ?? 0))}%`,
                background: accent,
              }}
            />
          </div>
        </>
      )}
    </Card>
  );
}

export function MetricGrid({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { temperatureUnit, windUnit } = useUnits();
  const { current } = snapshot;

  const humidity = current.humidity;
  const dewPoint = current.dewPoint;
  const visibilityKm = current.visibility != null ? current.visibility / 1000 : null;
  const uv = current.uvIndex;
  const uvInfo = uvCategory(uv);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      <Metric
        icon={<Droplets size={15} />}
        label="Humidity"
        value={humidity != null ? `${humidity.toFixed(0)}` : '—'}
        unit="%"
        sub={humidityCategory(humidity)}
        progress={humidity ?? 0}
        accent="#38bdf8"
      />
      <Metric
        icon={<Wind size={15} />}
        label="Wind"
        value={formatWind(current.windSpeed, windUnit)}
        unit={windSymbol(windUnit)}
        sub={`From ${windDirectionLabel(current.windDirection)} · ${current.windDirection.toFixed(0)}°`}
        progress={(current.windSpeed / 60) * 100}
        accent="#22d3ee"
      />
      <Metric
        icon={<Navigation size={15} />}
        label="Wind direction"
        value={windDirectionLabel(current.windDirection)}
        unit={`${current.windDirection.toFixed(0)}°`}
        sub="Meteorological bearing the wind arrives from"
        progress={(current.windDirection / 360) * 100}
        accent="#5eead4"
      />
      <Metric
        icon={<ArrowDown size={15} />}
        label="Wind gusts"
        value={current.windGusts != null ? formatWind(current.windGusts, windUnit) : '—'}
        unit={windSymbol(windUnit)}
        sub={
          current.windGusts != null
            ? `Gusts ${formatWind(current.windGusts - current.windSpeed, windUnit)} above sustained wind`
            : 'Gusts were not reported for this location.'
        }
        progress={current.windGusts != null ? (current.windGusts / 90) * 100 : 0}
        accent="#2dd4bf"
        unavailable={current.windGusts == null}
      />
      <Metric
        icon={<Gauge size={15} />}
        label="Pressure"
        value={current.pressureMsl != null ? current.pressureMsl.toFixed(0) : '—'}
        unit="hPa"
        sub={pressureCategory(current.pressureMsl)}
        progress={current.pressureMsl != null ? ((current.pressureMsl - 970) / 80) * 100 : 0}
        accent="#a78bfa"
        unavailable={current.pressureMsl == null}
      />
      <Metric
        icon={<Eye size={15} />}
        label="Visibility"
        value={visibilityKm != null ? visibilityKm.toFixed(1) : '—'}
        unit="km"
        sub={visibilityCategory(current.visibility)}
        progress={visibilityKm != null ? (visibilityKm / 25) * 100 : 0}
        accent="#7dd3fc"
        unavailable={visibilityKm == null}
      />
      <Metric
        icon={<Sun size={15} />}
        label="UV index"
        value={uv != null ? uv.toFixed(1) : '—'}
        sub={uv != null ? `${uvInfo.label} · ${uv >= 3 ? 'protection advised midday' : 'low risk'}` : 'UV is unavailable for this location.'}
        progress={uv != null ? (uv / 12) * 100 : 0}
        accent={uvInfo.color}
        unavailable={uv == null}
      />
      <Metric
        icon={<Thermometer size={15} />}
        label="Dew point"
        value={dewPoint != null ? formatTemperature(dewPoint, temperatureUnit, 1) : '—'}
        sub={
          dewPoint != null
            ? `Air ${formatTemperature(current.temperature - dewPoint, temperatureUnit, 1)} warmer than dew point`
            : 'Dew point is unavailable for this location.'
        }
        progress={dewPoint != null ? ((dewPoint + 10) / 40) * 100 : 0}
        accent="#60a5fa"
        unavailable={dewPoint == null}
      />
      <Metric
        icon={<Cloud size={15} />}
        label="Cloud cover"
        value={current.cloudCover != null ? current.cloudCover.toFixed(0) : '—'}
        unit="%"
        sub={
          current.cloudCover == null
            ? 'Cloud cover is unavailable.'
            : current.cloudCover > 80
              ? 'Overcast sky'
              : current.cloudCover > 40
                ? 'Partly cloudy sky'
                : 'Mostly clear sky'
        }
        progress={current.cloudCover ?? 0}
        accent="#94a3b8"
        unavailable={current.cloudCover == null}
      />
      <Metric
        icon={<Umbrella size={15} />}
        label="Precipitation"
        value={current.precipitation.toFixed(1)}
        unit="mm"
        sub="Measured in the current observation period"
        progress={(current.precipitation / 8) * 100}
        accent="#38bdf8"
      />
    </div>
  );
}
