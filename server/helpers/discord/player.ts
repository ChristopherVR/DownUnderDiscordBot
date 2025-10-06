/* eslint-disable no-undef */
import { Player } from 'discord-player';
import { AttachmentExtractor } from '@discord-player/extractor';
import { Client } from 'discord.js';
import { PlayerEventManager } from './playerEventManager';
import { PlayerStateManager } from '../status/playerStateManager';
import { WebSocketManager } from '../websocket';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { createLogger } from '../logger';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import Innertube from 'youtubei.js';

let player: Player | null = null;
let playerEventManager: PlayerEventManager | null = null;
let playerStateManager: PlayerStateManager | null = null;

const log = createLogger('player');

export const useDefaultPlayer = (): Player => {
  if (!player) {
    throw new Error('Player has not been initialized.');
  }
  return player;
};

export const getPlayerStateManager = (): PlayerStateManager => {
  if (!playerStateManager) {
    throw new Error('Player state manager has not been initialized.');
  }
  return playerStateManager;
};

export const getPlayerEventManager = (): PlayerEventManager => {
  if (!playerEventManager) {
    throw new Error('Player event manager has not been initialized.');
  }
  return playerEventManager;
};

function ffmpegPcmFrom(input: Readable): Readable {
  const ff = spawn(
    process.env.FFMPEG_PATH ?? 'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'debug',
      '-stats_period',
      '0.5',
      '-reconnect',
      '1',
      '-reconnect_streamed',
      '1',
      '-reconnect_delay_max',
      '5',
      '-rw_timeout',
      '15000000',
      '-i',
      'pipe:0',
      '-vn',
      '-sn',
      '-dn',
      '-f',
      's16le',
      '-ar',
      '48000',
      '-ac',
      '2',
      'pipe:1',
    ],
    { stdio: ['pipe', 'pipe', 'pipe'] },
  );

  input.once('error', (err) => ff.stdin.destroy(err));
  input.pipe(ff.stdin);

  ff.stderr.on('data', (d) => console.debug('[ffmpeg]', String(d).trim()));
  ff.on('error', (err) => console.error('[ffmpeg] error', err));
  ff.on('close', (code) => console.debug('[ffmpeg] exited', code));

  return ff.stdout as unknown as Readable;
}

export const initializePlayer = async (client: Client, wsManager?: WebSocketManager): Promise<Player> => {
  if (player) {
    return player;
  }

  player = new Player(client);

  player.events.on('debug', (_queue, message) => {
    // log.debug(`Debug: ${message} on guild ${_queue.guild.id}`);
  });
  player.events.on('playerError', (queue, error) => {
    log.error(error);
  });

  player.events.on('playerStart', (queue, track) => {
    log.info(`${queue.guild.id} Started playing: ${track.title}`);
  });
  player.events.on('playerFinish', (queue, track) => {
    log.info(`${queue.guild.id} Finished playing: ${track.title}`);
  });

  player.events.on('error', (queue, err) => {
    log.error(err);
  });

  await player.extractors.register(AttachmentExtractor, {});

  await player.extractors.register(YoutubeiExtractor, {
    innertubeConfigRaw: {
      // Git issue - https://github.com/LuanRT/YouTube.js/issues/1043
      player_id: '0004de42',
    },
    cookie:
      'APISID=VS9JpvhAVMoH4zhm/A-IEgpeicIett-elP; SAPISID=-ZMQZc_53sAiMYRd/A_266j80jHQkzm8TA; __Secure-1PAPISID=-ZMQZc_53sAiMYRd/A_266j80jHQkzm8TA; __Secure-3PAPISID=-ZMQZc_53sAiMYRd/A_266j80jHQkzm8TA; goodTube_autoplay=true; goodTube_uniqueUserStat=true; PREF=f6=40000000&tz=Australia.Brisbane&f7=100&repeat=NONE&f5=20000; SID=g.a0002Aj0mXJVX5sVTywGkahyp49MpFDuWWN9UIu5cX19TRPr5qE1unqz6TU4qjv9ufvJynzHzQACgYKAbsSARISFQHGX2MivPbRzqaixyiEorIeT7NSABoVAUF8yKo6TXAwsTndkagflgMyjOtB0076; SIDCC=AKEyXzUdzfKMpKqnRQy7t_JGCjT6OvorWi5rB9hMI477DNJSRmLjO17uLNVosYgRAZ0rN5W67o4',
    generateWithPoToken: true,
    ignoreSignInErrors: true,
    overrideBridgeMode: 'yt',

    // createStream: async (track, extractor) => {
    //   const id = track.id || new URL(track.url).searchParams.get('v') || track.url.split('/').pop();

    //   try {
    //     const t = await (
    //       await Innertube.create()
    //     ).download(id!, {
    //       type: 'video+audio',
    //       // quality: 'best',
    //       client: 'WEB',
    //     });
    //   } catch (error) {
    //     log.error('Error fetching video info from YouTube');
    //   }

    //   const url = await extractor.innerTube.download(id!, {
    //     type: 'video+audio',
    //     quality: 'best',
    //   });

    //   return ffmpegPcmFrom(Readable.from(url));
    // },
    streamOptions: {
      highWaterMark: 1 << 25,
      debugStream: (msg: string) => log.error(`YT Stream: ${msg}`),
    },
  });
  // Initialize state manager with enhanced functionality
  playerStateManager = new PlayerStateManager(player);

  // Initialize event manager and connect it to state manager
  playerEventManager = new PlayerEventManager(player);
  playerEventManager.setPlayerStateManager(playerStateManager);

  // Connect WebSocket manager if provided
  if (wsManager) {
    playerEventManager.setWebSocketManager(wsManager);
  }

  return player;
};

export const setWebSocketManager = (wsManager: WebSocketManager): void => {
  if (playerEventManager) {
    playerEventManager.setWebSocketManager(wsManager);
  }
};

export default useDefaultPlayer;
