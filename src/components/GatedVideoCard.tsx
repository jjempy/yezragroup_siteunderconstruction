'use client';

import { useState } from 'react';
import type { PaidVideoRow } from '@/types/database';
import { useBackToClose } from '@/lib/useBackToClose';

/** Full, unlocked playback of the paid-only extended cut — same
 * click-to-play behavior as the public VideoCard, but without the "Watch
 * on YouTube" outbound link, since this content isn't public. */
export function GatedVideoCard({ video, index }: { video: PaidVideoRow; index: number }) {
  const [playing, setPlaying] = useState(false);
  useBackToClose(playing, () => setPlaying(false));
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
        </div>
        <div className="vid-title">{video.title}</div>
      </div>
    </div>
  );
}
