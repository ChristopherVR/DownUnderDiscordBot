import { SpotifyExtractor, SoundCloudExtractor, YouTubeExtractor } from '@discord-player/extractor';
import { useMainPlayer } from 'discord-player';

// eslint-disable-next-line import/prefer-default-export
export const useDefaultPlayer = async () => {
  const player = useMainPlayer();

  if (!player) {
    throw new Error('The Discord player has not been created or initialized yet.');
  }

  await player.extractors.loadDefault();

  await player.extractors.register(SpotifyExtractor, {});
  await player.extractors.register(YouTubeExtractor, {});
  await player.extractors.register(SoundCloudExtractor, {});

  return player;
};
