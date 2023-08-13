import { Player } from 'discord-player';

import i18n from './helpers/localization/i18n.js';
import { setup } from './server/setup.js';
import { GatewayIntentBits, Client, GatewayDispatchEvents } from 'discord.js';
import {
  SpotifyExtractor,
  YouTubeExtractor,
  SoundCloudExtractor,
  VimeoExtractor,
  ReverbnationExtractor,
  AttachmentExtractor,
  AppleMusicExtractor,
} from '@discord-player/extractor';
import { useLocalizedString } from './helpers/localization/localizedString.js';
import { logger } from './helpers/logger/logger.js';

const token = process.env.CLIENT_TOKEN;

process.on('uncaughtException', (err) => console.error(err));

const listeners = ['ready', 'slashCommand'];

const init = async () => {
  await i18n();

  const client = new Client({
    rest: {
      version: '10',
    },
    intents:
      GatewayIntentBits.GuildMessages |
      GatewayIntentBits.MessageContent |
      GatewayIntentBits.GuildVoiceStates |
      GatewayIntentBits.Guilds,
  });

  for (const listener of listeners) {
    const importedFile = await import(`./helpers/discord/${listener}.js`);
    const setupListener: (c: Client) => void = importedFile.default;
    setupListener(client);
  }
  client.on(GatewayDispatchEvents.Ready, (interaction) => {
    const { localize } = useLocalizedString(interaction?.locale);
    const value = localize('activity:default');
    client.user?.setActivity(value);
  });

  if (!token) {
    logger(
      'Unable to start this discord bot. There is no Discord client token. Check if the environment specifies the CLIENT_TOKEN value.',
    ).error();
    process.exit(1);
  } else {
    await client.login(token);

    const player = Player.singleton(client);

    await player.extractors.loadDefault();

    await player.extractors.register(SpotifyExtractor, undefined);
    await player.extractors.register(YouTubeExtractor, undefined);
    await player.extractors.register(SoundCloudExtractor, undefined);
    await player.extractors.register(VimeoExtractor, undefined);
    await player.extractors.register(ReverbnationExtractor, undefined);
    await player.extractors.register(AttachmentExtractor, undefined);
    await player.extractors.register(AppleMusicExtractor, undefined);

    if (player.extractors.size === 0) {
      logger('No extractors registered. Unable to use this discord bot.').error();
      process.exit(1);
    }
  }
};

void setup(init);
