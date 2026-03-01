import { useEffect, useRef } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';

/**
 * Floating video preview panel.
 * When the current track is a video and showVideoPreview is enabled,
 * attaches the store's <video> element into the DOM to display the video feed.
 */
export default function VideoPreview() {
  const localAudio = useBotStore((s) => s.localAudio);
  const currentTrack = useBotStore((s) => s.player.currentTrack);
  const showVideoPreview = useBotStore((s) => s.showVideoPreview);
  const setShowVideoPreview = useBotStore((s) => s.setShowVideoPreview);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  const isVideo = currentTrack?.mediaType === 'video';

  useEffect(() => {
    if (!containerRef.current || !localAudio || !isVideo || !showVideoPreview) return;

    // The localAudio element is actually a <video> when mediaType is 'video'.
    // Attach it into the container so the video is visible.
    if (localAudio instanceof HTMLVideoElement) {
      const videoEl = localAudio;
      // Style the video element to fill the container
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = 'contain';
      videoEl.style.borderRadius = '0.5rem';

      containerRef.current.appendChild(videoEl);

      return () => {
        // Don't pause when detaching — just remove from DOM
        if (containerRef.current?.contains(videoEl)) {
          containerRef.current.removeChild(videoEl);
        }
      };
    }
  }, [localAudio, isVideo, showVideoPreview]);

  if (!isVideo || !showVideoPreview || !currentTrack) return null;

  return (
    <div
      className={`fixed z-50 overflow-hidden rounded-xl border border-white/[0.08] bg-black/90 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-300 ${
        expanded
          ? 'bottom-24 left-1/2 h-[60vh] w-[60vw] -translate-x-1/2'
          : 'bottom-24 right-4 h-48 w-80'
      }`}
      style={{
        '--text-primary': 'rgba(255, 255, 255, 0.9)',
        '--text-secondary': 'rgba(255, 255, 255, 0.6)',
        '--text-tertiary': 'rgba(255, 255, 255, 0.4)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      } as React.CSSProperties}
    >
      {/* Header bar */}
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-3 py-2">
        <span className="truncate text-[11px] font-medium text-t-secondary">
          {currentTrack.title}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="rounded-md p-1 text-t-tertiary transition-colors hover:bg-white/10 hover:text-t-secondary"
          >
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button
            onClick={() => setShowVideoPreview(false)}
            className="rounded-md p-1 text-t-tertiary transition-colors hover:bg-white/10 hover:text-t-secondary"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Video container */}
      <div ref={containerRef} className="flex h-full w-full items-center justify-center bg-black" />
    </div>
  );
}
