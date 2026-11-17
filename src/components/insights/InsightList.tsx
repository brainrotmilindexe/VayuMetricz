import {
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  Leaf,
  Sun,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Insight, InsightCategory } from '../../utils/insights';
import { Card } from '../common/Card';
import { EmptyState } from '../common/States';

const CATEGORY_META: Record<InsightCategory, { label: string; icon: LucideIcon; color: string }> = {
  temperature: { label: 'Temperature', icon: Thermometer, color: '#22d3ee' },
  precipitation: { label: 'Precipitation', icon: CloudRain, color: '#38bdf8' },
  wind: { label: 'Wind', icon: Wind, color: '#2dd4bf' },
  humidity: { label: 'Humidity', icon: Droplets, color: '#60a5fa' },
  pressure: { label: 'Pressure', icon: Gauge, color: '#a78bfa' },
  uv: { label: 'UV', icon: Sun, color: '#fbbf24' },
  visibility: { label: 'Visibility', icon: Eye, color: '#7dd3fc' },
  air: { label: 'Air quality', icon: Leaf, color: '#34d399' },
};

const TONE_STYLES: Record<Insight['tone'], string> = {
  info: 'border-line/70',
  warn: 'border-amber-500/35',
  positive: 'border-emerald-500/30',
};

export function InsightList({
  insights,
  limit,
  showFilters = true,
}: {
  insights: Insight[];
  limit?: number;
  showFilters?: boolean;
}) {
  const [filter, setFilter] = useState<InsightCategory | 'all'>('all');

  const visible = useMemo(() => {
    const filtered = filter === 'all' ? insights : insights.filter((insight) => insight.category === filter);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [insights, filter, limit]);

  const categories = useMemo(
    () => Array.from(new Set(insights.map((insight) => insight.category))),
    [insights],
  );

  if (insights.length === 0) {
    return (
      <EmptyState
        title="No insights for this forecast"
        message="The rule engine needs at least a full hourly series to compare trends. Try another location or refresh."
      />
    );
  }

  return (
    <div className="space-y-4">
      {showFilters ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={[
              'rounded-lg border px-2.5 py-1 text-[11px] font-medium transition',
              filter === 'all'
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-line bg-panel/40 text-muted hover:text-ink',
            ].join(' ')}
          >
            All ({insights.length})
          </button>
          {categories.map((category) => {
            const meta = CATEGORY_META[category];
            const Icon = meta.icon;
            const active = filter === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setFilter(category)}
                aria-pressed={active}
                className={[
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition',
                  active
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-line bg-panel/40 text-muted hover:text-ink',
                ].join(' ')}
              >
                <Icon size={11} style={{ color: active ? undefined : meta.color }} aria-hidden />
                {meta.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {visible.map((insight) => {
          const meta = CATEGORY_META[insight.category];
          const Icon = meta.icon;
          return (
            <Card key={insight.id} className={`p-4 ${TONE_STYLES[insight.tone]}`}>
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line/70"
                  style={{ background: `${meta.color}14`, color: meta.color }}
                  aria-hidden
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium leading-snug text-ink">{insight.title}</h3>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{insight.detail}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="rounded-md border border-line/70 bg-panel/60 px-1.5 py-0.5 font-mono text-muted">
                      {insight.evidence}
                    </span>
                    <span className="uppercase tracking-wider text-muted/80">{insight.period}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
