import { CalendarRange, RefreshCw } from 'lucide-react';
import { AnalyticsCharts } from '../components/charts/AnalyticsCharts';
import { DailyForecast } from '../components/weather/DailyForecast';
import { ForecastConfidence } from '../components/forecast/ForecastConfidence';
import { HourlyForecast } from '../components/weather/HourlyForecast';
import { DashboardSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/States';
import { useApp } from '../context/AppContext';
import { timeAgo } from '../utils/time';

export default function Forecast() {
  const { weather, status, error, refresh, place, lastUpdated } = useApp();

  if (!weather && status === 'loading') return <DashboardSkeleton />;
  if (!weather && error) return <ErrorState message={error} onRetry={() => void refresh()} />;
  if (!weather) return null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-accent">
            <CalendarRange size={12} /> Forecast
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">{place.name}</h1>
          <p className="mt-1 text-xs text-muted">
            {[place.admin1, place.country].filter(Boolean).join(', ')} · 48-hour hourly detail, seven-day outlook and
            atmospheric analytics
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span>Updated {lastUpdated ? timeAgo(lastUpdated) : '—'}</span>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={status === 'loading'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel/60 px-2.5 py-1.5 font-medium transition hover:text-ink disabled:opacity-60"
          >
            <RefreshCw size={11} className={status === 'loading' ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {error ? <ErrorState message={error} compact onRetry={() => void refresh()} /> : null}

      <HourlyForecast hourly={weather.hourly} currentTime={weather.current.time} limit={48} />
      <DailyForecast snapshot={weather} title="Extended seven-day forecast" />
      <ForecastConfidence />
      <AnalyticsCharts snapshot={weather} />

      <p className="text-[10px] leading-relaxed text-muted">
        Hourly values are forecast model output at the selected coordinates. Missing points indicate the provider
        returned no value for that hour.
      </p>
    </div>
  );
}
