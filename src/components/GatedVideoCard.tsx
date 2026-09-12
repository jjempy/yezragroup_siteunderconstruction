'use client';

import { useState } from 'react';
import type { PaidVideoRow } from '@/types/database';
import { useBackToClose } from '@/lib/useBackToClose';

/** Full, unlocked playback of the paid-only extended cut — same
 * click-to-play behavior as the public VideoCard, but without the "Watch
 * on YouTube" outbound link, since this content isn't public. Records a
 * flat "viewed" mark (no gamification) the first time it's played, for
 * the account page's plain "X of Y sessions viewed" line. */
export function GatedVideoCard({
  video,
  index,
  viewed,
}: {
  video: PaidVideoRow;
  index: number;
  viewed?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [hasViewed, setHasViewed] = useState(Boolean(viewed));
  useBackToClose(playing, () => setPlaying(false));
  const thumbUrl = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;

  function play() {
    setPlaying(true);
    if (!hasViewed) {
      setHasViewed(true);
      fetch('/api/library/mark-viewed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paidVideoId: video.id }),
      }).catch(() => {});
    }
  }

  return (
    <div className="vid-card reveal in">
      <div
        className="vid-thumb"
        style={{ backgroundImage: playing ? undefined : `url('${thumbUrl}')` }}
        onClick={play}
      >
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.youtube_id}?autoplay=1`}
            allow="accelerate-compute; autoplay; encrypted-media"
            allowFullScreen
            title={video.title}
          />
        ) : (
          <>
            <div className="play-btn" />
            {video.duration && <span className="vid-len">{video.duration}</span>}
          </>
        )}
      </div>
      <div className="vid-body">
        <div className="vid-tag">
          <span>Episode {String(index + 1).padStart(2, '0')}</span>
          {hasViewed && <span style={{ marginLeft: 8, color: 'var(--muted-l)' }}>✓ Viewed</span>}
        </div>
        <div className="vid-title">{video.title}</div>
      </div>
    </div>
  );
}
