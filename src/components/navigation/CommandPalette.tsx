import {
  ArrowRight,
  CalendarRange,
  Command as CommandIcon,
  CornerDownLeft,
  LayoutDashboard,
  Map as MapIcon,
  MapPin,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Star,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { searchPlaces } from '../../services/geocodingApi';
import type { Place } from '../../types/weather';

/**
 * ⌘K / Ctrl-K command palette: one search box for cities and pages.
 *
 * Geocoding is debounced and aborted when the query changes, so typing never
 * floods the API. Results are keyboard-navigable end to end.
 */

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  run: () => void;
}

const PAGE_ITEMS = [
  { to: '/', label: 'Dashboard', hint: 'Current conditions', icon: LayoutDashboard },
  { to: '/forecast', label: 'Forecast', hint: 'Hourly and seven-day', icon: CalendarRange },
  { to: '/maps', label: 'Weather Maps', hint: 'Point-sampled layers', icon: MapIcon },
  { to: '/insights', label: 'Insights', hint: 'Rule-based analysis', icon: Sparkles },
  { to: '/settings', label: 'Settings', hint: 'Units, theme, clock', icon: SettingsIcon },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const { saved, setPlace, place } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setActiveIndex(0);
  }, []);

  // Global shortcuts: ⌘K / Ctrl-K toggles, "/" opens when not typing.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable === true;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        close();
        return;
      }
      if (!typing && event.key === '/' && !open) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [close, open]);

  // Focus moves into the dialog on open and returns to the trigger on close,
  // so keyboard users are never dropped at the top of the page.
  useEffect(() => {
    if (open) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
    restoreFocusRef.current?.focus?.();
    return undefined;
  }, [open]);

  // Debounced geocoding, aborted whenever the query changes.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }
    const controller = new AbortController();
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchPlaces(trimmed, controller.signal)
        .then((places) => setResults(places.slice(0, 6)))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
      setSearching(false);
    };
  }, [query]);

  const items = useMemo<CommandItem[]>(() => {
    const trimmed = query.trim().toLowerCase();

    const savedItems: CommandItem[] = saved
      .filter((item) => !trimmed || item.name.toLowerCase().includes(trimmed))
      .slice(0, trimmed ? 3 : 4)
      .map((item) => ({
        id: `saved-${item.id}`,
        label: item.name,
        hint: [item.admin1, item.country].filter(Boolean).join(', ') || 'Saved location',
        icon: Star,
        run: () => {
          setPlace(item);
          close();
        },
      }));

    const placeItems: CommandItem[] = results.map((item) => ({
      id: `place-${item.id}`,
      label: item.name,
      hint: [item.admin1, item.country].filter(Boolean).join(', '),
      icon: MapPin,
      run: () => {
        setPlace(item);
        close();
      },
    }));

    const pageItems: CommandItem[] = PAGE_ITEMS.filter((item) =>
      !trimmed ? true : item.label.toLowerCase().includes(trimmed),
    ).map((item) => ({
      id: `page-${item.to}`,
      label: item.label,
      hint: item.hint,
      icon: item.icon,
      run: () => {
        navigate(item.to);
        close();
      },
    }));

    if (trimmed) return [...placeItems, ...savedItems, ...pageItems];
    return [...savedItems, ...pageItems];
  }, [close, navigate, query, results, saved, setPlace]);

  useEffect(() => {
    setActiveIndex(0);
  }, [items.length, query]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (items.length ? (index + 1) % items.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (items.length ? (index - 1 + items.length) % items.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      items[activeIndex]?.run();
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-1.5 rounded-lg border border-line bg-panel/60 px-2 py-1.5 text-[11px] text-muted transition hover:text-ink lg:inline-flex"
        aria-label="Open quick search"
        title="Search cities and pages (Ctrl K)"
      >
        <CommandIcon size={11} />
        <span className="font-medium">K</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Quick search"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
        <div className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
          <Search size={15} className="shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search a city, region or country…"
            aria-label="Search a city, region or country"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:block">esc</kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-[11px] text-muted">
              {searching ? 'Searching…' : query.trim().length >= 2 ? 'No matching places or pages.' : 'Type to search.'}
            </p>
          ) : (
            <ul role="listbox" aria-label="Quick search results">
              {items.map((item, index) => {
                const Icon = item.icon;
                const active = index === activeIndex;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={item.run}
                      className={[
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition',
                        active ? 'bg-accent/10 text-ink' : 'text-muted hover:bg-panel/60',
                      ].join(' ')}
                    >
                      <Icon size={14} className={active ? 'text-accent' : ''} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-ink">{item.label}</span>
                        {item.hint ? <span className="block truncate text-[10px] text-muted">{item.hint}</span> : null}
                      </span>
                      {active ? <CornerDownLeft size={12} className="text-accent" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line/70 px-4 py-2 text-[10px] text-muted">
          <span className="flex items-center gap-1">
            <ArrowRight size={10} /> Currently viewing {place.name}
          </span>
          <span className="hidden sm:block">↑ ↓ to navigate · ⏎ to select</span>
        </div>
      </div>
    </div>
  );
}
