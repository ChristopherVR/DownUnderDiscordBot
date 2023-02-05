import { ChatInputCommandInteraction, InteractionEditReplyOptions, InteractionReplyOptions } from 'discord.js';

export default class Interaction {
  private interaction: ChatInputCommandInteraction;

  private options: InteractionReplyOptions | InteractionEditReplyOptions = {};

  constructor(interaction: ChatInputCommandInteraction) {
    this.interaction = interaction;
  }

  public setOptions(interactionOptions: InteractionReplyOptions | InteractionEditReplyOptions) {
    this.options = interactionOptions;
    return this;
  }

  public async sendReply(): Promise<Interaction> {
    await this.interaction.reply(this.options as InteractionReplyOptions);
    return this;
  }
}
