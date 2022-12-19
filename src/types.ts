import {
  BaseInteraction,
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  Client,
  InteractionResponse,
  Message,
} from 'discord.js';

export type ClientExtended = Client<boolean> & {
  debug?: boolean;
};
export type PlayerCommand = ChatInputApplicationCommandData & {
  voiceChannel: boolean;
  permissions?: bigint;
  run: (
    client: ClientExtended,
    interaction: ChatInputCommandInteraction,
  ) => Promise<InteractionResponse<boolean> | Message<boolean> | undefined> | Promise<void> | Awaited<void> | void;
};

export type Command<TCommand extends BaseInteraction> = ChatInputApplicationCommandData & {
  run: (
    client: Client,
    interaction: TCommand,
  ) => Promise<InteractionResponse<boolean> | Message<boolean> | undefined> | Promise<void> | Awaited<void> | void;
};
