import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AirQualitySnapshot, Place, Settings, WeatherSnapshot } from '../types/weather';
import { fetchAirQuality } from '../services/airQualityApi';
import { placeFromCoordinates } from '../services/geocodingApi';
import { fetchForecast } from '../services/weatherApi';
import { placeFromSearch, placeToSearchParams } from '../utils/share';

type LoadStatus = 'loading' | 'ready' | 'error';
type GeoStatus = 'idle' | 'locating' | 'denied' | 'error' | 'granted';

interface AppContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  place: Place;
  setPlace: (place: Place) => void;
  saved: Place[];
  isSaved: (place: Place) => boolean;
  toggleSaved: (place: Place) => void;
  weather: WeatherSnapshot | null;
  air: AirQualitySnapshot | null;
  status: LoadStatus;
  error: string | null;
  airError: string | null;
  refresh: () => Promise<void>;
  lastUpdated: number | null;
  geoStatus: GeoStatus;
  geoMessage: string | null;
  locate: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_PLACE: Place = {
  id: '28.6139,77.2090',
  name: 'New Delhi',
  admin1: 'Delhi',
  country: 'India',
  countryCode: 'IN',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 'Asia/Kolkata',
};

const DEFAULT_SETTINGS: Settings = {
  temperatureUnit: 'c',
  windUnit: 'kmh',
  theme: 'dark',
  hour12: false,
};

const SEED_LOCATIONS: Place[] = [
  DEFAULT_PLACE,
  {
    id: '51.5072,-0.1276',
    name: 'London',
    admin1: 'England',
    country: 'United Kingdom',
    countryCode: 'GB',
    latitude: 51.5072,
    longitude: -0.1276,
    timezone: 'Europe/London',
  },
  {
    id: '35.6895,139.6917',
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    latitude: 35.6895,
    longitude: 139.6917,
    timezone: 'Asia/Tokyo',
  },
  {
    id: '40.7128,-74.0060',
    name: 'New York',
    admin1: 'New York',
    country: 'United States',
    countryCode: 'US',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
  },
];

const KEYS = {
  settings: 'vayumetricz.settings.v1',
  place: 'vayumetricz.place.v1',
  saved: 'vayumetricz.saved.v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Stored data is user-editable, so every value is validated before use. */
function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Place>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.length > 0 &&
    typeof candidate.latitude === 'number' &&
    Number.isFinite(candidate.latitude) &&
    Math.abs(candidate.latitude) <= 90 &&
    typeof candidate.longitude === 'number' &&
    Number.isFinite(candidate.longitude) &&
    Math.abs(candidate.longitude) <= 180
  );
}

function safePlace(value: unknown, fallback: Place): Place {
  return isPlace(value) ? value : fallback;
}

const TEMPERATURE_UNITS: Settings['temperatureUnit'][] = ['c', 'f'];
const WIND_UNITS: Settings['windUnit'][] = ['kmh', 'mph', 'ms', 'kn'];
const THEMES: Settings['theme'][] = ['dark', 'light'];

/** Sanitises stored settings so an old or hand-edited payload cannot break rendering. */
function sanitiseSettings(value: unknown): Settings {
  const input = (value ?? {}) as Partial<Settings>;
  return {
    temperatureUnit: TEMPERATURE_UNITS.includes(input.temperatureUnit as Settings['temperatureUnit'])
      ? (input.temperatureUnit as Settings['temperatureUnit'])
      : DEFAULT_SETTINGS.temperatureUnit,
    windUnit: WIND_UNITS.includes(input.windUnit as Settings['windUnit'])
      ? (input.windUnit as Settings['windUnit'])
      : DEFAULT_SETTINGS.windUnit,
    theme: THEMES.includes(input.theme as Settings['theme'])
      ? (input.theme as Settings['theme'])
      : DEFAULT_SETTINGS.theme,
    hour12: typeof input.hour12 === 'boolean' ? input.hour12 : DEFAULT_SETTINGS.hour12,
  };
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode); the app still works in memory */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() =>
    sanitiseSettings(readStorage<Partial<Settings>>(KEYS.settings, {})),
  );
  const [place, setPlaceState] = useState<Place>(() =>
    placeFromSearch(window.location.search) ?? safePlace(readStorage<unknown>(KEYS.place, null), DEFAULT_PLACE),
  );
  const [saved, setSaved] = useState<Place[]>(() => {
    const stored = readStorage<unknown>(KEYS.saved, SEED_LOCATIONS);
    const valid = Array.isArray(stored) ? stored.filter(isPlace).slice(0, 8) : [];
    return valid.length > 0 ? valid : SEED_LOCATIONS;
  });

  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [air, setAir] = useState<AirQualitySnapshot | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [airError, setAirError] = useState<string | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const requestRef = useRef(0);

  const setPlace = useCallback((next: Place) => {
    setPlaceState(next);
    writeStorage(KEYS.place, next);
  }, []);

  // Keep the address bar shareable: the current place is always in the query.
  useEffect(() => {
    const params = placeToSearchParams(place);
    const next = `${window.location.pathname}?${params.toString()}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [place]);

  // A pasted share link changes the place without a reload.
  useEffect(() => {
    const onPopState = () => {
      const shared = placeFromSearch(window.location.search);
      if (shared && shared.id !== place.id) setPlace(shared);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [place.id, setPlace]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = sanitiseSettings({ ...prev, ...patch });
      writeStorage(KEYS.settings, next);
      return next;
    });
  }, []);

  // Theme is applied to <html> so Tailwind's dark variant and the CSS tokens respond.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', settings.theme === 'dark');
    root.style.colorScheme = settings.theme;
  }, [settings.theme]);

  const load = useCallback(
    async (force = false) => {
      const requestId = ++requestRef.current;
      setStatus((current) => (current === 'ready' && !force ? current : 'loading'));
      setError(null);
      setAirError(null);
      try {
        const snapshot = await fetchForecast(place, { force });
        if (requestId !== requestRef.current) return;
        setWeather(snapshot);
        setStatus('ready');
      } catch (cause) {
        if (requestId !== requestRef.current) return;
        setError((cause as Error).message || 'Unable to load the forecast.');
        setStatus('error');
        return;
      }

      try {
        const airSnapshot = await fetchAirQuality(place, { force });
        if (requestId !== requestRef.current) return;
        setAir(airSnapshot);
      } catch (cause) {
        if (requestId !== requestRef.current) return;
        setAir(null);
        setAirError((cause as Error).message || 'Air quality is unavailable for this location.');
      }
    },
    [place],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  // Refresh quietly every 10 minutes; the service cache prevents needless calls.
  useEffect(() => {
    const timer = window.setInterval(() => void load(false), 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  const refresh = useCallback(async () => {
    await load(true);
  }, [load]);

  const isSaved = useCallback(
    (target: Place) => saved.some((item) => item.id === target.id),
    [saved],
  );

  const toggleSaved = useCallback((target: Place) => {
    setSaved((prev) => {
      const exists = prev.some((item) => item.id === target.id);
      const next = exists ? prev.filter((item) => item.id !== target.id) : [...prev, target].slice(-8);
      writeStorage(KEYS.saved, next);
      return next;
    });
  }, []);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('error');
      setGeoMessage('This browser does not expose a geolocation API. Use search instead.');
      return;
    }
    setGeoStatus('locating');
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoStatus('granted');
        setGeoMessage(null);
        setPlace(placeFromCoordinates(position.coords.latitude, position.coords.longitude));
      },
      (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setGeoStatus('denied');
          setGeoMessage('Location permission was denied. Search for a city instead.');
        } else {
          setGeoStatus('error');
          setGeoMessage('Your location could not be determined. Try again or search manually.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, [setPlace]);

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      updateSettings,
      place,
      setPlace,
      saved,
      isSaved,
      toggleSaved,
      weather,
      air,
      status,
      error,
      airError,
      refresh,
      lastUpdated: weather?.fetchedAt ?? null,
      geoStatus,
      geoMessage,
      locate,
    }),
    [
      settings,
      updateSettings,
      place,
      setPlace,
      saved,
      isSaved,
      toggleSaved,
      weather,
      air,
      status,
      error,
      airError,
      refresh,
      geoStatus,
      geoMessage,
      locate,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside an AppProvider');
  return context;
}

/** Convenience hook for the current display units. */
export function useUnits() {
  const { settings } = useApp();
  return {
    temperatureUnit: settings.temperatureUnit,
    windUnit: settings.windUnit,
    hour12: settings.hour12,
  };
}
