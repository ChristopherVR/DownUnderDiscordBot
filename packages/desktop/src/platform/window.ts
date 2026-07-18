import { isTauri } from './detect';

async function getAppWindow() {
  if (!isTauri()) return null;
  const { getCurrentWindow } = await import('@tauri-apps/api/window');
  return getCurrentWindow();
}

export const platformWindow = {
  async hide(): Promise<void> {
    const w = await getAppWindow();
    await w?.hide();
  },
  async toggleMaximize(): Promise<void> {
    const w = await getAppWindow();
    await w?.toggleMaximize();
  },
  async close(): Promise<void> {
    const w = await getAppWindow();
    await w?.close();
  },
};
