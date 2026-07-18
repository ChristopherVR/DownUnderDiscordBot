import { isTauri } from './detect';

export type DragDropPayload =
  | { kind: 'enter'; paths: string[]; position?: { x: number; y: number } }
  | { kind: 'over'; paths: string[]; position?: { x: number; y: number } }
  | { kind: 'leave' }
  | { kind: 'drop'; paths: string[] };

export type DragDropHandler = (payload: DragDropPayload) => void;

export interface DragDropSubscription {
  /** True if this is the window-level Tauri stream. When false, consumers must
   *  attach their own DOM drag handlers to their container element. */
  tauri: boolean;
  unlisten: () => void;
}

/** Register a window-level drag-drop listener.
 *  On Tauri this taps the native `onDragDropEvent` stream.
 *  In browser mode this returns `{ tauri: false }` and the caller falls back
 *  to HTML5 DOM events (which only yield File objects, not real paths). */
export async function registerDragDropHandler(handler: DragDropHandler): Promise<DragDropSubscription> {
  if (!isTauri()) {
    return { tauri: false, unlisten: () => {} };
  }

  const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow');
  const appWindow = getCurrentWebviewWindow();

  const unlisten = await appWindow.onDragDropEvent((event) => {
    const payload = event.payload as {
      type: string;
      paths?: string[];
      position?: { x: number; y: number };
    };
    if (payload.type === 'enter') {
      handler({ kind: 'enter', paths: payload.paths ?? [], position: payload.position });
    } else if (payload.type === 'over') {
      handler({ kind: 'over', paths: payload.paths ?? [], position: payload.position });
    } else if (payload.type === 'leave') {
      handler({ kind: 'leave' });
    } else if (payload.type === 'drop') {
      handler({ kind: 'drop', paths: payload.paths ?? [] });
    }
  });

  return { tauri: true, unlisten };
}
