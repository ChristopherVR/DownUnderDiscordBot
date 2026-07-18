import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'copper' | 'green' | 'purple' | 'blue' | 'rose' | 'orange' | 'cyan';

export interface ThemeDefinition {
  id: AccentColor;
  label: string;
  color: string; // Primary accent color
  colorHover: string; // Hover variant
  colorLight: string; // Light variant for backgrounds
}

export const ACCENT_THEMES: ThemeDefinition[] = [
  { id: 'copper', label: 'Copper', color: '#E2914A', colorHover: '#EFA868', colorLight: '#F4C493' },
  { id: 'green', label: 'Emerald', color: '#1DB954', colorHover: '#1ED760', colorLight: '#34d399' },
  { id: 'purple', label: 'Violet', color: '#8B5CF6', colorHover: '#A78BFA', colorLight: '#C4B5FD' },
  { id: 'blue', label: 'Ocean', color: '#3B82F6', colorHover: '#60A5FA', colorLight: '#93C5FD' },
  { id: 'rose', label: 'Rose', color: '#F43F5E', colorHover: '#FB7185', colorLight: '#FDA4AF' },
  { id: 'orange', label: 'Sunset', color: '#F97316', colorHover: '#FB923C', colorLight: '#FDBA74' },
  { id: 'cyan', label: 'Arctic', color: '#06B6D4', colorHover: '#22D3EE', colorLight: '#67E8F9' },
];

interface ThemeStore {
  mode: ThemeMode;
  accent: AccentColor;
  /** Resolved mode after applying system preference */
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  /** Call once on app init to set up media-query listener */
  initSystemListener: () => void;
}

function getSystemPreference(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'system' ? getSystemPreference() : mode;
}

function loadFromStorage(): { mode: ThemeMode; accent: AccentColor } {
  try {
    const raw = localStorage.getItem('du-theme');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        mode: parsed.mode ?? 'dark',
        accent: parsed.accent ?? 'copper',
      };
    }
  } catch {
    // ignore
  }
  return { mode: 'dark', accent: 'copper' };
}

function saveToStorage(mode: ThemeMode, accent: AccentColor) {
  localStorage.setItem('du-theme', JSON.stringify({ mode, accent }));
}

function applyToDOM(resolvedMode: 'light' | 'dark', accent: AccentColor) {
  const root = document.documentElement;
  root.setAttribute('data-mode', resolvedMode);
  root.setAttribute('data-accent', accent);
}

const initial = loadFromStorage();
const initialResolved = resolveMode(initial.mode);

// Apply immediately to avoid flash
applyToDOM(initialResolved, initial.accent);

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: initial.mode,
  accent: initial.accent,
  resolvedMode: initialResolved,

  setMode: (mode) => {
    const resolved = resolveMode(mode);
    saveToStorage(mode, get().accent);
    applyToDOM(resolved, get().accent);
    set({ mode, resolvedMode: resolved });
  },

  setAccent: (accent) => {
    saveToStorage(get().mode, accent);
    applyToDOM(get().resolvedMode, accent);
    set({ accent });
  },

  initSystemListener: () => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
      const { mode } = get();
      if (mode === 'system') {
        const resolved = getSystemPreference();
        applyToDOM(resolved, get().accent);
        set({ resolvedMode: resolved });
      }
    });
  },
}));
