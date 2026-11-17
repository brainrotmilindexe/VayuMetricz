import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react';
import { conditionFor } from '../../utils/weatherCodes';

interface WeatherIconProps {
  code: number | null;
  isDay?: boolean;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/** Condition- and day/night-aware weather glyph. Purely illustrative — labels carry the meaning. */
export function WeatherIcon({ code, isDay = true, size = 24, className = '', strokeWidth = 1.5 }: WeatherIconProps) {
  const { kind } = conditionFor(code);
  const Icon =
    kind === 'clear'
      ? isDay
        ? Sun
        : Moon
      : kind === 'partly'
        ? isDay
          ? CloudSun
          : CloudMoon
        : kind === 'fog'
          ? CloudFog
          : kind === 'drizzle'
            ? CloudDrizzle
            : kind === 'rain'
              ? CloudRain
              : kind === 'snow'
                ? CloudSnow
                : kind === 'storm'
                  ? CloudLightning
                  : Cloud;

  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}
