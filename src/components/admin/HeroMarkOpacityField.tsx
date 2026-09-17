'use client';

import { useState } from 'react';

function clamp(n: number) {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** The opacity value and its live preview both used to only update after
 * Save — the % label read the server-fetched value, and there was no way
 * to see what a given opacity actually looks like against the hero's dark
 * background before committing. Local state fixes both: the label and
 * the preview mark now track the slider in real time.
 *
 * The slider and the number field are two views of the same value — drag
 * one or type the other, they stay in sync, and either can end up in the
 * submitted form data (both share the same `name`, so whichever the
 * browser reads first is already correct either way). */
export function HeroMarkOpacityField({ opacity, markUrl }: { opacity: number; markUrl: string }) {
  const [value, setValue] = useState(opacity);

  return (
    <div className="admin-field" style={{ marginBottom: 20 }}>
      <label htmlFor="hero_mark_opacity">Hero Mark Opacity</label>
      <div className="opacity-control-row">
        <input
          id="hero_mark_opacity"
          name="hero_mark_opacity"
          type="range"
          className="opacity-slider"
          min="0"
          max="100"
          value={value}
          onChange={(e) => setValue(clamp(Number(e.target.value)))}
        />
        <div className="opacity-number-wrap">
          <input
            type="number"
            aria-label="Hero mark opacity percent"
            min="0"
            max="100"
            value={value}
            onChange={(e) => setValue(clamp(Number(e.target.value) || 0))}
          />
          <span>%</span>
        </div>
      </div>
      <div className="hint">Applies to whichever mark is showing — your upload, or the default, if empty.</div>
      <div className="opacity-preview">
        {markUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={markUrl} alt="" style={{ width: 120, height: 120, objectFit: 'contain', opacity: value / 100 }} />
        ) : (
          <svg width={120} height={120} viewBox="0 0 40 40" style={{ opacity: value / 100 }}>
            <circle className="spark" cx="27" cy="14" r="6.6" />
            <circle className="primary" cx="18" cy="21" r="11.5" />
          </svg>
        )}
      </div>
    </div>
  );
}
