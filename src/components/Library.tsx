import { VideoCard } from './VideoCard';
import type { SiteSettings, VideoRow } from '@/types/database';

export function Library({ videos, settings }: { videos: VideoRow[]; settings: SiteSettings }) {
  // "Hide if empty" — the whole section disappears with no videos, no
  // placeholder cards, matching the original CONFIG-driven behavior.
  if (videos.length === 0) return null;

  return (
    <section className="light" id="library">
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow">Watch Anytime</div>
          <h2>The Workshop Library.</h2>
          <p>
            Short, focused sessions — 20 to 30 minutes, one task each. No lead-in, no filler, no
            channel-building schedule — I turn the camera on when there&apos;s something worth thirty
            minutes of your time. Early episodes are simple by design; the library gets more polished
            as it grows, not slower.
          </p>
          <div style={{ marginTop: 16, display: 'flex', gap: 20 }}>
            {settings.youtube_channel_url && (
              <a
                href={settings.youtube_channel_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--gold-deep)', textDecoration: 'underline' }}
              >
                Full YouTube channel ↗
              </a>
            )}
            {settings.spotify_url && (
              <a
                href={settings.spotify_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, color: 'var(--gold-deep)', textDecoration: 'underline' }}
              >
                Listen on Spotify ↗
              </a>
            )}
          </div>
        </div>
        <div className="lib-grid">
          {videos.map((v, i) => (
            <VideoCard key={v.id} video={v} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
