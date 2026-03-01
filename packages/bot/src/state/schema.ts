/**
 * Derived heartbeat health indicator.
 * - `healthy`  — heartbeat received within the expected interval
 * - `missed`   — at least one heartbeat window missed (≥ 1 × interval)
 * - `late`     — multiple heartbeats missed but not yet timed-out
 * - `timeout`  — exceeded the hard timeout; instance marked offline
 * - `stale`    — no heartbeat for an extended period; pending removal
 * - `stopped`  — forcefully stopped via the dashboard
 */
export type HeartbeatStatus = 'healthy' | 'missed' | 'late' | 'timeout' | 'stale' | 'stopped';

export type InstanceInfo = {
  instanceId: string;
  online: boolean;
  lastHeartbeat: number;
  isActive: boolean;
  /** Set to `true` when an admin forcefully stops the instance via the dashboard. */
  forceStopped?: boolean;
  shardId?: number;
  hostname?: string;
  pid?: number;
  extra?: Record<string, unknown>;
};
export type GuildState = { guildId: string; activeInstanceId: string | null; instances: Record<string, InstanceInfo> };
export type StateDoc = { version: 1; updatedAt: number; guilds: Record<string, GuildState>; docVersion: number };
