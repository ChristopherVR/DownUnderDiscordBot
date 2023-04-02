import { ChatInputCommandInteraction, InteractionEditReplyOptions, InteractionReplyOptions } from 'discord.js';

export default class Interaction {
  private interaction: ChatInputCommandInteraction;

  private options: InteractionReplyOptions | InteractionEditReplyOptions | undefined;

  constructor(interaction: ChatInputCommandInteraction) {
    this.interaction = interaction;
  }

  public setOptions(interactionOptions: InteractionReplyOptions | InteractionEditReplyOptions) {
    if (!this.options) {
      throw new Error('The options have already been set.');
    }
    this.options = interactionOptions;
    return this;
  }

  public async sendReply(): Promise<Interaction> {
    await this.interaction.reply(this.options as InteractionReplyOptions);
    return this;
  }
}
