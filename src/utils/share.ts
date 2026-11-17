import type { Place } from '../types/weather';
import { placeId } from '../services/geocodingApi';

/**
 * Shareable location links.
 *
 * The app is a static SPA, so a location is fully described by its coordinates
 * plus a display label. Encoding them in the query string means a link such as
 * /?lat=51.5072&lon=-0.1276&name=London opens on London for anyone.
 */

export function placeToSearchParams(place: Place): URLSearchParams {
  const params = new URLSearchParams();
  params.set('lat', place.latitude.toFixed(4));
  params.set('lon', place.longitude.toFixed(4));
  if (place.name) params.set('name', place.name);
  if (place.admin1) params.set('admin1', place.admin1);
  if (place.country) params.set('country', place.country);
  if (place.countryCode) params.set('cc', place.countryCode);
  if (place.timezone) params.set('tz', place.timezone);
  return params;
}

export function placeToPath(place: Place, pathname = '/'): string {
  return `${pathname}?${placeToSearchParams(place).toString()}`;
}

export function shareUrlFor(place: Place): string {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?${placeToSearchParams(place).toString()}`;
}

/** Reads a place from the current URL, or null when no coordinates are present. */
export function placeFromSearch(search: string): Place | null {
  const params = new URLSearchParams(search);
  const rawLat = params.get('lat');
  const rawLon = params.get('lon');
  // Guard before Number(): Number(null) and Number('') are both 0, which would
  // silently place every visitor at 0°N 0°E.
  if (!rawLat?.trim() || !rawLon?.trim()) return null;
  const lat = Number(rawLat);
  const lon = Number(rawLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;

  const name = params.get('name')?.slice(0, 80) || 'Shared location';
  return {
    id: placeId(lat, lon),
    name,
    latitude: lat,
    longitude: lon,
    admin1: params.get('admin1')?.slice(0, 80) || undefined,
    country: params.get('country')?.slice(0, 80) || undefined,
    countryCode: params.get('cc')?.slice(0, 2) || undefined,
    timezone: params.get('tz')?.slice(0, 60) || undefined,
  };
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}
