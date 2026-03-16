import { describe, expect, it } from 'vitest';
import { cn, formatTime, truncate, platformIcon } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const condition = false as boolean;
    const result = cn('base', condition && 'hidden', 'always');
    expect(result).toBe('base always');
  });

  it('handles undefined and null values', () => {
    const result = cn('a', undefined, null, 'b');
    expect(result).toBe('a b');
  });

  it('merges tailwind classes correctly (twMerge)', () => {
    // twMerge should resolve conflicting tailwind classes
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('handles array inputs via clsx', () => {
    const result = cn(['foo', 'bar']);
    expect(result).toBe('foo bar');
  });

  it('handles object inputs via clsx', () => {
    const result = cn({ active: true, hidden: false });
    expect(result).toBe('active');
  });

  it('returns empty string for no arguments', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

describe('formatTime', () => {
  it('formats zero seconds', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats seconds less than a minute', () => {
    expect(formatTime(45)).toBe('0:45');
  });

  it('formats exact minutes', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(120)).toBe('2:00');
  });

  it('formats mixed minutes and seconds', () => {
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(185)).toBe('3:05');
  });

  it('pads seconds with leading zero', () => {
    expect(formatTime(61)).toBe('1:01');
    expect(formatTime(69)).toBe('1:09');
  });

  it('handles large values', () => {
    expect(formatTime(3661)).toBe('61:01');
  });

  it('floors fractional seconds', () => {
    expect(formatTime(90.7)).toBe('1:30');
    expect(formatTime(61.9)).toBe('1:01');
  });

  it('returns 0:00 for NaN', () => {
    expect(formatTime(NaN)).toBe('0:00');
  });

  it('returns 0:00 for undefined-like values', () => {
    // The function checks !seconds, so 0, NaN, undefined all return '0:00'
    expect(formatTime(0)).toBe('0:00');
  });
});

describe('truncate', () => {
  it('returns the string unchanged if shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('returns the string unchanged if equal to maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis when longer than maxLength', () => {
    const result = truncate('hello world', 6);
    // Should take first 5 chars (maxLength - 1) + ellipsis
    expect(result).toBe('hello\u2026');
    expect(result.length).toBe(6);
  });

  it('truncates long strings', () => {
    const result = truncate('This is a very long string that should be cut', 20);
    expect(result.length).toBe(20);
    expect(result.endsWith('\u2026')).toBe(true);
  });

  it('handles maxLength of 1', () => {
    const result = truncate('hello', 1);
    expect(result).toBe('\u2026');
  });
});

describe('platformIcon', () => {
  it('returns TV icon for youtube', () => {
    expect(platformIcon('youtube')).toBe('\uD83D\uDCFA');
  });

  it('returns music note for spotify', () => {
    expect(platformIcon('spotify')).toBe('\uD83C\uDFB5');
  });

  it('returns cloud icon for soundcloud', () => {
    expect(platformIcon('soundcloud')).toBe('\u2601\uFE0F');
  });

  it('returns folder icon for local', () => {
    expect(platformIcon('local')).toBe('\uD83D\uDCC1');
  });

  it('returns generic music icon for unknown platform', () => {
    expect(platformIcon('tidal')).toBe('\uD83C\uDFB6');
  });

  it('returns generic music icon for undefined', () => {
    expect(platformIcon(undefined)).toBe('\uD83C\uDFB6');
  });

  it('is case-insensitive', () => {
    expect(platformIcon('YouTube')).toBe('\uD83D\uDCFA');
    expect(platformIcon('SPOTIFY')).toBe('\uD83C\uDFB5');
    expect(platformIcon('SoundCloud')).toBe('\u2601\uFE0F');
  });
});
