import type { Place } from '../types/weather';
import { getJSON } from './http';

/** Open-Meteo geocoding service: https://open-meteo.com/en/docs/geocoding-api */

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

interface RawGeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
}

interface RawGeoResponse {
  results?: RawGeoResult[];
}

export function placeId(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

export function toPlace(result: RawGeoResult): Place {
  return {
    id: placeId(result.latitude, result.longitude),
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    country: result.country,
    countryCode: result.country_code,
    admin1: result.admin1 ?? result.admin2,
    timezone: result.timezone,
  };
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: '8',
    language: 'en',
    format: 'json',
  });

  const data = await getJSON<RawGeoResponse>(`${GEOCODING_URL}?${params.toString()}`, {
    ttlMs: 24 * 60 * 60 * 1000,
    signal,
  });

  return (data.results ?? []).map(toPlace);
}

/** Build a place from raw browser coordinates (reverse geocoding is not offered by Open-Meteo). */
export function placeFromCoordinates(latitude: number, longitude: number): Place {
  return {
    id: placeId(latitude, longitude),
    name: 'Current location',
    latitude,
    longitude,
  };
}
