import type { CSSProperties } from 'react';

function Bone({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div style={style} className={['animate-pulse rounded-xl bg-line/50', className].join(' ')} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading weather data…</span>
      <Bone className="h-72 w-full rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, index) => (
          <Bone key={index} className="h-28" />
        ))}
      </div>
      <Bone className="h-44 w-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Bone className="h-64 lg:col-span-2" />
        <Bone className="h-64" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return <Bone className="w-full" style={{ height }} />;
}

export function PanelSkeleton() {
  return (
    <div className="space-y-3">
      <Bone className="h-4 w-1/3" />
      <Bone className="h-24 w-full" />
      <Bone className="h-24 w-full" />
    </div>
  );
}
