import { AlertTriangle, Inbox, RefreshCw, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';

export function ErrorState({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        'flex flex-col items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 text-sm text-ink',
        compact ? 'p-4' : 'p-6',
      ].join(' ')}
      role="alert"
    >
      <div className="flex items-center gap-2 font-medium text-red-300">
        <WifiOff size={16} /> Forecast unavailable
      </div>
      <p className="text-muted">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent/50 hover:text-accent"
        >
          <RefreshCw size={13} /> Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  icon,
  action,
}: {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-panel/40 px-6 py-10 text-center">
      <div className="text-muted">{icon ?? <Inbox size={22} />}</div>
      <p className="font-medium text-ink">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted">{message}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Unavailable({ label = 'Not reported', className = '' }: { label?: string; className?: string }) {
  return (
    <span
      className={['inline-flex items-center gap-1 text-xs font-medium text-muted', className].join(' ')}
      title="This measurement was not returned by the weather provider for this location."
    >
      <AlertTriangle size={11} aria-hidden /> {label}
    </span>
  );
}
