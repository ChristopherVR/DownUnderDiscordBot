import { Client, GatewayIntentBits, Partials, Events, MessageFlags } from 'discord.js';
import { initializePlayer } from './helpers/discord/player';
import { handleChatInputInteraction } from './helpers/commands/DiscordBotIntegration';
import { createLogger } from './helpers/logger';
import { initI18n } from 'discord-dashboard-shared/localization';
import os from 'node:os';
import { createStateService } from './state/factory';
import type { WebSocketManager } from './helpers/websocket';
import { StateCoordinator } from './state/StateCoordinator';
import { registerControllerInteractionHandlers } from './helpers/discord/controllerInteractionManager';
import { isE2EMode, applyE2EStubs } from './testMode/index';

const botLog = createLogger('discord-bot');

export async function startBot(wsManager?: WebSocketManager) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Channel, Partials.Message],
  });
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    botLog.debug(
      { command: interaction.commandName, guildId: interaction.guildId },
      'Slash command interaction received',
    );

    try {
      await handleChatInputInteraction(interaction);
    } catch (error) {
      botLog.error({ err: error, command: interaction.commandName }, 'Slash command handling failed');
      if (!interaction.replied) {
        try {
          if (interaction.deferred) {
            await interaction.editReply({ content: 'Something went wrong while processing that command.' });
          } else {
            await interaction.reply({
              content: 'Something went wrong while processing that command.',
              flags: MessageFlags.Ephemeral,
            });
          }
        } catch (respondError) {
          botLog.error({ err: respondError }, 'Failed to send fallback slash command response');
        }
      }
    }
  });
  if (isE2EMode()) {
    botLog.warn('E2E mode enabled — skipping Discord login');
  } else {
    botLog.info('Logging into Discord API');
    await client.login(process.env.CLIENT_TOKEN);
    botLog.info('Discord login successful');
  }
  // initialize localization for server
  try {
    await initI18n({
      isServer: true,
      lng: 'en',
    });
    botLog.debug('Server localization initialized');
  } catch (error) {
    botLog.warn({ err: error }, 'Failed to initialize i18n');
  }

  // initialize music player
  const player = await initializePlayer(client, wsManager);

  // In E2E mode, apply stubs (fake Discord cache, synthetic voice connect)
  // after the player is ready so queueCreate listeners are wired before the
  // first play call.
  if (isE2EMode()) {
    await applyE2EStubs({ client, player });
  }

  const INSTANCE_ID = process.env.INSTANCE_ID || `${os.hostname()}-${process.pid}`;
  const GUILD_ID = process.env.GUILD_ID || (isE2EMode() ? 'test-guild-1' : 'mock-guild');
  const STATE_CHANNEL_ID = process.env.STATE_CHANNEL_ID || 'mock-channel';

  const state = createStateService({
    discordClient: client,
    stateChannelId: STATE_CHANNEL_ID,
    wsManager,
  });

  registerControllerInteractionHandlers(client, player);

  const coordinator = StateCoordinator.initialize({
    service: state,
    localInstanceId: INSTANCE_ID,
    defaultGuildIds: GUILD_ID ? [GUILD_ID] : undefined,
  });

  const publishPresence = async (guildId: string): Promise<void> => {
    try {
      await coordinator.updateInstancePresence(guildId, {
        instanceId: INSTANCE_ID,
        online: true,
        hostname: os.hostname(),
        pid: process.pid,
      });
    } catch (error) {
      botLog.error({ guildId, err: error }, 'Failed to publish instance presence');
    }
  };

  client.once(Events.ClientReady, async () => {
    botLog.info('Discord client ready');
    const guildIds = client.guilds.cache.size ? client.guilds.cache.map((guild) => guild.id) : [GUILD_ID];

    await Promise.all(guildIds.map((guildId) => publishPresence(guildId)));
    botLog.info({ guildIds }, 'Presence published for guilds on ready');
  });

  // heartbeat — skipped in E2E mode to avoid touching the (stubbed) Discord
  // state channel every 15 s.
  if (!isE2EMode()) {
    setInterval(async () => {
      // botLog.debug('Publishing heartbeat presence update');
      const guildIds = client.guilds.cache.size ? client.guilds.cache.map((guild) => guild.id) : [GUILD_ID];
      await Promise.all(guildIds.map((guildId) => publishPresence(guildId)));
      // botLog.info({ guildIds }, 'Presence published for guilds on ready');
    }, 15_000);
  }

  // Simple PING/PONG protocol in the state channel
  client.on(Events.MessageCreate, async (msg) => {
    if (msg.channelId !== STATE_CHANNEL_ID || msg.author.bot) return;
    botLog.debug({ channelId: msg.channelId }, 'State channel message received');
    const m = msg.content.trim();
    if (!m.startsWith('[STATE]')) return;
    const parts = m.split(/\s+/);
    if (parts[1] === 'PING') {
      const nonce = parts[2];
      const target = parts[3];
      if (target && target !== INSTANCE_ID) return;
      const guildIds = client.guilds.cache.size ? client.guilds.cache.map((guild) => guild.id) : [GUILD_ID];
      for (const guildId of guildIds) {
        const gs = await state.getGuildState(guildId);
        const me = gs.instances[INSTANCE_ID];
        botLog.debug({ nonce, guildId }, 'Responding with PONG');
        await msg.channel.send(
          `[STATE] PONG ${nonce} ${INSTANCE_ID} online=${me?.online ?? false} active=${
            me?.isActive ?? false
          } ts=${Date.now()} guild=${guildId}`,
        );
      }
    }
  });

  return { client, player, state, coordinator, INSTANCE_ID, GUILD_ID } as const;
}
