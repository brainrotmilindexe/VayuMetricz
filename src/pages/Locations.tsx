import { Check, LocateFixed, MapPin, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ComparePanel } from '../components/locations/ComparePanel';
import { SearchBar } from '../components/navigation/SearchBar';
import { Card } from '../components/common/Card';
import { EmptyState, ErrorState } from '../components/common/States';
import { SectionHeader } from '../components/common/SectionHeader';
import { useApp } from '../context/AppContext';
import { fetchForecast } from '../services/weatherApi';
import type { WeatherSnapshot } from '../types/weather';
import { formatTime } from '../utils/time';
import { formatTemperature, formatWind, windSymbol } from '../utils/units';
import { conditionFor } from '../utils/weatherCodes';
import { WeatherIcon } from '../components/weather/WeatherIcon';

export default function Locations() {
  const { saved, place, setPlace, toggleSaved, locate, geoStatus, geoMessage, settings } = useApp();
  const [summaries, setSummaries] = useState<Record<string, WeatherSnapshot>>({});
  const [failed, setFailed] = useState<Record<string, string>>({});

  useEffect(() => {
    const missing = saved.filter((entry) => !summaries[entry.id] && !failed[entry.id]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.allSettled(missing.map((entry) => fetchForecast(entry, { days: 7 }))).then((results) => {
      if (cancelled) return;
      const nextSnapshots: Record<string, WeatherSnapshot> = {};
      const nextFailures: Record<string, string> = {};
      results.forEach((result, index) => {
        const entry = missing[index];
        if (result.status === 'fulfilled') nextSnapshots[entry.id] = result.value;
        else nextFailures[entry.id] = (result.reason as Error)?.message ?? 'Unavailable';
      });
      setSummaries((prev) => ({ ...prev, ...nextSnapshots }));
      setFailed((prev) => ({ ...prev, ...nextFailures }));
    });
    return () => {
      cancelled = true;
    };
  }, [saved, summaries, failed]);

  return (
    <div className="space-y-5">
      <header>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-accent">
          <MapPin size={12} /> Locations
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Global location intelligence</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
          Search any city, region or country worldwide, keep favourites for one-tap switching, and compare conditions
          side by side. Geolocation is optional — search always works without it.
        </p>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <SearchBar />
          <button
            type="button"
            onClick={locate}
            disabled={geoStatus === 'locating'}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-panel/60 px-3 py-2 text-xs font-medium text-muted transition hover:text-ink disabled:opacity-60"
          >
            <LocateFixed size={13} className={geoStatus === 'locating' ? 'animate-pulse text-accent' : ''} />
            {geoStatus === 'locating' ? 'Locating…' : 'Use my location'}
          </button>
        </div>
        {geoMessage ? <p className="mt-2 text-[11px] text-amber-300">{geoMessage}</p> : null}
        <p className="mt-2 text-[10px] text-muted">
          Browser location is requested only when you press the button, and is not stored beyond the selected
          coordinates in this browser.
        </p>
      </Card>

      <section>
        <SectionHeader
          title="Saved locations"
          subtitle={`${saved.length} of 8 slots used · tap a card to make it the active location`}
        />
        {saved.length === 0 ? (
          <EmptyState
            icon={<Star size={20} />}
            title="No saved locations yet"
            message="Search for a city above and press the star, or save the location you are viewing from its header."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {saved.map((entry) => {
              const snapshot = summaries[entry.id];
              const active = entry.id === place.id;
              return (
                <Card
                  key={entry.id}
                  className={[
                    'p-4 transition',
                    active ? 'border-accent/45 bg-accent/[0.04]' : 'hover:border-accent/30',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold">{entry.name}</p>
                      <p className="truncate text-[11px] text-muted">
                        {[entry.admin1, entry.country].filter(Boolean).join(', ') || 'Coordinates'}
                      </p>
                      <p className="text-[10px] tabular text-muted/70">
                        {entry.latitude.toFixed(2)}°, {entry.longitude.toFixed(2)}°
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSaved(entry)}
                      aria-label={`Remove ${entry.name}`}
                      className="rounded-md p-1.5 text-muted transition hover:text-red-300"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {snapshot ? (
                    <>
                      <div className="mt-3 flex items-center gap-3">
                        <WeatherIcon
                          code={snapshot.current.weatherCode}
                          isDay={snapshot.current.isDay}
                          size={30}
                          className="text-accent"
                        />
                        <p className="font-display text-2xl font-semibold leading-none tabular">
                          {formatTemperature(snapshot.current.temperature, settings.temperatureUnit)}
                        </p>
                        <div className="min-w-0 text-[10px] text-muted">
                          <p className="truncate">{conditionFor(snapshot.current.weatherCode).label}</p>
                          <p className="tabular">
                            H {formatTemperature(snapshot.daily[0]?.temperatureMax ?? null, settings.temperatureUnit)} ·
                            L {formatTemperature(snapshot.daily[0]?.temperatureMin ?? null, settings.temperatureUnit)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
                        <span>
                          {formatWind(snapshot.current.windSpeed, settings.windUnit)} {windSymbol(settings.windUnit)}
                        </span>
                        <span>{snapshot.current.humidity.toFixed(0)}% RH</span>
                        <span>
                          Local {formatTime(snapshot.current.time, settings.hour12)}
                        </span>
                      </p>
                    </>
                  ) : failed[entry.id] ? (
                    <p className="mt-3 text-[11px] text-muted">Forecast unavailable for this location.</p>
                  ) : (
                    <p className="mt-3 animate-pulse text-[11px] text-muted">Loading conditions…</p>
                  )}

                  <button
                    type="button"
                    onClick={() => setPlace(entry)}
                    className={[
                      'mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition',
                      active
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-line text-muted hover:border-accent/40 hover:text-ink',
                    ].join(' ')}
                  >
                    {active ? <Check size={11} /> : null}
                    {active ? 'Currently viewing' : 'Switch to this location'}
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Location comparison" subtitle="Side-by-side current conditions for travel planning" />
        <ComparePanel candidates={saved} />
      </section>

      {Object.keys(failed).length > 0 ? (
        <ErrorState
          compact
          message={`Some saved locations could not be loaded: ${Object.keys(failed)
            .map((id) => saved.find((entry) => entry.id === id)?.name ?? id)
            .join(', ')}.`}
          onRetry={() => setFailed({})}
        />
      ) : null}
    </div>
  );
}
