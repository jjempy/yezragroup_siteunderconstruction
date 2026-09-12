import { createClient } from '@/lib/supabase/server';
import type { VideoRow } from '@/types/database';
import { addVideo, deleteVideo, moveVideo, updateVideo } from './actions';

export default async function VideosAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const supabase = createClient();
  const { data: videos } = await supabase.from('videos').select('*').order('sort_order');
  const list = (videos as VideoRow[]) ?? [];

  return (
    <>
      <h1>Workshop Videos</h1>
      <p className="sub">
        The always-free, publicly-released episodes shown on the homepage — never gated. For the
        paid-only "Early Access" bonus cuts, see Extended Videos instead.
      </p>
      {searchParams.saved && <p className="admin-toast ok">Saved</p>}

      <div className="admin-card">
        <h2>Add an Episode</h2>
        <form action={addVideo}>
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
              <input id="duration" name="duration" type="text" placeholder="24:10" />
            </div>
          </div>
          <button className="admin-btn" type="submit">
            Add Episode
          </button>
        </form>
      </div>

      {list.map((video, i) => (
        <div className="admin-card" key={video.id}>
          <form action={updateVideo.bind(null, video.id)}>
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
            <form action={moveVideo.bind(null, video.id, 'up')}>
              <button className="admin-btn secondary" type="submit" disabled={i === 0}>
                ↑ Move Up
              </button>
            </form>
            <form action={moveVideo.bind(null, video.id, 'down')}>
              <button className="admin-btn secondary" type="submit" disabled={i === list.length - 1}>
                ↓ Move Down
              </button>
            </form>
            <form action={deleteVideo.bind(null, video.id)}>
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
