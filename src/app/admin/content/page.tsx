import { createClient } from '@/lib/supabase/server';
import type { SiteSettings } from '@/types/database';
import { updateContentSettings } from '../settings-actions';
import { UnsavedChangesGuard } from '@/components/admin/UnsavedChangesGuard';

export default async function ContentAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase.from('site_settings').select('*').eq('id', 'default').maybeSingle<SiteSettings>();
  const settings = data!;

  return (
    <>
      <h1>Hero &amp; About</h1>
      <p className="sub">The homepage hero copy, about-section paragraphs, founder photo, contact and social links.</p>
      {searchParams.saved && <p className="admin-toast ok">Saved</p>}
      <div style={{ marginBottom: 16 }}>
        <button className="admin-btn" type="submit" form="content-form">
          Save Content
        </button>
      </div>
      <UnsavedChangesGuard>
      <form id="content-form" action={updateContentSettings} className="admin-card">
        <h2>Hero</h2>
        <div className="admin-field">
          <label htmlFor="hero_eyebrow">Eyebrow</label>
          <input id="hero_eyebrow" name="hero_eyebrow" type="text" defaultValue={settings.hero_eyebrow} />
        </div>
        <div className="admin-field">
          <label htmlFor="hero_heading">Heading</label>
          <textarea id="hero_heading" name="hero_heading" defaultValue={settings.hero_heading} />
          <div className="hint">Wrap a word or phrase in *asterisks* for the gold italic treatment.</div>
        </div>
        <div className="admin-field">
          <label htmlFor="hero_lede">Subheading</label>
          <textarea id="hero_lede" name="hero_lede" defaultValue={settings.hero_lede} />
        </div>

        <h2 style={{ marginTop: 32 }}>About</h2>
        <div className="admin-field">
          <label htmlFor="founder_photo_url">Founder Photo URL</label>
          <input id="founder_photo_url" name="founder_photo_url" type="url" defaultValue={settings.founder_photo_url} placeholder="https://…/joseph.jpg" />
          <div className="hint">
            Leave blank to show the soft brand-colored panel instead of a photo. Must be a direct link
            to the image file itself (right-click the photo → "Copy image address"), not a page that
            contains it — a Google Images result page or a LinkedIn profile URL won't work.
          </div>
        </div>
        <div className="admin-field">
          <label htmlFor="about_body">About Paragraphs</label>
          <textarea
            id="about_body"
            name="about_body"
            style={{ minHeight: 160 }}
            defaultValue={settings.about_body.join('\n')}
          />
          <div className="hint">One paragraph per line.</div>
        </div>

        <h2 style={{ marginTop: 32 }}>Contact &amp; Social</h2>
        <div className="admin-row">
          <div className="admin-field">
            <label htmlFor="contact_email">Contact Email</label>
            <input id="contact_email" name="contact_email" type="email" defaultValue={settings.contact_email} />
          </div>
          <div className="admin-field">
            <label htmlFor="contact_phone">Contact Phone</label>
            <input id="contact_phone" name="contact_phone" type="text" defaultValue={settings.contact_phone} />
          </div>
        </div>
        <div className="admin-row">
          <div className="admin-field">
            <label htmlFor="youtube_channel_url">YouTube Channel URL</label>
            <input id="youtube_channel_url" name="youtube_channel_url" type="url" defaultValue={settings.youtube_channel_url} />
          </div>
          <div className="admin-field">
            <label htmlFor="spotify_url">Spotify URL</label>
            <input id="spotify_url" name="spotify_url" type="url" defaultValue={settings.spotify_url} />
          </div>
        </div>
        <div className="admin-field">
          <label htmlFor="ga4_measurement_id">GA4 Measurement ID</label>
          <input id="ga4_measurement_id" name="ga4_measurement_id" type="text" defaultValue={settings.ga4_measurement_id} placeholder="G-XXXXXXXXXX" />
          <div className="hint">Leave blank to skip loading Google Analytics.</div>
        </div>

        <button className="admin-btn" type="submit">
          Save Content
        </button>
      </form>
      </UnsavedChangesGuard>
    </>
  );
}
