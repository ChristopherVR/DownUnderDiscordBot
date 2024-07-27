import { Player } from 'discord-player';

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

const token = process.env.CLIENT_TOKEN;

process.on('uncaughtException', (err) => {
  logger(err).fatal();
});

process.on('unhandledRejection', (err: Error) => {
  logger(err).fatal();
  process.exit(1);
});

const listeners = ['ready', 'slashCommand'];

const init = async () => {
  await i18n();

  const client = new Client({
    intents:
      GatewayIntentBits.GuildMessages |
      GatewayIntentBits.MessageContent |
      GatewayIntentBits.GuildVoiceStates |
      GatewayIntentBits.Guilds,
  });

  for (const listener of listeners) {
    const importedFile = (await import(`./helpers/discord/${listener}.js`)) as { default: (c: Client) => void };
    const setupListener: (c: Client) => void = importedFile.default;
    setupListener(client);
  }
  client.on(GatewayDispatchEvents.Ready, (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction?.locale);
    const value = localize('activity:default');
    client.user?.setActivity(value);
  });

  if (!token) {
    logger(DefaultLoggerMessage.NoClientToken).fatal();
    process.exit(1);
  } else {
    await client.login(token);

    const player = Player.singleton(client);

    await player.extractors.loadDefault();

    await player.extractors.register(SpotifyExtractor, undefined);
    await player.extractors.register(YoutubeiExtractor, undefined);
    await player.extractors.register(SoundCloudExtractor, undefined);
    await player.extractors.register(VimeoExtractor, undefined);
    await player.extractors.register(ReverbnationExtractor, undefined);
    await player.extractors.register(AttachmentExtractor, undefined);
    await player.extractors.register(AppleMusicExtractor, undefined);

    if (player.extractors.size === 0) {
      logger(DefaultLoggerMessage.NoExtractorsRegistered).fatal();
      process.exit(1);
    }
  }
};

void setup(init);
