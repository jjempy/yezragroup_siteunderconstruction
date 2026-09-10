import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';
import './globals.css';

export const metadata: Metadata = {
  title: 'Orchemet',
  description:
    "Clarity for the business you're actually running — free masterclasses, workshops, and advisory engagements.",
};

async function getBrandSettings(): Promise<Pick<
  SiteSettings,
  'brand_name' | 'color_gold' | 'color_gold_deep' | 'color_ink' | 'color_cream' | 'heading_font' | 'body_font'
> | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('brand_name, color_gold, color_gold_deep, color_ink, color_cream, heading_font, body_font')
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

  const colorVars: string[] = [];
  if (brand?.color_gold) colorVars.push(`--gold:${brand.color_gold};`);
  if (brand?.color_gold_deep) colorVars.push(`--gold-deep:${brand.color_gold_deep};`);
  if (brand?.color_ink) colorVars.push(`--ink:${brand.color_ink};`);
  if (brand?.color_cream) colorVars.push(`--cream:${brand.color_cream};`);
  if (brand?.heading_font) colorVars.push(`--serif:'${brand.heading_font}', Georgia, serif;`);
  if (brand?.body_font) colorVars.push(`--sans:'${brand.body_font}', -apple-system, sans-serif;`);

  const customFontFamilies = [brand?.heading_font, brand?.body_font].filter(
    (f): f is string => Boolean(f)
  );

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {customFontFamilies.length > 0 && (
          <link
            href={`https://fonts.googleapis.com/css2?family=${customFontFamilies
              .map((f) => f.trim().replace(/\s+/g, '+') + ':wght@400;500;600;700')
              .join('&family=')}&display=swap`}
            rel="stylesheet"
          />
        )}
        {colorVars.length > 0 && <style>{`:root{${colorVars.join('')}}`}</style>}
      </head>
      <body>{children}</body>
    </html>
  );
}
