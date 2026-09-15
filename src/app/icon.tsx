import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Static, brand-colored favicon (the two-circle mark) — a generated
// image rather than a static file so it never goes stale, and doesn't
// depend on the admin-uploaded logo being fetchable at request time
// (format/CORS risk not worth taking for something this small).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0F1416',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 40 40">
          <circle cx="27" cy="14" r="6.6" fill="#C6A045" />
          <circle cx="18" cy="21" r="11.5" fill="#F3EEE3" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
