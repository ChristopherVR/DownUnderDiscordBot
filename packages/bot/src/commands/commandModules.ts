// Static registry of command factories, keyed by module name.
//
// This exists so the command set survives esbuild bundling. CommandRegistry
// used to resolve each command via `import(new URL('../../commands/<name>.js',
// import.meta.url))` at runtime. That works from a tsc `dist/` tree (the files
// sit next to the compiled registry) but loads ZERO commands once the bot is
// bundled into a single `index.js` for the Tauri sidecar / npm artifact: the
// computed specifier is invisible to esbuild, so the files are neither inlined
// nor shipped, and the `../../` offset is wrong for the bundle layout anyway.
//
// Static imports below are bundled by esbuild, so the map is fully populated in
// every build. Keep it in sync with the command files in this directory.
import type { CommandHandler } from '../types/commands';

import play from './play';
import pause from './pause';
import resume from './resume';
import stop from './stop';
import skip from './skip';
import volume from './volume';
import loop from './loop';
import queue from './queue';
import nowplaying from './nowplaying';
import shuffle from './shuffle';
import seek from './seek';
import jump from './jump';
import back from './back';
import clear from './clear';
import remove from './remove';
import save from './save';
import playnext from './playnext';
import search from './search';
import playlist from './playlist';
import history from './history';
import setActive from './set-active';
import status from './status';
import hello from './hello';
import meme from './meme';
import ask from './ask';
import shutdown from './shutdown';

export const COMMAND_MODULE_FACTORIES: Record<string, () => CommandHandler> = {
  play,
  pause,
  resume,
  stop,
  skip,
  volume,
  loop,
  queue,
  nowplaying,
  shuffle,
  seek,
  jump,
  back,
  clear,
  remove,
  save,
  playnext,
  search,
  playlist,
  history,
  hello,
  meme,
  ask,
  // set-active, status and shutdown predate the CommandContext-based
  // CommandHandler shape and still take a raw ChatInputCommandInteraction.
  // The registry registers them on their runtime {name, run} shape, exactly
  // as the old path-based dynamic loader (which imported them untyped) did.
  // The casts keep the rest of this map type-checked while isolating the
  // known mismatch to these entries.
  'set-active': setActive as unknown as () => CommandHandler,
  status: status as unknown as () => CommandHandler,
  shutdown: shutdown as unknown as () => CommandHandler,
};
