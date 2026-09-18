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
 * image's average luminance on a hidden canvas and picks a light or dark
 * backdrop automatically, so a black-on-transparent mark doesn't render
 * invisible against a hardcoded dark preview box (or vice versa). Best
 * effort — a cross-origin image without CORS headers can taint the
 * canvas; that just quietly keeps the default backdrop instead of erroring.
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
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [urlValue, setUrlValue] = useState(currentUrl);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [bgColor, setBgColor] = useState('#0F1416');

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  function reset() {
    setFile(null);
    setUrlValue(currentUrl);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (!detectContrastBg) return;
    try {
      const img = e.currentTarget;
      const canvas = document.createElement('canvas');
      const w = (canvas.width = 40);
      const h = (canvas.height = 40);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      let total = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 40) continue; // skip near-transparent pixels
        const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        total += luminance;
        count += 1;
      }
      if (count === 0) return;
      const avg = total / count;
      // A dark mark needs a light backdrop and vice versa — cream/ink are
      // the site's own two ends of that range rather than plain black/white.
      setBgColor(avg < 128 ? '#F3EEE3' : '#0F1416');
    } catch {
      // Cross-origin image without CORS headers taints the canvas — keep
      // whatever backdrop is already set rather than throwing.
    }
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
              onLoad={handleImgLoad}
              alt={`${label} preview`}
              crossOrigin={detectContrastBg ? 'anonymous' : undefined}
              style={{
                height: previewHeight,
                display: 'block',
                background: detectContrastBg ? bgColor : undefined,
                padding: detectContrastBg ? 8 : undefined,
                borderRadius: 4,
              }}
            />
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
