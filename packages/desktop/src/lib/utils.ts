import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '\u2026';
}

export function platformIcon(platform?: string): string {
  switch (platform?.toLowerCase()) {
    case 'youtube': return '\uD83D\uDCFA';
    case 'spotify': return '\uD83C\uDFB5';
    case 'soundcloud': return '\u2601\uFE0F';
    case 'local': return '\uD83D\uDCC1';
    default: return '\uD83C\uDFB6';
  }
}
