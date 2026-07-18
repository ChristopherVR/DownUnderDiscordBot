import { type Client, type Collection, TextChannel, Message } from 'discord.js';
import { randomUUID } from 'crypto';
import { deflateSync, inflateSync } from 'zlib';
import { hostname } from 'os';
import type { IStateService, PongResult } from '../IStateService';
import type { GuildState, StateDoc, InstanceInfo, HeartbeatStatus } from '../schema';
import type { WebSocketManager } from '../../helpers/websocket';

const HEADER = 'STATE_JSON v1';
const COMPRESSED_HEADER = 'STATE_JSON_COMPRESSED v1';
const MAX_MESSAGE_LENGTH = 1900;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_TIMEOUT = 90000; // 90 seconds (3 missed heartbeats)
const STALE_INSTANCE_REMOVAL = 7200000; // 2 hours — hard-remove instances with no heartbeat
const STATE_BACKUP_INTERVAL = 300000; // 5 minutes
const CAS_MAX_RETRIES = 3;
const CAS_RETRY_BASE_MS = 100;
const PIN_CLEANUP_INTERVAL = 10; // clean up pins every N updates
// getState() does two real Discord REST calls (fetchPinned + fetch recent 50).
// Short-TTL read cache so a burst of reads (e.g. a dashboard request that
// calls getState() several times) doesn't hammer the channel and trip
// Discord's rate limiter — the cause of the compounding multi-minute
// dashboard load times seen in practice.
const STATE_READ_CACHE_TTL_MS = 3000;
// Ceiling on a single-flight operation. Discord rate-limit backoffs (or any
// transient REST hang) must never be allowed to wedge the in-flight lock
// forever — that would permanently lock out every subsequent caller, not
// just the one that got rate-limited, for the remaining life of the process.
const SINGLE_FLIGHT_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// Ping / Pong protocol markers
const PING_PREFIX = '[STATE] PING';
const PONG_PREFIX = '[STATE] PONG';
const PING_MAX_AGE_MS = 60_000; // Ignore PINGs older than 60 seconds
const DEFAULT_PING_TIMEOUT_MS = 10_000; // Default timeout waiting for PONG

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
  private updateCounter = 0;
  private stateReadCache: { doc: StateDoc; fetchedAt: number } | null = null;
  private stateReadInFlight: Promise<StateDoc> | null = null;
  private removeTimedOutInFlight: Promise<{ removed: number }> | null = null;

  /** Nonces of PINGs this instance has already responded to (avoids duplicate PONGs). */
  private answeredPingNonces = new Set<string>();

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
              const { extra: _, ...rest } = instance;
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
      const recent = (await ch.messages.fetch({ limit: 50 })) as unknown as Collection<string, Message<true>>;
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

    for (let attempt = 0; attempt < CAS_MAX_RETRIES; attempt++) {
      const { msg, doc } = await this.getOrCreateStateMessage();

      if (!msg) {
        throw new Error('Missing state message handle');
      }

      const before = doc.docVersion;

      await mutator(doc);

      doc.docVersion = before + 1;

      doc.updatedAt = Date.now();

      await msg.edit(this.toContent(doc));

      // Verify the write landed (optimistic concurrency check)
      try {
        const refetched = await msg.fetch(true);
        const verified = this.parse(refetched.content);
        if (verified && verified.docVersion === doc.docVersion) {
          // CAS succeeded — periodic pin cleanup
          this.updateCounter++;
          if (this.updateCounter % PIN_CLEANUP_INTERVAL === 0) {
            this.cleanupStalePins(msg.id).catch(() => {});
          }
          // Keep the read cache in sync so callers see this write immediately
          // instead of waiting out the read-cache TTL.
          this.stateReadCache = { doc, fetchedAt: Date.now() };
          return doc;
        }
      } catch {
        // Refetch failed — treat as conflict and retry
      }

      // Conflict detected — wait with jitter then retry
      const jitter = CAS_RETRY_BASE_MS + Math.random() * CAS_RETRY_BASE_MS * 2;
      await new Promise((r) => setTimeout(r, jitter));
    }

    throw new Error('State update failed after max CAS retries (concurrent conflict)');
  }

  /**
   * Clean up old pinned state messages (called periodically, not on every update)
   */
  private async cleanupStalePins(currentMsgId: string): Promise<void> {
    try {
      const ch = await this.getChannel();
      const pins = await ch.messages.fetchPinned();
      const others = pins.filter((p) => p.id !== currentMsgId && this.parse(p.content));

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
  }

  async getState(): Promise<StateDoc> {
    if (this.useMemoryStorage) {
      return this.memoryState;
    }
    if (this.stateReadCache && Date.now() - this.stateReadCache.fetchedAt < STATE_READ_CACHE_TTL_MS) {
      return this.stateReadCache.doc;
    }
    // Single-flight the cold-cache fetch too — concurrent callers (e.g. a
    // burst of overlapping dashboard requests) share one read instead of
    // each independently re-fetching the same channel messages.
    if (this.stateReadInFlight) {
      return this.stateReadInFlight;
    }

    const rawFetch = this.getOrCreateStateMessage().then(({ doc }) => {
      this.stateReadCache = { doc, fetchedAt: Date.now() };
      return doc;
    });

    // Bound by a timeout, not the raw fetch — a genuinely hung/rate-limited
    // Discord call must free the lock for future callers rather than
    // wedging every subsequent getState() for the rest of the process.
    const bounded = withTimeout(rawFetch, SINGLE_FLIGHT_TIMEOUT_MS, 'ChannelStateService.getState').finally(() => {
      this.stateReadInFlight = null;
    });
    this.stateReadInFlight = bounded;
    return bounded;
  }

  async getGuildState(guildId: string): Promise<GuildState> {
    if (this.useMemoryStorage) {
      const doc = this.memoryState;
      return doc.guilds[guildId] ?? { guildId, activeInstanceId: null, instances: {} };
    }
    const doc = await this.getState();
    return doc.guilds[guildId] ?? { guildId, activeInstanceId: null, instances: {} };
  }

  async setActiveInstance(guildId: string, instanceId: string): Promise<GuildState> {
    const fallback: GuildState = { guildId, activeInstanceId: null, instances: {} };
    let out: GuildState = fallback;
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
    info: Omit<InstanceInfo, 'online' | 'lastHeartbeat' | 'isActive'> & {
      online: boolean;
      lastHeartbeat?: number;
      isActive?: boolean;
    },
  ): Promise<GuildState> {
    const fallback: GuildState = { guildId, activeInstanceId: null, instances: {} };
    let out: GuildState = fallback;
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
      // Clear forceStopped when an instance sends a heartbeat (it restarted)
      if (info.online && rec.forceStopped) {
        rec.forceStopped = false;
      }

      // Hostname deduplication: if this instance is coming online with a
      // hostname, remove any OTHER instances with the same hostname that
      // are offline or have timed-out heartbeats (stale leftovers from
      // previous process restarts).
      if (info.online && rec.hostname) {
        const hn = rec.hostname;
        const now = Date.now();
        for (const [otherId, other] of Object.entries(g.instances)) {
          if (otherId === info.instanceId) continue;
          if (other.hostname !== hn) continue;
          // Remove if the other instance is offline or its heartbeat is stale
          if (!other.online || now - other.lastHeartbeat > HEARTBEAT_TIMEOUT) {
            delete g.instances[otherId];
            if (g.activeInstanceId === otherId) {
              g.activeInstanceId = null;
            }
          }
        }
      }

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
    await ch.send(`${PING_PREFIX} ${nonce}${targetInstanceId ? ` ${targetInstanceId}` : ''}`);
    return nonce;
  }

  /**
   * Send a PING and wait for PONG response(s) from the targeted instance(s).
   * Resolves with an array of PongResults (one per responding instance).
   * Times out after `timeoutMs` (default 10 s).
   */
  async pingAndWait(targetInstanceId?: string, timeoutMs = DEFAULT_PING_TIMEOUT_MS): Promise<PongResult[]> {
    if (this.useMemoryStorage) {
      // In memory-only mode we are the only instance, so just echo back immediately.
      return [{ nonce: 'memory', responderId: this.instanceId, rttMs: 0 }];
    }

    const ch = await this.getChannel();
    const nonce = randomUUID();
    const sentAt = Date.now();

    // Send the PING
    await ch.send(`${PING_PREFIX} ${nonce}${targetInstanceId ? ` ${targetInstanceId}` : ''}`);

    // Poll the channel for matching PONGs until timeout
    const results: PongResult[] = [];
    const deadline = sentAt + timeoutMs;

    while (Date.now() < deadline) {
      // Short sleep between polls
      await new Promise((r) => setTimeout(r, 500));

      try {
        const recent = (await ch.messages.fetch({ limit: 30 })) as unknown as Collection<string, Message<true>>;
        for (const [, msg] of recent) {
          if (!msg.content.startsWith(PONG_PREFIX)) continue;

          // Format: [STATE] PONG <nonce> <responderId>
          const parts = msg.content.split(' ');
          const pongNonce = parts[2];
          const responderId = parts[3];
          if (pongNonce !== nonce || !responderId) continue;
          if (results.some((r) => r.responderId === responderId)) continue;

          const msgTimestamp = msg.editedTimestamp ?? msg.createdTimestamp;
          results.push({
            nonce,
            responderId,
            rttMs: msgTimestamp - sentAt,
          });

          // If targeting a specific instance and we got its response, return early
          if (targetInstanceId && responderId === targetInstanceId) {
            return results;
          }
        }
      } catch {
        // Channel fetch failed, retry on next loop
      }
    }

    return results;
  }

  /**
   * Poll the state channel for PING messages addressed to this instance
   * and reply with a PONG.  Called periodically by the heartbeat loop.
   */
  async checkForPings(): Promise<void> {
    if (this.useMemoryStorage) return;

    try {
      const ch = await this.getChannel();
      const recent = (await ch.messages.fetch({ limit: 30 })) as unknown as Collection<string, Message<true>>;
      const now = Date.now();

      for (const [, msg] of recent) {
        if (!msg.content.startsWith(PING_PREFIX)) continue;

        const msgAge = now - msg.createdTimestamp;
        if (msgAge > PING_MAX_AGE_MS) continue; // Too old, skip

        // Format: [STATE] PING <nonce> [targetInstanceId]
        const parts = msg.content.split(' ');
        const nonce = parts[2];
        const target = parts[3]; // optional

        if (!nonce) continue;
        if (this.answeredPingNonces.has(nonce)) continue;

        // If target is specified and it's not us, skip
        if (target && target !== this.instanceId) continue;

        // Respond with PONG
        this.answeredPingNonces.add(nonce);
        await ch.send(`${PONG_PREFIX} ${nonce} ${this.instanceId}`);

        // Prune old nonces (keep set from growing unbounded)
        if (this.answeredPingNonces.size > 200) {
          const iter = this.answeredPingNonces.values();
          for (let i = 0; i < 100; i++) iter.next();
          // Remove oldest half
          const remaining = new Set<string>();
          for (const v of iter) remaining.add(v);
          this.answeredPingNonces.clear();
          for (const v of remaining) this.answeredPingNonces.add(v);
        }
      }
    } catch (error) {
      console.warn('checkForPings error:', error);
    }
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
        // Also check for PING messages addressed to this instance
        await this.checkForPings();
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
        // Omit isActive so the heartbeat preserves whatever active state is currently stored.
        // Setting isActive here would clear the active instance on every heartbeat cycle.
        await this.setOnline(guildId, {
          instanceId: this.instanceId,
          online: true,
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
   * Clean up instances that haven't sent heartbeats recently.
   *
   * Two-tier strategy:
   *  1. After HEARTBEAT_TIMEOUT (90 s / 3 missed beats): mark the instance **offline**
   *     and revoke its active status so another instance can take over.
   *  2. After STALE_INSTANCE_REMOVAL (24 h): hard-delete the instance record from state
   *     to prevent unbounded growth of abandoned entries.
   */
  private async cleanupStaleInstances(): Promise<void> {
    const now = Date.now();

    // Pre-check: read current state and determine if any work is needed
    const currentState = await this.getState();
    let needsWork = false;
    for (const guild of Object.values(currentState.guilds)) {
      // Check for stale heartbeats
      for (const instance of Object.values(guild.instances)) {
        const age = now - instance.lastHeartbeat;
        if ((instance.online && age > HEARTBEAT_TIMEOUT) || age > STALE_INSTANCE_REMOVAL) {
          needsWork = true;
          break;
        }
      }
      if (needsWork) break;

      // Check for hostname duplicates that can be cleaned up
      const hostnameMap = new Map<string, number>();
      for (const inst of Object.values(guild.instances)) {
        if (inst.hostname) hostnameMap.set(inst.hostname, (hostnameMap.get(inst.hostname) ?? 0) + 1);
      }
      for (const count of hostnameMap.values()) {
        if (count > 1) {
          needsWork = true;
          break;
        }
      }
      if (needsWork) break;
    }

    if (!needsWork) return;

    let markedOffline = false;
    let removed = false;
    await this.update(async (doc) => {
      for (const guildId of Object.keys(doc.guilds)) {
        const guild = doc.guilds[guildId];
        const instancesToRemove: string[] = [];

        for (const [instanceId, instance] of Object.entries(guild.instances)) {
          const age = now - instance.lastHeartbeat;

          // Tier 2: hard-remove instances silent for over 24 hours
          if (age > STALE_INSTANCE_REMOVAL) {
            instancesToRemove.push(instanceId);
            removed = true;
            continue;
          }

          // Tier 1: mark as offline after 90 s of missed heartbeats
          if (instance.online && age > HEARTBEAT_TIMEOUT) {
            instance.online = false;
            markedOffline = true;

            // Revoke active status so another instance can take over
            if (guild.activeInstanceId === instanceId) {
              guild.activeInstanceId = null;
            }
            instance.isActive = false;

            // Broadcast the offline transition via WebSocket
            if (this.wsManager) {
              this.wsManager.broadcastBotStatus(guildId, instanceId, 'offline');
            }
          }
        }

        // Remove hard-stale instances
        for (const instanceId of instancesToRemove) {
          delete guild.instances[instanceId];

          // If the active instance was removed, clear it
          if (guild.activeInstanceId === instanceId) {
            guild.activeInstanceId = null;
          }
        }

        // Hostname deduplication pass: when multiple instances share the
        // same hostname (caused by bot restarts), keep only the one with
        // the most recent heartbeat and remove the rest.
        const byHostname = new Map<string, Array<[string, InstanceInfo]>>();
        for (const [instanceId, instance] of Object.entries(guild.instances)) {
          if (!instance.hostname) continue;
          const list = byHostname.get(instance.hostname) ?? [];
          list.push([instanceId, instance]);
          byHostname.set(instance.hostname, list);
        }

        for (const [, entries] of byHostname) {
          if (entries.length <= 1) continue;
          // Sort by freshest heartbeat first, then prefer online over offline
          entries.sort((a, b) => {
            if (a[1].online !== b[1].online) return a[1].online ? -1 : 1;
            return b[1].lastHeartbeat - a[1].lastHeartbeat;
          });
          // Keep the first (best) instance, remove the rest
          for (let i = 1; i < entries.length; i++) {
            const [dupeId] = entries[i];
            delete guild.instances[dupeId];
            if (guild.activeInstanceId === dupeId) {
              guild.activeInstanceId = null;
            }
            removed = true;
          }
        }

        // If no instances remain, remove the guild entry
        if (Object.keys(guild.instances).length === 0) {
          delete doc.guilds[guildId];
        }
      }
    });

    if (markedOffline) {
      console.log('Marked stale bot instances as offline (heartbeat timeout)');
    }
    if (removed) {
      console.log('Removed duplicate/stale bot instances');
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
    const fallback: GuildState = { guildId, activeInstanceId: null, instances: {} };
    let out: GuildState = fallback;
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
      out = g || fallback;
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
   * Derive the heartbeat health status for a given instance.
   *
   * Tiers (based on time since lastHeartbeat):
   *  - `stopped`  — forcefully stopped via the dashboard
   *  - `healthy`  — within one heartbeat interval (30 s)
   *  - `missed`   — 1 heartbeat missed (30–60 s)
   *  - `late`     — 2+ heartbeats missed but below timeout (60–90 s)
   *  - `timeout`  — past the heartbeat timeout (90 s – 2 h)
   *  - `stale`    — past the stale removal threshold (> 2 h)
   */
  getHeartbeatStatus(instance: InstanceInfo): HeartbeatStatus {
    if (instance.forceStopped) return 'stopped';
    const age = Date.now() - instance.lastHeartbeat;
    if (age > STALE_INSTANCE_REMOVAL) return 'stale';
    if (age > HEARTBEAT_TIMEOUT) return 'timeout';
    if (age > HEARTBEAT_INTERVAL * 2) return 'late';
    if (age > HEARTBEAT_INTERVAL) return 'missed';
    return 'healthy';
  }

  /**
   * Forcefully mark an instance as stopped (admin action from the dashboard).
   * Sets `online = false`, `isActive = false`, `forceStopped = true`,
   * clears `activeInstanceId` if this was the active instance,
   * and broadcasts the status change via WebSocket.
   */
  async forceStopInstance(guildId: string, instanceId: string): Promise<GuildState> {
    const fallback: GuildState = { guildId, activeInstanceId: null, instances: {} };
    let out: GuildState = fallback;

    await this.update((doc) => {
      const g = doc.guilds[guildId];
      if (!g || !g.instances[instanceId]) {
        out = g || fallback;
        return;
      }

      const inst = g.instances[instanceId];
      inst.online = false;
      inst.isActive = false;
      inst.forceStopped = true;

      if (g.activeInstanceId === instanceId) {
        g.activeInstanceId = null;
      }

      out = g;
    });

    // Broadcast the forced-stop via WebSocket
    if (this.wsManager) {
      this.wsManager.broadcastBotStatus(guildId, instanceId, 'offline');
    }

    return out;
  }

  /**
   * Remove all timed-out and stale instances across every guild.
   * This is intended for explicit admin cleanup from the dashboard.
   * It removes any instance whose heartbeat exceeds HEARTBEAT_TIMEOUT
   * (except the current running instance) and performs hostname dedup.
   *
   * Single-flight: this is called on every dashboard load, so concurrent
   * callers (multiple open tabs/windows, or a burst of polls) share one
   * in-progress run instead of each racing their own CAS write against the
   * same channel message — that pile-up was the cause of dashboard loads
   * occasionally taking a minute or more under concurrent load.
   */
  async removeTimedOutInstances(): Promise<{ removed: number }> {
    if (this.removeTimedOutInFlight) {
      return this.removeTimedOutInFlight;
    }
    // Bound by a timeout, not the raw call — see getState() for why: a
    // hung/rate-limited Discord call must free the lock rather than
    // wedging every subsequent dashboard load for the rest of the process.
    const bounded = withTimeout(
      this.doRemoveTimedOutInstances(),
      SINGLE_FLIGHT_TIMEOUT_MS,
      'ChannelStateService.removeTimedOutInstances',
    ).finally(() => {
      this.removeTimedOutInFlight = null;
    });
    this.removeTimedOutInFlight = bounded;
    return bounded;
  }

  private async doRemoveTimedOutInstances(): Promise<{ removed: number }> {
    const now = Date.now();
    let totalRemoved = 0;

    // Pre-check with the (cheap, cached) read path first — skip the CAS
    // write entirely when there's nothing to remove. This endpoint is called
    // on every dashboard load, so doing an unconditional read+edit+refetch
    // cycle here on every call was a major contributor to dashboard latency.
    const currentState = await this.getState();
    let needsWork = false;
    for (const guild of Object.values(currentState.guilds)) {
      for (const [instanceId, instance] of Object.entries(guild.instances)) {
        if (instanceId === this.instanceId) continue;
        if (now - instance.lastHeartbeat > HEARTBEAT_TIMEOUT) {
          needsWork = true;
          break;
        }
      }
      if (needsWork) break;

      const hostnameCounts = new Map<string, number>();
      for (const inst of Object.values(guild.instances)) {
        if (inst.hostname) hostnameCounts.set(inst.hostname, (hostnameCounts.get(inst.hostname) ?? 0) + 1);
      }
      for (const count of hostnameCounts.values()) {
        if (count > 1) {
          needsWork = true;
          break;
        }
      }
      if (needsWork) break;
    }

    if (!needsWork) {
      return { removed: 0 };
    }

    await this.update((doc) => {
      for (const guildId of Object.keys(doc.guilds)) {
        const guild = doc.guilds[guildId];
        const toRemove: string[] = [];

        for (const [instanceId, instance] of Object.entries(guild.instances)) {
          // Never remove the currently running instance
          if (instanceId === this.instanceId) continue;

          const age = now - instance.lastHeartbeat;
          // Remove any instance past heartbeat timeout (offline / unreachable)
          if (age > HEARTBEAT_TIMEOUT) {
            toRemove.push(instanceId);
          }
        }

        for (const id of toRemove) {
          delete guild.instances[id];
          if (guild.activeInstanceId === id) {
            guild.activeInstanceId = null;
          }
          totalRemoved++;
        }

        // Hostname deduplication — keep only the freshest per hostname
        const byHostname = new Map<string, Array<[string, InstanceInfo]>>();
        for (const [instanceId, instance] of Object.entries(guild.instances)) {
          if (!instance.hostname) continue;
          const list = byHostname.get(instance.hostname) ?? [];
          list.push([instanceId, instance]);
          byHostname.set(instance.hostname, list);
        }

        for (const [, entries] of byHostname) {
          if (entries.length <= 1) continue;
          entries.sort((a, b) => {
            if (a[1].online !== b[1].online) return a[1].online ? -1 : 1;
            return b[1].lastHeartbeat - a[1].lastHeartbeat;
          });
          for (let i = 1; i < entries.length; i++) {
            const [dupeId] = entries[i];
            delete guild.instances[dupeId];
            if (guild.activeInstanceId === dupeId) {
              guild.activeInstanceId = null;
            }
            totalRemoved++;
          }
        }

        // Clean up empty guild entries
        if (Object.keys(guild.instances).length === 0) {
          delete doc.guilds[guildId];
        }
      }
    });

    if (totalRemoved > 0) {
      console.log(`Removed ${totalRemoved} timed-out/stale bot instances`);
    }

    return { removed: totalRemoved };
  }

  /**
   * Get this service instance's ID
   */
  getInstanceId(): string {
    return this.instanceId;
  }
}
