/** WMO weather interpretation codes → human labels, visual families and hero gradients. */

export type WeatherKind = 'clear' | 'partly' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

export interface ConditionMeta {
  label: string;
  kind: WeatherKind;
}

const CONDITIONS: Record<number, ConditionMeta> = {
  0: { label: 'Clear sky', kind: 'clear' },
  1: { label: 'Mainly clear', kind: 'clear' },
  2: { label: 'Partly cloudy', kind: 'partly' },
  3: { label: 'Overcast', kind: 'cloudy' },
  45: { label: 'Fog', kind: 'fog' },
  48: { label: 'Depositing rime fog', kind: 'fog' },
  51: { label: 'Light drizzle', kind: 'drizzle' },
  53: { label: 'Moderate drizzle', kind: 'drizzle' },
  55: { label: 'Dense drizzle', kind: 'drizzle' },
  56: { label: 'Light freezing drizzle', kind: 'drizzle' },
  57: { label: 'Dense freezing drizzle', kind: 'drizzle' },
  61: { label: 'Slight rain', kind: 'rain' },
  63: { label: 'Moderate rain', kind: 'rain' },
  65: { label: 'Heavy rain', kind: 'rain' },
  66: { label: 'Light freezing rain', kind: 'rain' },
  67: { label: 'Heavy freezing rain', kind: 'rain' },
  71: { label: 'Slight snowfall', kind: 'snow' },
  73: { label: 'Moderate snowfall', kind: 'snow' },
  75: { label: 'Heavy snowfall', kind: 'snow' },
  77: { label: 'Snow grains', kind: 'snow' },
  80: { label: 'Slight rain showers', kind: 'rain' },
  81: { label: 'Moderate rain showers', kind: 'rain' },
  82: { label: 'Violent rain showers', kind: 'rain' },
  85: { label: 'Slight snow showers', kind: 'snow' },
  86: { label: 'Heavy snow showers', kind: 'snow' },
  95: { label: 'Thunderstorm', kind: 'storm' },
  96: { label: 'Thunderstorm with slight hail', kind: 'storm' },
  99: { label: 'Thunderstorm with heavy hail', kind: 'storm' },
};

export function conditionFor(code: number | null): ConditionMeta {
  if (code == null) return { label: 'Unavailable', kind: 'cloudy' };
  return CONDITIONS[code] ?? { label: 'Mixed conditions', kind: 'cloudy' };
}

export function isHazardous(code: number | null): boolean {
  return code != null && (code >= 95 || code === 65 || code === 67 || code === 75 || code === 82);
}

const ACCENTS: Record<WeatherKind, string> = {
  clear: '#38bdf8',
  partly: '#22d3ee',
  cloudy: '#94a3b8',
  fog: '#a8b3c2',
  drizzle: '#7dd3fc',
  rain: '#38bdf8',
  snow: '#bae6fd',
  storm: '#a78bfa',
};

export function accentFor(kind: WeatherKind): string {
  return ACCENTS[kind];
}

const DAY_GRADIENTS: Record<WeatherKind, string> = {
  clear: 'linear-gradient(135deg, #0b3a63 0%, #11608f 42%, #071726 100%)',
  partly: 'linear-gradient(135deg, #123a5c 0%, #1a567d 45%, #08131f 100%)',
  cloudy: 'linear-gradient(135deg, #1c2b3b 0%, #223447 48%, #080e18 100%)',
  fog: 'linear-gradient(135deg, #2a3542 0%, #1e2a36 48%, #0a1118 100%)',
  drizzle: 'linear-gradient(135deg, #0d2437 0%, #14405a 45%, #081420 100%)',
  rain: 'linear-gradient(135deg, #0a1e33 0%, #123a52 45%, #060e1a 100%)',
  snow: 'linear-gradient(135deg, #1a3a4c 0%, #2a5b70 45%, #0b1724 100%)',
  storm: 'linear-gradient(135deg, #0b1224 0%, #221f4a 50%, #080c18 100%)',
};

const NIGHT_GRADIENTS: Record<WeatherKind, string> = {
  clear: 'linear-gradient(135deg, #050b18 0%, #0c1f38 48%, #0a2a44 100%)',
  partly: 'linear-gradient(135deg, #060d1a 0%, #10223a 48%, #0b2033 100%)',
  cloudy: 'linear-gradient(135deg, #0d1622 0%, #17222f 48%, #080e18 100%)',
  fog: 'linear-gradient(135deg, #1b242f 0%, #141d27 48%, #080d14 100%)',
  drizzle: 'linear-gradient(135deg, #08151f 0%, #0e2637 45%, #060d16 100%)',
  rain: 'linear-gradient(135deg, #071625 0%, #0d2436 45%, #050b13 100%)',
  snow: 'linear-gradient(135deg, #10222e 0%, #173445 45%, #080f18 100%)',
  storm: 'linear-gradient(135deg, #070b16 0%, #1a1838 50%, #06090f 100%)',
};

export function heroGradient(kind: WeatherKind, isDay: boolean): string {
  return isDay ? DAY_GRADIENTS[kind] : NIGHT_GRADIENTS[kind];
}
