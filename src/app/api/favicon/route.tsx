import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

const SIZE = { width: 32, height: 32 };

// Favicon — what shows up in the browser tab and next to the site in
// Google search results. Uses the admin-uploaded logo (Admin -> Brand)
// when one's set, so this stays in sync with the real brand mark instead
// of a permanently-frozen default. Falls back to the original two-circle
// mark if no logo is uploaded, or if fetching site_settings fails for any
// reason — a favicon should never be the thing that breaks the page.
//
// This used to be Next's file-convention `icon.tsx`, served at a URL
// (`/icon?<hash>`) that Next appends a long-lived immutable cache header
// to and that never changes just because the *admin-uploaded logo*
// changes underneath it (the hash is tied to this route's code, not its
// dynamic output) — so a rebrand never actually reached Google's or a
// browser's cached favicon. This is now a plain route we control the URL
// and cache lifetime for directly: `?v=` is a manual cache-buster to bump
// whenever a real logo change needs to force a fresh fetch everywhere
// (see layout.tsx's `icons` field and favicon.ico's redirect target —
// bump both together), and the Cache-Control below is deliberately short
// instead of "forever", so it also self-heals within an hour even
// without a version bump.
export async function GET() {
  let logoUrl: string | null = null;
  let ink = '#0F1416';
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('logo_url, color_ink')
      .eq('id', 'default')
      .maybeSingle();
    logoUrl = data?.logo_url || null;
    ink = data?.color_ink || ink;
  } catch {
    // Supabase unreachable — fall through to the defaults above.
  }

  const image = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} width={26} height={26} style={{ objectFit: 'contain' }} alt="" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 40 40">
            <circle cx="27" cy="14" r="6.6" fill="#C6A045" />
            <circle cx="18" cy="21" r="11.5" fill="#F3EEE3" />
          </svg>
        )}
      </div>
    ),
    { ...SIZE }
  );
  image.headers.set('Cache-Control', 'public, max-age=3600, must-revalidate');
  return image;
}
