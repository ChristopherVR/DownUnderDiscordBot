import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Music } from 'lucide-react';

export default function TitleBar() {
  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="fixed left-0 right-0 top-0 z-50 flex h-9 select-none items-center justify-between border-b border-white/5 bg-[#08080c]/90 backdrop-blur-xl"
    >
      <div
        data-tauri-drag-region
        className="flex flex-1 items-center gap-2 pl-4"
      >
        <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-spotify-green to-emerald-400">
          <Music size={10} className="text-black" />
        </div>
        <span className="text-[11px] font-medium tracking-wide text-white/40">
          Down Under Bot
        </span>
      </div>
      <div className="flex">
        <button
          onClick={() => appWindow.minimize()}
          className="flex h-9 w-11 items-center justify-center text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="flex h-9 w-11 items-center justify-center text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          <Square size={11} />
        </button>
        <button
          onClick={() => appWindow.close()}
          className="flex h-9 w-11 items-center justify-center text-white/40 transition-colors hover:bg-red-500/80 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
