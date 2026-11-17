import { Moon, Sun } from 'lucide-react';
import { useUnits } from '../../context/AppContext';
import type { WeatherSnapshot } from '../../types/weather';
import { formatDuration, formatTime, parseLocal } from '../../utils/time';
import { Card } from '../common/Card';
import { Unavailable } from '../common/States';

function minutesOfDay(iso: string): number {
  const parts = parseLocal(iso);
  return parts.hour * 60 + parts.minute;
}

export function SunPath({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { hour12 } = useUnits();
  const today = snapshot.daily[0];
  const now = minutesOfDay(snapshot.current.time);
  const sunriseMin = today?.sunrise ? minutesOfDay(today.sunrise) : null;
  const sunsetMin = today?.sunset ? minutesOfDay(today.sunset) : null;
  const solarNoon = sunriseMin != null && sunsetMin != null ? (sunriseMin + sunsetMin) / 2 : null;
  const isDay = sunriseMin != null && sunsetMin != null && now >= sunriseMin && now <= sunsetMin;
  const progress =
    sunriseMin != null && sunsetMin != null && sunsetMin > sunriseMin
      ? Math.min(1, Math.max(0, (now - sunriseMin) / (sunsetMin - sunriseMin)))
      : isDay
        ? 0.5
        : 0;

  // Position on a semicircular arc: x 10→190, y 92→18.
  const x = 10 + progress * 180;
  const y = 92 - Math.sin(Math.PI * progress) * 74;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold tracking-tight">Sun &amp; daylight</h2>
          <p className="text-[11px] text-muted">Today at this location</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[10px] text-muted">
          {isDay ? <Sun size={11} className="text-amber-300" /> : <Moon size={11} className="text-sky-300" />}
          {isDay ? 'Daylight' : 'Night'}
        </span>
      </div>

      <div className="relative mt-2">
        <svg viewBox="0 0 200 100" className="h-32 w-full" role="img" aria-label="Sun path across the sky today">
          <defs>
            <linearGradient id="sunArc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <path
            d="M10 92 A 90 74 0 0 1 190 92"
            fill="none"
            stroke="currentColor"
            className="text-line"
            strokeWidth="1.5"
            strokeDasharray="3 5"
          />
          <path
            d="M10 92 A 90 74 0 0 1 190 92"
            fill="none"
            stroke="url(#sunArc)"
            strokeWidth="2"
            strokeDasharray={`${progress * 283} 283`}
          />
          <line x1="10" y1="92" x2="190" y2="92" stroke="currentColor" className="text-line" strokeWidth="1" />
          <circle cx={x} cy={y} r="6.5" fill="#fbbf24" opacity="0.25" />
          <circle cx={x} cy={y} r="3.4" fill="#fde68a" />
        </svg>
        <div className="flex justify-between text-[10px] text-muted">
          <span>{today?.sunrise ? formatTime(today.sunrise, hour12) : '—'} sunrise</span>
          <span className="text-center">{solarNoon != null ? formatTime(localFromMinutes(solarNoon), hour12) : '—'} solar noon</span>
          <span>{today?.sunset ? formatTime(today.sunset, hour12) : '—'} sunset</span>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-line/60 bg-panel/40 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-muted">Daylight</dt>
          <dd className="mt-0.5 font-medium tabular">{formatDuration(today?.daylightSeconds ?? null)}</dd>
        </div>
        <div className="rounded-lg border border-line/60 bg-panel/40 px-3 py-2">
          <dt className="text-[10px] uppercase tracking-wider text-muted">Solar noon</dt>
          <dd className="mt-0.5 font-medium tabular">
            {solarNoon != null ? formatTime(localFromMinutes(solarNoon), hour12) : <Unavailable />}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        Sun position is interpolated between the provider's sunrise and sunset times. Solar noon is the midpoint of
        daylight — an approximation of true solar transit.
      </p>
    </Card>
  );
}

/** Convert minutes-from-midnight back into a local ISO string for formatting. */
function localFromMinutes(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = Math.round(minutes % 60);
  return `1970-01-01T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
