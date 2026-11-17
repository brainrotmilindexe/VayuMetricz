/** Unit conversion and meteorological classification helpers. */

export type TemperatureUnit = 'c' | 'f';
export type WindUnit = 'kmh' | 'mph' | 'ms' | 'kn';

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'c' ? celsius : celsius * (9 / 5) + 32;
}

export function temperatureSymbol(unit: TemperatureUnit): string {
  return unit === 'c' ? '°C' : '°F';
}

/** "21°" — the compact form used across cards. */
export function formatTemperature(celsius: number | null, unit: TemperatureUnit, digits = 0): string {
  if (celsius == null || Number.isNaN(celsius)) return '—';
  return `${convertTemperature(celsius, unit).toFixed(digits)}°`;
}

const WIND_FACTORS: Record<WindUnit, number> = {
  kmh: 1,
  mph: 0.621371,
  ms: 1 / 3.6,
  kn: 0.539957,
};

const WIND_LABELS: Record<WindUnit, string> = {
  kmh: 'km/h',
  mph: 'mph',
  ms: 'm/s',
  kn: 'kn',
};

export function convertWind(kmh: number, unit: WindUnit): number {
  return kmh * WIND_FACTORS[unit];
}

export function windSymbol(unit: WindUnit): string {
  return WIND_LABELS[unit];
}

export function formatWind(kmh: number | null, unit: WindUnit, digits = 0): string {
  if (kmh == null || Number.isNaN(kmh)) return '—';
  return `${convertWind(kmh, unit).toFixed(digits)}`;
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

export function windDirectionLabel(degrees: number | null): string {
  if (degrees == null || Number.isNaN(degrees)) return '—';
  return COMPASS[Math.round(degrees / 22.5) % 16];
}

export interface Classification {
  label: string;
  /** Tailwind text colour class. */
  tone: string;
  /** Hex colour for charts and markers. */
  color: string;
}

export function uvCategory(uv: number | null): Classification {
  if (uv == null) return { label: 'Unavailable', tone: 'text-muted', color: '#8b9eb8' };
  if (uv < 3) return { label: 'Low', tone: 'text-emerald-400', color: '#34d399' };
  if (uv < 6) return { label: 'Moderate', tone: 'text-yellow-400', color: '#facc15' };
  if (uv < 8) return { label: 'High', tone: 'text-orange-400', color: '#fb923c' };
  if (uv < 11) return { label: 'Very high', tone: 'text-red-400', color: '#f87171' };
  return { label: 'Extreme', tone: 'text-fuchsia-400', color: '#e879f9' };
}

/** European AQI bands (Open-Meteo `european_aqi`). */
export function europeanAqiCategory(aqi: number | null): Classification {
  if (aqi == null) return { label: 'Unavailable', tone: 'text-muted', color: '#8b9eb8' };
  if (aqi <= 20) return { label: 'Good', tone: 'text-emerald-400', color: '#34d399' };
  if (aqi <= 40) return { label: 'Fair', tone: 'text-lime-400', color: '#a3e635' };
  if (aqi <= 60) return { label: 'Moderate', tone: 'text-yellow-400', color: '#facc15' };
  if (aqi <= 80) return { label: 'Poor', tone: 'text-orange-400', color: '#fb923c' };
  if (aqi <= 100) return { label: 'Very poor', tone: 'text-red-400', color: '#f87171' };
  return { label: 'Extremely poor', tone: 'text-fuchsia-400', color: '#e879f9' };
}

/** US AQI bands (Open-Meteo `us_aqi`). */
export function usAqiCategory(aqi: number | null): Classification {
  if (aqi == null) return { label: 'Unavailable', tone: 'text-muted', color: '#8b9eb8' };
  if (aqi <= 50) return { label: 'Good', tone: 'text-emerald-400', color: '#34d399' };
  if (aqi <= 100) return { label: 'Moderate', tone: 'text-yellow-400', color: '#facc15' };
  if (aqi <= 150) return { label: 'Unhealthy for sensitive groups', tone: 'text-orange-400', color: '#fb923c' };
  if (aqi <= 200) return { label: 'Unhealthy', tone: 'text-red-400', color: '#f87171' };
  if (aqi <= 300) return { label: 'Very unhealthy', tone: 'text-fuchsia-400', color: '#e879f9' };
  return { label: 'Hazardous', tone: 'text-rose-400', color: '#fb7185' };
}

export function humidityCategory(humidity: number | null): string {
  if (humidity == null) return 'Unavailable';
  if (humidity < 30) return 'Dry air';
  if (humidity < 60) return 'Comfortable';
  if (humidity < 80) return 'Humid';
  return 'Very humid';
}

export function pressureCategory(pressure: number | null): string {
  if (pressure == null) return 'Unavailable';
  if (pressure < 1000) return 'Low pressure';
  if (pressure < 1013) return 'Slightly low';
  if (pressure <= 1022) return 'Normal range';
  return 'High pressure';
}

export function visibilityCategory(meters: number | null): string {
  if (meters == null) return 'Unavailable';
  if (meters < 1000) return 'Very poor';
  if (meters < 4000) return 'Reduced';
  if (meters < 10000) return 'Moderate';
  return 'Clear';
}
