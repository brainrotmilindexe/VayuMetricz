import { AlertTriangle, CloudLightning, Info, ShieldAlert, Wind } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { WeatherSnapshot } from '../../types/weather';
import { formatHour } from '../../utils/time';
import { formatWind, windSymbol } from '../../utils/units';
import { conditionFor } from '../../utils/weatherCodes';
import { Card } from '../common/Card';

interface Hazard {
  id: string;
  title: string;
  detail: string;
  time: string;
  icon: 'storm' | 'rain' | 'wind' | 'visibility';
}

/** Forecast-derived flags. These are NOT official warnings and are labelled as such. */
function deriveHazards(snapshot: WeatherSnapshot, windUnit: 'kmh' | 'mph' | 'ms' | 'kn', hour12: boolean): Hazard[] {
  const hazards: Hazard[] = [];
  const window = snapshot.hourly.slice(0, 48);

  const storm = window.find((point) => point.weatherCode != null && point.weatherCode >= 95);
  if (storm) {
    hazards.push({
      id: 'storm',
      title: 'Thunderstorm conditions in the forecast',
      detail: `Model output shows ${conditionFor(storm.weatherCode).label.toLowerCase()} around ${formatHour(storm.time, hour12)}. Check your national meteorological service for official warnings.`,
      time: formatHour(storm.time, hour12),
      icon: 'storm',
    });
  }

  const heavyRain = window.find((point) => (point.precipitation ?? 0) >= 4);
  if (heavyRain) {
    hazards.push({
      id: 'rain',
      title: 'Heavy hourly rainfall possible',
      detail: `${(heavyRain.precipitation ?? 0).toFixed(1)} mm is forecast in a single hour around ${formatHour(heavyRain.time, hour12)}; surface water may accumulate.`,
      time: formatHour(heavyRain.time, hour12),
      icon: 'rain',
    });
  }

  const gusty = window.find((point) => (point.windGusts ?? 0) >= 55);
  if (gusty) {
    hazards.push({
      id: 'wind',
      title: 'Strong wind gusts forecast',
      detail: `Gusts reach ${formatWind(gusty.windGusts, windUnit)} ${windSymbol(windUnit)} around ${formatHour(gusty.time, hour12)}.`,
      time: formatHour(gusty.time, hour12),
      icon: 'wind',
    });
  }

  const poorVisibility = window.find((point) => point.visibility != null && point.visibility < 1000);
  if (poorVisibility) {
    hazards.push({
      id: 'visibility',
      title: 'Low visibility period',
      detail: `Visibility falls to ${((poorVisibility.visibility ?? 0) / 1000).toFixed(1)} km around ${formatHour(poorVisibility.time, hour12)}.`,
      time: formatHour(poorVisibility.time, hour12),
      icon: 'visibility',
    });
  }

  return hazards;
}

export function AlertsPanel({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { settings } = useApp();
  const hazards = deriveHazards(snapshot, settings.windUnit, settings.hour12);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-2">
        <ShieldAlert size={16} className="mt-0.5 text-accent" aria-hidden />
        <div>
          <h2 className="font-display text-sm font-semibold tracking-tight">Alerts &amp; warnings</h2>
          <p className="text-[11px] text-muted">Official alerts are not connected to this build</p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-line/70 bg-panel/40 p-3 text-[11px] leading-relaxed text-muted">
        <Info size={13} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          VayuMetricz reads forecast, air-quality and geocoding data from Open-Meteo, which does not include national
          warning feeds. No official alerts are shown or invented here. For authoritative warnings, consult your
          national meteorological agency.
        </p>
      </div>

      <h3 className="mt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
        Forecast highlights — not official warnings
      </h3>

      {hazards.length === 0 ? (
        <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] text-emerald-300">
          No thunderstorm, heavy-rain, strong-gust or low-visibility signals in the next 48 forecast hours.
        </div>
      ) : (
        <ul className="mt-2 space-y-2">
          {hazards.map((hazard) => (
            <li key={hazard.id} className="flex gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
              <span className="mt-0.5 text-amber-300">
                {hazard.icon === 'storm' ? (
                  <CloudLightning size={14} />
                ) : hazard.icon === 'wind' ? (
                  <Wind size={14} />
                ) : (
                  <AlertTriangle size={14} />
                )}
              </span>
              <div>
                <p className="text-xs font-medium text-ink">{hazard.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{hazard.detail}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wider text-amber-300/80">{hazard.time} · derived</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
