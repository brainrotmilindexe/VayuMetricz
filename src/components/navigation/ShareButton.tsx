import { Check, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { copyToClipboard, shareUrlFor } from '../../utils/share';

/** Copies a permalink for the current location, so a forecast can be shared as-is. */
export function ShareButton() {
  const { place } = useApp();
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return undefined;
    const timer = window.setTimeout(() => setState('idle'), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={async () => {
          const ok = await copyToClipboard(shareUrlFor(place));
          setState(ok ? 'copied' : 'failed');
        }}
        aria-label="Copy a shareable link to this location"
        title="Copy shareable link"
        className="rounded-lg border border-line bg-panel/60 p-2 text-muted transition hover:text-ink"
      >
        {state === 'copied' ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
      </button>
      {state !== 'idle' ? (
        <span
          role="status"
          className="absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[10px] text-muted shadow-soft"
        >
          {state === 'copied' ? 'Link copied to clipboard' : 'Copy failed — use the address bar'}
        </span>
      ) : null}
    </div>
  );
}
