import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';
import { updateBrandSettings } from '../settings-actions';
import { UnsavedChangesGuard } from '@/components/admin/UnsavedChangesGuard';

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
        <div className="admin-field">
          <label htmlFor="logo_file">Logo</label>
          {settings.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt="Current logo"
              style={{ height: 40, marginBottom: 10, display: 'block' }}
            />
          )}
          <input id="logo_file" name="logo_file" type="file" accept="image/*" />
          <div className="hint">Replaces the small circle icon in the nav (top-left) and footer.</div>
        </div>
        <div className="admin-field">
          <label htmlFor="logo_url">Or paste an image URL instead</label>
          <input id="logo_url" name="logo_url" type="url" defaultValue={settings.logo_url} placeholder="https://…/logo.svg" />
          <div className="hint">Only used if you don&apos;t upload a file above. Leave as-is otherwise.</div>
        </div>
        <label className="admin-checkbox" style={{ marginBottom: 16 }}>
          <input type="checkbox" name="hero_logo_watermark" defaultChecked={settings.hero_logo_watermark} />
          Also use this logo as the large faded background mark behind the homepage headline
        </label>
        <div className="hint" style={{ marginTop: -10, marginBottom: 20 }}>
          Off by default — a detailed or non-transparent logo (most photo/PNG exports) looks like a hard
          box when blown up large and faded behind text. Only turn this on with a logo that has a
          transparent background (a real vector/SVG mark or a PNG exported with no background) and is
          simple enough to read faded at low opacity. If it looks wrong after saving, just uncheck this —
          the headline background will fall back to the default mark.
        </div>
        <div className="admin-row">
          <div className="admin-field">
            <label htmlFor="color_gold">Gold (primary accent)</label>
            <input id="color_gold" name="color_gold" type="text" defaultValue={settings.color_gold} placeholder="#C6A045" />
          </div>
          <div className="admin-field">
            <label htmlFor="color_gold_deep">Gold Deep (secondary accent)</label>
            <input id="color_gold_deep" name="color_gold_deep" type="text" defaultValue={settings.color_gold_deep} placeholder="#9C7C2E" />
          </div>
        </div>
        <div className="admin-row">
          <div className="admin-field">
            <label htmlFor="color_ink">Ink (dark background)</label>
            <input id="color_ink" name="color_ink" type="text" defaultValue={settings.color_ink} placeholder="#0F1416" />
          </div>
          <div className="admin-field">
            <label htmlFor="color_cream">Cream (light background)</label>
            <input id="color_cream" name="color_cream" type="text" defaultValue={settings.color_cream} placeholder="#F3EEE3" />
          </div>
        </div>
        <div className="admin-row">
          <div className="admin-field">
            <label htmlFor="heading_font">Heading Font (Google Fonts name)</label>
            <input id="heading_font" name="heading_font" type="text" defaultValue={settings.heading_font} placeholder="Fraunces" />
          </div>
          <div className="admin-field">
            <label htmlFor="body_font">Body Font (Google Fonts name)</label>
            <input id="body_font" name="body_font" type="text" defaultValue={settings.body_font} placeholder="Inter" />
          </div>
        </div>
        <button className="admin-btn" type="submit">
          Save Brand Settings
        </button>
      </form>
      </UnsavedChangesGuard>
    </>
  );
}
