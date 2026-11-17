import {
  CalendarRange,
  LayoutDashboard,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Moon,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { SearchBar } from './SearchBar';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/forecast', label: 'Forecast', icon: CalendarRange, end: false },
  { to: '/maps', label: 'Weather Maps', icon: MapIcon, end: false },
  { to: '/insights', label: 'Insights', icon: Sparkles, end: false },
  { to: '/locations', label: 'Locations', icon: MapPin, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

function LogoMark() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-xl border border-accent/25 bg-gradient-to-br from-accent/20 to-transparent">
      <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden>
        <defs>
          <linearGradient id="logoGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#67e8f9" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path d="M5 20c4.2 0 5.2-7 10.4-7s6.3 4 9.6 4" fill="none" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 25c3.6 0 4.7-4.4 8.8-4.4s5.7 2.4 9.2 2.4" fill="none" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        <circle cx="23" cy="9" r="2.6" fill="url(#logoGradient)" />
      </svg>
    </span>
  );
}

export function Navbar() {
  const { settings, updateSettings, geoStatus, geoMessage, locate, place } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  useEffect(() => {
    setDismissedMessage(null);
  }, [geoMessage]);

  const showGeoMessage = geoMessage && geoMessage !== dismissedMessage;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="VayuMetricz home">
            <LogoMark />
            <span className="hidden sm:block">
              <span className="block font-display text-[15px] font-semibold leading-none tracking-tight text-ink">
                VayuMetricz
              </span>
              <span className="mt-1 block text-[8.5px] uppercase tracking-[0.2em] text-muted">
                Weather, measured intelligently
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="ml-3 hidden items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'relative rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors',
                    isActive ? 'text-accent' : 'text-muted hover:text-ink',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive ? (
                      <span className="absolute inset-x-2.5 -bottom-[13px] h-0.5 rounded-full bg-accent" aria-hidden />
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden w-52 md:block lg:w-64">
              <SearchBar />
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen((open) => !open)}
              aria-label={searchOpen ? 'Close location search' : 'Search locations'}
              aria-expanded={searchOpen}
              className="rounded-lg border border-line bg-panel/60 p-2 text-muted transition hover:text-ink md:hidden"
            >
              {searchOpen ? <X size={15} /> : <Search size={15} />}
            </button>

            <div className="flex items-center rounded-lg border border-line bg-panel/60 p-0.5" role="group" aria-label="Temperature unit">
              {(['c', 'f'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => updateSettings({ temperatureUnit: unit })}
                  aria-pressed={settings.temperatureUnit === unit}
                  className={[
                    'rounded-md px-2 py-1 text-[11px] font-semibold transition',
                    settings.temperatureUnit === unit ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink',
                  ].join(' ')}
                >
                  °{unit.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} appearance`}
              className="rounded-lg border border-line bg-panel/60 p-2 text-muted transition hover:text-ink"
            >
              {settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              type="button"
              onClick={locate}
              disabled={geoStatus === 'locating'}
              aria-label="Use my current location"
              title="Use my current location"
              className="hidden rounded-lg border border-line bg-panel/60 p-2 text-muted transition hover:text-ink disabled:opacity-50 sm:block"
            >
              <LocateFixed size={15} className={geoStatus === 'locating' ? 'animate-pulse text-accent' : ''} />
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="border-t border-line/70 bg-bg/95 px-4 py-3 md:hidden">
            <SearchBar autoFocus onSelect={() => setSearchOpen(false)} />
          </div>
        ) : null}

        {showGeoMessage ? (
          <div className="border-t border-amber-500/20 bg-amber-500/5 px-4 py-2 text-center text-[11px] text-amber-200">
            {geoMessage}
            <button
              type="button"
              onClick={() => setDismissedMessage(geoMessage)}
              className="ml-2 underline decoration-dotted underline-offset-2 hover:text-amber-100"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </header>

      {/* Mobile-first bottom navigation */}
      <nav
        aria-label="Primary mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-6">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'flex flex-col items-center gap-1 px-1 py-2.5 text-[9px] font-medium transition-colors',
                      isActive ? 'text-accent' : 'text-muted',
                    ].join(' ')
                  }
                >
                  <Icon size={17} strokeWidth={1.8} aria-hidden />
                  <span className="truncate">{item.label === 'Weather Maps' ? 'Maps' : item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <span className="sr-only">Currently viewing {place.name}</span>
    </>
  );
}
