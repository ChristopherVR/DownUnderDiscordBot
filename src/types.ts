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
    interaction: ChatInputCommandInteraction,
  ) =>
    | Promise<InteractionResponse<boolean> | Message<boolean> | undefined>
    | Promise<void>
    | Awaited<void>
    | void
    | Promise<void | InteractionResponse<boolean> | Message<boolean> | undefined>;
};

export type Command<TCommand extends BaseInteraction> = ChatInputApplicationCommandData & {
  run: (
    interaction: TCommand,
  ) =>
    | Promise<InteractionResponse<boolean> | Message<boolean> | undefined>
    | Promise<void>
    | Awaited<void>
    | void
    | Promise<void | InteractionResponse<boolean> | Message<boolean> | undefined>;
};
