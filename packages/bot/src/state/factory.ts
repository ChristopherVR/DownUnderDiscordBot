import { ChannelStateService } from './channel/ChannelStateService';
import type { IStateService } from './IStateService';
import type { WebSocketManager } from '../helpers/websocket';

export function createStateService(deps: {
  discordClient: import('discord.js').Client;
  stateChannelId: string;
  wsManager?: WebSocketManager;
}): IStateService {
  const backend = process.env.STATE_BACKEND ?? 'channel';
  switch (backend) {
    case 'memory': {
      // The ChannelStateService already has an in-memory storage path that
      // activates when `client.channels.fetch` is not a function. We expose
      // that path explicitly by passing a stripped-down client shim.
      const shim = {
        // Crucially: no `channels.fetch` - triggers `useMemoryStorage = true`.
        channels: {},
        guilds: deps.discordClient.guilds,
      } as unknown as import('discord.js').Client;
      return new ChannelStateService(shim, deps.stateChannelId, deps.wsManager);
    }
    case 'channel':
    default:
      return new ChannelStateService(deps.discordClient, deps.stateChannelId, deps.wsManager);
  }
}
