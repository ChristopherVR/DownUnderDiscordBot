import 'dotenv/config';
import { Player } from 'discord-player';
import { EmbedBuilder, ChannelType, Collection, TextChannel, MessageFlags } from 'discord.js';

import i18n from './helpers/localization/i18n.js';
import { setup } from './server/setup.js';
import { GatewayIntentBits, Client, GatewayDispatchEvents, ChatInputCommandInteraction } from 'discord.js';
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
import { Queue as displayQueue } from './commands/music/queue.js';
import { activeController, getControllerPayload } from './helpers/discord/playerEventManager.js';
import { YoutubeiExtractor } from 'discord-player-youtubei';

const token = process.env.CLIENT_TOKEN;

process.on('uncaughtException', (err) => {
  logger.fatal(err);
});

process.on('unhandledRejection', (err: Error) => {
  logger.fatal(err);
});

const init = async () => {
  await i18n();
  logger.info('Localization has been loaded.');

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

    const { COMMANDS } = await import('./constants/commands.js');
    await client.application.commands.set(COMMANDS);

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
      const { handleSlashCommand } = await import('./helpers/discord/slashCommand.js');
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
