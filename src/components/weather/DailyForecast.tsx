import { ChevronDown, Droplets, Sun, Sunrise, Sunset, Wind } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useUnits } from '../../context/AppContext';
import type { WeatherSnapshot } from '../../types/weather';
import { formatDuration, formatHour, formatTime, shortDate, weekdayShort } from '../../utils/time';
import { formatTemperature, formatWind, windDirectionLabel, windSymbol } from '../../utils/units';
import { conditionFor } from '../../utils/weatherCodes';
import { Card } from '../common/Card';
import { WeatherIcon } from './WeatherIcon';

export function DailyForecast({
  snapshot,
  initialDay = null,
  title = 'Seven-day forecast',
}: {
  snapshot: WeatherSnapshot;
  initialDay?: number | null;
  title?: string;
}) {
  const { temperatureUnit, windUnit, hour12 } = useUnits();
  const [openDay, setOpenDay] = useState<number | null>(initialDay);
  const daily = snapshot.daily;
  const { globalMin, globalMax } = useMemo(() => {
    const mins = daily.map((day) => day.temperatureMin).filter((value): value is number => value != null);
    const maxes = daily.map((day) => day.temperatureMax).filter((value): value is number => value != null);
    return {
      globalMin: mins.length ? Math.min(...mins) : 0,
      globalMax: maxes.length ? Math.max(...maxes) : 1,
    };
  }, [daily]);

  const span = Math.max(1, globalMax - globalMin);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold tracking-tight">{title}</h2>
          <p className="text-[11px] text-muted">
            Daily min–max range shown against the week · tap a day for hourly detail
          </p>
        </div>
        <span className="hidden text-[10px] uppercase tracking-wider text-muted sm:block">
          {formatTemperature(globalMin, temperatureUnit)} – {formatTemperature(globalMax, temperatureUnit)}
        </span>
      </div>

      <ul className="divide-y divide-line/60">
        {daily.map((day, index) => {
          const condition = conditionFor(day.weatherCode);
          const isOpen = openDay === index;
          const left = day.temperatureMin != null ? ((day.temperatureMin - globalMin) / span) * 100 : 0;
          const width =
            day.temperatureMin != null && day.temperatureMax != null
              ? Math.max(6, ((day.temperatureMax - day.temperatureMin) / span) * 100)
              : 0;
          const hours = snapshot.hourly.filter((point) => point.time.slice(0, 10) === day.date);

          return (
            <li key={day.date}>
              <button
                type="button"
                onClick={() => setOpenDay(isOpen ? null : index)}
                aria-expanded={isOpen}
                className={[
                  'grid w-full grid-cols-[52px_1fr_auto] items-center gap-3 px-4 py-3 text-left transition sm:grid-cols-[64px_minmax(0,1fr)_90px_92px_minmax(120px,1.4fr)_84px]',
                  isOpen ? 'bg-accent/5' : 'hover:bg-panel/60',
                ].join(' ')}
              >
                <div>
                  <p className="text-xs font-semibold">{index === 0 ? 'Today' : weekdayShort(day.date)}</p>
                  <p className="text-[10px] text-muted">{shortDate(day.date)}</p>
                </div>

                <div className="flex min-w-0 items-center gap-2">
                  <WeatherIcon code={day.weatherCode} size={20} className="shrink-0 text-accent" />
                  <span className="truncate text-xs text-muted">{condition.label}</span>
                </div>

                <div className="hidden items-center gap-1 text-[11px] text-sky-400 sm:flex">
                  <Droplets size={10} aria-hidden />
                  {day.precipitationProbabilityMax != null
                    ? `${day.precipitationProbabilityMax.toFixed(0)}%`
                    : '—'}
                </div>

                <div className="hidden items-center gap-1 text-[11px] text-muted sm:flex">
                  <Wind size={10} aria-hidden />
                  {formatWind(day.windSpeedMax, windUnit)} {windSymbol(windUnit)}
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <span className="w-8 text-right text-[11px] tabular text-muted">
                    {formatTemperature(day.temperatureMin, temperatureUnit)}
                  </span>
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line/70">
                    <span
                      className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  </span>
                  <span className="w-8 text-[11px] font-medium tabular">
                    {formatTemperature(day.temperatureMax, temperatureUnit)}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 sm:hidden">
                  <span className="text-xs font-medium tabular">
                    {formatTemperature(day.temperatureMax, temperatureUnit)}
                  </span>
                  <span className="text-[11px] tabular text-muted">
                    {formatTemperature(day.temperatureMin, temperatureUnit)}
                  </span>
                </div>

                <div className="hidden justify-end sm:flex">
                  <ChevronDown
                    size={14}
                    className={['text-muted transition-transform', isOpen ? 'rotate-180 text-accent' : ''].join(' ')}
                    aria-hidden
                  />
                </div>
              </button>

              {isOpen ? (
                <div className="border-t border-line/60 bg-panel/40 px-4 py-4">
                  <div className="mb-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3 lg:grid-cols-6">
                    <div className="rounded-lg border border-line/60 px-3 py-2">
                      <p className="text-muted">Sunrise / sunset</p>
                      <p className="mt-0.5 font-medium tabular">
                        {formatTime(day.sunrise, hour12)} / {formatTime(day.sunset, hour12)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line/60 px-3 py-2">
                      <p className="text-muted">Daylight</p>
                      <p className="mt-0.5 font-medium tabular">{formatDuration(day.daylightSeconds)}</p>
                    </div>
                    <div className="rounded-lg border border-line/60 px-3 py-2">
                      <p className="text-muted">Precipitation</p>
                      <p className="mt-0.5 font-medium tabular">
                        {(day.precipitationSum ?? 0).toFixed(1)} mm
                      </p>
                    </div>
                    <div className="rounded-lg border border-line/60 px-3 py-2">
                      <p className="text-muted">Max UV</p>
                      <p className="mt-0.5 font-medium tabular">
                        {day.uvIndexMax != null ? day.uvIndexMax.toFixed(1) : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line/60 px-3 py-2">
                      <p className="text-muted">Wind / gusts</p>
                      <p className="mt-0.5 font-medium tabular">
                        {formatWind(day.windSpeedMax, windUnit)} / {formatWind(day.windGustsMax, windUnit)}{' '}
                        {windSymbol(windUnit)} {windDirectionLabel(day.windDirectionDominant)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line/60 px-3 py-2">
                      <p className="text-muted">Feels like range</p>
                      <p className="mt-0.5 font-medium tabular">
                        {formatTemperature(day.apparentMin, temperatureUnit)} –{' '}
                        {formatTemperature(day.apparentMax, temperatureUnit)}
                      </p>
                    </div>
                  </div>

                  {hours.length > 0 ? (
                    <div className="no-scrollbar overflow-x-auto">
                      <table className="w-full min-w-[560px] border-separate border-spacing-0 text-[11px]">
                        <thead>
                          <tr className="text-left text-muted">
                            <th className="sticky left-0 bg-panel/90 py-1.5 pr-3 font-medium">Hour</th>
                            {hours.map((hour) => (
                              <th key={hour.time} className="px-2 py-1.5 text-center font-medium tabular">
                                {formatHour(hour.time, hour12)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="tabular">
                          <tr>
                            <td className="sticky left-0 bg-panel/90 py-1.5 pr-3 text-muted">Temp</td>
                            {hours.map((hour) => (
                              <td key={hour.time} className="px-2 py-1.5 text-center">
                                {formatTemperature(hour.temperature, temperatureUnit)}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="sticky left-0 bg-panel/90 py-1.5 pr-3 text-muted">Rain</td>
                            {hours.map((hour) => (
                              <td key={hour.time} className="px-2 py-1.5 text-center text-sky-400">
                                {hour.precipitationProbability != null
                                  ? `${hour.precipitationProbability.toFixed(0)}%`
                                  : '—'}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="sticky left-0 bg-panel/90 py-1.5 pr-3 text-muted">Humidity</td>
                            {hours.map((hour) => (
                              <td key={hour.time} className="px-2 py-1.5 text-center text-muted">
                                {hour.humidity != null ? `${hour.humidity.toFixed(0)}%` : '—'}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="sticky left-0 bg-panel/90 py-1.5 pr-3 text-muted">
                              Wind ({windSymbol(windUnit)})
                            </td>
                            {hours.map((hour) => (
                              <td key={hour.time} className="px-2 py-1.5 text-center text-muted">
                                {formatWind(hour.windSpeed, windUnit)}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  <p className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Sun size={10} /> Solar data from Open-Meteo
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sunrise size={10} /> {formatTime(day.sunrise, hour12)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sunset size={10} /> {formatTime(day.sunset, hour12)}
                    </span>
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
