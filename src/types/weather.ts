/** Core data model for VayuMetricz. All values arrive from Open-Meteo in metric units. */

export interface Place {
  /** Stable identity derived from rounded coordinates. */
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  countryCode?: string;
  admin1?: string;
  timezone?: string;
}

export interface CurrentConditions {
  /** Local time at the location, ISO without offset (e.g. 2026-11-17T14:30). */
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  dewPoint: number | null;
  precipitation: number;
  weatherCode: number;
  isDay: boolean;
  cloudCover: number | null;
  pressureMsl: number | null;
  windSpeed: number;
  windDirection: number;
  windGusts: number | null;
  visibility: number | null;
  uvIndex: number | null;
}

export interface HourlyPoint {
  time: string;
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  dewPoint: number | null;
  precipitationProbability: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  cloudCover: number | null;
  visibility: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  windGusts: number | null;
  pressure: number | null;
  uvIndex: number | null;
  isDay: boolean | null;
}

export interface DailyPoint {
  date: string;
  weatherCode: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  apparentMax: number | null;
  apparentMin: number | null;
  sunrise: string | null;
  sunset: string | null;
  uvIndexMax: number | null;
  precipitationSum: number | null;
  precipitationProbabilityMax: number | null;
  windSpeedMax: number | null;
  windGustsMax: number | null;
  windDirectionDominant: number | null;
  daylightSeconds: number | null;
}

export interface WeatherSnapshot {
  place: Place;
  fetchedAt: number;
  timezone: string;
  timezoneAbbreviation: string;
  utcOffsetSeconds: number;
  elevation: number | null;
  current: CurrentConditions;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
}

export interface AirQualityCurrent {
  time: string;
  europeanAqi: number | null;
  usAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  carbonMonoxide: number | null;
  nitrogenDioxide: number | null;
  ozone: number | null;
  sulphurDioxide: number | null;
}

export interface AirQualityPoint {
  time: string;
  pm25: number | null;
  pm10: number | null;
  europeanAqi: number | null;
}

export interface AirQualitySnapshot {
  fetchedAt: number;
  place: Place;
  timezone: string;
  current: AirQualityCurrent;
  hourly: AirQualityPoint[];
}

export interface WeatherAlert {
  id: string;
  title: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  area: string;
  starts: string;
  ends: string;
  description: string;
  source: string;
}

export interface Settings {
  temperatureUnit: 'c' | 'f';
  windUnit: 'kmh' | 'mph' | 'ms' | 'kn';
  theme: 'dark' | 'light';
  hour12: boolean;
}
