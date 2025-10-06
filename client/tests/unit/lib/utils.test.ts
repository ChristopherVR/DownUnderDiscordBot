import { describe, it, expect } from 'vitest';
import { cn } from '../../../src/lib/utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const shouldShow = true;
      const shouldHide = false;
      const result = cn('base', shouldShow && 'conditional', shouldHide && 'hidden');
      expect(result).toBe('base conditional');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid');
      expect(result).toBe('base valid');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle arrays', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle objects', () => {
      const result = cn({
        class1: true,
        class2: false,
        class3: true,
      });
      expect(result).toBe('class1 class3');
    });

    it('should merge Tailwind classes correctly', () => {
      // This tests the tailwind-merge functionality
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4'); // px-4 should override px-2
    });
  });
});
