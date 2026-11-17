interface Option<T extends string> {
  value: T;
  label: string;
  title?: string;
}

interface SegmentedProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={[
        'inline-flex flex-wrap items-center gap-1 rounded-xl border border-line bg-panel/60 p-1',
        className,
      ].join(' ')}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            title={option.title}
            className={[
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'bg-accent/15 text-accent ring-1 ring-inset ring-accent/35'
                : 'text-muted hover:bg-line/40 hover:text-ink',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
