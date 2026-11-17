import type { AirQualityPoint, AirQualitySnapshot, Place } from '../types/weather';
import { getJSON } from './http';

/** Open-Meteo Air Quality API: https://open-meteo.com/en/docs/air-quality-api */

const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

type NumSeries = (number | null)[] | undefined;

interface RawAir {
  timezone?: string;
  current?: Record<string, number | string | null>;
  hourly?: {
    time: string[];
    pm2_5?: NumSeries;
    pm10?: NumSeries;
    european_aqi?: NumSeries;
  };
}

const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export async function fetchAirQuality(
  place: Place,
  options: { force?: boolean; signal?: AbortSignal } = {},
): Promise<AirQualitySnapshot> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current:
      'european_aqi,us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide',
    hourly: 'pm2_5,pm10,european_aqi',
    timezone: 'auto',
    past_days: '2',
    forecast_days: '2',
  });

  const raw = await getJSON<RawAir>(`${AIR_URL}?${params.toString()}`, {
    ttlMs: 20 * 60 * 1000,
    force: options.force,
    signal: options.signal,
  });

  const current = raw.current ?? {};
  const times = raw.hourly?.time ?? [];
  const hourly: AirQualityPoint[] = times.map((time, index) => ({
    time,
    pm25: num(raw.hourly?.pm2_5?.[index]),
    pm10: num(raw.hourly?.pm10?.[index]),
    europeanAqi: num(raw.hourly?.european_aqi?.[index]),
  }));

  return {
    fetchedAt: Date.now(),
    place,
    timezone: raw.timezone ?? place.timezone ?? 'UTC',
    current: {
      time: typeof current.time === 'string' ? current.time : '',
      europeanAqi: num(current.european_aqi),
      usAqi: num(current.us_aqi),
      pm25: num(current.pm2_5),
      pm10: num(current.pm10),
      carbonMonoxide: num(current.carbon_monoxide),
      nitrogenDioxide: num(current.nitrogen_dioxide),
      ozone: num(current.ozone),
      sulphurDioxide: num(current.sulphur_dioxide),
    },
    hourly,
  };
}
