'use client';

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactPlayer from 'react-player';
import { usePlayerStore } from '@/stores/playerStore';

export interface YoutubePlayerHandle {
  seekTo: (timeMs: number) => void;
}

interface Props {
  videoId: string;
}

const YoutubePlayer = forwardRef<YoutubePlayerHandle, Props>(({ videoId }, ref) => {
  const playerRef = useRef<HTMLVideoElement>(null);

  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const playbackRate = usePlayerStore((s) => s.playbackRate);
  const seekToTime = usePlayerStore((s) => s.seekToTime);
  const setCurrentTimeMs = usePlayerStore((s) => s.setCurrentTimeMs);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const clearSeek = usePlayerStore((s) => s.clearSeek);
  const loopCaptionIndex = usePlayerStore((s) => s.loopCaptionIndex);
  const captions = usePlayerStore((s) => s.captions);
  const incrementLoopCount = usePlayerStore((s) => s.incrementLoopCount);

  const loopGuardRef = useRef(false);

  useImperativeHandle(ref, () => ({
    seekTo: (timeMs: number) => {
      if (playerRef.current) {
        playerRef.current.currentTime = timeMs / 1000;
      }
    },
  }));

  useEffect(() => {
    if (seekToTime !== null && playerRef.current) {
      playerRef.current.currentTime = seekToTime / 1000;
      clearSeek();
    }
  }, [seekToTime, clearSeek]);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
      <ReactPlayer
        ref={playerRef}
        src={`https://www.youtube.com/watch?v=${videoId}`}
        playing={isPlaying}
        playbackRate={playbackRate}
        controls
        width="100%"
        height="100%"
        onTimeUpdate={(e) => {
          const el = (e as unknown as { currentTarget: HTMLVideoElement }).currentTarget;
          const ms = Math.floor(el.currentTime * 1000);

          if (loopCaptionIndex !== null && captions[loopCaptionIndex]) {
            const c = captions[loopCaptionIndex];
            const end = c.offset + c.duration;
            if (ms < c.offset - 200 || ms >= end) {
              if (!loopGuardRef.current) {
                loopGuardRef.current = true;
                el.currentTime = c.offset / 1000;
                incrementLoopCount();
                setCurrentTimeMs(c.offset);
                setTimeout(() => { loopGuardRef.current = false; }, 250);
              }
              return;
            }
          }

          setCurrentTimeMs(ms);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
});

YoutubePlayer.displayName = 'YoutubePlayer';
export default YoutubePlayer;
