import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Generated OG/Twitter card — what shows up when the site is shared in
// Slack, iMessage, LinkedIn, etc. Without this the link preview was
// blank/generic; a real card meaningfully affects click-through when a
// link gets shared, and is itself a signal search/AI crawlers weigh.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0F1416 0%, #171D20 60%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 90px',
        }}
      >
        <svg width="64" height="64" viewBox="0 0 40 40" style={{ marginBottom: 36 }}>
          <circle cx="27" cy="14" r="6.6" fill="#C6A045" />
          <circle cx="18" cy="21" r="11.5" fill="#F3EEE3" />
        </svg>
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#C6A045',
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          Testimony, Not Theory
        </div>
        <div
          style={{
            fontSize: 58,
            lineHeight: 1.15,
            color: '#F3EEE3',
            fontWeight: 600,
            maxWidth: 950,
          }}
        >
          Clarity for the business you&apos;re actually running.
        </div>
      </div>
    ),
    { ...size }
  );
}
