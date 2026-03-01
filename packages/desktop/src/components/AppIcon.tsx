import type { CSSProperties } from 'react';

interface AppIconProps {
  /** Icon width and height in pixels */
  size?: number;
  /** Additional CSS class names */
  className?: string;
  /** Inline styles – use `color` to set the fill (inherits currentColor) */
  style?: CSSProperties;
}

/**
 * Custom "Down Under" app icon – beamed eighth notes with a boomerang-curved
 * beam, a sound-wave arc, and Southern Cross stars.
 *
 * Accepts the same `size` / `style` / `className` API as lucide-react icons
 * so it can be used as a drop-in replacement.
 */
export default function AppIcon({ size = 24, className, style }: AppIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={className}
      style={style}
    >
      {/* Left note head */}
      <ellipse cx="5.8" cy="17" rx="3" ry="2.2" transform="rotate(-15 5.8 17)" />
      {/* Right note head */}
      <ellipse cx="13.2" cy="15.7" rx="3" ry="2.2" transform="rotate(-15 13.2 15.7)" />
      {/* Left stem */}
      <rect x="8.2" y="4.5" width="1.6" height="13" rx="0.8" />
      {/* Right stem */}
      <rect x="15.7" y="3" width="1.6" height="13.2" rx="0.8" />
      {/* Boomerang-curved beam connecting the stems */}
      <path d="M8.5 5 C10 2.2 15 1.5 17 3.5 L17 5.3 C15 3.8 10.5 4 9 6.5 Z" />
      {/* Sound wave arc */}
      <path
        d="M19.2 7 Q21.5 11.5 19.2 16"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Southern Cross stars */}
      <circle cx="2.8" cy="3.2" r="0.7" opacity={0.7} />
      <circle cx="4" cy="5" r="0.5" opacity={0.5} />
      <circle cx="1.8" cy="5.2" r="0.5" opacity={0.5} />
      <circle cx="3" cy="6.5" r="0.45" opacity={0.4} />
    </svg>
  );
}
