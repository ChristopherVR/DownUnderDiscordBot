import {
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  InteractionResponse,
  Message,
  BaseInteraction,
} from 'discord.js';

export type PlayerCommand = ChatInputApplicationCommandData & {
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
