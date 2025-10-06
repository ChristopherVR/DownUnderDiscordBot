import type { StateDoc, GuildState, InstanceInfo } from './schema';

export interface InstancePresenceInput {
  instanceId: string;
  online: boolean;
  isActive?: boolean;
  hostname?: string;
  pid?: number;
  shardId?: number;
  extra?: InstanceInfo['extra'];
}

export interface IStateService {
  getState(): Promise<StateDoc>;
  getGuildState(guildId: string): Promise<GuildState>;
  setActiveInstance(guildId: string, instanceId: string): Promise<GuildState>;
  setOnline(guildId: string, info: InstancePresenceInput): Promise<GuildState>;
  sendPing(targetInstanceId?: string): Promise<string>;

  // Enhanced bot tracking methods
  getBotInstances(guildId: string): Promise<InstanceInfo[]>;
  getOnlineInstances(): Promise<Record<string, InstanceInfo[]>>;
  getActiveInstance(guildId: string): Promise<InstanceInfo | null>;
  setOffline(guildId: string, instanceId: string): Promise<GuildState>;
  getHealthStatus(): Promise<{
    totalInstances: number;
    onlineInstances: number;
    guildsWithBots: number;
    lastUpdated: number;
  }>;

  // State persistence and recovery methods
  recoverFromBackup(): Promise<boolean>;
  refreshHeartbeats(): Promise<void>;
  shutdown(): Promise<void>;
  getInstanceId(): string;
}
