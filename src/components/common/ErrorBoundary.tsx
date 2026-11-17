import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence: a render error inside any page shows a readable recovery
 * card instead of a blank white screen. The rest of the app (navigation, theme)
 * stays mounted because only the routed content is wrapped.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept in the console for debugging; nothing is sent anywhere.
    console.error('VayuMetricz render error', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface p-6 text-center">
        <TriangleAlert size={22} className="mx-auto text-amber-300" aria-hidden />
        <h1 className="mt-3 font-display text-lg font-semibold">This section could not render</h1>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          Something unexpected happened while drawing this page. Your saved locations and settings are untouched, and
          the data comes straight from Open-Meteo, so reloading usually clears it.
        </p>
        <p className="mt-3 break-words rounded-lg border border-line/70 bg-panel/50 p-2 text-[10px] text-muted">
          {error.message || 'Unknown error'}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted transition hover:text-ink"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent"
          >
            <RotateCcw size={12} /> Reload the app
          </button>
        </div>
      </div>
    );
  }
}
