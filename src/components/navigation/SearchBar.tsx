import { Loader2, MapPin, Search, Star, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useApp } from '../../context/AppContext';
import { searchPlaces } from '../../services/geocodingApi';
import type { Place } from '../../types/weather';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export function SearchBar({ onSelect, autoFocus = false }: { onSelect?: () => void; autoFocus?: boolean }) {
  const { setPlace, toggleSaved, isSaved } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const container = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setStatus('idle');
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus('loading');
      setError(null);
      try {
        const places = await searchPlaces(trimmed, controller.signal);
        setResults(places);
        setActive(0);
        setStatus('ready');
        setOpen(true);
      } catch (cause) {
        if ((cause as Error).name === 'AbortError') return;
        setError((cause as Error).message || 'Search failed. Try again.');
        setStatus('error');
      }
    }, 320);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (container.current && !container.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const choose = (place: Place) => {
    setPlace(place);
    setQuery('');
    setResults([]);
    setOpen(false);
    onSelect?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const place = results[active];
      if (place) choose(place);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={container} className="relative w-full">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          autoFocus={autoFocus}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search city, region or country…"
          aria-label="Search for a location"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="location-search-results"
          className="h-9 w-full rounded-xl border border-line bg-panel/60 pl-9 pr-8 text-xs text-ink placeholder:text-muted/80 focus:border-accent/50 focus:bg-panel focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          id="location-search-results"
          role="listbox"
          className="absolute z-50 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-soft"
        >
          {status === 'loading' ? (
            <p className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-muted">
              <Loader2 size={12} className="animate-spin" /> Searching worldwide locations…
            </p>
          ) : null}

          {status === 'error' ? <p className="px-3 py-2.5 text-[11px] text-red-300">{error}</p> : null}

          {status === 'ready' && results.length === 0 ? (
            <p className="px-3 py-2.5 text-[11px] text-muted">
              No locations matched “{query.trim()}”. Try a different spelling or a nearby city.
            </p>
          ) : null}

          {results.map((place, index) => {
            const saved = isSaved(place);
            return (
              <div
                key={place.id}
                role="option"
                aria-selected={index === active}
                className={[
                  'flex items-center gap-1 rounded-lg px-1 transition',
                  index === active ? 'bg-accent/10' : 'hover:bg-panel/70',
                ].join(' ')}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(place)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-2 text-left"
                >
                  <MapPin size={13} className="shrink-0 text-accent" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-ink">{place.name}</span>
                    <span className="block truncate text-[10px] text-muted">
                      {[place.admin1, place.country].filter(Boolean).join(', ') || 'Coordinates'}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleSaved(place)}
                  aria-label={saved ? `Remove ${place.name} from saved locations` : `Save ${place.name}`}
                  aria-pressed={saved}
                  className="shrink-0 rounded-md p-1.5 text-muted transition hover:text-amber-300"
                >
                  <Star size={12} className={saved ? 'fill-amber-300 text-amber-300' : ''} />
                </button>
              </div>
            );
          })}

          <p className="px-3 pb-1 pt-2 text-[9px] uppercase tracking-wider text-muted/70">
            Search by Open-Meteo Geocoding
          </p>
        </div>
      ) : null}
    </div>
  );
}
