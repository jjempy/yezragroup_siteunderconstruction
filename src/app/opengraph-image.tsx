import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FALLBACK = {
  logoUrl: null as string | null,
  ink: '#0F1416',
  cream: '#F3EEE3',
  gold: '#C6A045',
  eyebrow: 'Testimony, Not Theory',
  heading: "Clarity for the business you're actually running.",
};

// Generated OG/Twitter card — what shows up when the site is shared in
// Slack, iMessage, LinkedIn, etc. Without this the link preview was
// blank/generic; a real card meaningfully affects click-through when a
// link gets shared, and is itself a signal search/AI crawlers weigh.
// Pulls the live brand mark, colors, and hero copy from site_settings so
// this stays in sync with whatever's actually configured in Admin -> Brand
// instead of being frozen to the site's original launch look.
export default async function OpengraphImage() {
  let data = FALLBACK;
  try {
    const supabase = createClient();
    const { data: settings } = await supabase
      .from('site_settings')
      .select('logo_url, color_ink, color_cream, color_gold, hero_eyebrow, hero_heading')
      .eq('id', 'default')
      .maybeSingle();
    if (settings) {
      data = {
        logoUrl: settings.logo_url || null,
        ink: settings.color_ink || FALLBACK.ink,
        cream: settings.color_cream || FALLBACK.cream,
        gold: settings.color_gold || FALLBACK.gold,
        eyebrow: settings.hero_eyebrow || FALLBACK.eyebrow,
        heading: settings.hero_heading || FALLBACK.heading,
      };
    }
  } catch {
    // Supabase unreachable — fall through to the launch-day defaults above.
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${data.ink} 0%, ${data.ink} 60%)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 90px',
        }}
      >
        {data.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.logoUrl} width={64} height={64} style={{ objectFit: 'contain', marginBottom: 36 }} alt="" />
        ) : (
          <svg width="64" height="64" viewBox="0 0 40 40" style={{ marginBottom: 36 }}>
            <circle cx="27" cy="14" r="6.6" fill={data.gold} />
            <circle cx="18" cy="21" r="11.5" fill={data.cream} />
          </svg>
        )}
        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: data.gold,
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          {data.eyebrow}
        </div>
        <div
          style={{
            fontSize: 58,
            lineHeight: 1.15,
            color: data.cream,
            fontWeight: 600,
            maxWidth: 950,
          }}
        >
          {data.heading}
        </div>
      </div>
    ),
    { ...size }
  );
}
