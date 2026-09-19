import { createClient } from '@/lib/supabase/server';
import type { VideoRow, PaidVideoRow } from '@/types/database';
import { addVideo, deleteVideo, moveVideo, updateVideo } from './actions';
import { addPaidVideo, deletePaidVideo, movePaidVideo, updatePaidVideo } from '../extended-videos/actions';
import { AdminHighlightOnLoad } from '@/components/admin/AdminHighlightOnLoad';

/** Workshop Videos and Extended Videos used to be two separate nav
 * items/pages for what is, from an admin's point of view, one job:
 * managing the video content. They're still two different tables with
 * different fields (Extended has a Preview Length the free tier
 * doesn't) and different actions files — this just presents them
 * together on one page instead of a click apart. */
export default async function VideosAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const supabase = createClient();
  const [{ data: videos }, { data: paidVideos }] = await Promise.all([
    supabase.from('videos').select('*').order('sort_order'),
    supabase.from('paid_videos').select('*').order('sort_order'),
  ]);
  const list = (videos as VideoRow[]) ?? [];
  const paidList = (paidVideos as PaidVideoRow[]) ?? [];

  return (
    <>
      <AdminHighlightOnLoad />
      <h1>Videos</h1>
      <p className="sub">Everything shown in the Workshop Library, both the free episodes and the paid bonus cuts.</p>
      {searchParams.saved && <p className="admin-toast ok">Saved</p>}

      <h2 style={{ marginTop: 8, marginBottom: 4 }}>Free Workshop Videos</h2>
      <p className="sub" style={{ marginBottom: 16 }}>
        The always-free, publicly-released episodes shown on the homepage — never gated.
      </p>

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

      <h2 style={{ marginTop: 40, marginBottom: 4 }}>Extended Paid Videos</h2>
      <p className="sub" style={{ marginBottom: 16 }}>
        The paid-only &quot;Early Access&quot; bonus cut of each session — longer, less edited, with
        additional insights. This is what the $147 tier actually includes. Non-buyers see a short locked
        preview clip (Preview Length) of this content, with a &quot;Get Full Access&quot; prompt — full
        playback is buyers-only.
      </p>

      <div className="admin-card">
        <h2>Add an Extended Episode</h2>
        <form action={addPaidVideo}>
          <div className="admin-row">
            <div className="admin-field">
              <label htmlFor="ext-title">Title</label>
              <input id="ext-title" name="title" type="text" required />
            </div>
            <div className="admin-field">
              <label htmlFor="ext-youtube_id">YouTube ID or URL</label>
              <input id="ext-youtube_id" name="youtube_id" type="text" required placeholder="dQw4w9WgXcQ" />
            </div>
            <div className="admin-field">
              <label htmlFor="ext-duration">Duration</label>
              <input id="ext-duration" name="duration" type="text" placeholder="41:00" />
            </div>
            <div className="admin-field">
              <label htmlFor="ext-preview_seconds">Preview Length (seconds)</label>
              <input id="ext-preview_seconds" name="preview_seconds" type="number" min={5} defaultValue={45} />
            </div>
          </div>
          <button className="admin-btn" type="submit">
            Add Extended Episode
          </button>
        </form>
      </div>

      {paidList.map((video, i) => (
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
              <button className="admin-btn secondary" type="submit" disabled={i === paidList.length - 1}>
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
