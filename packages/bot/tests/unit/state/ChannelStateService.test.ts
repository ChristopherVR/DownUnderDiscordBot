import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelStateService } from '../../../state/channel/ChannelStateService';
import type { InstanceInfo } from 'discord-dashboard-shared';

describe('ChannelStateService (memory mode)', () => {
  let service: ChannelStateService;

  beforeEach(() => {
    const mockClient = {} as unknown as import('discord.js').Client;
    const mockChannelId = 'test-channel-id';
    service = new ChannelStateService(mockClient, mockChannelId);
    vi.clearAllMocks();
  });

  describe('getState', () => {
    it('should return initial empty state document', async () => {
      const state = await service.getState();

      expect(state.version).toBe(1);
      expect(state.guilds).toEqual({});
      expect(typeof state.updatedAt).toBe('number');
      expect(typeof state.docVersion).toBe('number');
    });
  });

  describe('setOnline', () => {
    it('should add new instance to guild', async () => {
      const instanceInfo: InstanceInfo = {
        instanceId: 'bot-1',
        online: true,
        lastHeartbeat: Date.now(),
        isActive: false,
        hostname: 'test-host',
        pid: 12345,
      };

      const guildState = await service.setOnline('guild-1', instanceInfo);

      expect(guildState.guildId).toBe('guild-1');
      expect(guildState.instances['bot-1']).toMatchObject({
        instanceId: 'bot-1',
        online: true,
        hostname: 'test-host',
        pid: 12345,
        isActive: false,
      });
      expect(typeof guildState.instances['bot-1'].lastHeartbeat).toBe('number');
      expect(guildState.activeInstanceId).toBeNull();
    });

    it('should update existing instance', async () => {
      const instanceInfo: InstanceInfo = {
        instanceId: 'bot-1',
        online: true,
        lastHeartbeat: Date.now(),
        isActive: false,
      };

      await service.setOnline('guild-1', instanceInfo);

      const updatedInfo: InstanceInfo = {
        ...instanceInfo,
        lastHeartbeat: Date.now() + 1_000,
        hostname: 'updated-host',
      };

      const guildState = await service.setOnline('guild-1', updatedInfo);
      const stored = guildState.instances['bot-1'];

      expect(stored.hostname).toBe('updated-host');
      expect(stored.lastHeartbeat).toBe(updatedInfo.lastHeartbeat);
    });
  });

  describe('setActiveInstance', () => {
    it('should set active instance for guild', async () => {
      const instanceInfo: InstanceInfo = {
        instanceId: 'bot-1',
        online: true,
        lastHeartbeat: Date.now(),
        isActive: false,
      };

      await service.setOnline('guild-1', instanceInfo);
      const guildState = await service.setActiveInstance('guild-1', 'bot-1');

      expect(guildState.activeInstanceId).toBe('bot-1');
      expect(guildState.instances['bot-1'].isActive).toBe(true);
    });

    it('should create placeholder instance when activating unknown id', async () => {
      const guildState = await service.setActiveInstance('guild-1', 'new-instance');

      expect(guildState.activeInstanceId).toBe('new-instance');
      expect(guildState.instances['new-instance']).toMatchObject({
        instanceId: 'new-instance',
        isActive: true,
        online: true,
      });
    });
  });

  describe('getGuildState', () => {
    it('should return guild state', async () => {
      const instanceInfo: InstanceInfo = {
        instanceId: 'bot-1',
        online: true,
        lastHeartbeat: Date.now(),
        isActive: false,
      };

      await service.setOnline('guild-1', instanceInfo);
      const guildState = await service.getGuildState('guild-1');

      expect(guildState.guildId).toBe('guild-1');
      expect(guildState.instances['bot-1']).toMatchObject({ instanceId: 'bot-1', online: true });
    });

    it('should create new guild state if not exists', async () => {
      const guildState = await service.getGuildState('new-guild');

      expect(guildState).toEqual({ guildId: 'new-guild', activeInstanceId: null, instances: {} });
    });
  });

  describe('sendPing', () => {
    it('should report ping for all instances', async () => {
      const result = await service.sendPing();

      expect(result).toBe('Ping sent to all instances');
    });

    it('should report ping for a specific instance', async () => {
      const result = await service.sendPing('bot-1');

      expect(result).toBe('Ping sent to instance bot-1');
    });
  });

  describe('instance cleanup indicator', () => {
    it('should allow detecting stale instances via heartbeat check', async () => {
      const oldTimestamp = Date.now() - 60_000;
      const instanceInfo: InstanceInfo = {
        instanceId: 'bot-1',
        online: true,
        lastHeartbeat: oldTimestamp,
        isActive: true,
      };

      await service.setOnline('guild-1', instanceInfo);
      const state = await service.getState();
      const guildState = state.guilds['guild-1'];

      const isStale = Date.now() - guildState.instances['bot-1'].lastHeartbeat > 30_000;
      expect(isStale).toBe(true);
    });
  });

  describe('multiple guilds', () => {
    it('should keep guild data isolated', async () => {
      const instance1: InstanceInfo = {
        instanceId: 'bot-1',
        online: true,
        lastHeartbeat: Date.now(),
        isActive: false,
      };

      const instance2: InstanceInfo = {
        instanceId: 'bot-2',
        online: true,
        lastHeartbeat: Date.now(),
        isActive: false,
      };

      await service.setOnline('guild-1', instance1);
      await service.setOnline('guild-2', instance2);

      const state = await service.getState();

      expect(Object.keys(state.guilds)).toContain('guild-1');
      expect(Object.keys(state.guilds)).toContain('guild-2');
      expect(state.guilds['guild-1'].instances['bot-1'].instanceId).toBe('bot-1');
      expect(state.guilds['guild-2'].instances['bot-2'].instanceId).toBe('bot-2');
    });
  });
});
