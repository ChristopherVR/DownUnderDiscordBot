import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore, toast } from '@/stores/useToastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset store state
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addToast', () => {
    it('adds a toast with default type of info', () => {
      useToastStore.getState().addToast('Hello world');
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Hello world');
      expect(toasts[0].type).toBe('info');
    });

    it('adds a toast with specified type', () => {
      useToastStore.getState().addToast('Success!', 'success');
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
    });

    it('adds an error toast', () => {
      useToastStore.getState().addToast('Something failed', 'error');
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
    });

    it('generates a unique id for each toast', () => {
      useToastStore.getState().addToast('Toast 1');
      useToastStore.getState().addToast('Toast 2');
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(2);
      expect(toasts[0].id).not.toBe(toasts[1].id);
    });

    it('appends multiple toasts', () => {
      useToastStore.getState().addToast('First');
      useToastStore.getState().addToast('Second');
      useToastStore.getState().addToast('Third');
      expect(useToastStore.getState().toasts).toHaveLength(3);
    });

    it('auto-removes toast after 3000ms', () => {
      useToastStore.getState().addToast('Temporary');
      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(3000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('removes only the specific toast after timeout, not others', () => {
      useToastStore.getState().addToast('First');
      vi.advanceTimersByTime(1000);
      useToastStore.getState().addToast('Second');

      // After 2000ms more, the first toast should be removed (3000ms total)
      vi.advanceTimersByTime(2000);
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Second');

      // After another 1000ms, the second toast should also be removed
      vi.advanceTimersByTime(1000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('removeToast', () => {
    it('removes a toast by id', () => {
      useToastStore.getState().addToast('To remove');
      const id = useToastStore.getState().toasts[0].id;

      useToastStore.getState().removeToast(id);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('does not affect other toasts when removing one', () => {
      useToastStore.getState().addToast('Keep');
      useToastStore.getState().addToast('Remove');
      const removeId = useToastStore.getState().toasts[1].id;

      useToastStore.getState().removeToast(removeId);
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Keep');
    });

    it('is a no-op for non-existent id', () => {
      useToastStore.getState().addToast('Existing');
      useToastStore.getState().removeToast('non-existent-id');
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('toast shorthand helpers', () => {
    it('toast.success adds a success toast', () => {
      toast.success('Done!');
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Done!');
    });

    it('toast.error adds an error toast', () => {
      toast.error('Oops');
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].message).toBe('Oops');
    });

    it('toast.info adds an info toast', () => {
      toast.info('FYI');
      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('info');
      expect(toasts[0].message).toBe('FYI');
    });
  });
});
