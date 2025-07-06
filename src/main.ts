import 'dotenv/config';
import { Player } from 'discord-player';
import {
  EmbedBuilder,
  ChannelType,
  Collection,
  TextChannel,
  MessageFlags,
  Client,
  GatewayIntentBits,
  Message,
} from 'discord.js';
import { randomUUID } from 'crypto';

import i18n from './helpers/localization/i18n.js';
import { setup } from './server/setup.js';
import {
  SpotifyExtractor,
  SoundCloudExtractor,
  VimeoExtractor,
  ReverbnationExtractor,
  AttachmentExtractor,
  AppleMusicExtractor,
} from '@discord-player/extractor';
import { useLocalizedString } from './helpers/localization/localizedString.js';
import { logger } from './helpers/logger/logger.js';
import { initializePlayer, useDefaultPlayer } from './helpers/discord/player.js';
import { QueueRepeatMode } from 'discord-player';
import { getControllerPayload, activeController } from './helpers/discord/playerEventManager.js';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { handleSlashCommand } from './helpers/discord/slashCommand.js';
import { getCommands, setCommands } from './commandRegistry.js';
import {
  getInstanceId,
  getStatusMessagePayload,
  isInstanceActive,
  setInstanceActive,
  setStatusMessage,
  updateStatusMessage,
} from './instanceManager.js';

const token = process.env.CLIENT_TOKEN;
let heartbeatInterval: NodeJS.Timeout | null = null;
const instanceId = getInstanceId();

const shutdown = async (client: Client) => {
  logger.info('Shutting down gracefully...');
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  const statusMessage = getStatusMessagePayload();
  if (statusMessage) {
    try {
      // This is a fire-and-forget, we don't want to wait for it.
      (client.channels.cache.get(process.env.STATUS_CHANNEL_ID!) as TextChannel).send({
        content: `❌ OFFLINE [${instanceId}]`,
      });
      logger.info('Offline status message sent.');
    } catch (error) {
      logger.error({ err: error }, 'Failed to send offline status message on shutdown.');
    }
  }
  client.destroy();
  logger.info('Client destroyed.');
  process.exit(0);
};

process.on('uncaughtException', (err) => {
  logger.fatal(err);
});

process.on('unhandledRejection', (err: Error) => {
  logger.fatal(err);
});

const init = async () => {
  await i18n();
  logger.info('Localization has been loaded.');

  const { COMMANDS, MISC_COMMANDS, MUSIC_COMMANDS } = await import('./constants/commands.js');
  const initializedCommands = COMMANDS.map((c) => c());
  setCommands(initializedCommands, MISC_COMMANDS, MUSIC_COMMANDS);
  logger.info('Commands have been loaded.');

  const client = new Client({
    intents:
      GatewayIntentBits.GuildMessages |
      GatewayIntentBits.MessageContent |
      GatewayIntentBits.GuildVoiceStates |
      GatewayIntentBits.GuildMembers |
      GatewayIntentBits.Guilds,
  });

  client.once('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }
    logger.info(`${client.user.username} is now connected.`);

    await client.application.commands.set(getCommands());

    if (process.env.MUSIC_CHANNEL_ID) {
      try {
        const musicChannel = await client.channels.fetch(process.env.MUSIC_CHANNEL_ID);

        logger.info({ musicChannel }, 'Music channel fetched');
        if (musicChannel && musicChannel.type === ChannelType.GuildText) {
          let fetched: Collection<string, any>;
          do {
            fetched = await (musicChannel as TextChannel).messages.fetch();
            logger.info('Fetching messages');
            if (fetched.size > 0) {
              for (const message of fetched.values()) {
                logger.info(message.id, 'Deleting message.');
                await message.delete();
              }
            }
          } while (fetched.size > 0);
          logger.info(`Cleaned up music channel: ${musicChannel.id}`);
        } else {
          logger.warn(`Music channel ${process.env.MUSIC_CHANNEL_ID} not found or is not a text channel.`);
        }
      } catch (error) {
        logger.error(error as Error);
      }
    }

    const { localize } = useLocalizedString();
    const value = localize('activity:default');
    client.user.setActivity(value);

    if (process.env.STATUS_CHANNEL_ID) {
      const statusChannel = (await client.channels.fetch(process.env.STATUS_CHANNEL_ID)) as TextChannel;

      const electLeader = async () => {
        const messages = await statusChannel.messages.fetch({ limit: 100 });
        const activeInstances = messages.filter((m) => m.content.startsWith('✅ ACTIVE'));

        if (activeInstances.size === 0) {
          logger.info('No active instances found. Electing self as leader.');
          setInstanceActive(true);
        } else {
          logger.info('Active instance found. Starting as inactive.');
          setInstanceActive(false);
        }

        const myStatus = await statusChannel.send(getStatusMessagePayload());
        setStatusMessage(myStatus);
      };

      await electLeader();

      // Heartbeat for the active instance
      heartbeatInterval = setInterval(() => {
        if (isInstanceActive()) {
          updateStatusMessage();
        }
      }, 30_000); // Every 30 seconds

      // Liveness probe for inactive instances
      setInterval(async () => {
        if (!isInstanceActive()) {
          const messages = await statusChannel.messages.fetch({ limit: 10 });
          const latestActive = messages.find((m) => m.content.startsWith('✅ ACTIVE'));
          if (latestActive) {
            // Check if the timestamp is older than our threshold (e.g., 65 seconds)
            if (Date.now() - latestActive.createdTimestamp > 65000) {
              logger.warn('Active instance has missed heartbeats. Forcing re-election.');
              // We can't trust the old message, so we delete it to ensure a clean slate.
              await latestActive
                .delete()
                .catch((err) => logger.error({ err }, 'Failed to delete stale active message.'));
              await electLeader();
            }
          } else {
            // No active message found at all.
            logger.info('No active instance found during liveness probe. Triggering election.');
            await electLeader();
          }
        }
      }, 70_000); // Every 70 seconds

      // Watch for other instances going offline
      const messageCollector = statusChannel.createMessageCollector();
      messageCollector.on('collect', async (message) => {
        if (message.content.startsWith('❌ OFFLINE')) {
          const wasActive = message.content.includes('✅ ACTIVE');
          if (wasActive && !isInstanceActive()) {
            // The leader went down, a new election is needed.
            logger.info('Active instance went offline. Re-electing leader.');
            await electLeader();
          }
        }
        if (message.content.startsWith('SET_ACTIVE')) {
          const targetId = message.content.split(':')[1];
          if (targetId === getInstanceId()) {
            logger.info('Received command to become active instance.');
            setInstanceActive(true);
          } else {
            logger.info('Received command for another instance to become active. Setting self to inactive.');
            setInstanceActive(false);
          }
        }
      });
    }
  });

  client.on('interactionCreate', async (interaction) => {
    logger.info(
      {
        type: interaction.type,
        user: interaction.user.id,
        guild: interaction.guildId,
        channel: interaction.channel?.id,
      },
      'Interaction received',
    );
    if (interaction.isChatInputCommand()) {
      await handleSlashCommand(interaction);
      return;
    }

    if (interaction.isButton()) {
      logger.info(
        {
          customId: interaction.customId,
          user: interaction.user.id,
          guild: interaction.guildId,
          channel: interaction.channel?.id,
        },
        'Button interaction received',
      );
      const player = useDefaultPlayer();
      const queue = player.nodes.get(interaction.guildId!);
      if (!queue || !interaction.guildId) return;

      const controller = activeController.get(interaction.guildId);

      switch (interaction.customId) {
        case 'back':
          if (queue.history.previousTrack) await queue.history.back();
          break;
        case 'skip':
          if (queue.currentTrack) queue.node.skip();
          break;
        case 'stop':
          if (queue.currentTrack) {
            queue.delete();
            if (controller) {
              const stoppedEmbed = new EmbedBuilder().setDescription('⏹️ Music has been stopped.').setColor('Red');
              await controller.edit({ embeds: [stoppedEmbed], components: [] });
              activeController.delete(interaction.guildId);
            }
          }
          break;
        case 'pause_resume':
          if (queue.currentTrack) queue.node.setPaused(!queue.node.isPaused());
          break;
        case 'volume_up':
          if (queue.currentTrack) queue.node.setVolume(queue.node.volume + 10);
          break;
        case 'volume_down':
          if (queue.currentTrack) queue.node.setVolume(queue.node.volume - 10);
          break;
        case 'loop':
          queue.setRepeatMode(((queue.repeatMode + 1) % 4) as QueueRepeatMode);
          if (controller) {
            const payload = getControllerPayload(queue);
            await controller.edit(payload);
          }
          break;
        case 'queue':
          {
            if (!queue.tracks || queue.tracks.size === 0) {
              await interaction.reply({ content: 'The queue is empty.', flags: MessageFlags.Ephemeral });
              return;
            }

            const tracks = queue.tracks
              .map((track, i) => {
                return `${i + 1}. **${track.title}** ([link](${track.url}))`;
              })
              .slice(0, 10);
            const queueEmbed = new EmbedBuilder()
              .setTitle('Server Queue')
              .setDescription(tracks.join('\n'))
              .setColor('Random');
            await interaction.reply({ embeds: [queueEmbed], flags: MessageFlags.Ephemeral });
          }
          return;
      }
      await interaction.deferUpdate();
    }
  });

  if (!token) {
    logger.fatal('No client token provided.');
    process.exit(1);
  } else {
    await client.login(token);

    process.on('SIGINT', () => shutdown(client));
    process.on('SIGTERM', () => shutdown(client));

    const player = initializePlayer(client);

    logger.info('Loading extractors...');

    await player.extractors.loadMulti([
      SpotifyExtractor,
      SoundCloudExtractor,
      AttachmentExtractor,
      VimeoExtractor,
      AppleMusicExtractor,
      ReverbnationExtractor,
    ]);

    await player.extractors.register(YoutubeiExtractor, {});

    if (player.extractors.size === 0) {
      logger.warn('No extractors registered.');
    }
  }
};

void setup(init);
