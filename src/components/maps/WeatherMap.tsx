import 'leaflet/dist/leaflet.css';
import type { Map as LeafletMap } from 'leaflet';
import { Clock, Loader2, LocateFixed, Pause, Play, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useApp } from '../../context/AppContext';
import { fetchGridSamples, type GridSample } from '../../services/weatherApi';
import { conditionFor } from '../../utils/weatherCodes';
import { formatTemperature, formatWind, windSymbol } from '../../utils/units';
import { floorToHour, formatHour, weekdayShort } from '../../utils/time';
import { Segmented } from '../common/Segmented';
import { ErrorState } from '../common/States';

type LayerKey = 'temperature' | 'precipitation' | 'wind' | 'cloud' | 'pressure';

interface LayerConfig {
  label: string;
  short: string;
  unit: string;
  get: (sample: GridSample) => number | null;
  stops: [number, string][];
}

const LAYERS: Record<LayerKey, LayerConfig> = {
  temperature: {
    label: 'Temperature',
    short: 'Temp',
    unit: '°C',
    get: (sample) => sample.temperature,
    stops: [
      [-30, '#312e81'],
      [-10, '#3b82f6'],
      [0, '#22d3ee'],
      [15, '#a3e635'],
      [25, '#facc15'],
      [35, '#fb923c'],
      [45, '#ef4444'],
    ],
  },
  precipitation: {
    label: 'Precipitation',
    short: 'Rain',
    unit: 'mm',
    get: (sample) => sample.precipitation,
    stops: [
      [0, '#1e293b'],
      [0.1, '#0ea5e9'],
      [1.5, '#38bdf8'],
      [5, '#818cf8'],
      [12, '#c084fc'],
    ],
  },
  wind: {
    label: 'Wind speed',
    short: 'Wind',
    unit: 'km/h',
    get: (sample) => sample.windSpeed,
    stops: [
      [0, '#0e7490'],
      [15, '#22d3ee'],
      [30, '#34d399'],
      [50, '#fbbf24'],
      [75, '#f97316'],
      [100, '#ef4444'],
    ],
  },
  cloud: {
    label: 'Cloud cover',
    short: 'Cloud',
    unit: '%',
    get: (sample) => sample.cloudCover,
    stops: [
      [0, '#0f2537'],
      [25, '#334155'],
      [50, '#64748b'],
      [75, '#a8b3c2'],
      [100, '#e2e8f0'],
    ],
  },
  pressure: {
    label: 'Pressure',
    short: 'MSL',
    unit: 'hPa',
    get: (sample) => sample.pressure,
    stops: [
      [980, '#7c3aed'],
      [1000, '#3b82f6'],
      [1013, '#22d3ee'],
      [1025, '#34d399'],
      [1045, '#fbbf24'],
    ],
  },
};

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function colorFor(stops: [number, string][], value: number): string {
  if (value <= stops[0][0]) return stops[0][1];
  for (let index = 1; index < stops.length; index += 1) {
    if (value <= stops[index][0]) {
      const [lowValue, lowColor] = stops[index - 1];
      const [highValue, highColor] = stops[index];
      const ratio = (value - lowValue) / (highValue - lowValue || 1);
      const [r1, g1, b1] = hexToRgb(lowColor);
      const [r2, g2, b2] = hexToRgb(highColor);
      const r = Math.round(r1 + (r2 - r1) * ratio);
      const g = Math.round(g1 + (g2 - g1) * ratio);
      const b = Math.round(b1 + (b2 - b1) * ratio);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return stops[stops.length - 1][1];
}

function MapFocus({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 6), { duration: 0.8 });
  }, [latitude, longitude, map]);
  return null;
}

function Sampler({
  layer,
  time,
  onSamples,
  onLoading,
  onError,
}: {
  layer: LayerKey;
  time?: string;
  onSamples: (samples: GridSample[]) => void;
  onLoading: (loading: boolean) => void;
  onError: (message: string | null) => void;
}) {
  const map = useMap();
  const [samples, setSamples] = useState<GridSample[]>([]);
  const timer = useRef<number | undefined>(undefined);

  const load = useCallback(async () => {
    const bounds = map.getBounds();
    const north = Math.min(85, bounds.getNorth());
    const south = Math.max(-85, bounds.getSouth());
    const west = bounds.getWest();
    const east = bounds.getEast();
    const rows = 5;
    const cols = 6;
    const points: { latitude: number; longitude: number }[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        points.push({
          latitude: south + ((north - south) * (row + 0.5)) / rows,
          longitude: west + ((east - west) * (col + 0.5)) / cols,
        });
      }
    }
    onLoading(true);
    onError(null);
    try {
      const result = await fetchGridSamples(points, { time });
      setSamples(result);
      onSamples(result);
    } catch (cause) {
      onError((cause as Error).message || 'Unable to sample weather for this map area.');
    } finally {
      onLoading(false);
    }
  }, [map, onError, onLoading, onSamples, time]);

  useMapEvents({
    moveend: () => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => void load(), 500);
    },
  });

  useEffect(() => {
    void load();
    return () => window.clearTimeout(timer.current);
  }, [load]);

  const config = LAYERS[layer];

  return (
    <>
      {samples.map((sample) => {
        const value = config.get(sample);
        if (value == null) return null;
        return (
          <CircleMarker
            key={`${sample.latitude.toFixed(3)}-${sample.longitude.toFixed(3)}`}
            center={[sample.latitude, sample.longitude]}
            radius={14}
            pathOptions={{
              stroke: true,
              color: '#0b1320',
              weight: 1,
              fillColor: colorFor(config.stops, value),
              fillOpacity: 0.66,
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <p className="text-[10px] uppercase tracking-wider text-[#93a7bf]">
                  {sample.latitude.toFixed(2)}°, {sample.longitude.toFixed(2)}°
                </p>
                <p className="mt-1 text-[15px] font-semibold">
                  {config.label}:{' '}
                  <span style={{ color: colorFor(config.stops, value) }}>
                    {value.toFixed(layer === 'precipitation' ? 2 : layer === 'cloud' ? 0 : 1)} {config.unit}
                  </span>
                </p>
                <p className="mt-1 text-[11px] text-[#c3d3e8]">
                  {conditionFor(sample.weatherCode).label}
                  {sample.temperature != null ? ` · ${formatTemperature(sample.temperature, 'c', 1)}` : ''}
                </p>
                <p className="text-[11px] text-[#93a7bf]">
                  Wind {sample.windSpeed != null ? formatWind(sample.windSpeed, 'kmh') : '—'} km/h · cloud{' '}
                  {sample.cloudCover != null ? `${sample.cloudCover.toFixed(0)}%` : '—'}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}

export function WeatherMap({ height = '68vh' }: { height?: string }) {
  const { place, settings, weather } = useApp();
  const [layer, setLayer] = useState<LayerKey>('temperature');
  const [samples, setSamples] = useState<GridSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Time scrubber: frames are the location's own local hours, so the labels and
  // the sampled values always belong to the place being viewed.
  const hours = weather?.hourly ?? [];
  const currentIndex = weather
    ? Math.max(0, hours.findIndex((hour) => hour.time === floorToHour(weather.current.time)))
    : 0;
  const frameTime = hours[currentIndex + frame]?.time;
  const maxFrame = Math.min(23, Math.max(0, hours.length - currentIndex - 1));

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setFrame((value) => (value >= maxFrame ? 0 : value + 1));
    }, 900);
    return () => window.clearInterval(timer);
  }, [maxFrame, playing]);

  const config = LAYERS[layer];
  const values = samples
    .map((sample) => config.get(sample))
    .filter((value): value is number => value != null);
  const min = values.length ? Math.min(...values) : null;
  const max = values.length ? Math.max(...values) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          ariaLabel="Weather map layer"
          value={layer}
          onChange={(value) => setLayer(value)}
          options={(Object.keys(LAYERS) as LayerKey[]).map((key) => ({
            value: key,
            label: LAYERS[key].label,
          }))}
        />
        <div className="flex items-center gap-2 text-[10px] text-muted">
          {loading ? <Loader2 size={12} className="animate-spin text-accent" /> : <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
          {loading ? 'Sampling forecast…' : `${samples.length} forecast points`}
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="rounded-md border border-line p-1 transition hover:text-ink"
            aria-label="Resample the visible map area"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {error ? <ErrorState message={error} compact onRetry={() => setReloadKey((key) => key + 1)} /> : null}

      {hours.length > 1 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line/70 bg-panel/40 px-3 py-2">
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? 'Pause the forecast timeline' : 'Play the forecast timeline'}
            className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-panel/70 text-accent transition hover:border-accent/40"
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <div className="flex min-w-[180px] flex-1 items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted">Now</span>
            <input
              type="range"
              min={0}
              max={maxFrame}
              step={1}
              value={frame}
              onChange={(event) => {
                setPlaying(false);
                setFrame(Number(event.target.value));
              }}
              aria-label="Forecast hour offset"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent"
              style={{
                background: `linear-gradient(90deg, rgb(var(--accent)) ${(frame / Math.max(1, maxFrame)) * 100}%, rgb(var(--line)) ${(frame / Math.max(1, maxFrame)) * 100}%)`,
              }}
            />
            <span className="whitespace-nowrap text-[10px] tabular text-muted">+{maxFrame}h</span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-line/70 bg-panel/60 px-2 py-1 text-[10.5px] font-medium tabular text-ink">
            <Clock size={11} className="text-accent" />
            {frame === 0
              ? 'Live conditions'
              : frameTime
                ? `${weekdayShort(frameTime)} ${formatHour(frameTime, settings.hour12)}`
                : '—'}
          </span>

          {frame !== 0 ? (
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setFrame(0);
              }}
              className="rounded-lg border border-line px-2 py-1 text-[10px] text-muted transition hover:text-ink"
            >
              Back to now
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-2xl border border-line">
        <MapContainer
          ref={(instance: LeafletMap | null) => {
            mapRef.current = instance;
          }}
          center={[place.latitude, place.longitude]}
          zoom={6}
          minZoom={2}
          worldCopyJump
          scrollWheelZoom
          className="z-0 w-full"
          style={{ height }}
        >
          <TileLayer
            key={settings.theme}
            url={
              settings.theme === 'light'
                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
                : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
            }
            attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Sampler
            key={`${reloadKey}-${frame === 0 ? 'now' : frameTime ?? frame}`}
            layer={layer}
            time={frame === 0 ? undefined : frameTime}
            onSamples={setSamples}
            onLoading={setLoading}
            onError={setError}
          />
          <MapFocus latitude={place.latitude} longitude={place.longitude} />
          <CircleMarker
            center={[place.latitude, place.longitude]}
            radius={6}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#22d3ee', fillOpacity: 1 }}
          >
            <Popup>
              <strong>{place.name}</strong>
              <br />
              Selected location
            </Popup>
          </CircleMarker>
        </MapContainer>

        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] w-56 rounded-xl border border-white/10 bg-[#0a1523]/90 p-3 backdrop-blur-md">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#93a7bf]">{config.label}</p>
          {min != null && max != null ? (
            <>
              <div
                className="mt-2 h-2 w-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${config.stops.map(([, color]) => color).join(', ')})`,
                }}
                aria-hidden
              />
              <div className="mt-1 flex justify-between text-[10px] tabular text-[#c3d3e8]">
                <span>
                  {min.toFixed(0)} {config.unit}
                </span>
                <span>
                  {max.toFixed(0)} {config.unit}
                </span>
              </div>
            </>
          ) : (
            <p className="mt-2 text-[10px] text-[#93a7bf]">No values in view — zoom to a region with coverage.</p>
          )}
          <p className="mt-2 text-[9px] leading-snug text-[#7f93ad]">
            Point samples from Open-Meteo, plotted at forecast grid locations. Not a radar or satellite composite.
          </p>
        </div>

        <button
          type="button"
          onClick={() => mapRef.current?.flyTo([place.latitude, place.longitude], 6, { duration: 0.8 })}
          className="absolute right-3 top-3 z-[500] inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0a1523]/90 px-2.5 py-1.5 text-[10px] font-medium text-[#c3d3e8] backdrop-blur-md transition hover:text-white"
        >
          <LocateFixed size={11} /> Recenter
        </button>
      </div>

      <p className="text-[10px] leading-relaxed text-muted">
        Layers are rendered from genuine Open-Meteo values sampled across the visible map area, with colours interpolated
        per layer. Base map © Esri, HERE, Garmin, © OpenStreetMap contributors. Scrub the timeline to sample the hourly
        forecast for the location's own local hours. Zoom or pan to resample; changing layer recolours the existing
        samples without another request.
      </p>
    </div>
  );
}
