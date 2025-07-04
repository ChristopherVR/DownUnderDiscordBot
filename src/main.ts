import { Player } from 'discord-player';
import { EmbedBuilder } from 'discord.js';

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
import { DefaultLoggerMessage } from './enums/logger.js';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { initializePlayer, useDefaultPlayer } from './helpers/discord/player.js';
import { QueueRepeatMode } from 'discord-player';
import { Queue as displayQueue } from './commands/music/queue.js';
import { activeController, getControllerPayload } from './helpers/discord/playerEventManager.js';

const token = process.env.CLIENT_TOKEN;

process.on('uncaughtException', (err) => {
  logger(err).fatal();
});

process.on('unhandledRejection', (err: Error) => {
  logger(err).fatal();
});

const init = async () => {
  await i18n();

  const client = new Client({
    intents:
      GatewayIntentBits.GuildMessages |
      GatewayIntentBits.MessageContent |
      GatewayIntentBits.GuildVoiceStates |
      GatewayIntentBits.Guilds,
  });

  client.once('ready', async () => {
    if (!client.user || !client.application) {
      return;
    }
    logger(`${client.user.username} is now connected.`).info();

    const { COMMANDS } = await import('./constants/commands.js');
    await client.application.commands.set(COMMANDS);

    const { localize } = useLocalizedString();
    const value = localize('activity:default');
    client.user.setActivity(value);
  });

  client.on('interactionCreate', async (interaction) => {
    logger(`INTERACTION: ${interaction.type} - USER: ${interaction.user.id} - GUILD: ${interaction.guildId}`).info();
    if (interaction.isChatInputCommand()) {
      const { handleSlashCommand } = await import('./helpers/discord/slashCommand.js');
      await handleSlashCommand(interaction);
      return;
    }

    if (interaction.isButton()) {
      logger(`BUTTON: ${interaction.customId} - USER: ${interaction.user.id} - GUILD: ${interaction.guildId}`).info();
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
            if (controller) {
              const stoppedEmbed = new EmbedBuilder().setDescription('⏹️ Music has been stopped.').setColor('Red');
              await controller.edit({ embeds: [stoppedEmbed], components: [] });
            }
            queue.delete();
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
              await interaction.reply({ content: 'The queue is empty.', ephemeral: true });
              return;
            }

            const tracks = queue.tracks.map((track, i) => {
              return `${i + 1}. **${track.title}** ([link](${track.url}))`;
            });
            const queueEmbed = new EmbedBuilder()
              .setTitle('Server Queue')
              .setDescription(tracks.join('\n'))
              .setColor('Random');
            await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
          }
          return;
      }
      await interaction.deferUpdate();
    }
  });

  if (!token) {
    logger(DefaultLoggerMessage.NoClientToken).fatal();
    process.exit(1);
  } else {
    await client.login(token);

    const player = initializePlayer(client);

    logger('Loading extractors...').info();

    await player.extractors.loadMulti([
      SpotifyExtractor,
      YoutubeiExtractor,
      SoundCloudExtractor,
      AttachmentExtractor,
      VimeoExtractor,
      AppleMusicExtractor,
      ReverbnationExtractor,
    ]);

    if (player.extractors.size === 0) {
      logger(DefaultLoggerMessage.NoExtractorsRegistered).warning();
    }
  }

  if (localization) {
    logger('Localization has been loaded.').info();
  }
};

void setup(init);
