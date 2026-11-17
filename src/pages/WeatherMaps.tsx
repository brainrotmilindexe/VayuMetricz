import { Compass, Layers, MapPin } from 'lucide-react';
import { WeatherMap } from '../components/maps/WeatherMap';
import { Card } from '../components/common/Card';
import { useApp } from '../context/AppContext';
import { formatTemperature, formatWind, windDirectionLabel, windSymbol } from '../utils/units';
import { conditionFor } from '../utils/weatherCodes';
import { WeatherIcon } from '../components/weather/WeatherIcon';

export default function WeatherMaps() {
  const { weather, place, settings } = useApp();

  return (
    <div className="space-y-5">
      <header>
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-accent">
          <Layers size={12} /> Weather maps
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">Geographical weather intelligence</h1>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
          Explore temperature, precipitation, wind, cloud cover and pressure across a region. Every coloured point is a
          real forecast value sampled from Open-Meteo at that coordinate.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <WeatherMap />

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-start gap-2">
              <MapPin size={14} className="mt-0.5 text-accent" aria-hidden />
              <div className="min-w-0">
                <h2 className="font-display text-sm font-semibold">Selected location</h2>
                <p className="truncate text-[11px] text-muted">
                  {place.name}
                  {place.country ? `, ${place.country}` : ''}
                </p>
                <p className="text-[10px] tabular text-muted/80">
                  {place.latitude.toFixed(3)}°, {place.longitude.toFixed(3)}°
                </p>
              </div>
            </div>

            {weather ? (
              <>
                <div className="mt-3 flex items-center gap-3">
                  <WeatherIcon
                    code={weather.current.weatherCode}
                    isDay={weather.current.isDay}
                    size={40}
                    className="text-accent"
                  />
                  <div>
                    <p className="font-display text-3xl font-semibold leading-none tabular">
                      {formatTemperature(weather.current.temperature, settings.temperatureUnit)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {conditionFor(weather.current.weatherCode).label} · feels{' '}
                      {formatTemperature(weather.current.apparentTemperature, settings.temperatureUnit)}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-line/50 pb-1.5">
                    <dt className="text-muted">Wind</dt>
                    <dd className="tabular">
                      {formatWind(weather.current.windSpeed, settings.windUnit)} {windSymbol(settings.windUnit)}{' '}
                      {windDirectionLabel(weather.current.windDirection)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-line/50 pb-1.5">
                    <dt className="text-muted">Humidity</dt>
                    <dd className="tabular">{weather.current.humidity.toFixed(0)}%</dd>
                  </div>
                  <div className="flex justify-between border-b border-line/50 pb-1.5">
                    <dt className="text-muted">Cloud cover</dt>
                    <dd className="tabular">
                      {weather.current.cloudCover != null ? `${weather.current.cloudCover.toFixed(0)}%` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Precipitation</dt>
                    <dd className="tabular">{weather.current.precipitation.toFixed(1)} mm</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="mt-3 text-[11px] text-muted">Loading the forecast for this location…</p>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="font-display text-sm font-semibold">About these layers</h2>
            <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted">
              <li>
                VayuMetricz plots point forecasts on the map rather than raster radar imagery, so nothing here is a
                decorative or fabricated overlay.
              </li>
              <li>Zoom or pan and the visible grid is resampled automatically after a short pause.</li>
              <li>
                Colour scales are fixed per layer, so the same colour means the same value in every viewport. The legend
                shows the sampled range for the current view.
              </li>
              <li>Click any point for its exact values, condition and wind.</li>
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted/80">
              <Compass size={10} /> Base map © Esri, HERE, Garmin, © OpenStreetMap contributors
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
