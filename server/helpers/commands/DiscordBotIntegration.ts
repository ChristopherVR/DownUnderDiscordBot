import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Client,
  Guild,
  GuildBasedChannel,
  GuildMember,
  MessageFlags,
  User,
} from 'discord.js';
import { CommandExecution } from '../../../shared/src/types/index.js';
import { createLogger } from '../logger';
import { CommandRegistry } from './CommandRegistry';
import { tErrors } from 'discord-dashboard-shared/localization';
import { CommandHandler } from '../../types/commands';
import { DashboardCommandContext, DashboardCommandContextOptions, InteractionCommandContext } from './CommandContext';

const integrationLog = createLogger('discord-integration');

export class DiscordBotIntegration {
  private client: Client | null = null;

  constructor(private readonly commandRegistry: CommandRegistry) {}

  public setClient(client: Client): void {
    this.client = client;
  }

  public async handleChatInputInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
    integrationLog.debug({ command: interaction.commandName, guildId: interaction.guildId }, 'Handling chat input interaction');

    if (!this.client) {
      integrationLog.warn('Discarding interaction - Discord client not set on integration');
      await this.respondWithError(interaction);
      return;
    }

    try {
      await this.commandRegistry.waitUntilLoaded();
    } catch (error) {
      integrationLog.error({ err: error }, 'Failed to ensure command registry readiness for slash command');
      await this.respondWithError(interaction);
      return;
    }

    const command = this.commandRegistry.getCommandHandler(interaction.commandName);
    if (!command) {
      integrationLog.warn({ command: interaction.commandName }, 'Slash command handler not found');
      await this.respondWithError(interaction, tErrors('command.notFound'));
      return;
    }

    const args = this.extractArgsFromInteraction(interaction, command);
    const context = new InteractionCommandContext(interaction);
    const execution = await this.commandRegistry.executeCommand(interaction.commandName, args, context);

    if (execution.status === 'error') {
      integrationLog.warn({ command: interaction.commandName, error: execution.error }, 'Slash command execution failed');
      await this.respondWithError(interaction, execution.error);
    }
  }

  private extractArgsFromInteraction(
    interaction: ChatInputCommandInteraction,
    command: CommandHandler,
  ): Record<string, unknown> {
    const args: Record<string, unknown> = {};
    const options = command.options ?? [];

    for (const option of options) {
      switch (option.type) {
        case ApplicationCommandOptionType.Integer: {
          const value = interaction.options.getInteger(option.name);
          if (value !== null) {
            args[option.name] = value;
          }
          break;
        }
        case ApplicationCommandOptionType.Boolean: {
          const value = interaction.options.getBoolean(option.name);
          if (value !== null) {
            args[option.name] = value;
          }
          break;
        }
        case ApplicationCommandOptionType.Number: {
          const value = interaction.options.getNumber(option.name);
          if (value !== null) {
            args[option.name] = value;
          }
          break;
        }
        default: {
          const value = interaction.options.getString(option.name);
          if (value !== null) {
            args[option.name] = value;
          }
        }
      }
    }

    return args;
  }

  private async respondWithError(
    interaction: ChatInputCommandInteraction,
    message?: string,
  ): Promise<void> {
    const content = message ?? tErrors('generic');

    try {
      if (interaction.replied) {
        return;
      }

      if (interaction.deferred) {
        await interaction.editReply({ content });
        return;
      }

      await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    } catch (error) {
      integrationLog.warn({ err: error }, 'Failed to send interaction error response');
    }
  }

  public async executeCommand(
    commandName: string,
    args: Record<string, unknown> = {},
    guildId?: string,
    channelId?: string,
    userId?: string,
  ): Promise<CommandExecution> {
    integrationLog.info({ command: commandName, guildId, channelId, userId, argKeys: Object.keys(args) }, 'Dispatching Discord command');

    if (!this.client) {
      throw new Error('Discord client not initialized');
    }

    const contextOptions = await this.buildDashboardContextOptions(args, guildId, channelId, userId);
    const context = new DashboardCommandContext(contextOptions);

    const execution = await this.commandRegistry.executeCommand(commandName, args, context);
    integrationLog.info({ command: commandName, guildId, channelId, executionId: execution.id }, 'Discord command execution completed');

    return execution;
  }

  private async buildDashboardContextOptions(
    args: Record<string, unknown>,
    guildId?: string,
    channelId?: string,
    userId?: string,
  ): Promise<DashboardCommandContextOptions> {
    if (!this.client) {
      throw new Error('Discord client not initialized');
    }

    let guild: Guild | null = null;
    if (guildId) {
      guild = await this.client.guilds.fetch(guildId);
    } else {
      const guilds = await this.client.guilds.fetch();
      const firstGuild = guilds.first();
      if (firstGuild) {
        guild = await firstGuild.fetch();
      }
    }

    if (!guild) {
      throw new Error('Unable to resolve guild for command execution');
    }

    let channel: GuildBasedChannel | null = null;
    if (channelId) {
      const fetchedChannel = await guild.channels.fetch(channelId);
      if (fetchedChannel && (fetchedChannel.isTextBased() || fetchedChannel.isVoiceBased())) {
        channel = fetchedChannel;
      }
    }

    let user: User | null = null;
    if (userId) {
      try {
        user = await this.client.users.fetch(userId);
      } catch (error) {
        integrationLog.warn({ userId, err: error }, 'Failed to fetch user for command context');
      }
    }

    let member: GuildMember | null = null;
    if (userId) {
      try {
        member = await guild.members.fetch(userId);
      } catch (error) {
        integrationLog.warn({ guildId: guild.id, userId, err: error }, 'Failed to fetch guild member for command context');
      }
    }

    return {
      guild,
      channel,
      user,
      member,
      locale: guild.preferredLocale ?? 'en-US',
      args,
    };
  }

  public async validateCommandExecution(
    commandName: string,
    guildId?: string,
    channelId?: string,
  ): Promise<{ valid: boolean; error?: string }> {
    integrationLog.debug({ command: commandName, guildId, channelId }, 'Validating command context');

    if (!this.client) {
      return { valid: false, error: 'Discord client not initialized' };
    }

    await this.commandRegistry.waitUntilLoaded();
    const command = this.commandRegistry.getCommandHandler(commandName);
    if (!command) {
      integrationLog.warn({ command: commandName }, 'Command validation failed - command not found');
      return { valid: false, error: `Command '${commandName}' not found` };
    }

    if (guildId) {
      try {
        await this.client.guilds.fetch(guildId);
      } catch {
        return { valid: false, error: `Cannot access guild ${guildId}` };
      }
    }

    if (channelId && guildId) {
      try {
        const guild = await this.client.guilds.fetch(guildId);
        await guild.channels.fetch(channelId);
      } catch {
        return { valid: false, error: `Cannot access channel ${channelId}` };
      }
    }

    integrationLog.info({ command: commandName, guildId, channelId }, 'Command context validated');
    return { valid: true };
  }

  public async getAvailableGuilds(): Promise<Array<{ id: string; name: string }>> {
    if (!this.client) {
      return [];
    }

    try {
      const guilds = await this.client.guilds.fetch();
      const guildList = await Promise.all(
        guilds.map(async (guild) => {
          const fullGuild = await guild.fetch();
          return {
            id: fullGuild.id,
            name: fullGuild.name,
          };
        }),
      );
      return guildList;
    } catch (error) {
      integrationLog.error({ err: error }, 'Failed to fetch guild listing');
      return [];
    }
  }

  public async getAvailableChannels(
    guildId: string,
  ): Promise<Array<{ id: string; name: string; type: string }>> {
    if (!this.client) {
      return [];
    }

    try {
      const guild = await this.client.guilds.fetch(guildId);
      const channels = await guild.channels.fetch();

      return channels
        .filter((channel) => channel !== null)
        .map((channel) => ({
          id: channel!.id,
          name: channel!.name,
          type: channel!.type === 0 ? 'text' : channel!.type === 2 ? 'voice' : 'other',
        }));
    } catch (error) {
      integrationLog.error({ guildId, err: error }, 'Failed to fetch channels for guild');
      return [];
    }
  }
}

let activeIntegration: DiscordBotIntegration | null = null;

export const registerDiscordIntegration = (integration: DiscordBotIntegration): void => {
  activeIntegration = integration;
};

export const executeCommand = (
  commandName: string,
  args: Record<string, unknown> = {},
  guildId?: string,
  channelId?: string,
  userId?: string,
) => {
  if (!activeIntegration) {
    throw new Error('Discord bot integration not initialised');
  }
  return activeIntegration.executeCommand(commandName, args, guildId, channelId, userId);
};

export const handleChatInputInteraction = async (
  interaction: ChatInputCommandInteraction,
): Promise<void> => {
  if (!activeIntegration) {
    integrationLog.warn('Discord bot integration not initialised for slash interaction');
    if (!interaction.replied) {
      try {
        if (interaction.deferred) {
          await interaction.editReply({ content: tErrors('generic') });
        } else {
          await interaction.reply({ content: tErrors('generic'), flags: MessageFlags.Ephemeral });
        }
      } catch (error) {
        integrationLog.warn({ err: error }, 'Failed to send fallback interaction response');
      }
    }
    return;
  }

  await activeIntegration.handleChatInputInteraction(interaction);
};
