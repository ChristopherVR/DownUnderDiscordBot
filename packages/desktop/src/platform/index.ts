import { isTauri } from './detect';

export { isTauri };
export { platformWindow } from './window';
export { openExternal } from './shell';
export { registerDragDropHandler } from './dragDrop';
export type { DragDropPayload, DragDropHandler, DragDropSubscription } from './dragDrop';
export { pickFolder } from './filePicker';
export { startOAuth, registerDeepLinkAuth, clientKind } from './authFlow';
export type { ClientKind } from './authFlow';
export { libraryPlatform } from './library';
export type { ScannedTrack, FolderChangeEvent } from './library';
export { updaterPlatform } from './updater';
export type { UpdateInfo, UpdateProgress } from './updater';

export const platform = {
  isTauri: isTauri(),
  canMinimizeToTray: isTauri(),
  canDragOsFiles: isTauri(),
  canPickClientFolder: isTauri(),
  showCustomTitlebar: isTauri(),
  canCheckForUpdates: isTauri(),
};
