import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

// Favicon — what shows up in the browser tab and next to the site in
// Google search results. Uses the admin-uploaded logo (Admin -> Brand)
// when one's set, so this stays in sync with the real brand mark instead
// of a permanently-frozen default. Falls back to the original two-circle
// mark if no logo is uploaded, or if fetching site_settings fails for any
// reason — a favicon should never be the thing that breaks the page.
export default async function Icon() {
  let logoUrl: string | null = null;
  try {
    const supabase = createClient();
    const { data } = await supabase.from('site_settings').select('logo_url').eq('id', 'default').maybeSingle();
    logoUrl = data?.logo_url || null;
  } catch {
    // Supabase unreachable — fall through to the default mark below.
  }

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
    { ...size }
  );
}
