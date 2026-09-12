import { createClient } from '@/lib/supabase/server';
import type { PaidVideoRow } from '@/types/database';
import { addPaidVideo, deletePaidVideo, movePaidVideo, updatePaidVideo } from './actions';

export default async function ExtendedVideosAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const supabase = createClient();
  const { data: videos } = await supabase.from('paid_videos').select('*').order('sort_order');
  const list = (videos as PaidVideoRow[]) ?? [];

  return (
    <>
      <h1>Extended Videos</h1>
      <p className="sub">
        The paid-only "Early Access" bonus cut of each session — longer, less edited, with additional
        insights. This is what the $147 tier actually unlocks. Non-buyers see a short locked preview
        clip (Preview Length) of this content, with an unlock prompt — full playback is buyers-only.
        The free homepage videos are managed separately under Workshop Videos and are never gated.
      </p>
      {searchParams.saved && <p className="admin-toast ok">Saved</p>}

      <div className="admin-card">
        <h2>Add an Extended Episode</h2>
        <form action={addPaidVideo}>
          <div className="admin-row">
            <div className="admin-field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" required />
            </div>
            <div className="admin-field">
              <label htmlFor="youtube_id">YouTube ID or URL</label>
              <input id="youtube_id" name="youtube_id" type="text" required placeholder="dQw4w9WgXcQ" />
            </div>
            <div className="admin-field">
              <label htmlFor="duration">Duration</label>
              <input id="duration" name="duration" type="text" placeholder="41:00" />
            </div>
            <div className="admin-field">
              <label htmlFor="preview_seconds">Preview Length (seconds)</label>
              <input id="preview_seconds" name="preview_seconds" type="number" min={5} defaultValue={45} />
            </div>
          </div>
          <button className="admin-btn" type="submit">
            Add Extended Episode
          </button>
        </form>
      </div>

      {list.map((video, i) => (
        <div className="admin-card" key={video.id}>
          <form action={updatePaidVideo.bind(null, video.id)}>
            <div className="admin-row">
              <div className="admin-field">
                <label htmlFor={`title-${video.id}`}>Title</label>
                <input id={`title-${video.id}`} name="title" type="text" defaultValue={video.title} required />
              </div>
              <div className="admin-field">
                <label htmlFor={`youtube_id-${video.id}`}>YouTube ID or URL</label>
                <input id={`youtube_id-${video.id}`} name="youtube_id" type="text" defaultValue={video.youtube_id} required />
              </div>
              <div className="admin-field">
                <label htmlFor={`duration-${video.id}`}>Duration</label>
                <input id={`duration-${video.id}`} name="duration" type="text" defaultValue={video.duration} />
              </div>
              <div className="admin-field">
                <label htmlFor={`preview_seconds-${video.id}`}>Preview Length (seconds)</label>
                <input
                  id={`preview_seconds-${video.id}`}
                  name="preview_seconds"
                  type="number"
                  min={5}
                  defaultValue={video.preview_seconds}
                />
              </div>
            </div>
            <label className="admin-checkbox">
              <input type="checkbox" name="is_visible" defaultChecked={video.is_visible} />
              Visible
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              <button className="admin-btn" type="submit">
                Save
              </button>
            </div>
          </form>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <form action={movePaidVideo.bind(null, video.id, 'up')}>
              <button className="admin-btn secondary" type="submit" disabled={i === 0}>
                ↑ Move Up
              </button>
            </form>
            <form action={movePaidVideo.bind(null, video.id, 'down')}>
              <button className="admin-btn secondary" type="submit" disabled={i === list.length - 1}>
                ↓ Move Down
              </button>
            </form>
            <form action={deletePaidVideo.bind(null, video.id)}>
              <button className="admin-btn danger" type="submit">
                Remove
              </button>
            </form>
          </div>
        </div>
      ))}
    </>
  );
}
