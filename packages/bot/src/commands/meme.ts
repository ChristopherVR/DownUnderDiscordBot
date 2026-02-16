import axios from 'axios';
import { EmbedBuilder, MessageFlags } from 'discord.js';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import type { CommandContext, CommandHandler } from '../types/commands';

export const MemeCommand = (): CommandHandler => ({
  name: tCommands('meme.name'),
  description: tCommands('meme.description'),
  run: async (context: CommandContext) => {
    try {
      if (!context.deferred) {
        await context.deferReply();
      }

      const { data } = await axios.get('https://meme-api.com/gimme');

      const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setURL(data.postLink)
        .setImage(data.url)
        .setColor('Random')
        .setFooter({ text: `From r/${data.subreddit} by ${data.author}` });

      await context.followUp({ embeds: [embed] });
    } catch (error) {
      await context.followUp({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
    }
  },
});

export default MemeCommand;
