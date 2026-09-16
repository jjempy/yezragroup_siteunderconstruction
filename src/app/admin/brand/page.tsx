import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';
import { updateBrandSettings } from '../settings-actions';
import { UnsavedChangesGuard } from '@/components/admin/UnsavedChangesGuard';
import { AdminHighlightOnLoad } from '@/components/admin/AdminHighlightOnLoad';
import { BrandColorFields } from '@/components/admin/BrandColorFields';

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
        <div className="admin-field" style={{ marginTop: 8 }}>
          <label htmlFor="hero_mark_file">Hero Background Mark</label>
          <div className="hint" style={{ marginBottom: 8 }}>
            A separate image from the logo above — the large, faded decorative element behind the
            homepage headline. Leave empty to keep the default abstract mark. Works best with a
            transparent background (a real vector/SVG or a PNG with no background) — a detailed or
            opaque image will show as a hard box when faded large behind text.
          </div>
          {settings.hero_mark_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.hero_mark_url}
              alt="Current hero background mark"
              style={{ height: 80, marginBottom: 10, display: 'block', background: '#0F1416', padding: 8 }}
            />
          )}
          <input id="hero_mark_file" name="hero_mark_file" type="file" accept="image/*" />
        </div>
        <div className="admin-field">
          <label htmlFor="hero_mark_url">Or paste an image URL instead</label>
          <input
            id="hero_mark_url"
            name="hero_mark_url"
            type="url"
            defaultValue={settings.hero_mark_url}
            placeholder="https://…/mark.svg"
          />
          <div className="hint">Only used if you don&apos;t upload a file above. Leave blank to use the default mark.</div>
        </div>
        <div className="admin-field" style={{ marginBottom: 20 }}>
          <label htmlFor="hero_mark_opacity">Hero Mark Opacity ({settings.hero_mark_opacity}%)</label>
          <input
            id="hero_mark_opacity"
            name="hero_mark_opacity"
            type="range"
            min="0"
            max="100"
            defaultValue={settings.hero_mark_opacity}
          />
          <div className="hint">Applies to whichever mark is showing — your upload, or the default, if empty.</div>
        </div>
        <BrandColorFields
          colorGold={settings.color_gold}
          colorGoldDeep={settings.color_gold_deep}
          colorInk={settings.color_ink}
          colorCream={settings.color_cream}
        />
        <div className="admin-row">
          <div className="admin-field">
            <label htmlFor="heading_font">Heading Font (Google Fonts name)</label>
            <input id="heading_font" name="heading_font" type="text" defaultValue={settings.heading_font} placeholder="Archivo" />
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
