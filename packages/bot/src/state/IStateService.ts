import type { StateDoc, GuildState, InstanceInfo, HeartbeatStatus } from './schema';

export interface InstancePresenceInput {
  instanceId: string;
  online: boolean;
  isActive?: boolean;
  hostname?: string;
  pid?: number;
  shardId?: number;
  extra?: InstanceInfo['extra'];
}

/** Result returned when waiting for a PONG response to a previous PING. */
export interface PongResult {
  nonce: string;
  responderId: string;
  rttMs: number;
}

export interface IStateService {
  getState(): Promise<StateDoc>;
  getGuildState(guildId: string): Promise<GuildState>;
  setActiveInstance(guildId: string, instanceId: string): Promise<GuildState>;
  setOnline(guildId: string, info: InstancePresenceInput): Promise<GuildState>;
  sendPing(targetInstanceId?: string): Promise<string>;

  /**
   * Send a PING and wait for a PONG response from the targeted instance(s).
   * Returns the round-trip time and responder info.  Times-out after `timeoutMs`.
   */
  pingAndWait(targetInstanceId?: string, timeoutMs?: number): Promise<PongResult[]>;

  /**
   * Poll the state channel for any PING messages addressed to this instance
   * and reply with a PONG.  Called periodically by the heartbeat loop.
   */
  checkForPings(): Promise<void>;

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

  // Force-stop an instance (admin action from the dashboard)
  forceStopInstance(guildId: string, instanceId: string): Promise<GuildState>;

  // Remove all timed-out / stale instances across all guilds
  removeTimedOutInstances(): Promise<{ removed: number }>;

  // Derive a heartbeat health status for an instance
  getHeartbeatStatus(instance: InstanceInfo): HeartbeatStatus;

  // State persistence and recovery methods
  recoverFromBackup(): Promise<boolean>;
  refreshHeartbeats(): Promise<void>;
  shutdown(): Promise<void>;
  getInstanceId(): string;
}
