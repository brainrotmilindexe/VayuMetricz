import { Database, Info, Monitor, RotateCcw, Settings2, Trash2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Segmented } from '../components/common/Segmented';
import { useApp } from '../context/AppContext';
import { formatTemperature, windSymbol } from '../utils/units';

const WIND_OPTIONS = [
  { value: 'kmh' as const, label: 'km/h' },
  { value: 'mph' as const, label: 'mph' },
  { value: 'ms' as const, label: 'm/s' },
  { value: 'kn' as const, label: 'kn' },
];

export default function Settings() {
  const { settings, updateSettings, saved, toggleSaved, setPlace, place } = useApp();

  const resetSettings = () => {
    updateSettings({ temperatureUnit: 'c', windUnit: 'kmh', theme: 'dark', hour12: false });
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-accent">
          <Settings2 size={12} /> Settings
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="mt-1 text-xs text-muted">
          Display units, appearance and stored locations. Everything is saved in this browser only.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-display text-sm font-semibold">Units</h2>
          <p className="text-[11px] text-muted">Weather data is always fetched in metric and converted for display.</p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">Temperature</p>
              <Segmented
                ariaLabel="Temperature unit"
                value={settings.temperatureUnit}
                onChange={(value) => updateSettings({ temperatureUnit: value })}
                options={[
                  { value: 'c', label: 'Celsius (°C)' },
                  { value: 'f', label: 'Fahrenheit (°F)' },
                ]}
              />
              <p className="mt-1.5 text-[11px] text-muted">
                Preview: {formatTemperature(21.4, settings.temperatureUnit, 1)} at 21.4 °C source data.
              </p>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">Wind speed</p>
              <Segmented
                ariaLabel="Wind unit"
                value={settings.windUnit}
                onChange={(value) => updateSettings({ windUnit: value })}
                options={WIND_OPTIONS}
              />
              <p className="mt-1.5 text-[11px] text-muted">
                Gusts and wind charts use {windSymbol(settings.windUnit)} as well.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-display text-sm font-semibold">Appearance</h2>
          <p className="text-[11px] text-muted">The interface is dark-first, with a complete light theme.</p>

          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">Theme</p>
              <Segmented
                ariaLabel="Theme"
                value={settings.theme}
                onChange={(value) => updateSettings({ theme: value })}
                options={[
                  { value: 'dark', label: 'Midnight (dark)' },
                  { value: 'light', label: 'Daylight (light)' },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">Clock format</p>
              <Segmented
                ariaLabel="Clock format"
                value={settings.hour12 ? '12' : '24'}
                onChange={(value) => updateSettings({ hour12: value === '12' })}
                options={[
                  { value: '24', label: '24-hour' },
                  { value: '12', label: '12-hour' },
                ]}
              />
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-line/70 bg-panel/40 p-3 text-[11px] text-muted">
              <Monitor size={13} className="mt-0.5 shrink-0" />
              <p>
                Reduced-motion preferences are respected automatically: transitions and animations are suppressed when
                your system asks for it.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-display text-sm font-semibold">Saved locations</h2>
          <p className="text-[11px] text-muted">{saved.length} of 8 saved · used for switching and comparison</p>

          {saved.length === 0 ? (
            <p className="mt-4 text-[11px] text-muted">Nothing saved yet. Use the star in any location header.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line/60">
              {saved.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {entry.name}
                      {entry.id === place.id ? <span className="ml-2 text-[10px] text-accent">active</span> : null}
                    </p>
                    <p className="truncate text-[10px] text-muted">
                      {[entry.admin1, entry.country].filter(Boolean).join(', ') || 'Coordinates'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {entry.id !== place.id ? (
                      <button
                        type="button"
                        onClick={() => setPlace(entry)}
                        className="rounded-md border border-line px-2 py-1 text-[10px] text-muted transition hover:text-ink"
                      >
                        Use
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => toggleSaved(entry)}
                      aria-label={`Remove ${entry.name}`}
                      className="rounded-md p-1.5 text-muted transition hover:text-red-300"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-display text-sm font-semibold">Data &amp; privacy</h2>
          <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted">
            <li className="flex gap-2">
              <Database size={12} className="mt-0.5 shrink-0" />
              <span>
                Forecasts are cached in memory for 10 minutes, air quality for 20 minutes and geocoding results for 24
                hours to avoid unnecessary provider calls.
              </span>
            </li>
            <li className="flex gap-2">
              <Info size={12} className="mt-0.5 shrink-0" />
              <span>
                No API keys are required. Weather, geocoding and air-quality data come from Open-Meteo, which is free
                for non-commercial use with attribution.
              </span>
            </li>
            <li className="flex gap-2">
              <Info size={12} className="mt-0.5 shrink-0" />
              <span>
                Your saved locations and preferences stay in this browser's local storage. Coordinates are sent to
                Open-Meteo only to retrieve weather for them.
              </span>
            </li>
          </ul>
          <button
            type="button"
            onClick={resetSettings}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-medium text-muted transition hover:text-ink"
          >
            <RotateCcw size={11} /> Reset display settings
          </button>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="font-display text-sm font-semibold">About VayuMetricz</h2>
        <p className="mt-1 text-xs text-muted">Weather, measured intelligently.</p>
        <p className="mt-2 max-w-3xl text-[11px] leading-relaxed text-muted">
          VayuMetricz is a global weather intelligence interface built on open meteorological data. It combines current
          conditions, hourly and seven-day forecasts, atmospheric analytics, an interactive sampled-data map, air
          quality and rule-based insights. It does not fabricate measurements or official warnings, and it clearly
          labels model output as forecast rather than observation.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted">
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-accent hover:underline">
            Open-Meteo
          </a>
          <a
            href="https://open-meteo.com/en/docs/air-quality-api"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            Air Quality API
          </a>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            OpenStreetMap
          </a>
          <a href="https://www.esri.com/" target="_blank" rel="noreferrer" className="text-accent hover:underline">
            Esri
          </a>
        </p>
      </Card>
    </div>
  );
}
