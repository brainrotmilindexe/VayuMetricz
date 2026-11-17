import { Clock3, Droplets, MapPin, Star, Sunrise, Sunset, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { WeatherSnapshot } from '../../types/weather';
import { clockForOffset, formatTime, longDate, timeAgo } from '../../utils/time';
import { convertTemperature, formatTemperature, formatWind, temperatureSymbol, windSymbol, windDirectionLabel } from '../../utils/units';
import { accentFor, conditionFor, heroGradient } from '../../utils/weatherCodes';
import { WeatherIcon } from './WeatherIcon';

function coordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? 'E' : 'W'}`;
  return `${lat}, ${lon}`;
}

export function CurrentWeather({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { settings, isSaved, toggleSaved, lastUpdated } = useApp();
  const { current, place } = snapshot;
  const condition = conditionFor(current.weatherCode);
  const gradient = heroGradient(condition.kind, current.isDay);
  const accent = accentFor(condition.kind);
  const saved = isSaved(place);
  const [clock, setClock] = useState(() => clockForOffset(snapshot.utcOffsetSeconds, settings.hour12));

  useEffect(() => {
    setClock(clockForOffset(snapshot.utcOffsetSeconds, settings.hour12));
    const timer = window.setInterval(
      () => setClock(clockForOffset(snapshot.utcOffsetSeconds, settings.hour12)),
      15000,
    );
    return () => window.clearInterval(timer);
  }, [snapshot.utcOffsetSeconds, settings.hour12]);

  const today = snapshot.daily[0];

  return (
    <section
      className="relative animate-rise overflow-hidden rounded-3xl border border-white/10"
      style={{ background: gradient }}
      aria-label="Current conditions"
    >
      {/* Atmosphere: layered light, a drifting glow and a large condition glyph. */}
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full opacity-70 blur-3xl animate-drift"
        style={{ background: `radial-gradient(circle, ${accent}66 0%, transparent 68%)` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/5" aria-hidden />
      <WeatherIcon
        code={current.weatherCode}
        isDay={current.isDay}
        size={260}
        strokeWidth={0.6}
        className="pointer-events-none absolute -bottom-10 right-2 text-white/12 sm:right-8"
      />

      <div className="relative z-10 p-5 text-white sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/60">
              <MapPin size={14} aria-hidden />
              <span className="text-[11px] font-medium uppercase tracking-[0.22em]">Current location</span>
            </div>
            <h1 className="mt-1.5 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {place.name}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {[place.admin1, place.country].filter(Boolean).join(', ') || coordinates(place.latitude, place.longitude)}
            </p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/55">
              <span className="tabular">{longDate(current.time)}</span>
              <span className="inline-flex items-center gap-1 tabular">
                <Clock3 size={11} aria-hidden /> {clock} local
              </span>
              <span className="tabular">{coordinates(place.latitude, place.longitude)}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleSaved(place)}
            aria-pressed={saved}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/20"
          >
            <Star size={14} className={saved ? 'fill-amber-300 text-amber-300' : ''} aria-hidden />
            {saved ? 'Saved location' : 'Save location'}
          </button>
        </div>

        <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <div className="flex items-start">
              <span className="font-display text-[clamp(4.5rem,15vw,8rem)] font-semibold leading-[0.85] tracking-tighter tabular">
                {Math.round(convertTemperature(current.temperature, settings.temperatureUnit))}
              </span>
              <span className="mt-2 font-display text-3xl text-white/70 sm:text-4xl">
                {settings.temperatureUnit === 'c' ? '°C' : '°F'}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <WeatherIcon code={current.weatherCode} isDay={current.isDay} size={26} className="text-white/90" />
              <p className="text-lg font-medium">{condition.label}</p>
              <p className="text-sm text-white/60">
                Feels like {formatTemperature(current.apparentTemperature, settings.temperatureUnit)}
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <span className="text-white/45">H</span>
                {formatTemperature(today?.temperatureMax ?? null, settings.temperatureUnit)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="text-white/45">L</span>
                {formatTemperature(today?.temperatureMin ?? null, settings.temperatureUnit)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Wind size={13} aria-hidden />
                {formatWind(current.windSpeed, settings.windUnit)} {windSymbol(settings.windUnit)}{' '}
                <span className="text-white/50">{windDirectionLabel(current.windDirection)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Droplets size={13} aria-hidden />
                {current.humidity.toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10 text-sm backdrop-blur-md sm:grid-cols-4 lg:grid-cols-2">
            <div className="bg-black/10 p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/50">
                <Sunrise size={12} aria-hidden /> Sunrise
              </p>
              <p className="mt-1 font-display text-lg tabular">{formatTime(today?.sunrise ?? null, settings.hour12)}</p>
            </div>
            <div className="bg-black/10 p-3.5">
              <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/50">
                <Sunset size={12} aria-hidden /> Sunset
              </p>
              <p className="mt-1 font-display text-lg tabular">{formatTime(today?.sunset ?? null, settings.hour12)}</p>
            </div>
            <div className="bg-black/10 p-3.5">
              <p className="text-[10px] uppercase tracking-widest text-white/50">Peak UV</p>
              <p className="mt-1 font-display text-lg tabular">
                {today?.uvIndexMax != null ? today.uvIndexMax.toFixed(1) : '—'}
              </p>
            </div>
            <div className="bg-black/10 p-3.5">
              <p className="text-[10px] uppercase tracking-widest text-white/50">Pressure</p>
              <p className="mt-1 font-display text-lg tabular">
                {current.pressureMsl != null ? `${current.pressureMsl.toFixed(0)} hPa` : '—'}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/45">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
          Open-Meteo forecast · updated {lastUpdated ? timeAgo(lastUpdated) : 'moments ago'} · {temperatureSymbol(settings.temperatureUnit)} ·
          local time {snapshot.timezoneAbbreviation || snapshot.timezone}
        </p>
      </div>
    </section>
  );
}
