import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/navigation/Navbar';
import { DashboardSkeleton } from './components/common/Skeletons';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import Dashboard from './pages/Dashboard';

// Route-level splitting keeps the map and charting code out of the initial payload.
const Forecast = lazy(() => import('./pages/Forecast'));
const WeatherMaps = lazy(() => import('./pages/WeatherMaps'));
const Insights = lazy(() => import('./pages/Insights'));
const Locations = lazy(() => import('./pages/Locations'));
const Settings = lazy(() => import('./pages/Settings'));

function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="font-display text-5xl font-semibold tracking-tighter text-accent">404</p>
      <h1 className="mt-2 font-display text-xl font-semibold">This page is off the map</h1>
      <p className="mt-2 text-sm text-muted">
        The page you asked for does not exist. Head back to the dashboard to see current conditions.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent"
      >
        Return to dashboard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1100] focus:rounded-lg focus:border focus:border-accent/50 focus:bg-surface focus:px-3 focus:py-2 focus:text-xs focus:text-accent"
      >
        Skip to content
      </a>
      <Navbar />

      <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-12">
        <ErrorBoundary>
          <Suspense fallback={<DashboardSkeleton />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/maps" element={<WeatherMaps />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <footer className="border-t border-line/70 px-4 pb-24 pt-6 sm:px-6 lg:pb-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-sm font-semibold tracking-tight">VayuMetricz</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-muted">
              Weather, measured intelligently
            </p>
            <p className="mt-2 max-w-md text-[10px] leading-relaxed text-muted">
              Forecast, air quality and geocoding data from Open-Meteo. Base maps © Esri, HERE, Garmin and OpenStreetMap contributors.
              Model output is not an official warning — always check your national meteorological service during severe
              weather.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-muted">
            <Link to="/forecast" className="hover:text-accent">
              Forecast
            </Link>
            <Link to="/maps" className="hover:text-accent">
              Maps
            </Link>
            <Link to="/insights" className="hover:text-accent">
              Insights
            </Link>
            <Link to="/locations" className="hover:text-accent">
              Locations
            </Link>
            <Link to="/settings" className="hover:text-accent">
              Settings
            </Link>
            <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="hover:text-accent">
              Data source
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
