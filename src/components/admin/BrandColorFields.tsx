'use client';

import { useState } from 'react';

function toColorInputValue(value: string, fallback: string): string {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash : fallback;
}

function ColorField({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="admin-field">
      <label htmlFor={name}>{label}</label>
      <div className="color-field-row">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={toColorInputValue(value, placeholder)}
          onChange={(e) => onChange(e.target.value)}
        />
        <input id={name} name={name} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </div>
  );
}

/** The four brand colors, with a swatch picker synced to the text field
 * and a live preview beneath — including a hover simulation on the demo
 * button, since "will the hover state still be legible" is exactly the
 * kind of thing a raw hex field can't answer before you hit Save. Nothing
 * here saves anything itself; the text inputs still submit with the
 * surrounding form via their `name` attrs, same as before. */
export function BrandColorFields({
  colorGold,
  colorGoldDeep,
  colorInk,
  colorCream,
}: {
  colorGold: string;
  colorGoldDeep: string;
  colorInk: string;
  colorCream: string;
}) {
  const [gold, setGold] = useState(colorGold || '#C6A045');
  const [goldDeep, setGoldDeep] = useState(colorGoldDeep || '#9C7C2E');
  const [ink, setInk] = useState(colorInk || '#0F1416');
  const [cream, setCream] = useState(colorCream || '#F3EEE3');
  const [hovering, setHovering] = useState(false);

  return (
    <>
      <div className="admin-row">
        <ColorField label="Accent" name="color_gold" value={gold} onChange={setGold} placeholder="#C6A045" />
        <ColorField label="Accent Hover" name="color_gold_deep" value={goldDeep} onChange={setGoldDeep} placeholder="#9C7C2E" />
      </div>
      <div className="admin-row">
        <ColorField label="Dark Background" name="color_ink" value={ink} onChange={setInk} placeholder="#0F1416" />
        <ColorField label="Light Background" name="color_cream" value={cream} onChange={setCream} placeholder="#F3EEE3" />
      </div>
      <div className="admin-field" style={{ marginBottom: 20 }}>
        <label>Live Preview</label>
        <div className="hint" style={{ marginBottom: 8 }}>
          Updates as you type — nothing here is saved until you click Save Brand Settings. Move your
          mouse onto the button to see the hover color.
        </div>
        <div className="color-preview" style={{ background: toColorInputValue(ink, '#0F1416') }}>
          <span style={{ color: toColorInputValue(cream, '#F3EEE3'), fontSize: 13.5 }}>Dark section — body text</span>
          <button
            type="button"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            style={{
              background: toColorInputValue(hovering ? goldDeep : gold, '#C6A045'),
              color: toColorInputValue(ink, '#0F1416'),
              border: 'none',
              padding: '10px 20px',
              borderRadius: 2,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {hovering ? 'Hovering' : 'Hover me'}
          </button>
        </div>
        <div className="color-preview" style={{ background: toColorInputValue(cream, '#F3EEE3'), marginTop: 10 }}>
          <span style={{ color: toColorInputValue(ink, '#0F1416'), fontSize: 13.5 }}>Light section — body text</span>
        </div>
      </div>
    </>
  );
}
