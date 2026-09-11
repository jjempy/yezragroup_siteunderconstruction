'use client';

import { useState } from 'react';
import type { VideoRow } from '@/types/database';

/**
 * Shown to signed-in-but-unpaid visitors: thumbnail, title, and a "Preview"
 * button that plays only the first `preview_seconds` of the episode (via
 * YouTube's start/end embed params) before a persistent "Unlock Full
 * Access" prompt — the hook, not the whole thing, always paired with a
 * path straight to checkout.
 */
export function LockedVideoCard({ video, index }: { video: VideoRow; index: number }) {
  const [playing, setPlaying] = useState(false);
  const thumbUrl = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;

  return (
    <div className="vid-card reveal in">
      <div
        className="vid-thumb"
        style={{ backgroundImage: playing ? undefined : `url('${thumbUrl}')` }}
        onClick={() => setPlaying(true)}
      >
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?autoplay=1&start=0&end=${video.preview_seconds}&controls=0`}
            allow="accelerate-compute; autoplay; encrypted-media"
            allowFullScreen
            title={`${video.title} (preview)`}
          />
        ) : (
          <>
            <div className="play-btn" />
            <span className="vid-len">Preview</span>
          </>
        )}
      </div>
      <div className="vid-body">
        <div className="vid-tag">
          <span>Episode {String(index + 1).padStart(2, '0')}</span>
        </div>
        <div className="vid-title">{video.title}</div>
        <a
          href="/api/checkout/workshop-library"
          className="rung-btn gold"
          style={{ display: 'block', textAlign: 'center', marginTop: 12 }}
        >
          Unlock Full Access — $147
        </a>
      </div>
    </div>
  );
}
