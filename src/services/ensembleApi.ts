import type { Place } from '../types/weather';
import { getJSON } from './http';

/**
 * Open-Meteo Ensemble API — https://open-meteo.com/en/docs/ensemble-api
 *
 * A deterministic forecast is a single answer; an ensemble is 30 answers from
 * slightly perturbed starting conditions. The spread between them is the
 * honest measure of how much the atmosphere could still do differently, so
 * VayuMetricz shows the 10th–90th percentile band instead of claiming one
 * number is the truth.
 */

const ENSEMBLE_URL = 'https://ensemble-api.open-meteo.com/v1/ensemble';

export interface EnsembleHour {
  time: string;
  p10: number;
  p50: number;
  p90: number;
  spread: number;
}

export interface EnsembleSnapshot {
  fetchedAt: number;
  place: Place;
  hours: EnsembleHour[];
  memberCount: number;
}

interface RawEnsemble {
  hourly?: Record<string, (number | null)[] | string[]>;
}

/** Linear-interpolated quantile on an already sorted array. */
function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return Number.NaN;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function buildEnsembleUrl(place: Pick<Place, 'latitude' | 'longitude'>, days = 7): string {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    hourly: 'temperature_2m',
    models: 'gfs025',
    forecast_days: String(days),
    timezone: 'auto',
    temperature_unit: 'celsius',
  });
  return `${ENSEMBLE_URL}?${params.toString()}`;
}

export async function fetchEnsemble(
  place: Place,
  options: { force?: boolean; signal?: AbortSignal } = {},
): Promise<EnsembleSnapshot> {
  const raw = await getJSON<RawEnsemble>(buildEnsembleUrl(place), {
    ttlMs: 30 * 60 * 1000,
    force: options.force,
    signal: options.signal,
  });

  const hourly = raw.hourly ?? {};
  const times = (hourly.time as string[] | undefined) ?? [];
  const memberKeys = Object.keys(hourly)
    .filter((key) => key.startsWith('temperature_2m'))
    .sort();

  const members = memberKeys.map((key) => hourly[key] as (number | null)[]);

  const hours: EnsembleHour[] = times.map((time, index) => {
    const values = members
      .map((series) => series[index])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      .sort((a, b) => a - b);

    if (values.length === 0) {
      return { time, p10: Number.NaN, p50: Number.NaN, p90: Number.NaN, spread: Number.NaN };
    }

    const p10 = quantile(values, 0.1);
    const p50 = quantile(values, 0.5);
    const p90 = quantile(values, 0.9);
    return { time, p10, p50, p90, spread: p90 - p10 };
  });

  return {
    fetchedAt: Date.now(),
    place,
    hours: hours.filter((hour) => Number.isFinite(hour.p50)),
    memberCount: memberKeys.length,
  };
}

export type ConfidenceLevel = 'high' | 'moderate' | 'low';

/** Spread thresholds in °C, applied to a whole day's mean ensemble spread. */
export function confidenceFor(spreadCelsius: number): { level: ConfidenceLevel; label: string } {
  if (spreadCelsius < 2) return { level: 'high', label: 'High confidence' };
  if (spreadCelsius < 4) return { level: 'moderate', label: 'Moderate confidence' };
  return { level: 'low', label: 'Low confidence' };
}
