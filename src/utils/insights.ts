import type { AirQualitySnapshot, WeatherSnapshot } from '../types/weather';
import { floorToHour, formatHour, formatTime } from './time';
import { formatTemperature, formatWind, uvCategory, windDirectionLabel, windSymbol } from './units';
import type { Settings } from '../types/weather';

/**
 * VayuMetricz insight engine.
 *
 * Every insight is produced by an explicit, auditable rule over the Open-Meteo
 * forecast payload. Nothing here predicts weather — the text only restates what
 * the provider's numbers show, together with the measurements that triggered it.
 */

export type InsightCategory =
  | 'temperature'
  | 'precipitation'
  | 'wind'
  | 'humidity'
  | 'pressure'
  | 'uv'
  | 'visibility'
  | 'air';

export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;
  detail: string;
  evidence: string;
  period: string;
  tone: 'info' | 'warn' | 'positive';
}

const HOUR_MS = 60 * 60 * 1000;

function seriesFrom(snapshot: WeatherSnapshot, count: number) {
  const start = floorToHour(snapshot.current.time);
  const startIndex = snapshot.hourly.findIndex((point) => point.time >= start);
  const index = startIndex === -1 ? 0 : startIndex;
  return snapshot.hourly.slice(index, index + count);
}

function mean(values: (number | null)[]): number | null {
  const usable = values.filter((value): value is number => value != null);
  if (usable.length === 0) return null;
  return usable.reduce((sum, value) => sum + value, 0) / usable.length;
}

export function buildInsights(
  snapshot: WeatherSnapshot,
  settings: Settings,
  air: AirQualitySnapshot | null,
): Insight[] {
  const insights: Insight[] = [];
  const { temperatureUnit, windUnit, hour12 } = settings;
  const next24 = seriesFrom(snapshot, 24);
  const next12 = next24.slice(0, 12);
  const today = snapshot.daily[0];
  const tomorrow = snapshot.daily[1];

  /* 1 — warmest hour of the day */
  const todayPoints = snapshot.hourly.filter((point) => point.time.slice(0, 10) === snapshot.current.time.slice(0, 10));
  const peak = todayPoints.reduce<(typeof todayPoints)[number] | null>((best, point) => {
    if (point.temperature == null) return best;
    if (!best || best.temperature == null || point.temperature > best.temperature) return point;
    return best;
  }, null);
  if (peak && peak.temperature != null) {
    insights.push({
      id: 'peak-temperature',
      category: 'temperature',
      title: `Peak temperature near ${formatHour(peak.time, hour12)}`,
      detail: `Temperatures are modelled to top out at ${formatTemperature(peak.temperature, temperatureUnit)} around ${formatHour(peak.time, hour12)} local time. Daily range ${formatTemperature(today?.temperatureMin ?? null, temperatureUnit)} to ${formatTemperature(today?.temperatureMax ?? null, temperatureUnit)}.`,
      evidence: `Maximum hourly 2 m temperature = ${formatTemperature(peak.temperature, temperatureUnit, 1)}`,
      period: `Today, ${formatHour(peak.time, hour12)}`,
      tone: 'info',
    });
  }

  /* 2 — temperature direction over the next six hours */
  const currentTemp = snapshot.current.temperature;
  const plusSix = next24[6]?.temperature ?? null;
  if (plusSix != null && Number.isFinite(currentTemp)) {
    const delta = plusSix - currentTemp;
    if (Math.abs(delta) >= 2) {
      insights.push({
        id: 'temperature-trend',
        category: 'temperature',
        title: delta > 0 ? `Warming by ${Math.abs(delta).toFixed(1)}°` : `Cooling by ${Math.abs(delta).toFixed(1)}°`,
        detail:
          delta > 0
            ? `The forecast climbs from ${formatTemperature(currentTemp, temperatureUnit)} now to ${formatTemperature(plusSix, temperatureUnit)} by ${formatHour(next24[6]?.time ?? null, hour12)}.`
            : `The forecast eases from ${formatTemperature(currentTemp, temperatureUnit)} now to ${formatTemperature(plusSix, temperatureUnit)} by ${formatHour(next24[6]?.time ?? null, hour12)}.`,
        evidence: `Δ 2 m temperature over 6 h = ${delta > 0 ? '+' : ''}${delta.toFixed(1)} K`,
        period: `Next 6 hours`,
        tone: delta > 0 ? 'info' : 'info',
      });
    }
  }

  /* 3 — wettest window in the next 24 hours */
  const wetHours = next24.filter(
    (point) => (point.precipitationProbability ?? 0) >= 40 || (point.precipitation ?? 0) >= 0.2,
  );
  if (wetHours.length > 0) {
    const peakProbability = Math.max(...wetHours.map((point) => point.precipitationProbability ?? 0));
    insights.push({
      id: 'precipitation-window',
      category: 'precipitation',
      title: `Rain signal between ${formatHour(wetHours[0].time, hour12)} and ${formatHour(wetHours[wetHours.length - 1].time, hour12)}`,
      detail: `${wetHours.length} of the next 24 hours carry a rain signal. Peak probability ${peakProbability.toFixed(0)}% at ${formatHour(wetHours.reduce((best, point) => ((point.precipitationProbability ?? 0) > (best.precipitationProbability ?? 0) ? point : best)).time, hour12)}.`,
      evidence: `Hours with ≥40% probability or ≥0.2 mm = ${wetHours.length} · peak ${peakProbability.toFixed(0)}%`,
      period: `${formatHour(wetHours[0].time, hour12)} → ${formatHour(wetHours[wetHours.length - 1].time, hour12)}`,
      tone: wetHours.length >= 4 ? 'warn' : 'info',
    });
  } else {
    const maxProbability = Math.max(...next24.map((point) => point.precipitationProbability ?? 0), 0);
    insights.push({
      id: 'precipitation-dry',
      category: 'precipitation',
      title: 'No meaningful rain signal in the next 24 hours',
      detail: `Precipitation probability stays at or below ${maxProbability.toFixed(0)}% for every hour in the next day.`,
      evidence: `Maximum hourly precipitation probability = ${maxProbability.toFixed(0)}%`,
      period: 'Next 24 hours',
      tone: 'positive',
    });
  }

  /* 4 — expected total rainfall */
  const rainSum = next24.reduce((sum, point) => sum + (point.precipitation ?? 0), 0);
  if (rainSum >= 0.1) {
    insights.push({
      id: 'rain-total',
      category: 'precipitation',
      title: `${rainSum.toFixed(1)} mm of precipitation expected`,
      detail: `Accumulated over the next 24 hours from hourly precipitation rates. Wet hours: ${next24.filter((point) => (point.precipitation ?? 0) >= 0.1).length}.`,
      evidence: `Σ hourly precipitation (next 24 h) = ${rainSum.toFixed(2)} mm`,
      period: 'Next 24 hours',
      tone: rainSum >= 10 ? 'warn' : 'info',
    });
  }

  /* 5 — wind trend */
  const windFirst = mean(next12.slice(0, 6).map((point) => point.windSpeed));
  const windLast = mean(next12.slice(6, 12).map((point) => point.windSpeed));
  if (windFirst != null && windLast != null && Math.abs(windLast - windFirst) >= 5) {
    insights.push({
      id: 'wind-trend',
      category: 'wind',
      title: windLast > windFirst ? 'Wind strengthening over the next 12 hours' : 'Wind easing over the next 12 hours',
      detail: `Average wind moves from ${formatWind(windFirst, windUnit, 1)} to ${formatWind(windLast, windUnit, 1)} ${windSymbol(windUnit)}, currently from ${windDirectionLabel(snapshot.current.windDirection)}.`,
      evidence: `Mean 10 m wind 0–6 h = ${formatWind(windFirst, windUnit, 1)} ${windSymbol(windUnit)} → 6–12 h = ${formatWind(windLast, windUnit, 1)} ${windSymbol(windUnit)}`,
      period: 'Next 12 hours',
      tone: windLast - windFirst >= 12 ? 'warn' : 'info',
    });
  }

  /* 6 — strongest gust in the next 24 hours */
  const gustPeak = next24.reduce<{ time: string; value: number } | null>((best, point) => {
    if (point.windGusts == null) return best;
    return !best || point.windGusts > best.value ? { time: point.time, value: point.windGusts } : best;
  }, null);
  if (gustPeak && gustPeak.value >= 35) {
    insights.push({
      id: 'wind-gust',
      category: 'wind',
      title: `Gusts up to ${formatWind(gustPeak.value, windUnit)} ${windSymbol(windUnit)}`,
      detail: `The strongest modelled gust in the next 24 hours arrives around ${formatHour(gustPeak.time, hour12)}. Secure loose outdoor objects if you are in an exposed area.`,
      evidence: `Maximum 10 m wind gust (next 24 h) = ${formatWind(gustPeak.value, windUnit, 1)} ${windSymbol(windUnit)}`,
      period: formatHour(gustPeak.time, hour12),
      tone: gustPeak.value >= 60 ? 'warn' : 'info',
    });
  }

  /* 7 — overnight humidity */
  const humidityNow = snapshot.current.humidity;
  const humidityPeak = next24.slice(0, 18).reduce<{ time: string; value: number } | null>((best, point) => {
    if (point.humidity == null) return best;
    return !best || point.humidity > best.value ? { time: point.time, value: point.humidity } : best;
  }, null);
  if (humidityPeak && humidityPeak.value - humidityNow >= 12) {
    insights.push({
      id: 'humidity-rise',
      category: 'humidity',
      title: `Humidity climbs to ${humidityPeak.value.toFixed(0)}%`,
      detail: `Relative humidity rises from ${humidityNow.toFixed(0)}% now to ${humidityPeak.value.toFixed(0)}% around ${formatHour(humidityPeak.time, hour12)} — typical of overnight cooling.`,
      evidence: `Δ RH = +${(humidityPeak.value - humidityNow).toFixed(0)} percentage points`,
      period: formatHour(humidityPeak.time, hour12),
      tone: humidityPeak.value >= 90 ? 'warn' : 'info',
    });
  }

  /* 8 — mugginess from the dew point */
  if (snapshot.current.dewPoint != null) {
    const spread = snapshot.current.temperature - snapshot.current.dewPoint;
    if (spread <= 4) {
      insights.push({
        id: 'dew-point',
        category: 'humidity',
        title: 'Air feels muggy',
        detail: `The dew point is ${formatTemperature(snapshot.current.dewPoint, temperatureUnit, 1)}, only ${spread.toFixed(1)} K below the air temperature, so sweat evaporates slowly.`,
        evidence: `T − Td = ${spread.toFixed(1)} K (≤ 4 K threshold)`,
        period: 'Now',
        tone: 'info',
      });
    }
  }

  /* 9 — pressure trend */
  const pressureNow = snapshot.current.pressureMsl;
  const pressureLater = next24[18]?.pressure ?? null;
  if (pressureNow != null && pressureLater != null && Math.abs(pressureLater - pressureNow) >= 3) {
    const falling = pressureLater < pressureNow;
    insights.push({
      id: 'pressure-trend',
      category: 'pressure',
      title: falling ? 'Pressure falling over the next 18 hours' : 'Pressure rising over the next 18 hours',
      detail: `${pressureNow.toFixed(1)} hPa now → ${pressureLater.toFixed(1)} hPa at ${formatHour(next24[18]?.time ?? null, hour12)}. ${falling ? 'Falling pressure often accompanies approaching unsettled weather.' : 'Rising pressure usually indicates settling conditions.'}`,
      evidence: `Δ MSL pressure = ${falling ? '' : '+'}${(pressureLater - pressureNow).toFixed(1)} hPa`,
      period: 'Next 18 hours',
      tone: falling ? 'warn' : 'positive',
    });
  }

  /* 10 — UV */
  const uvMax = today?.uvIndexMax ?? null;
  if (uvMax != null) {
    const category = uvCategory(uvMax);
    insights.push({
      id: 'uv',
      category: 'uv',
      title: `UV index peaks at ${uvMax.toFixed(1)} (${category.label.toLowerCase()})`,
      detail:
        uvMax >= 6
          ? `Peak UV occurs around local solar noon. Unprotected skin can burn quickly — use sunscreen, a hat and shade during the middle of the day.`
          : `UV levels stay ${category.label.toLowerCase()} today. ${uvMax >= 3 ? 'Some protection is sensible around midday.' : 'No special protection is needed for most people.'}`,
      evidence: `Daily maximum UV index = ${uvMax.toFixed(1)} (${category.label})`,
      period: 'Today',
      tone: uvMax >= 8 ? 'warn' : 'info',
    });
  }

  /* 11 — visibility */
  const worstVisibility = next12.reduce<{ time: string; value: number } | null>((best, point) => {
    if (point.visibility == null) return best;
    return !best || point.visibility < best.value ? { time: point.time, value: point.visibility } : best;
  }, null);
  if (worstVisibility && worstVisibility.value < 4000) {
    insights.push({
      id: 'visibility',
      category: 'visibility',
      title: `Visibility drops to ${(worstVisibility.value / 1000).toFixed(1)} km`,
      detail: `Reduced visibility is forecast around ${formatHour(worstVisibility.time, hour12)}. Allow extra travel time and use low-visibility lighting if driving.`,
      evidence: `Minimum hourly visibility (next 12 h) = ${worstVisibility.value.toFixed(0)} m`,
      period: formatHour(worstVisibility.time, hour12),
      tone: 'warn',
    });
  }

  /* 12 — air quality */
  const aqi = air?.current.europeanAqi ?? null;
  if (aqi != null) {
    insights.push({
      id: 'air-quality',
      category: 'air',
      title: `European AQI ${aqi.toFixed(0)} at the latest observation`,
      detail: `Modelled PM2.5 is ${air?.current.pm25?.toFixed(1) ?? '—'} µg/m³ and PM10 is ${air?.current.pm10?.toFixed(1) ?? '—'} µg/m³. ${aqi > 60 ? 'Sensitive groups may want to limit prolonged outdoor exertion.' : 'Air quality is not expected to restrict normal outdoor activity.'}`,
      evidence: `Open-Meteo CAMS European AQI = ${aqi.toFixed(0)}`,
      period: `Observation ${formatTime(air?.current.time || null, hour12)}`,
      tone: aqi > 60 ? 'warn' : 'positive',
    });
  }

  /* 13 — tomorrow summary */
  if (tomorrow && tomorrow.temperatureMax != null && tomorrow.temperatureMin != null) {
    insights.push({
      id: 'tomorrow',
      category: 'temperature',
      title: `Tomorrow: ${formatTemperature(tomorrow.temperatureMax, temperatureUnit)} / ${formatTemperature(tomorrow.temperatureMin, temperatureUnit)}`,
      detail: `Overnight low ${formatTemperature(tomorrow.temperatureMin, temperatureUnit)}, afternoon high ${formatTemperature(tomorrow.temperatureMax, temperatureUnit)}, maximum precipitation probability ${(tomorrow.precipitationProbabilityMax ?? 0).toFixed(0)}%, wind up to ${formatWind(tomorrow.windSpeedMax, windUnit)} ${windSymbol(windUnit)}.`,
      evidence: `Daily min/max from Open-Meteo, ${tomorrow.date}`,
      period: 'Tomorrow',
      tone: 'info',
    });
  }

  return insights;
}

/** Hours until a timestamp (used for freshness messaging). */
export function staleHours(fetchedAt: number): number {
  return (Date.now() - fetchedAt) / HOUR_MS;
}
