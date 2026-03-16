import { EventEmitter } from 'node:events';
import type { IStateService, InstancePresenceInput } from './IStateService';
import type { GuildState, InstanceInfo } from './schema';

export interface StateCoordinatorOptions {
  service: IStateService;
  localInstanceId: string;
  defaultGuildIds?: string[];
}

export interface ActiveInstanceChange {
  guildId: string;
  previousInstanceId: string | null;
  currentInstanceId: string | null;
  reason?: string;
  actorId?: string;
  timestamp: number;
}

export interface GuildStateChangedEvent extends ActiveInstanceChange {
  state: GuildState;
}

export class InactiveInstanceError extends Error {
  public readonly guildId: string;
  public readonly activeInstanceId: string | null;
  public readonly localInstanceId: string;
  public readonly commandName?: string;

  constructor(params: {
    guildId: string;
    activeInstanceId: string | null;
    localInstanceId: string;
    commandName?: string;
  }) {
    const { guildId, activeInstanceId, localInstanceId, commandName } = params;
    const baseMessage = activeInstanceId
      ? `Instance ${localInstanceId} is not active for guild ${guildId}. Active instance: ${activeInstanceId}.`
      : `No active instance registered for guild ${guildId}.`;
    const suffix = commandName ? ` Command: ${commandName}.` : '';
    super(`${baseMessage}${suffix}`);
    this.name = 'InactiveInstanceError';
    this.guildId = guildId;
    this.activeInstanceId = activeInstanceId;
    this.localInstanceId = localInstanceId;
    this.commandName = commandName;
  }
}

export class StateCoordinator extends EventEmitter {
  private static singleton: StateCoordinator | null = null;

  public static initialize(options: StateCoordinatorOptions): StateCoordinator {
    if (!StateCoordinator.singleton) {
      StateCoordinator.singleton = new StateCoordinator(options);
    }
    return StateCoordinator.singleton;
  }

  public static get(): StateCoordinator {
    if (!StateCoordinator.singleton) {
      throw new Error('StateCoordinator has not been initialized');
    }
    return StateCoordinator.singleton;
  }

  public static hasInstance(): boolean {
    return StateCoordinator.singleton !== null;
  }

  private readonly service: IStateService;
  private readonly localInstanceId: string;
  private readonly guildCache = new Map<string, GuildState>();

  private constructor(options: StateCoordinatorOptions) {
    super();
    this.service = options.service;
    this.localInstanceId = options.localInstanceId;

    if (options.defaultGuildIds?.length) {
      for (const guildId of options.defaultGuildIds) {
        this.service
          .getGuildState(guildId)
          .then((state) => this.guildCache.set(guildId, state))
          .catch(() => {
            // Ignore failures during warm-up; guild state lazily fetched on demand
          });
      }
    }
  }

  public getService(): IStateService {
    return this.service;
  }

  public getLocalInstanceId(): string {
    return this.localInstanceId;
  }

  public async getGuildState(guildId: string): Promise<GuildState> {
    const cached = this.guildCache.get(guildId);
    if (cached) {
      return cached;
    }

    const state = await this.service.getGuildState(guildId);
    this.guildCache.set(guildId, state);
    return state;
  }

  public async refreshGuildState(guildId: string): Promise<GuildState> {
    const state = await this.service.getGuildState(guildId);
    this.guildCache.set(guildId, state);
    return state;
  }

  public async getAllGuildStates(): Promise<GuildState[]> {
    const doc = await this.service.getState();
    const states = Object.values(doc.guilds);
    for (const state of states) {
      this.guildCache.set(state.guildId, state);
    }
    return states;
  }

  public async getActiveInstanceId(guildId: string): Promise<string | null> {
    const state = await this.getGuildState(guildId);
    return state.activeInstanceId ?? null;
  }

  public async isLocalInstanceActive(guildId: string): Promise<boolean> {
    const active = await this.getActiveInstanceId(guildId);
    return active === null || active === this.localInstanceId;
  }

  public async ensureLocalIsActive(guildId: string, commandName?: string): Promise<void> {
    if (!guildId) {
      return;
    }
    // Always fetch fresh state for the race-critical active-instance check.
    // A stale cache could allow a non-active instance to process a command.
    const freshState = await this.refreshGuildState(guildId);
    const activeInstanceId = freshState.activeInstanceId ?? null;
    if (activeInstanceId && activeInstanceId !== this.localInstanceId) {
      throw new InactiveInstanceError({
        guildId,
        activeInstanceId,
        localInstanceId: this.localInstanceId,
        commandName,
      });
    }
  }

  public async setActiveInstance(
    guildId: string,
    instanceId: string,
    meta?: { reason?: string; actorId?: string },
  ): Promise<GuildState> {
    const before = await this.getActiveInstanceId(guildId);
    const updated = await this.service.setActiveInstance(guildId, instanceId);
    this.guildCache.set(guildId, updated);

    const after = updated.activeInstanceId ?? null;
    if (before !== after) {
      const event: ActiveInstanceChange = {
        guildId,
        previousInstanceId: before ?? null,
        currentInstanceId: after,
        reason: meta?.reason,
        actorId: meta?.actorId,
        timestamp: Date.now(),
      };
      this.emit(STATE_EVENTS.ACTIVE_CHANGED, event);
    }

    return updated;
  }

  public async updateInstancePresence(guildId: string, info: InstancePresenceInput): Promise<InstanceInfo> {
    const cachedState = this.guildCache.get(guildId);
    const existing = cachedState?.instances[info.instanceId];

    const payload: InstancePresenceInput = {
      instanceId: info.instanceId,
      online: info.online,
      hostname: info.hostname ?? existing?.hostname,
      pid: info.pid ?? existing?.pid,
      shardId: info.shardId ?? existing?.shardId,
      extra: info.extra ?? existing?.extra,
    };

    if (typeof info.isActive === 'boolean') {
      payload.isActive = info.isActive;
    }

    const before = cachedState?.activeInstanceId ?? null;
    const updatedGuild = await this.service.setOnline(guildId, payload);
    this.guildCache.set(guildId, updatedGuild);

    const after = updatedGuild.activeInstanceId ?? null;
    if (before !== after) {
      const event: ActiveInstanceChange = {
        guildId,
        previousInstanceId: before,
        currentInstanceId: after,
        timestamp: Date.now(),
      };
      this.emit(STATE_EVENTS.ACTIVE_CHANGED, event);
    }

    const guildEvent: GuildStateChangedEvent = {
      guildId,
      previousInstanceId: before,
      currentInstanceId: after,
      state: updatedGuild,
      timestamp: Date.now(),
    };
    this.emit(STATE_EVENTS.GUILD_STATE_UPDATED, guildEvent);

    return updatedGuild.instances[info.instanceId];
  }

  public async setInstanceOffline(guildId: string, instanceId: string): Promise<GuildState> {
    const before = await this.getActiveInstanceId(guildId);
    const updatedGuild = await this.service.setOffline(guildId, instanceId);
    this.guildCache.set(guildId, updatedGuild);

    const after = updatedGuild.activeInstanceId ?? null;
    if (before !== after) {
      const event: ActiveInstanceChange = {
        guildId,
        previousInstanceId: before,
        currentInstanceId: after,
        timestamp: Date.now(),
      };
      this.emit(STATE_EVENTS.ACTIVE_CHANGED, event);
    }

    const guildEvent: GuildStateChangedEvent = {
      guildId,
      previousInstanceId: before,
      currentInstanceId: after,
      state: updatedGuild,
      timestamp: Date.now(),
    };
    this.emit(STATE_EVENTS.GUILD_STATE_UPDATED, guildEvent);

    return updatedGuild;
  }

  public async sendPing(targetInstanceId?: string): Promise<string> {
    return this.service.sendPing(targetInstanceId);
  }
}

export const STATE_EVENTS = {
  ACTIVE_CHANGED: 'active-instance-changed',
  GUILD_STATE_UPDATED: 'guild-state-updated',
} as const;
