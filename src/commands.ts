import { Ask } from './commands/ask';
import { Meme } from './commands/meme';
import { Back } from './commands/music/back';
import { Clear } from './commands/music/clear';
import { Controller } from './commands/music/controller';
import { Filter } from './commands/music/filter';
import { Jump } from './commands/music/jump';
import { Loop } from './commands/music/loop';
import { NowPlaying } from './commands/music/nowplaying';
import { Pause } from './commands/music/pause';
import { Play } from './commands/music/play';
import { PlayNext } from './commands/music/playnext';
import { Remove } from './commands/music/remove';
import { Resume } from './commands/music/resume';
import { Save } from './commands/music/save';
import { Search } from './commands/music/search';
import { Seek } from './commands/music/seek';
import { Shuffle } from './commands/music/shuffle';
import { Skip } from './commands/music/skip';
import { Stop } from './commands/music/stop';
import { Volume } from './commands/music/volume';
import { Queue } from './commands/music/queue';
import Hello from './commands/hello';

export const getCommands = () => [
  Hello,
  Ask,
  Meme,
  Back,
  Clear,
  Controller,
  Filter,
  Jump,
  Loop,
  NowPlaying,
  Pause,
  Play,
  PlayNext,
  Queue,
  Remove,
  Resume,
  Save,
  Search,
  Seek,
  Shuffle,
  Skip,
  Stop,
  Volume,
];

export default getCommands;
