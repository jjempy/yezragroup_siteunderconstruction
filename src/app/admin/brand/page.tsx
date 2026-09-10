import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';
import { updateBrandSettings } from '../settings-actions';

export default async function BrandAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle<SiteSettings>();
  const settings = data!;

  return (
    <>
      <h1>Brand</h1>
      <p className="sub">Logo, colors, and fonts. Leave a field blank to keep the current default.</p>
      {searchParams.saved && <p className="admin-toast ok">Saved.</p>}
      <form action={updateBrandSettings} className="admin-card">
        <div className="admin-field">
          <label htmlFor="brand_name">Brand Name</label>
          <input id="brand_name" name="brand_name" type="text" defaultValue={settings.brand_name} required />
        </div>
        <div className="admin-field">
          <label htmlFor="logo_url">Logo URL</label>
          <input id="logo_url" name="logo_url" type="url" defaultValue={settings.logo_url} placeholder="https://…/logo.svg" />
          <div className="hint">Replaces the text wordmark in the nav and footer once set.</div>
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
    </>
  );
}
