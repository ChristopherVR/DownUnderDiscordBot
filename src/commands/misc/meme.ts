import { ApplicationCommandType, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { localizedString, useLocalizedString } from '../../helpers/localization/localizedString.js';
import { Command } from '../../models/discord.js';
import getLocalizations from '../../helpers/localization/getLocalizations.js';
import axios from 'axios';
import { logger } from '../../helpers/logger/logger.js';

interface Meme {
  postLink: string;
  subreddit: string;
  title: string;
  url: string;
  nsfw: boolean;
  spoiler: boolean;
  author: string;
  ups: number;
  preview: string[];
}

export const Meme: Command<ChatInputCommandInteraction> = {
  name: localizedString('global:meme'),
  nameLocalizations: getLocalizations('global:meme'),
  description: localizedString('global:memeDesc'),
  descriptionLocalizations: getLocalizations('global:memeDesc'),
  type: ApplicationCommandType.ChatInput,
  run: async (interaction: ChatInputCommandInteraction) => {
    const { localize } = useLocalizedString(interaction.locale);

    try {
      await interaction.deferReply();
      const { data } = await axios.get<Meme>('https://meme-api.com/gimme');

      const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setURL(data.postLink)
        .setImage(data.url)
        .setColor('Random')
        .setFooter({ text: `r/${data.subreddit} • Posted by u/${data.author}` });

      await interaction.followUp({ embeds: [embed] });
    } catch (error) {
      if (error instanceof Error) {
        logger(error).error();
      } else {
        logger(String(error)).error();
      }
      await interaction.followUp({
        content: localize('global:genericError'),
        ephemeral: true,
      });
    }
  },
};

export default Meme;
