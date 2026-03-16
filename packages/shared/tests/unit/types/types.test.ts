import { describe, it, expect } from 'vitest';
import type {
  GlobalState,
  GuildState,
  InstanceInfo,
  Track,
  PlayerState,
  CommandDefinition,
  CommandOption,
  CommandChoice,
  CommandExecution,
  LogEntry,
  ConnectionInfo,
  UploadedFile,
  FileUploadProgress,
  WebSocketMessage,
  StreamStatusUpdate,
  BotStatusUpdate,
  DiscordCommandOption,
  ApiResult,
  LogsResponse,
  CommandRegistryResponse,
  CommandExecutionResponse,
  CommandHistoryResponse,
  CommandValidationResponse,
  SearchResult,
  SearchResponse,
  PlaylistSummary,
  PlaylistTrackItem,
  PlaylistDetail,
  CreatePlaylistRequest,
  AddTrackToPlaylistRequest,
  LocalFilesResponse,
  ConnectionsResponse,
  PlaybackOptions,
  ErrorMessages,
  TrackPlatform,
} from '@/types/index';

// ---- Helpers ----

/** Assert at compile time that a value satisfies a type. */
function assertType<T>(_value: T): void {
  // no-op, purely compile-time check
}

// ---- Core State Management Types ----

describe('GlobalState', () => {
  it('should accept a valid GlobalState object', () => {
    const state: GlobalState = {
      guilds: {},
      lastUpdated: Date.now(),
    };
    expect(state.guilds).toEqual({});
    expect(state.lastUpdated).toBeTypeOf('number');
  });

  it('should accept guilds with GuildState values', () => {
    const state: GlobalState = {
      guilds: {
        '123': {
          guildId: '123',
          activeInstanceId: null,
          instances: {},
        },
      },
      lastUpdated: 1000,
    };
    expect(state.guilds['123'].guildId).toBe('123');
    expect(state.guilds['123'].activeInstanceId).toBeNull();
  });
});

describe('GuildState', () => {
  it('should require guildId, activeInstanceId, and instances', () => {
    const guild: GuildState = {
      guildId: 'guild-1',
      activeInstanceId: 'instance-abc',
      instances: {},
    };
    expect(guild.guildId).toBe('guild-1');
    expect(guild.activeInstanceId).toBe('instance-abc');
  });

  it('should allow activeInstanceId to be null', () => {
    const guild: GuildState = {
      guildId: 'guild-2',
      activeInstanceId: null,
      instances: {},
    };
    expect(guild.activeInstanceId).toBeNull();
  });
});

describe('InstanceInfo', () => {
  it('should accept required fields', () => {
    const instance: InstanceInfo = {
      instanceId: 'inst-1',
      online: true,
      lastHeartbeat: Date.now(),
      isActive: true,
    };
    expect(instance.instanceId).toBe('inst-1');
    expect(instance.online).toBe(true);
    expect(instance.isActive).toBe(true);
  });

  it('should accept all optional fields', () => {
    const instance: InstanceInfo = {
      instanceId: 'inst-2',
      online: false,
      lastHeartbeat: 0,
      isActive: false,
      hostname: 'my-host',
      pid: 12345,
      shardId: 0,
      extra: { region: 'us-east-1' },
    };
    expect(instance.hostname).toBe('my-host');
    expect(instance.pid).toBe(12345);
    expect(instance.shardId).toBe(0);
    expect(instance.extra).toEqual({ region: 'us-east-1' });
  });
});

// ---- Player and Music Types ----

describe('Track', () => {
  it('should accept a minimal online track', () => {
    const track: Track = {
      id: 't-1',
      title: 'Test Song',
      artist: 'Artist',
      duration: 240,
      url: 'https://example.com/song',
      source: 'online',
    };
    expect(track.source).toBe('online');
    expect(track.thumbnail).toBeUndefined();
    expect(track.filePath).toBeUndefined();
  });

  it('should accept a local track with filePath', () => {
    const track: Track = {
      id: 't-2',
      title: 'Local File',
      artist: 'Unknown',
      duration: 180,
      url: 'file:///music/song.mp3',
      source: 'local',
      filePath: '/music/song.mp3',
      thumbnail: 'https://example.com/thumb.jpg',
    };
    expect(track.source).toBe('local');
    expect(track.filePath).toBe('/music/song.mp3');
  });

  it('should accept playlist source', () => {
    const track: Track = {
      id: 't-3',
      title: 'Playlist Track',
      artist: 'Band',
      duration: 300,
      url: 'https://example.com/track',
      source: 'playlist',
    };
    expect(track.source).toBe('playlist');
  });
});

describe('PlayerState', () => {
  it('should accept a valid playing state', () => {
    const track: Track = {
      id: 't-1',
      title: 'Song',
      artist: 'Artist',
      duration: 200,
      url: 'https://example.com',
      source: 'online',
    };
    const state: PlayerState = {
      status: 'playing',
      track,
      position: 42,
      volume: 80,
      loop: false,
      queue: [track],
      currentIndex: 0,
    };
    expect(state.status).toBe('playing');
    expect(state.track).toBe(track);
    expect(state.queue).toHaveLength(1);
  });

  it('should accept a stopped state with null track', () => {
    const state: PlayerState = {
      status: 'stopped',
      track: null,
      position: 0,
      volume: 100,
      loop: false,
      queue: [],
      currentIndex: 0,
    };
    expect(state.track).toBeNull();
    expect(state.queue).toHaveLength(0);
  });

  it('should accept paused status', () => {
    const state: PlayerState = {
      status: 'paused',
      track: null,
      position: 0,
      volume: 50,
      loop: true,
      queue: [],
      currentIndex: 0,
    };
    expect(state.status).toBe('paused');
    expect(state.loop).toBe(true);
  });
});

// ---- Command System Types ----

describe('CommandDefinition', () => {
  it('should accept a command with only required fields', () => {
    const cmd: CommandDefinition = {
      name: 'play',
      description: 'Play a track',
    };
    expect(cmd.name).toBe('play');
    expect(cmd.options).toBeUndefined();
    expect(cmd.category).toBeUndefined();
  });

  it('should accept options and category', () => {
    const cmd: CommandDefinition = {
      name: 'volume',
      description: 'Set volume',
      category: 'music',
      options: [
        {
          name: 'level',
          description: 'Volume level',
          type: 'integer',
          required: true,
          min: 0,
          max: 100,
        },
      ],
    };
    expect(cmd.options).toHaveLength(1);
    expect(cmd.category).toBe('music');
  });
});

describe('CommandOption', () => {
  it('should accept all option types', () => {
    const types: CommandOption['type'][] = ['string', 'integer', 'boolean', 'file'];
    for (const type of types) {
      const option: CommandOption = {
        name: `opt-${type}`,
        description: `A ${type} option`,
        type,
      };
      expect(option.type).toBe(type);
    }
  });

  it('should accept choices', () => {
    const option: CommandOption = {
      name: 'source',
      description: 'Track source',
      type: 'string',
      choices: [
        { name: 'YouTube', value: 'youtube' },
        { name: 'Spotify', value: 'spotify' },
      ],
    };
    expect(option.choices).toHaveLength(2);
  });
});

describe('CommandChoice', () => {
  it('should accept string values', () => {
    const choice: CommandChoice = { name: 'Option A', value: 'a' };
    expect(choice.value).toBe('a');
  });

  it('should accept number values', () => {
    const choice: CommandChoice = { name: 'Quality', value: 320 };
    expect(choice.value).toBe(320);
  });
});

describe('CommandExecution', () => {
  it('should accept all status variants', () => {
    const statuses: CommandExecution['status'][] = ['success', 'error', 'pending'];
    for (const status of statuses) {
      const exec: CommandExecution = {
        id: `exec-${status}`,
        command: 'play',
        arguments: { query: 'test' },
        timestamp: Date.now(),
        status,
      };
      expect(exec.status).toBe(status);
    }
  });

  it('should accept result and error fields', () => {
    const exec: CommandExecution = {
      id: 'exec-err',
      command: 'play',
      arguments: {},
      timestamp: Date.now(),
      status: 'error',
      result: undefined,
      error: 'Track not found',
    };
    expect(exec.error).toBe('Track not found');
  });
});

// ---- Logging Types ----

describe('LogEntry', () => {
  it('should accept all category and level combinations', () => {
    const categories: LogEntry['category'][] = ['audit', 'command', 'system'];
    const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];

    for (const category of categories) {
      for (const level of levels) {
        const entry: LogEntry = {
          id: `log-${category}-${level}`,
          category,
          level,
          message: 'test message',
          timestamp: Date.now(),
        };
        expect(entry.category).toBe(category);
        expect(entry.level).toBe(level);
      }
    }
  });

  it('should accept optional source and metadata', () => {
    const entry: LogEntry = {
      id: 'log-1',
      category: 'system',
      level: 'info',
      message: 'System started',
      timestamp: Date.now(),
      source: 'bot-core',
      metadata: { version: '2.0.0', uptime: 3600 },
    };
    expect(entry.source).toBe('bot-core');
    expect(entry.metadata).toEqual({ version: '2.0.0', uptime: 3600 });
  });
});

// ---- Connection Types ----

describe('ConnectionInfo', () => {
  it('should accept text and voice types', () => {
    const textConn: ConnectionInfo = {
      id: 'conn-1',
      name: 'general',
      type: 'text',
      connected: true,
      guildId: 'guild-1',
      channelId: 'ch-1',
    };
    const voiceConn: ConnectionInfo = {
      id: 'conn-2',
      name: 'Music',
      type: 'voice',
      connected: false,
      guildId: 'guild-1',
      channelId: 'ch-2',
    };
    expect(textConn.type).toBe('text');
    expect(voiceConn.type).toBe('voice');
  });
});

// ---- File Upload Types ----

describe('UploadedFile', () => {
  it('should accept required fields only', () => {
    const file: UploadedFile = {
      id: 'file-1',
      originalName: 'song.mp3',
      fileName: 'abc123.mp3',
      filePath: '/uploads/abc123.mp3',
      mimeType: 'audio/mpeg',
      size: 5_000_000,
      uploadedAt: Date.now(),
    };
    expect(file.mediaType).toBeUndefined();
    expect(file.metadata).toBeUndefined();
  });

  it('should accept full metadata', () => {
    const file: UploadedFile = {
      id: 'file-2',
      originalName: 'video.mp4',
      fileName: 'xyz789.mp4',
      filePath: '/uploads/xyz789.mp4',
      mimeType: 'video/mp4',
      size: 50_000_000,
      uploadedAt: Date.now(),
      mediaType: 'video',
      metadata: {
        duration: 300,
        bitrate: 128000,
        artist: 'Test Artist',
        title: 'Test Title',
        album: 'Test Album',
      },
    };
    expect(file.mediaType).toBe('video');
    expect(file.metadata?.duration).toBe(300);
    expect(file.metadata?.album).toBe('Test Album');
  });
});

describe('FileUploadProgress', () => {
  it('should accept all status variants', () => {
    const statuses: FileUploadProgress['status'][] = ['uploading', 'processing', 'complete', 'error'];
    for (const status of statuses) {
      const progress: FileUploadProgress = {
        fileId: 'file-1',
        progress: status === 'complete' ? 100 : 50,
        status,
      };
      expect(progress.status).toBe(status);
    }
  });

  it('should accept error message on error status', () => {
    const progress: FileUploadProgress = {
      fileId: 'file-1',
      progress: 0,
      status: 'error',
      error: 'File too large',
    };
    expect(progress.error).toBe('File too large');
  });
});

// ---- WebSocket Message Types ----

describe('WebSocketMessage', () => {
  it('should accept bot_status type', () => {
    const msg: WebSocketMessage = {
      type: 'bot_status',
      payload: {
        guildId: 'g-1',
        instanceId: 'i-1',
        status: 'online',
      },
    };
    expect(msg.type).toBe('bot_status');
  });

  it('should accept player_state type', () => {
    const msg: WebSocketMessage = {
      type: 'player_state',
      payload: {
        status: 'playing',
        track: null,
        position: 0,
        volume: 100,
        loop: false,
        queue: [],
        currentIndex: 0,
      },
    };
    expect(msg.type).toBe('player_state');
  });

  it('should accept log_entry type', () => {
    const msg: WebSocketMessage = {
      type: 'log_entry',
      payload: {
        id: 'log-1',
        category: 'system',
        level: 'info',
        message: 'test',
        timestamp: Date.now(),
      },
    };
    expect(msg.type).toBe('log_entry');
  });

  it('should accept command_result type', () => {
    const msg: WebSocketMessage = {
      type: 'command_result',
      payload: {
        id: 'exec-1',
        command: 'play',
        arguments: {},
        timestamp: Date.now(),
        status: 'success',
      },
    };
    expect(msg.type).toBe('command_result');
  });

  it('should accept connection_update type', () => {
    const msg: WebSocketMessage = {
      type: 'connection_update',
      payload: [],
    };
    expect(msg.type).toBe('connection_update');
  });

  it('should accept stream_status type', () => {
    const msg: WebSocketMessage = {
      type: 'stream_status',
      payload: {
        videoId: 'abc123',
        status: 'streaming',
        client: 'WEB',
      },
    };
    expect(msg.type).toBe('stream_status');
  });
});

describe('StreamStatusUpdate', () => {
  it('should accept all status and client variants', () => {
    const statuses: StreamStatusUpdate['status'][] = ['resolving', 'fallback', 'streaming', 'error'];
    const clients: StreamStatusUpdate['client'][] = ['ANDROID', 'WEB', 'yt-dlp'];

    for (const status of statuses) {
      for (const client of clients) {
        const update: StreamStatusUpdate = {
          videoId: 'vid-1',
          status,
          client,
        };
        expect(update.status).toBe(status);
        expect(update.client).toBe(client);
      }
    }
  });

  it('should accept optional message', () => {
    const update: StreamStatusUpdate = {
      videoId: 'vid-1',
      status: 'error',
      client: 'WEB',
      message: 'Rate limited',
    };
    expect(update.message).toBe('Rate limited');
  });
});

describe('BotStatusUpdate', () => {
  it('should accept online and offline statuses', () => {
    const online: BotStatusUpdate = {
      guildId: 'g-1',
      instanceId: 'i-1',
      status: 'online',
      connections: [],
    };
    const offline: BotStatusUpdate = {
      guildId: 'g-1',
      instanceId: 'i-1',
      status: 'offline',
    };
    expect(online.status).toBe('online');
    expect(offline.connections).toBeUndefined();
  });
});

// ---- Discord.js Command Types ----

describe('DiscordCommandOption', () => {
  it('should accept Discord option types', () => {
    const option: DiscordCommandOption = {
      name: 'query',
      description: 'Search query',
      type: 3, // STRING
      required: true,
    };
    expect(option.type).toBe(3);
  });

  it('should accept numeric min/max', () => {
    const option: DiscordCommandOption = {
      name: 'volume',
      description: 'Volume level',
      type: 4, // INTEGER
      min_value: 0,
      max_value: 100,
    };
    expect(option.min_value).toBe(0);
    expect(option.max_value).toBe(100);
  });
});

// ---- API Response Types ----

describe('ApiResult', () => {
  it('should accept a successful result with data', () => {
    const result: ApiResult<string> = {
      success: true,
      data: 'hello',
    };
    expect(result.success).toBe(true);
    expect(result.data).toBe('hello');
  });

  it('should accept an error result', () => {
    const result: ApiResult<never> = {
      success: false,
      error: 'Something went wrong',
    };
    expect(result.success).toBe(false);
    expect(result.error).toBe('Something went wrong');
  });

  it('should work with complex generic types', () => {
    const result: ApiResult<Track[]> = {
      success: true,
      data: [
        {
          id: 't-1',
          title: 'Song',
          artist: 'Artist',
          duration: 200,
          url: 'https://example.com',
          source: 'online',
        },
      ],
    };
    expect(result.data).toHaveLength(1);
  });
});

describe('LogsResponse', () => {
  it('should contain items array, total, and hasMore', () => {
    const response: LogsResponse = {
      items: [],
      total: 0,
      hasMore: false,
    };
    expect(response.items).toEqual([]);
    expect(response.total).toBe(0);
    expect(response.hasMore).toBe(false);
  });
});

describe('CommandRegistryResponse', () => {
  it('should contain commands and count', () => {
    const response: CommandRegistryResponse = {
      success: true,
      commands: [{ name: 'play', description: 'Play a song' }],
      count: 1,
    };
    expect(response.commands).toHaveLength(1);
    expect(response.count).toBe(1);
  });
});

describe('CommandExecutionResponse', () => {
  it('should accept a successful execution', () => {
    const response: CommandExecutionResponse = {
      success: true,
      execution: {
        id: 'e-1',
        command: 'play',
        arguments: { query: 'test' },
        timestamp: Date.now(),
        status: 'success',
      },
    };
    expect(response.success).toBe(true);
    expect(response.execution?.command).toBe('play');
  });

  it('should accept an error execution', () => {
    const response: CommandExecutionResponse = {
      success: false,
      error: 'Command failed',
    };
    expect(response.success).toBe(false);
    expect(response.execution).toBeUndefined();
  });
});

describe('CommandHistoryResponse', () => {
  it('should contain history and count', () => {
    const response: CommandHistoryResponse = {
      success: true,
      history: [],
      count: 0,
    };
    expect(response.history).toEqual([]);
    expect(response.count).toBe(0);
  });
});

describe('CommandValidationResponse', () => {
  it('should contain validation result', () => {
    const response: CommandValidationResponse = {
      success: true,
      validation: {
        valid: true,
        errors: [],
      },
    };
    expect(response.validation.valid).toBe(true);
    expect(response.validation.errors).toHaveLength(0);
  });

  it('should contain validation errors', () => {
    const response: CommandValidationResponse = {
      success: true,
      validation: {
        valid: false,
        errors: ['Missing required field: query'],
      },
    };
    expect(response.validation.valid).toBe(false);
    expect(response.validation.errors).toHaveLength(1);
  });
});

describe('SearchResult and SearchResponse', () => {
  it('should accept a minimal search result', () => {
    const result: SearchResult = {
      id: 'sr-1',
      title: 'Found Song',
      url: 'https://example.com/song',
    };
    expect(result.artist).toBeUndefined();
    expect(result.duration).toBeUndefined();
    expect(result.thumbnail).toBeUndefined();
  });

  it('should accept a full search result', () => {
    const result: SearchResult = {
      id: 'sr-2',
      title: 'Full Song',
      artist: 'Artist',
      duration: 240,
      url: 'https://example.com/song',
      thumbnail: 'https://example.com/thumb.jpg',
    };
    expect(result.artist).toBe('Artist');
  });

  it('should wrap results in SearchResponse', () => {
    const response: SearchResponse = {
      items: [{ id: 'sr-1', title: 'Song', url: 'https://example.com' }],
    };
    expect(response.items).toHaveLength(1);
  });
});

// ---- Playlist Types ----

describe('TrackPlatform', () => {
  it('should accept all valid platform values', () => {
    const platforms: TrackPlatform[] = ['youtube', 'spotify', 'soundcloud', 'local', 'unknown'];
    expect(platforms).toHaveLength(5);
    for (const p of platforms) {
      assertType<TrackPlatform>(p);
    }
  });
});

describe('PlaylistSummary', () => {
  it('should accept all required fields', () => {
    const summary: PlaylistSummary = {
      id: 'pl-1',
      name: 'My Playlist',
      description: 'A great playlist',
      isPublic: true,
      userId: 'user-1',
      trackCount: 10,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-06-01T00:00:00Z',
    };
    expect(summary.name).toBe('My Playlist');
    expect(summary.trackCount).toBe(10);
  });

  it('should allow null description', () => {
    const summary: PlaylistSummary = {
      id: 'pl-2',
      name: 'Untitled',
      description: null,
      isPublic: false,
      userId: 'user-1',
      trackCount: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };
    expect(summary.description).toBeNull();
  });
});

describe('PlaylistTrackItem', () => {
  it('should accept all fields including nullable ones', () => {
    const track: PlaylistTrackItem = {
      id: 'pt-1',
      title: 'Track 1',
      artist: null,
      duration: 200,
      url: 'https://example.com/track',
      thumbnail: null,
      platform: 'youtube',
      position: 0,
    };
    expect(track.artist).toBeNull();
    expect(track.thumbnail).toBeNull();
    expect(track.platform).toBe('youtube');
  });
});

describe('PlaylistDetail', () => {
  it('should contain tracks array', () => {
    const detail: PlaylistDetail = {
      id: 'pl-1',
      name: 'My Playlist',
      description: 'Great music',
      isPublic: true,
      trackCount: 1,
      tracks: [
        {
          id: 'pt-1',
          title: 'Song 1',
          artist: 'Artist 1',
          duration: 180,
          url: 'https://example.com/1',
          thumbnail: 'https://example.com/thumb1.jpg',
          platform: 'spotify',
          position: 0,
        },
      ],
    };
    expect(detail.tracks).toHaveLength(1);
    expect(detail.trackCount).toBe(1);
  });
});

describe('CreatePlaylistRequest', () => {
  it('should require only name', () => {
    const req: CreatePlaylistRequest = { name: 'New Playlist' };
    expect(req.name).toBe('New Playlist');
    expect(req.description).toBeUndefined();
    expect(req.isPublic).toBeUndefined();
  });

  it('should accept all optional fields', () => {
    const req: CreatePlaylistRequest = {
      name: 'Public Playlist',
      description: 'Shared with everyone',
      isPublic: true,
    };
    expect(req.isPublic).toBe(true);
  });
});

describe('AddTrackToPlaylistRequest', () => {
  it('should require title and url', () => {
    const req: AddTrackToPlaylistRequest = {
      title: 'Song',
      url: 'https://example.com/song',
    };
    expect(req.title).toBe('Song');
    expect(req.artist).toBeUndefined();
  });

  it('should accept all optional fields', () => {
    const req: AddTrackToPlaylistRequest = {
      title: 'Local Song',
      artist: 'Artist',
      duration: 200,
      url: 'file:///music/song.mp3',
      thumbnail: 'https://example.com/thumb.jpg',
      platform: 'local',
      filePath: '/music/song.mp3',
    };
    expect(req.platform).toBe('local');
    expect(req.filePath).toBe('/music/song.mp3');
  });
});

// ---- Container Response Types ----

describe('LocalFilesResponse', () => {
  it('should contain a files array', () => {
    const response: LocalFilesResponse = { files: [] };
    expect(response.files).toEqual([]);
  });
});

describe('ConnectionsResponse', () => {
  it('should contain an items array', () => {
    const response: ConnectionsResponse = { items: [] };
    expect(response.items).toEqual([]);
  });
});

// ---- PlaybackOptions ----

describe('PlaybackOptions', () => {
  it('should accept empty options', () => {
    const opts: PlaybackOptions = {};
    expect(opts.volume).toBeUndefined();
  });

  it('should accept all optional fields', () => {
    const opts: PlaybackOptions = {
      volume: 75,
      loop: true,
      shuffle: false,
      position: 120,
    };
    expect(opts.volume).toBe(75);
    expect(opts.loop).toBe(true);
    expect(opts.shuffle).toBe(false);
    expect(opts.position).toBe(120);
  });
});

// ---- ErrorMessages ----

describe('ErrorMessages', () => {
  it('should accept all required error message keys', () => {
    const errors: ErrorMessages = {
      'errors.connection.failed': 'Connection failed',
      'errors.command.invalid': 'Invalid command',
      'errors.command.unauthorized': 'Unauthorized',
      'errors.upload.fileTooBig': 'File too big',
      'errors.upload.invalidFormat': 'Invalid format',
      'errors.player.trackNotFound': 'Track not found',
      'errors.bot.notConnected': 'Bot not connected',
      'errors.generic': 'An error occurred',
    };
    expect(Object.keys(errors)).toHaveLength(8);
    expect(errors['errors.generic']).toBe('An error occurred');
  });
});

// ---- Type Compatibility ----

describe('Type compatibility', () => {
  it('Track should be usable in PlayerState.queue', () => {
    const track: Track = {
      id: 't-1',
      title: 'Song',
      artist: 'Artist',
      duration: 200,
      url: 'https://example.com',
      source: 'online',
    };
    const state: PlayerState = {
      status: 'playing',
      track,
      position: 0,
      volume: 100,
      loop: false,
      queue: [track, track],
      currentIndex: 0,
    };
    expect(state.queue[0]).toBe(state.track);
  });

  it('ConnectionInfo should be usable in BotStatusUpdate.connections', () => {
    const conn: ConnectionInfo = {
      id: 'c-1',
      name: 'Music',
      type: 'voice',
      connected: true,
      guildId: 'g-1',
      channelId: 'ch-1',
    };
    const update: BotStatusUpdate = {
      guildId: 'g-1',
      instanceId: 'i-1',
      status: 'online',
      connections: [conn],
    };
    expect(update.connections).toHaveLength(1);
    expect(update.connections?.[0]).toBe(conn);
  });

  it('LogEntry should be usable in LogsResponse.items', () => {
    const entry: LogEntry = {
      id: 'l-1',
      category: 'command',
      level: 'info',
      message: 'Command executed',
      timestamp: Date.now(),
    };
    const response: LogsResponse = {
      items: [entry],
      total: 1,
      hasMore: false,
    };
    expect(response.items[0]).toBe(entry);
  });

  it('InstanceInfo should be usable in GuildState.instances', () => {
    const instance: InstanceInfo = {
      instanceId: 'inst-1',
      online: true,
      lastHeartbeat: Date.now(),
      isActive: true,
    };
    const guild: GuildState = {
      guildId: 'g-1',
      activeInstanceId: 'inst-1',
      instances: { 'inst-1': instance },
    };
    expect(guild.instances['inst-1']).toBe(instance);
  });
});
