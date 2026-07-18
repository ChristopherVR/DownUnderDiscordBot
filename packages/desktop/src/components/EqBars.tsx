/**
 * The app's signature element: a small level-meter, styled after an analog
 * VU meter, that reads as an instrument rather than decoration. Animates only
 * while something is actually playing; otherwise it sits as a flat, static
 * readout at rest.
 */

const BAR_HEIGHTS = [7, 14, 10, 16];

interface EqBarsProps {
  playing: boolean;
  size?: 'sm' | 'md';
  color?: string;
}

export default function EqBars({ playing, size = 'sm', color = 'var(--accent)' }: EqBarsProps) {
  const barWidth = size === 'sm' ? 2 : 3;
  const gap = size === 'sm' ? 2 : 3;
  const maxHeight = size === 'sm' ? 14 : 18;

  return (
    <div
      className="flex items-end"
      style={{ height: maxHeight, gap }}
      role="img"
      aria-label={playing ? 'Playing' : 'Paused'}
    >
      {BAR_HEIGHTS.map((restHeight, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{
            width: barWidth,
            background: color,
            height: playing ? undefined : restHeight,
            animation: playing ? 'var(--animate-now-playing-bar)' : undefined,
            animationDelay: playing ? `${i * 0.15}s` : undefined,
            opacity: playing ? 1 : 0.45,
          }}
        />
      ))}
    </div>
  );
}
