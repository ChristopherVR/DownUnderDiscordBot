import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, ACCENT_THEMES, type ThemeMode, type AccentColor } from '@/stores/useThemeStore';
import { cn } from '@/lib/utils';

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export default function ThemeSelector() {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);

  return (
    <div className="flex flex-col gap-5">
      {/* Mode selector */}
      <div>
        <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">
          Appearance
        </label>
        <div data-testid="settings-theme" className="grid grid-cols-3 gap-2">
          {MODE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-3.5 transition-all',
                mode === value
                  ? 'border-[var(--accent)]/40 bg-[var(--accent)]/[0.06]'
                  : 'border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--glass-hover-border)]',
              )}
            >
              <Icon
                size={20}
                className={cn(mode === value ? 'text-[var(--accent)]' : 'text-t-tertiary')}
                style={mode === value ? { color: 'var(--accent)' } : undefined}
              />
              <span className={cn('text-xs font-semibold', mode === value ? 'text-t-primary' : 'text-t-secondary')}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color selector */}
      <div>
        <label className="mb-2.5 block text-[11px] font-semibold uppercase tracking-wider text-t-faint">
          Accent Color
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ACCENT_THEMES.map((theme) => {
            const isActive = accent === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setAccent(theme.id as AccentColor)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border p-3 transition-all',
                  isActive
                    ? 'border-transparent'
                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] hover:border-[var(--glass-hover-border)]',
                )}
                style={
                  isActive
                    ? {
                        borderColor: `${theme.color}40`,
                        background: `${theme.color}0F`,
                      }
                    : undefined
                }
              >
                {/* Color swatch */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform',
                    isActive && 'scale-110',
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${theme.color}, ${theme.colorHover})`,
                    boxShadow: isActive ? `0 0 12px ${theme.color}50` : 'none',
                  }}
                >
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2.5 7L5.5 10L11.5 4"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className={cn('text-xs font-semibold', isActive ? 'text-t-primary' : 'text-t-secondary')}>
                  {theme.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
