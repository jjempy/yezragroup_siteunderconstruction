'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A file/URL image field that previews instantly on selection — instead
 * of only ever showing the last-saved image until the whole form is
 * submitted and the page reloads. Nothing here is saved until the
 * surrounding form's own submit button is pressed; "Use saved image
 * instead" just clears the local selection (file input + any typed URL)
 * back to whatever's already live, with no server round-trip either way.
 *
 * `detectContrastBg` (used for the hero mark) samples the previewed
 * image's average luminance on a *separate, offscreen* Image — never the
 * visible <img> itself — and picks a light or dark backdrop (the site's
 * own live ink/cream colors, passed in as props) automatically. Using an
 * offscreen probe for the measurement means a CORS failure there can
 * never break the visible preview's own display. If the image turns out
 * to have no transparency at all, no backdrop color can create contrast
 * (there's nothing to show it through) — that's surfaced as a message
 * instead of silently doing nothing.
 */
export function ImageUploadPreview({
  label,
  fileName,
  urlName,
  currentUrl,
  hint,
  urlHint,
  urlPlaceholder,
  previewHeight = 60,
  detectContrastBg = false,
  inkColor = '#0F1416',
  creamColor = '#F3EEE3',
}: {
  label: string;
  fileName: string;
  urlName: string;
  currentUrl: string;
  hint?: string;
  urlHint?: string;
  urlPlaceholder?: string;
  previewHeight?: number;
  detectContrastBg?: boolean;
  inkColor?: string;
  creamColor?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [urlValue, setUrlValue] = useState(currentUrl);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState(inkColor);
  const [opaqueWarning, setOpaqueWarning] = useState(false);

  const previewSrc = objectUrl || urlValue;
  const changed = Boolean(file) || urlValue !== currentUrl;

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!detectContrastBg || !previewSrc) return;
    let cancelled = false;
    setOpaqueWarning(false);

    // A fresh Image object (not the visible <img>'s onLoad) always fires
    // load/error even for an already browser-cached URL — relying on the
    // rendered <img>'s onLoad prop misses that case entirely when the
    // image loads synchronously from cache before React attaches the
    // listener, which is exactly what happens for an already-saved URL
    // on a normal page load.
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        const w = (canvas.width = 40);
        const h = (canvas.height = 40);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(probe, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let total = 0;
        let count = 0;
        let hasTransparency = false;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 250) hasTransparency = true;
          if (alpha < 40) continue; // skip near-transparent pixels
          const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          total += luminance;
          count += 1;
        }
        if (count === 0) return;
        const avg = total / count;
        // A dark mark needs a light backdrop and vice versa.
        setBgColor(avg < 128 ? creamColor : inkColor);
        setOpaqueWarning(!hasTransparency);
      } catch {
        // Cross-origin without CORS headers taints the canvas — keep the
        // current backdrop rather than throwing. The visible preview
        // below uses a plain, non-crossOrigin <img>, so it still displays
        // fine regardless of whether this measurement succeeds.
      }
    };
    probe.src = previewSrc;
    return () => {
      cancelled = true;
    };
  }, [detectContrastBg, previewSrc, inkColor, creamColor]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  function reset() {
    setFile(null);
    setUrlValue(currentUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <>
      <div className="admin-field">
        <label htmlFor={fileName}>{label}</label>
        {hint && (
          <div className="hint" style={{ marginBottom: 8 }}>
            {hint}
          </div>
        )}
        {previewSrc && (
          <div style={{ marginBottom: 10 }}>
            <img
              src={previewSrc}
              alt={`${label} preview`}
              style={{
                height: previewHeight,
                display: 'block',
                background: detectContrastBg ? bgColor : undefined,
                padding: detectContrastBg ? 8 : undefined,
                borderRadius: 4,
              }}
            />
            {detectContrastBg && opaqueWarning && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: '#B4573F' }}>
                This image has no transparent areas, so a different backdrop color can&apos;t create
                contrast — the whole background you see above <em>is</em> the image itself. Ask for a
                version with a transparent background (SVG or PNG) if it needs to work on both light and
                dark sections.
              </div>
            )}
            {changed && (
              <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--gold-deep)' }}>
                Not saved yet — this previews what &quot;Save&quot; will set.{' '}
                <button
                  type="button"
                  onClick={reset}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--gold-deep)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  Use saved image instead
                </button>
              </div>
            )}
          </div>
        )}
        <input ref={fileInputRef} id={fileName} name={fileName} type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      <div className="admin-field">
        <label htmlFor={urlName}>Or paste an image URL instead</label>
        <input
          id={urlName}
          name={urlName}
          type="url"
          value={urlValue}
          onChange={(e) => setUrlValue(e.target.value)}
          placeholder={urlPlaceholder}
        />
        <div className="hint">{urlHint ?? "Only used if you don't upload a file above. Leave as-is otherwise."}</div>
      </div>
    </>
  );
}
