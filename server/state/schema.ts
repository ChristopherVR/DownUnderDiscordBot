export type InstanceInfo = {
  instanceId: string;
  online: boolean;
  lastHeartbeat: number;
  isActive: boolean;
  shardId?: number;
  hostname?: string;
  pid?: number;
  extra?: Record<string, unknown>;
};
export type GuildState = { guildId: string; activeInstanceId: string | null; instances: Record<string, InstanceInfo> };
export type StateDoc = { version: 1; updatedAt: number; guilds: Record<string, GuildState>; docVersion: number };
