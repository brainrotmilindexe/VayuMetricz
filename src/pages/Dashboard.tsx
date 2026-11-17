import { ArrowRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AirQualityPanel } from '../components/weather/AirQualityPanel';
import { AlertsPanel } from '../components/weather/AlertsPanel';
import { CurrentWeather } from '../components/weather/CurrentWeather';
import { DailyForecast } from '../components/weather/DailyForecast';
import { HourlyForecast } from '../components/weather/HourlyForecast';
import { MetricGrid } from '../components/weather/MetricGrid';
import { SunPath } from '../components/weather/SunPath';
import { InsightList } from '../components/insights/InsightList';
import { DashboardSkeleton } from '../components/common/Skeletons';
import { ErrorState } from '../components/common/States';
import { SectionHeader } from '../components/common/SectionHeader';
import { useApp } from '../context/AppContext';
import { timeAgo } from '../utils/time';
import { buildInsights } from '../utils/insights';

export default function Dashboard() {
  const { weather, air, status, error, refresh, settings, lastUpdated, place } = useApp();

  if (!weather && status === 'loading') return <DashboardSkeleton />;
  if (!weather && error) return <ErrorState message={error} onRetry={() => void refresh()} />;
  if (!weather) return null;

  const insights = buildInsights(weather, settings, air);
  const stale = lastUpdated != null && Date.now() - lastUpdated > 30 * 60 * 1000;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[11px] text-muted">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          Live forecast · Open-Meteo · {lastUpdated ? `updated ${timeAgo(lastUpdated)}` : 'loading'}
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/locations"
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-panel/60 px-2.5 py-1.5 text-[11px] font-medium text-muted transition hover:text-ink"
          >
            Change location <ArrowRight size={11} />
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={status === 'loading'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel/60 px-2.5 py-1.5 text-[11px] font-medium text-muted transition hover:text-ink disabled:opacity-60"
          >
            <RefreshCw size={11} className={status === 'loading' ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {stale ? (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200">
          This forecast is more than 30 minutes old and may no longer reflect the latest model run. Refresh to update.
        </p>
      ) : null}

      {error && weather ? <ErrorState message={error} compact onRetry={() => void refresh()} /> : null}

      <CurrentWeather snapshot={weather} />
      <MetricGrid snapshot={weather} />

      <HourlyForecast hourly={weather.hourly} currentTime={weather.current.time} limit={24} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <DailyForecast snapshot={weather} />
        <div className="space-y-4">
          <AlertsPanel snapshot={weather} />
          <SunPath snapshot={weather} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AirQualityPanel air={air} />
        <section>
          <SectionHeader
            title="Weather intelligence"
            subtitle={`Rule-based observations for ${place.name}`}
            action={
              <Link
                to="/insights"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
              >
                All insights <ArrowRight size={11} />
              </Link>
            }
          />
          <InsightList insights={insights} limit={4} showFilters={false} />
        </section>
      </div>

      <p className="pt-2 text-[10px] leading-relaxed text-muted">
        Forecast data from{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-accent hover:underline">
          Open-Meteo
        </a>{' '}
        (CC BY 4.0). VayuMetricz presents model output as-is and never invents measurements or official warnings.
      </p>
    </div>
  );
}
