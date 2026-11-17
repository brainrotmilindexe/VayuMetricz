import type {
  CurrentConditions,
  DailyPoint,
  HourlyPoint,
  Place,
  WeatherSnapshot,
} from '../types/weather';
import { floorToHour } from '../utils/time';
import { getJSON } from './http';

/**
 * Open-Meteo forecast service.
 * Docs: https://open-meteo.com/en/docs
 *
 * All measurements are requested in metric units (celsius, km/h, mm, hPa) and
 * converted for display only, so switching units never refetches.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const CURRENT_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'rain',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
].join(',');

const HOURLY_VARS = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'dew_point_2m',
  'precipitation_probability',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'visibility',
  'wind_speed_10m',
  'wind_direction_10m',
  'wind_gusts_10m',
  'pressure_msl',
  'uv_index',
  'is_day',
].join(',');

const DAILY_VARS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'apparent_temperature_max',
  'apparent_temperature_min',
  'sunrise',
  'sunset',
  'daylight_duration',
  'uv_index_max',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'wind_direction_10m_dominant',
].join(',');

type NumSeries = (number | null)[] | undefined;

interface RawForecast {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
  timezone_abbreviation?: string;
  utc_offset_seconds?: number;
  current?: Record<string, number | string | null>;
  hourly?: {
    time: string[];
    temperature_2m?: NumSeries;
    apparent_temperature?: NumSeries;
    relative_humidity_2m?: NumSeries;
    dew_point_2m?: NumSeries;
    precipitation_probability?: NumSeries;
    precipitation?: NumSeries;
    weather_code?: NumSeries;
    cloud_cover?: NumSeries;
    visibility?: NumSeries;
    wind_speed_10m?: NumSeries;
    wind_direction_10m?: NumSeries;
    wind_gusts_10m?: NumSeries;
    pressure_msl?: NumSeries;
    uv_index?: NumSeries;
    is_day?: NumSeries;
  };
  daily?: {
    time: string[];
    weather_code?: NumSeries;
    temperature_2m_max?: NumSeries;
    temperature_2m_min?: NumSeries;
    apparent_temperature_max?: NumSeries;
    apparent_temperature_min?: NumSeries;
    sunrise?: (string | null)[];
    sunset?: (string | null)[];
    daylight_duration?: NumSeries;
    uv_index_max?: NumSeries;
    precipitation_sum?: NumSeries;
    precipitation_probability_max?: NumSeries;
    wind_speed_10m_max?: NumSeries;
    wind_gusts_10m_max?: NumSeries;
    wind_direction_10m_dominant?: NumSeries;
  };
}

const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const at = (series: NumSeries, index: number): number | null => num(series?.[index]);

function currentValue(current: RawForecast['current'], key: string): number | null {
  return num(current?.[key]);
}

export function buildForecastUrl(place: Pick<Place, 'latitude' | 'longitude'>, days = 7): string {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: CURRENT_VARS,
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    timezone: 'auto',
    forecast_days: String(days),
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  });
  return `${FORECAST_URL}?${params.toString()}`;
}

export function normaliseForecast(raw: RawForecast, place: Place): WeatherSnapshot {
  const hourlyTimes = raw.hourly?.time ?? [];
  const hourly: HourlyPoint[] = hourlyTimes.map((time, i) => ({
    time,
    temperature: at(raw.hourly?.temperature_2m, i),
    apparentTemperature: at(raw.hourly?.apparent_temperature, i),
    humidity: at(raw.hourly?.relative_humidity_2m, i),
    dewPoint: at(raw.hourly?.dew_point_2m, i),
    precipitationProbability: at(raw.hourly?.precipitation_probability, i),
    precipitation: at(raw.hourly?.precipitation, i),
    weatherCode: at(raw.hourly?.weather_code, i),
    cloudCover: at(raw.hourly?.cloud_cover, i),
    visibility: at(raw.hourly?.visibility, i),
    windSpeed: at(raw.hourly?.wind_speed_10m, i),
    windDirection: at(raw.hourly?.wind_direction_10m, i),
    windGusts: at(raw.hourly?.wind_gusts_10m, i),
    pressure: at(raw.hourly?.pressure_msl, i),
    uvIndex: at(raw.hourly?.uv_index, i),
    isDay: at(raw.hourly?.is_day, i) === 1,
  }));

  const currentTime = (raw.current?.time as string | undefined) ?? hourlyTimes[0] ?? '';
  const alignedIndex = Math.max(
    0,
    hourly.findIndex((point) => point.time === floorToHour(currentTime)),
  );
  const aligned = hourly[alignedIndex];

  const current: CurrentConditions = {
    time: currentTime,
    temperature: currentValue(raw.current, 'temperature_2m') ?? aligned?.temperature ?? 0,
    apparentTemperature:
      currentValue(raw.current, 'apparent_temperature') ?? aligned?.apparentTemperature ?? 0,
    humidity: currentValue(raw.current, 'relative_humidity_2m') ?? aligned?.humidity ?? 0,
    dewPoint: aligned?.dewPoint ?? null,
    precipitation: currentValue(raw.current, 'precipitation') ?? aligned?.precipitation ?? 0,
    weatherCode: currentValue(raw.current, 'weather_code') ?? aligned?.weatherCode ?? 0,
    isDay: currentValue(raw.current, 'is_day') === 1,
    cloudCover: currentValue(raw.current, 'cloud_cover') ?? aligned?.cloudCover ?? null,
    pressureMsl: currentValue(raw.current, 'pressure_msl') ?? aligned?.pressure ?? null,
    windSpeed: currentValue(raw.current, 'wind_speed_10m') ?? aligned?.windSpeed ?? 0,
    windDirection: currentValue(raw.current, 'wind_direction_10m') ?? aligned?.windDirection ?? 0,
    windGusts: currentValue(raw.current, 'wind_gusts_10m') ?? aligned?.windGusts ?? null,
    visibility: aligned?.visibility ?? null,
    uvIndex: aligned?.uvIndex ?? null,
  };

  const dailyTimes = raw.daily?.time ?? [];
  const daily: DailyPoint[] = dailyTimes.map((date, i) => ({
    date,
    weatherCode: at(raw.daily?.weather_code, i),
    temperatureMax: at(raw.daily?.temperature_2m_max, i),
    temperatureMin: at(raw.daily?.temperature_2m_min, i),
    apparentMax: at(raw.daily?.apparent_temperature_max, i),
    apparentMin: at(raw.daily?.apparent_temperature_min, i),
    sunrise: raw.daily?.sunrise?.[i] ?? null,
    sunset: raw.daily?.sunset?.[i] ?? null,
    uvIndexMax: at(raw.daily?.uv_index_max, i),
    precipitationSum: at(raw.daily?.precipitation_sum, i),
    precipitationProbabilityMax: at(raw.daily?.precipitation_probability_max, i),
    windSpeedMax: at(raw.daily?.wind_speed_10m_max, i),
    windGustsMax: at(raw.daily?.wind_gusts_10m_max, i),
    windDirectionDominant: at(raw.daily?.wind_direction_10m_dominant, i),
    daylightSeconds: at(raw.daily?.daylight_duration, i),
  }));

  return {
    place,
    fetchedAt: Date.now(),
    timezone: raw.timezone ?? place.timezone ?? 'UTC',
    timezoneAbbreviation: raw.timezone_abbreviation ?? '',
    utcOffsetSeconds: raw.utc_offset_seconds ?? 0,
    elevation: raw.elevation ?? null,
    current,
    hourly,
    daily,
  };
}

export async function fetchForecast(
  place: Place,
  options: { days?: number; force?: boolean; signal?: AbortSignal } = {},
): Promise<WeatherSnapshot> {
  const days = options.days ?? 7;
  const raw = await getJSON<RawForecast>(buildForecastUrl(place, days), {
    ttlMs: 10 * 60 * 1000,
    force: options.force,
    signal: options.signal,
  });
  return normaliseForecast(raw, place);
}

/** Multi-point sampling for the map layer. Open-Meteo accepts comma-separated coordinates. */
export interface GridSample {
  latitude: number;
  longitude: number;
  temperature: number | null;
  precipitation: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  cloudCover: number | null;
  pressure: number | null;
  weatherCode: number | null;
}

interface RawGridPoint {
  latitude: number;
  longitude: number;
  current?: Record<string, number | string | null>;
}

export async function fetchGridSamples(
  points: { latitude: number; longitude: number }[],
  signal?: AbortSignal,
): Promise<GridSample[]> {
  if (points.length === 0) return [];
  const params = new URLSearchParams({
    latitude: points.map((p) => p.latitude.toFixed(3)).join(','),
    longitude: points.map((p) => p.longitude.toFixed(3)).join(','),
    current: 'temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,cloud_cover,pressure_msl,weather_code',
    timezone: 'auto',
    wind_speed_unit: 'kmh',
    temperature_unit: 'celsius',
  });

  const raw = await getJSON<RawGridPoint | RawGridPoint[]>(`${FORECAST_URL}?${params.toString()}`, {
    ttlMs: 5 * 60 * 1000,
    signal,
  });
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((point) => ({
    latitude: num(point.latitude) ?? 0,
    longitude: num(point.longitude) ?? 0,
    temperature: num(point.current?.temperature_2m),
    precipitation: num(point.current?.precipitation),
    windSpeed: num(point.current?.wind_speed_10m),
    windDirection: num(point.current?.wind_direction_10m),
    cloudCover: num(point.current?.cloud_cover),
    pressure: num(point.current?.pressure_msl),
    weatherCode: num(point.current?.weather_code),
  }));
}
