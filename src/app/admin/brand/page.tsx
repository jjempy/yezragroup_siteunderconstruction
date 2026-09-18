import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';
import { updateBrandSettings } from '../settings-actions';
import { UnsavedChangesGuard } from '@/components/admin/UnsavedChangesGuard';
import { AdminHighlightOnLoad } from '@/components/admin/AdminHighlightOnLoad';
import { BrandColorFields } from '@/components/admin/BrandColorFields';
import { HeroMarkOpacityField } from '@/components/admin/HeroMarkOpacityField';
import { ImageUploadPreview } from '@/components/admin/ImageUploadPreview';

export default async function BrandAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle<SiteSettings>();
  const settings = data!;

  return (
    <>
      <AdminHighlightOnLoad />
      <h1>Brand</h1>
      <p className="sub">Logo, colors, and fonts. Leave a field blank to keep the current default.</p>
      {searchParams.saved && <p className="admin-toast ok">Saved</p>}
      {searchParams.error && <p className="admin-toast err">{searchParams.error}</p>}
      <div style={{ marginBottom: 16 }}>
        <button className="admin-btn" type="submit" form="brand-form">
          Save Brand Settings
        </button>
      </div>
      <UnsavedChangesGuard>
      <form id="brand-form" action={updateBrandSettings} className="admin-card">
        <div className="admin-field">
          <label htmlFor="brand_name">Brand Name</label>
          <input id="brand_name" name="brand_name" type="text" defaultValue={settings.brand_name} required />
        </div>
        <ImageUploadPreview
          label="Logo"
          fileName="logo_file"
          urlName="logo_url"
          currentUrl={settings.logo_url}
          hint="Replaces the small circle icon in the nav (top-left) and footer."
          urlPlaceholder="https://…/logo.svg"
          previewHeight={40}
        />
        <ImageUploadPreview
          label="Email Header Logo"
          fileName="email_logo_file"
          urlName="email_logo_url"
          currentUrl={settings.email_logo_url}
          hint="A separate, larger logo used only in the header of emails (RSVP/purchase confirmations, contact replies) — the business-card/flyer version with a tagline works well here. Leave empty to use the small site icon above instead."
          urlPlaceholder="https://…/email-logo.png"
          urlHint="Only used if you don't upload a file above. Leave blank to fall back to the Logo field above."
          previewHeight={48}
        />
        <ImageUploadPreview
          label="Hero Background Mark"
          fileName="hero_mark_file"
          urlName="hero_mark_url"
          currentUrl={settings.hero_mark_url}
          hint="A separate image from the logo above — the large, faded decorative element behind the homepage headline. Leave empty to keep the default abstract mark. Works best with a transparent background (a real vector/SVG or a PNG with no background) — a detailed or opaque image will show as a hard box when faded large behind text."
          urlPlaceholder="https://…/mark.svg"
          urlHint="Only used if you don't upload a file above. Leave blank to use the default mark."
          previewHeight={80}
          detectContrastBg
          inkColor={settings.color_ink}
          creamColor={settings.color_cream}
        />
        <HeroMarkOpacityField opacity={settings.hero_mark_opacity} markUrl={settings.hero_mark_url} />
        <BrandColorFields
          colorGold={settings.color_gold}
          colorGoldDeep={settings.color_gold_deep}
          colorInk={settings.color_ink}
          colorCream={settings.color_cream}
        />
        <div className="admin-row">
          <div className="admin-field">
            <label htmlFor="heading_font">Heading Font (name)</label>
            <input id="heading_font" name="heading_font" type="text" defaultValue={settings.heading_font} placeholder="Archivo" />
            <div className="hint">
              On Google Fonts (like Archivo or Montserrat)? Just type its name here — that&apos;s it.
            </div>
          </div>
          <div className="admin-field">
            <label htmlFor="body_font">Body Font (Google Fonts name)</label>
            <input id="body_font" name="body_font" type="text" defaultValue={settings.body_font} placeholder="Inter" />
            <div className="hint">Body text only supports Google Fonts — type any name from fonts.google.com.</div>
          </div>
        </div>
        <div className="admin-field" style={{ marginTop: 8 }}>
          <label htmlFor="heading_font_file">Not on Google Fonts? Upload the heading font file</label>
          <div className="hint" style={{ marginBottom: 8 }}>
            For a purchased/custom display font (like a logo-adjacent typeface) that isn&apos;t on Google
            Fonts at all. Upload the file here — it&apos;ll be used under whatever name is typed in{' '}
            <strong>Heading Font</strong> above, and this takes over from the Google Fonts lookup entirely
            once uploaded. Accepts .woff2, .woff, .ttf, or .otf — make sure you have a license that covers
            using it on a live website, not just a personal-use download.
          </div>
          {settings.heading_font_file_url && (
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              <span
                style={{
                  fontFamily: `'${settings.heading_font || 'inherit'}'`,
                  fontSize: 28,
                  display: 'block',
                  marginBottom: 4,
                }}
              >
                {settings.heading_font || 'Aa Preview'}
              </span>
              <a href={settings.heading_font_file_url} target="_blank" rel="noopener noreferrer">
                Current font file
              </a>
            </div>
          )}
          <input id="heading_font_file" name="heading_font_file" type="file" accept=".woff2,.woff,.ttf,.otf" />
        </div>
        <button className="admin-btn" type="submit">
          Save Brand Settings
        </button>
      </form>
      </UnsavedChangesGuard>
    </>
  );
}
