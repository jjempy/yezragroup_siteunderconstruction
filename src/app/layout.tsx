import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';
import './globals.css';

// Next.js caches fetch() responses by default — including the ones
// Supabase's client makes under the hood — even on routes that are
// otherwise rendered dynamically. Without this, an admin save could take
// a while (or a full redeploy) to actually show up on the live site,
// which reads as "my change didn't save" even though it did. This is a
// low-traffic CMS-driven site, so always-fresh data is worth far more
// than the caching would ever save.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const SITE_URL = 'https://orchemet.com';
const DESCRIPTION =
  "Free masterclasses, a paid workshop library, and advisory engagements for business owners whose business is working — but working despite something they can't quite name. Testimony, not theory.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Orchemet — Clarity for the Business You're Actually Running",
    template: '%s | Orchemet',
  },
  description: DESCRIPTION,
  keywords: [
    'business blind spots',
    'why does my business feel stuck',
    'honest business feedback',
    'free business masterclass',
    'small business workshop',
    'business advisory engagement',
    'business coaching alternative',
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Orchemet',
    title: "Orchemet — Clarity for the Business You're Actually Running",
    description: DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Orchemet — Clarity for the Business You're Actually Running",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

async function getBrandSettings(): Promise<Pick<
  SiteSettings,
  | 'brand_name'
  | 'color_gold'
  | 'color_gold_deep'
  | 'color_ink'
  | 'color_cream'
  | 'heading_font'
  | 'body_font'
  | 'heading_font_file_url'
> | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select(
        'brand_name, color_gold, color_gold_deep, color_ink, color_cream, heading_font, body_font, heading_font_file_url'
      )
      .eq('id', 'default')
      .maybeSingle();
    return data;
  } catch {
    // Supabase env vars not configured yet (e.g. first local run) — fall
    // back to the built-in palette rather than crashing the whole app.
    return null;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrandSettings();

  // A heading font can come from Google Fonts (the common case — type a
  // name, done) or from an uploaded file for anything Google doesn't
  // carry (a purchased display font, say) — see Admin -> Brand. The
  // uploaded file always wins when both happen to be present, same
  // precedence as every other file-vs-URL field in this admin panel.
  const hasCustomHeadingFont = Boolean(brand?.heading_font_file_url);

  const colorVars: string[] = [];
  if (brand?.color_gold) colorVars.push(`--gold:${brand.color_gold};`);
  if (brand?.color_gold_deep) colorVars.push(`--gold-deep:${brand.color_gold_deep};`);
  if (brand?.color_ink) colorVars.push(`--ink:${brand.color_ink};`);
  if (brand?.color_cream) colorVars.push(`--cream:${brand.color_cream};`);
  if (brand?.heading_font) colorVars.push(`--serif:'${brand.heading_font}', Georgia, serif;`);
  if (brand?.body_font) colorVars.push(`--sans:'${brand.body_font}', -apple-system, sans-serif;`);

  const googleFontFamilies = [brand?.body_font, hasCustomHeadingFont ? null : brand?.heading_font].filter(
    (f): f is string => Boolean(f)
  );

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {googleFontFamilies.length > 0 && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${googleFontFamilies
              .map((f) => f.trim().replace(/\s+/g, '+') + ':wght@400;500;600;700')
              .join('&family=')}&display=swap`}
            rel="stylesheet"
          />
        )}
        {hasCustomHeadingFont && brand?.heading_font && (
          <style>{`@font-face{font-family:'${brand.heading_font}';src:url('${brand.heading_font_file_url}');font-display:swap;}`}</style>
        )}
        {colorVars.length > 0 && <style>{`:root{${colorVars.join('')}}`}</style>}
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
