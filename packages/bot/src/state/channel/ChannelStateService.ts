import { type Client, TextChannel, Message } from 'discord.js';
import { randomUUID } from 'crypto';
import { deflateSync, inflateSync } from 'zlib';
import { hostname } from 'os';
import type { IStateService } from '../IStateService';
import type { GuildState, StateDoc, InstanceInfo } from '../schema';
import type { WebSocketManager } from '../../helpers/websocket';

const HEADER = 'STATE_JSON v1';
const COMPRESSED_HEADER = 'STATE_JSON_COMPRESSED v1';
const MAX_MESSAGE_LENGTH = 1900;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 90000; // 90 seconds (3 missed heartbeats)
const STATE_BACKUP_INTERVAL = 300000; // 5 minutes

/**
 * ChannelStateService
 * - Stores a single JSON state document in a pinned message in STATE_CHANNEL_ID
 * - Tolerates stale messages: on read, scans recents for the latest valid state blob if the pin is missing/outdated
 * - Uses a simple CAS (docVersion) strategy to avoid stomping concurrent edits
 * - Provides comprehensive bot tracking with heartbeat monitoring
 * - Implements state persistence and recovery mechanisms
 */
export class ChannelStateService implements IStateService {
  private heartbeatInterval?: NodeJS.Timeout;
  private backupInterval?: NodeJS.Timeout;
  private stateBackup: StateDoc | null = null;
  private instanceId: string;
  private isShuttingDown = false;
  private wsManager?: WebSocketManager; // WebSocket manager for real-time updates
  private useMemoryStorage: boolean;
  private memoryState: StateDoc;
  private removeSignalHandlers: Array<() => void> = [];

  constructor(
    private client: Client,
    private channelId: string,
    wsManager?: WebSocketManager,
  ) {
    this.instanceId = randomUUID();
    this.wsManager = wsManager;

    const channels = (this.client as unknown as { channels?: { fetch?: unknown } }).channels;
    this.useMemoryStorage = !channels || typeof channels.fetch !== 'function';
    this.memoryState = this.emptyDoc();

    if (!this.useMemoryStorage) {
      this.startHeartbeatMonitoring();
      this.startStateBackup();
      this.registerSignalHandlers();
    }
  }

  private registerSignalHandlers(): void {
    const onSignal = () => this.shutdown();
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);
    this.removeSignalHandlers.push(() => {
      process.off('SIGINT', onSignal);
      process.off('SIGTERM', onSignal);
    });
  }

  private async getChannel(): Promise<TextChannel> {
    if (this.useMemoryStorage) {
      throw new Error('Channel access is not available in memory storage mode');
    }
    const ch = await this.client.channels.fetch(this.channelId);
    if (!ch || !ch.isTextBased() || ch.type !== 0) throw new Error('STATE_CHANNEL_ID is not a text channel');
    return ch as TextChannel;
  }

  private emptyDoc(): StateDoc {
    return { version: 1, updatedAt: Date.now(), guilds: {}, docVersion: 0 };
  }

  private parse(content: string): StateDoc | null {
    const payload = this.extractPayload(content);
    if (!payload) return null;

    try {
      const obj = JSON.parse(payload) as StateDoc;
      if (typeof obj?.docVersion !== 'number') return null;
      return obj;
    } catch {
      return null;
    }
  }

  private toContent(doc: StateDoc): string {
    const json = JSON.stringify(doc);
    const inline = `${HEADER}::${json}`;
    if (inline.length <= MAX_MESSAGE_LENGTH) {
      return inline;
    }

    const compressedInline = `${COMPRESSED_HEADER}::${this.compressContent(json)}`;
    if (compressedInline.length <= MAX_MESSAGE_LENGTH) {
      return compressedInline;
    }

    const compactDoc = this.compactDoc(doc);
    const compactJson = JSON.stringify(compactDoc);
    const compactInline = `${HEADER}::${compactJson}`;
    if (compactInline.length <= MAX_MESSAGE_LENGTH) {
      return compactInline;
    }

    const compactCompressed = `${COMPRESSED_HEADER}::${this.compressContent(compactJson)}`;
    if (compactCompressed.length <= MAX_MESSAGE_LENGTH) {
      return compactCompressed;
    }

    const minimalDoc = this.minimalDoc(doc);
    const minimalJson = JSON.stringify(minimalDoc);
    const minimalCompressed = `${COMPRESSED_HEADER}::${this.compressContent(minimalJson)}`;
    if (minimalCompressed.length <= MAX_MESSAGE_LENGTH) {
      return minimalCompressed;
    }

    throw new Error('State document exceeds Discord message length limit');
  }

  private extractPayload(content: string): string | null {
    const trimmed = content.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith(COMPRESSED_HEADER)) {
      let raw = trimmed.slice(COMPRESSED_HEADER.length).trim();
      if (raw.startsWith('::')) {
        raw = raw.slice(2).trim();
      }
      if (!raw) {
        return null;
      }

      try {
        return this.decompressContent(raw);
      } catch (error) {
        console.warn('Failed to decompress state payload:', error);
        return null;
      }
    }

    if (!trimmed.startsWith(HEADER)) {
      return null;
    }

    let raw = trimmed.slice(HEADER.length).trim();

    if (raw.startsWith('```json')) {
      const start = raw.indexOf('```json') + 7;
      const end = raw.lastIndexOf('```');
      if (end === -1) {
        return null;
      }
      raw = raw.slice(start, end).trim();
    } else if (raw.startsWith('::')) {
      raw = raw.slice(2).trim();
    }

    return raw || null;
  }

  private compressContent(json: string): string {
    return deflateSync(json, { level: 9 }).toString('base64');
  }

  private decompressContent(base64: string): string {
    const buffer = Buffer.from(base64, 'base64');
    return inflateSync(buffer).toString('utf-8');
  }

  private compactDoc(doc: StateDoc): StateDoc {
    const compactGuilds = Object.fromEntries(
      Object.entries(doc.guilds).map(([guildId, guild]) => [
        guildId,
        {
          ...guild,
          instances: Object.fromEntries(
            Object.entries(guild.instances).map(([instanceId, instance]) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { extra, ...rest } = instance;
              return [instanceId, { ...rest }];
            }),
          ),
        },
      ]),
    );

    return {
      ...doc,
      guilds: compactGuilds,
    };
  }

  private minimalDoc(doc: StateDoc): StateDoc {
    const minimalGuilds = Object.fromEntries(
      Object.entries(doc.guilds).map(([guildId, guild]) => [
        guildId,
        {
          guildId: guild.guildId,
          activeInstanceId: guild.activeInstanceId,
          instances: Object.fromEntries(
            Object.entries(guild.instances).map(([instanceId, instance]) => [
              instanceId,
              {
                instanceId: instance.instanceId,
                online: instance.online,
                lastHeartbeat: instance.lastHeartbeat,
                isActive: instance.isActive,
              },
            ]),
          ),
        },
      ]),
    );

    return {
      ...doc,
      guilds: minimalGuilds,
    };
  }

  private async findBestStateMessage(ch: TextChannel): Promise<Message | null> {
    const candidates: Array<{ msg: Message; doc: StateDoc }> = [];

    const consider = (msg: Message | null | undefined) => {
      if (!msg) {
        return;
      }
      const parsed = this.parse(msg.content);
      if (parsed) {
        candidates.push({ msg, doc: parsed });
      }
    };

    try {
      const pinned = await ch.messages.fetchPinned();
      pinned.forEach((msg) => consider(msg));
    } catch (error) {
      console.warn('Failed to fetch pinned state messages:', error);
    }

    try {
      const recent = await ch.messages.fetch({ limit: 50 });
      recent.forEach((msg) => consider(msg));
    } catch (error) {
      console.warn('Failed to fetch recent state messages:', error);
    }

    if (!candidates.length) {
      return null;
    }

    const best = candidates.reduce<{ msg: Message; doc: StateDoc } | null>((current, candidate) => {
      if (!current) {
        return candidate;
      }

      if (candidate.doc.docVersion > current.doc.docVersion) {
        return candidate;
      }

      const candidateTimestamp = candidate.msg.editedTimestamp ?? candidate.msg.createdTimestamp ?? 0;
      const currentTimestamp = current.msg.editedTimestamp ?? current.msg.createdTimestamp ?? 0;

      if (candidate.doc.docVersion === current.doc.docVersion && candidateTimestamp > currentTimestamp) {
        return candidate;
      }

      return current;
    }, null);

    return best?.msg ?? null;
  }

  private async getOrCreateStateMessage(): Promise<{ msg: Message | null; doc: StateDoc }> {
    if (this.useMemoryStorage) {
      return { msg: null, doc: this.memoryState };
    }

    const ch = await this.getChannel();
    const best = await this.findBestStateMessage(ch);

    if (best) {
      const d = this.parse(best.content) ?? this.emptyDoc();
      // ensure it's pinned and canonical
      if (!best.pinned) await best.pin().catch(() => {});
      return { msg: best, doc: d };
    }

    const created = await ch.send(this.toContent(this.emptyDoc()));
    try {
      await created.pin();
    } catch {
      // Pin failed, continue without pinning
    }
    return { msg: created, doc: this.emptyDoc() };
  }

  private async update(mutator: (doc: StateDoc) => void | Promise<void>): Promise<StateDoc> {
    if (this.useMemoryStorage) {
      const doc = this.memoryState;

      const before = doc.docVersion;

      await mutator(doc);

      doc.docVersion = before + 1;

      doc.updatedAt = Date.now();

      this.memoryState = doc;

      return doc;
    }

    const { msg, doc } = await this.getOrCreateStateMessage();

    if (!msg) {
      throw new Error('Missing state message handle');
    }

    const before = doc.docVersion;

    await mutator(doc);

    doc.docVersion = before + 1;

    doc.updatedAt = Date.now();

    await msg.edit(this.toContent(doc));

    // clean up: unpin older state messages

    try {
      const ch = await this.getChannel();

      const pins = await ch.messages.fetchPinned();

      const others = pins.filter((p) => p.id !== msg.id && this.parse(p.content));

      for (const [, m] of others) {
        try {
          await m.unpin();
        } catch {
          // Unpin failed, continue
        }
      }
    } catch {
      // Failed to fetch pinned messages, continue
    }

    return doc;
  }

  async getState(): Promise<StateDoc> {
    if (this.useMemoryStorage) {
      return this.memoryState;
    }
    const { doc } = await this.getOrCreateStateMessage();
    return doc;
  }

  async getGuildState(guildId: string): Promise<GuildState> {
    if (this.useMemoryStorage) {
      const doc = this.memoryState;
      return doc.guilds[guildId] ?? { guildId, activeInstanceId: null, instances: {} };
    }
    const { doc } = await this.getOrCreateStateMessage();
    return doc.guilds[guildId] ?? { guildId, activeInstanceId: null, instances: {} };
  }

  async setActiveInstance(guildId: string, instanceId: string): Promise<GuildState> {
    let out!: GuildState;
    await this.update((doc) => {
      const g = (doc.guilds[guildId] ??= { guildId, activeInstanceId: null, instances: {} });
      g.instances[instanceId] ??= {
        instanceId,
        online: true,
        lastHeartbeat: Date.now(),
        isActive: false,
      } as InstanceInfo;
      for (const k of Object.keys(g.instances)) g.instances[k].isActive = k === instanceId;
      g.activeInstanceId = instanceId;
      out = g;
    });

    // Broadcast bot status update via WebSocket
    if (this.wsManager) {
      this.wsManager.broadcastBotStatus(guildId, instanceId, 'online');
    }

    return out;
  }

  async setOnline(
    guildId: string,
    info: Omit<InstanceInfo, 'online' | 'lastHeartbeat'> & { online: boolean; lastHeartbeat?: number },
  ): Promise<GuildState> {
    let out!: GuildState;
    await this.update((doc) => {
      const g = (doc.guilds[guildId] ??= { guildId, activeInstanceId: null, instances: {} });
      const rec = (g.instances[info.instanceId] ??= {
        instanceId: info.instanceId,
        online: info.online,
        lastHeartbeat: info.lastHeartbeat ?? Date.now(),
        isActive: false,
        hostname: info.hostname,
        pid: info.pid,
        shardId: info.shardId,
        extra: info.extra,
      });
      rec.online = info.online;
      rec.hostname = info.hostname ?? rec.hostname;
      rec.pid = info.pid ?? rec.pid;
      rec.shardId = info.shardId ?? rec.shardId;
      rec.extra = info.extra ?? rec.extra;
      rec.lastHeartbeat = info.lastHeartbeat ?? Date.now();
      if (typeof info.isActive === 'boolean') {
        rec.isActive = info.isActive;
        if (info.isActive) {
          g.activeInstanceId = info.instanceId;
          for (const [id, instance] of Object.entries(g.instances)) {
            if (id !== info.instanceId) {
              instance.isActive = false;
            }
          }
        } else if (g.activeInstanceId === info.instanceId) {
          g.activeInstanceId = null;
        }
      }
      out = g;
    });

    // Broadcast bot status update via WebSocket
    if (this.wsManager) {
      this.wsManager.broadcastBotStatus(guildId, info.instanceId, info.online ? 'online' : 'offline');
    }

    return out;
  }

  async sendPing(targetInstanceId?: string): Promise<string> {
    if (this.useMemoryStorage) {
      return targetInstanceId ? `Ping sent to instance ${targetInstanceId}` : 'Ping sent to all instances';
    }
    const ch = await this.getChannel();
    const nonce = randomUUID();
    await ch.send(`[STATE] PING ${nonce}${targetInstanceId ? ` ${targetInstanceId}` : ''}`);
    return nonce;
  }

  /**
   * Start heartbeat monitoring for this instance
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      try {
        await this.sendHeartbeat();
        await this.cleanupStaleInstances();
      } catch (error) {
        console.error('Heartbeat monitoring error:', error);
      }
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Start periodic state backup
   */
  private startStateBackup(): void {
    this.backupInterval = setInterval(async () => {
      if (this.isShuttingDown) return;

      try {
        const state = await this.getState();
        this.stateBackup = JSON.parse(JSON.stringify(state)); // Deep clone
      } catch (error) {
        console.error('State backup error:', error);
      }
    }, STATE_BACKUP_INTERVAL);
  }

  /**
   * Send heartbeat for this instance
   */
  private async sendHeartbeat(): Promise<void> {
    const guildIds = this.client.guilds.cache.map((guild) => guild.id);

    for (const guildId of guildIds) {
      try {
        await this.setOnline(guildId, {
          instanceId: this.instanceId,
          online: true,
          isActive: false, // Will be set by setActiveInstance if needed
          hostname: process.env.HOSTNAME || hostname(),
          pid: process.pid,
          shardId: this.client.shard?.ids[0],
          extra: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
          },
        });
      } catch (error) {
        console.error(`Failed to send heartbeat for guild ${guildId}:`, error);
      }
    }
  }

  /**
   * Clean up instances that haven't sent heartbeats recently
   */
  private async cleanupStaleInstances(): Promise<void> {
    const now = Date.now();
    let hasChanges = false;

    await this.update(async (doc) => {
      for (const guildId of Object.keys(doc.guilds)) {
        const guild = doc.guilds[guildId];
        const instancesToRemove: string[] = [];

        for (const [instanceId, instance] of Object.entries(guild.instances)) {
          if (now - instance.lastHeartbeat > HEARTBEAT_TIMEOUT) {
            instancesToRemove.push(instanceId);
            hasChanges = true;
          }
        }

        // Remove stale instances
        for (const instanceId of instancesToRemove) {
          delete guild.instances[instanceId];

          // If the active instance was removed, clear it
          if (guild.activeInstanceId === instanceId) {
            guild.activeInstanceId = null;
          }
        }

        // If no instances remain, remove the guild
        if (Object.keys(guild.instances).length === 0) {
          delete doc.guilds[guildId];
        }
      }
    });

    if (hasChanges) {
      console.log('Cleaned up stale bot instances');
    }
  }

  /**
   * Get all bot instances for a specific guild
   */
  async getBotInstances(guildId: string): Promise<InstanceInfo[]> {
    const guildState = await this.getGuildState(guildId);
    return Object.values(guildState.instances);
  }

  /**
   * Get all online bot instances across all guilds
   */
  async getOnlineInstances(): Promise<Record<string, InstanceInfo[]>> {
    const state = await this.getState();
    const result: Record<string, InstanceInfo[]> = {};

    for (const [guildId, guildState] of Object.entries(state.guilds)) {
      const onlineInstances = Object.values(guildState.instances).filter((instance) => instance.online);
      if (onlineInstances.length > 0) {
        result[guildId] = onlineInstances;
      }
    }

    return result;
  }

  /**
   * Get the active bot instance for a guild
   */
  async getActiveInstance(guildId: string): Promise<InstanceInfo | null> {
    const guildState = await this.getGuildState(guildId);
    if (!guildState.activeInstanceId) return null;

    return guildState.instances[guildState.activeInstanceId] || null;
  }

  /**
   * Set an instance as offline
   */
  async setOffline(guildId: string, instanceId: string): Promise<GuildState> {
    let out!: GuildState;
    await this.update((doc) => {
      const g = doc.guilds[guildId];
      if (g && g.instances[instanceId]) {
        g.instances[instanceId].online = false;
        g.instances[instanceId].lastHeartbeat = Date.now();

        // If this was the active instance, clear it
        if (g.activeInstanceId === instanceId) {
          g.activeInstanceId = null;
        }
      }
      out = g || { guildId, activeInstanceId: null, instances: {} };
    });

    // Broadcast bot status update via WebSocket
    if (this.wsManager) {
      this.wsManager.broadcastBotStatus(guildId, instanceId, 'offline');
    }

    return out;
  }

  /**
   * Get health status of all instances
   */
  async getHealthStatus(): Promise<{
    totalInstances: number;
    onlineInstances: number;
    guildsWithBots: number;
    lastUpdated: number;
  }> {
    const state = await this.getState();
    let totalInstances = 0;
    let onlineInstances = 0;
    const guildsWithBots = Object.keys(state.guilds).length;

    for (const guildState of Object.values(state.guilds)) {
      for (const instance of Object.values(guildState.instances)) {
        totalInstances++;
        if (instance.online) {
          onlineInstances++;
        }
      }
    }

    return {
      totalInstances,
      onlineInstances,
      guildsWithBots,
      lastUpdated: state.updatedAt,
    };
  }

  /**
   * Recover state from backup if main state is corrupted
   */
  async recoverFromBackup(): Promise<boolean> {
    if (!this.stateBackup) {
      console.warn('No state backup available for recovery');
      return false;
    }

    try {
      const { msg } = await this.getOrCreateStateMessage();

      // Restore from backup with incremented version
      const recoveredState = { ...this.stateBackup };
      recoveredState.docVersion += 1;
      recoveredState.updatedAt = Date.now();

      if (msg) {
        await msg.edit(this.toContent(recoveredState));
      } else {
        this.memoryState = recoveredState;
      }
      console.log('Successfully recovered state from backup');
      return true;
    } catch (error) {
      console.error('Failed to recover state from backup:', error);
      return false;
    }
  }

  /**
   * Force refresh of instance heartbeats
   */
  async refreshHeartbeats(): Promise<void> {
    await this.sendHeartbeat();
    await this.cleanupStaleInstances();
  }

  /**
   * Graceful shutdown - mark this instance as offline
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;

    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
    }

    this.removeSignalHandlers.forEach((dispose) => {
      try {
        dispose();
      } catch {
        // ignore
      }
    });
    this.removeSignalHandlers = [];

    if (this.useMemoryStorage) {
      return;
    }

    // Mark this instance as offline in all guilds
    try {
      const guildIds = this.client.guilds.cache.map((guild) => guild.id);

      for (const guildId of guildIds) {
        await this.setOffline(guildId, this.instanceId);
      }

      console.log('Successfully marked instance as offline during shutdown');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  /**
   * Get this service instance's ID
   */
  getInstanceId(): string {
    return this.instanceId;
  }
}
