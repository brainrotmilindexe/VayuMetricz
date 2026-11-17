/**
 * Time helpers.
 *
 * Open-Meteo returns local wall-clock timestamps without an offset (with
 * timezone=auto), e.g. "2026-11-17T14:00". We deliberately parse those strings
 * ourselves and format them in UTC so the browser's own timezone never shifts
 * a location's local time.
 */

export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function parseLocal(iso: string): LocalParts {
  const [datePart, timePart = '00:00'] = iso.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return { year, month, day, hour, minute: minute ?? 0 };
}

export function toUTCDate(iso: string): Date {
  const p = parseLocal(iso);
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute));
}

/** "14:30" (24h) or "2:30 PM" (12h). */
export function formatTime(iso: string | null, hour12 = false): string {
  if (!iso) return '—';
  return toUTCDate(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
    timeZone: 'UTC',
  });
}

/** "14:00" / "2 PM" — used in hourly strips and chart axes. */
export function formatHour(iso: string | null, hour12 = false): string {
  if (!iso) return '—';
  if (hour12) {
    return toUTCDate(iso).toLocaleTimeString('en-GB', { hour: 'numeric', hour12: true, timeZone: 'UTC' });
  }
  return `${String(parseLocal(iso).hour).padStart(2, '0')}:00`;
}

export function formatHourShort(iso: string | null, hour12 = false): string {
  if (!iso) return '—';
  if (hour12) {
    return toUTCDate(iso).toLocaleTimeString('en-GB', { hour: 'numeric', hour12: true, timeZone: 'UTC' });
  }
  return String(parseLocal(iso).hour).padStart(2, '0');
}

/** "Mon" */
export function weekdayShort(iso: string): string {
  return toUTCDate(iso).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' });
}

/** "17 Nov" */
export function shortDate(iso: string): string {
  return toUTCDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** "Monday, 17 November 2026" */
export function longDate(iso: string): string {
  return toUTCDate(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "Monday, 17 November" */
export function mediumDate(iso: string): string {
  return toUTCDate(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

/** Live clock for a location from its UTC offset. */
export function clockForOffset(utcOffsetSeconds: number, hour12 = false): string {
  const shifted = new Date(Date.now() + utcOffsetSeconds * 1000);
  return shifted.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
    timeZone: 'UTC',
  });
}

/** The hour on the hour, used to align hourly series with current conditions. */
export function floorToHour(iso: string): string {
  return `${iso.slice(0, 13)}:00`;
}

/** Duration in seconds → "10h 42m". */
export function formatDuration(seconds: number | null): string {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  const total = Math.round(seconds / 60);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

/** Relative "updated 4 min ago" label. */
export function timeAgo(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}
