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
    case 'channel':
    default:
      return new ChannelStateService(deps.discordClient, deps.stateChannelId, deps.wsManager);
  }
}
