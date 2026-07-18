import { isTauri } from './detect';

/** Prompt the user for a folder path.
 *  Tauri → native directory dialog.
 *  Browser → `window.prompt` (the bot can't see the user's client filesystem,
 *  but it CAN scan its own - users type a server-side path or a shared mount). */
export async function pickFolder(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selected = await open({ directory: true, multiple: false, title: 'Select Music Folder' });
    return typeof selected === 'string' ? selected : null;
  }
  const path = window.prompt('Enter the full path to a music folder on the server:');
  return path?.trim() ? path.trim() : null;
}
