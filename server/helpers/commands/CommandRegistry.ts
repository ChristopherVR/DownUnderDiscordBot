import {
  CommandDefinition,
  CommandOption,
  CommandExecution,
  DiscordCommandOption,
  DiscordCommandChoice,
} from '../../../shared/src/types/index.js';
import { URL } from 'node:url';
import { v4 as uuid } from 'uuid';
import { tCommands, tErrors } from 'discord-dashboard-shared/localization';
import { StateCoordinator, InactiveInstanceError } from '../../state/StateCoordinator';
import { createLogger } from '../logger';
import { MessageFlags } from 'discord.js';
import { CommandHandler } from '../../types/commands';
import { CommandContext, DashboardCommandContext, DashboardCommandContextOptions } from './CommandContext';

const registryLog = createLogger('command-registry');

const KNOWN_COMMAND_MODULES = [
  'play',
  'pause',
  'resume',
  'stop',
  'skip',
  'volume',
  'loop',
  'queue',
  'nowplaying',
  'shuffle',
  'seek',
  'jump',
  'back',
  'clear',
  'remove',
  'save',
  'playnext',
  'set-active',
  'status',
  'hello',
  'meme',
  'ask',
  'shutdown',
];

type CommandHistoryFilters = {
  limit?: number;
  command?: string;
  status?: CommandExecution['status'];
  since?: number;
};

const OPTION_TYPE_MAP: Record<number, CommandOption['type']> = {
  3: 'string',
  4: 'integer',
  5: 'boolean',
  11: 'file',
};

const isCommandContext = (value: unknown): value is CommandContext => {
  return typeof value === 'object' && value !== null && 'type' in (value as Record<string, unknown>);
};

const isDashboardContextOptions = (value: unknown): value is DashboardCommandContextOptions => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const possible = value as Record<string, unknown>;
  return (
    'guild' in possible ||
    'channel' in possible ||
    'user' in possible ||
    'member' in possible ||
    'locale' in possible ||
    'args' in possible
  );
};

export class CommandRegistry {
  private static readonly MUSIC_COMMANDS = new Set<string>([
    'play',
    'pause',
    'resume',
    'stop',
    'skip',
    'queue',
    'nowplaying',
    'loop',
    'jump',
    'back',
    'clear',
    'remove',
    'playnext',
    'seek',
    'shuffle',
    'volume',
    'save',
  ]);

  private commands: Map<string, CommandHandler> = new Map();
  private commandLookup: Map<string, CommandHandler> = new Map();
  private commandHistory: CommandExecution[] = [];
  private maxHistorySize = 1000;
  private initializationPromise: Promise<void> | null = null;
  private hasLoaded = false;

  public async loadKnownCommands(): Promise<void> {
    if (this.hasLoaded) {
      return;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.internalLoadKnownCommands()
        .then(() => {
          this.hasLoaded = true;
        })
        .finally(() => {
          this.initializationPromise = null;
        });
    }

    await this.initializationPromise;
  }

  public async waitUntilLoaded(): Promise<void> {
    await this.loadKnownCommands();
  }

  private async internalLoadKnownCommands(): Promise<void> {
    registryLog.info({ moduleCount: KNOWN_COMMAND_MODULES.length }, 'Loading known command modules');
    for (const moduleName of KNOWN_COMMAND_MODULES) {
      try {
        await this.loadCommandModule(moduleName);
      } catch (error) {
        registryLog.warn({ module: moduleName, err: error }, 'Failed to load command module');
      }
    }
    registryLog.info({ registeredCount: this.commands.size }, 'Finished loading command modules');
  }

  private async loadCommandModule(moduleName: string): Promise<void> {
    const extensions = ['.js', '.ts', '.mjs', '.cjs'];

    for (const extension of extensions) {
      try {
        const moduleUrl = new URL(`../../commands/${moduleName}${extension}`, import.meta.url);
        const module = await import(moduleUrl.href);
        const commandFactory = module.default;
        if (typeof commandFactory !== 'function') {
          continue;
        }

        const command = commandFactory();
        if (!command || !command.name || typeof command.run !== 'function') {
          continue;
        }

        this.registerCommand(command, moduleName);
        // registryLog.debug({ module: moduleName, command: command.name }, 'Command module registered');

        return;
      } catch (error) {
        registryLog.debug({ module: moduleName, extension, err: error }, 'Command module import failed');
      }
    }

    throw new Error(`Unable to load command module '${moduleName}'`);
  }

  public registerCommand(command: CommandHandler, alias?: string): void {
    this.commands.set(command.name, command);
    this.commandLookup.set(command.name.toLowerCase(), command);
    if (alias) {
      this.commandLookup.set(alias.toLowerCase(), command);
    }
  }

  public getCommandHandler(name: string): CommandHandler | undefined {
    return this.commands.get(name) ?? this.commandLookup.get(name.toLowerCase());
  }

  public getCommandDefinitions(): CommandDefinition[] {
    return Array.from(this.commands.values()).map((command) => ({
      name: command.name,
      description: command.description,
      options: this.convertOptions(command.options ?? []),
      category: command.category ?? 'general',
    }));
  }

  private convertOptions(options: DiscordCommandOption[]): CommandOption[] {
    return options.map((option) => ({
      name: option.name,
      description: option.description,
      type: this.convertOptionType(option.type),
      required: option.required ?? false,
      choices: option.choices?.map((choice: DiscordCommandChoice) => ({
        name: choice.name,
        value: choice.value,
      })),
      min: (option as { min_value?: number }).min_value,
      max: (option as { max_value?: number }).max_value,
    }));
  }

  private convertOptionType(discordType: number): CommandOption['type'] {
    return OPTION_TYPE_MAP[discordType] ?? 'string';
  }

  public validateArguments(commandName: string, args: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const command = this.getCommandHandler(commandName);
    if (!command) {
      return { valid: false, errors: [tErrors('command.notFound')] };
    }

    const options = this.convertOptions(command.options ?? []);
    const errors: string[] = [];

    for (const option of options) {
      const value = args[option.name];
      const hasValue = value !== undefined && value !== null && value !== '';

      if (option.required && !hasValue) {
        errors.push(tErrors('command.validation.required', { field: option.name }));
        continue;
      }

      if (!hasValue) {
        continue;
      }

      const typeError = this.validateArgumentType(option, value);
      if (typeError) {
        errors.push(typeError);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private validateArgumentType(option: CommandOption, value: unknown): string | null {
    switch (option.type) {
      case 'integer': {
        const numericValue = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(numericValue) || !Number.isFinite(numericValue) || !Number.isInteger(numericValue)) {
          return tErrors('command.validation.invalidType', { field: option.name, expected: 'integer' });
        }
        return null;
      }
      case 'boolean': {
        if (typeof value === 'boolean') {
          return null;
        }
        if (typeof value === 'string') {
          const lowered = value.toLowerCase();
          if (lowered === 'true' || lowered === 'false') {
            return null;
          }
        }
        return tErrors('command.validation.invalidType', { field: option.name, expected: 'boolean' });
      }
      default:
        return null;
    }
  }

  private async sendEphemeral(context: CommandContext, content: string): Promise<void> {
    try {
      if (context.replied || context.deferred) {
        await context.followUp({ content, flags: MessageFlags.Ephemeral });
      } else {
        await context.reply({ content, flags: MessageFlags.Ephemeral });
      }
    } catch (error) {
      registryLog.warn({ err: error }, 'Failed to send command response');
    }
  }

  private async enforceActiveInstance(commandName: string, context: CommandContext): Promise<void> {
    if (!CommandRegistry.MUSIC_COMMANDS.has(commandName)) {
      return;
    }

    const guildId = context.guildId;
    if (!guildId) {
      return;
    }

    if (!StateCoordinator.hasInstance()) {
      return;
    }

    try {
      await StateCoordinator.get().ensureLocalIsActive(guildId, commandName);
    } catch (error) {
      if (error instanceof InactiveInstanceError) {
        await this.sendEphemeral(
          context,
          tCommands('setActive.responses.alreadyActive', { instance: error.activeInstanceId ?? 'unknown' }),
        );
      } else {
        await this.sendEphemeral(context, tErrors('bot.management.instanceOffline'));
      }
      throw error;
    }
  }

  public async executeCommand(
    commandName: string,
    args: Record<string, unknown> = {},
    contextInput?: CommandContext | DashboardCommandContextOptions,
  ): Promise<CommandExecution> {
    const executionId = uuid();
    registryLog.info({ executionId, command: commandName, argKeys: Object.keys(args) }, 'Executing command request');

    const execution: CommandExecution = {
      id: executionId,
      command: commandName,
      arguments: args,
      timestamp: Date.now(),
      status: 'pending',
    };

    try {
      await this.waitUntilLoaded();

      const validation = this.validateArguments(commandName, args);
      if (!validation.valid) {
        execution.status = 'error';
        execution.error = validation.errors.join(', ');
        registryLog.warn({ command: commandName, errors: validation.errors }, 'Command validation failed');
        this.addToHistory(execution);
        return execution;
      }

      const command = this.getCommandHandler(commandName);
      if (!command) {
        execution.status = 'error';
        execution.error = `Command '${commandName}' not found`;
        this.addToHistory(execution);
        return execution;
      }

      const context = this.resolveContext(args, contextInput);

      try {
        await this.enforceActiveInstance(command.name, context);
      } catch (error) {
        if (error instanceof InactiveInstanceError) {
          execution.status = 'error';
          execution.error = tErrors('bot.management.instanceOffline');
          this.addToHistory(execution);
          return execution;
        }
        throw error;
      }

      const result = await command.run(context, args);
      execution.status = 'success';

      if (context.type === 'dashboard') {
        const dashboardContext = context as DashboardCommandContext;
        const responses = dashboardContext.getResponses();
        if (responses.length || result !== undefined) {
          execution.result = { result, responses };
        } else if (result !== undefined) {
          execution.result = result;
        }
      } else if (result !== undefined) {
        execution.result = result;
      }
    } catch (error) {
      execution.status = 'error';
      execution.error = error instanceof Error ? error.message : tErrors('generic');
    }

    this.addToHistory(execution);
    return execution;
  }

  private resolveContext(
    args: Record<string, unknown>,
    contextInput?: CommandContext | DashboardCommandContextOptions,
  ): CommandContext {
    if (contextInput) {
      if (isCommandContext(contextInput)) {
        return contextInput;
      }
      if (isDashboardContextOptions(contextInput)) {
        return new DashboardCommandContext({ ...contextInput, args });
      }
    }

    return new DashboardCommandContext({ args });
  }

  private addToHistory(execution: CommandExecution): void {
    this.commandHistory.unshift(execution);
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory = this.commandHistory.slice(0, this.maxHistorySize);
    }
  }

  public getCommandHistory(filters: CommandHistoryFilters = {}): CommandExecution[] {
    let history = [...this.commandHistory];

    if (filters.command) {
      history = history.filter((execution) => execution.command === filters.command);
    }

    if (filters.status) {
      history = history.filter((execution) => execution.status === filters.status);
    }

    if (filters.since) {
      history = history.filter((execution) => execution.timestamp >= filters.since!);
    }

    if (filters.limit) {
      history = history.slice(0, filters.limit);
    }

    return history;
  }

  public getCommandExecution(executionId: string): CommandExecution | undefined {
    return this.commandHistory.find((execution) => execution.id === executionId);
  }

  public clearHistory(): void {
    this.commandHistory = [];
  }

  public getStats(): {
    totalCommands: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    mostUsedCommands: Array<{ command: string; count: number }>;
  } {
    const commandCounts = new Map<string, number>();
    let successful = 0;
    let failed = 0;

    for (const execution of this.commandHistory) {
      commandCounts.set(execution.command, (commandCounts.get(execution.command) ?? 0) + 1);

      if (execution.status === 'success') {
        successful += 1;
      } else if (execution.status === 'error') {
        failed += 1;
      }
    }

    const mostUsedCommands = Array.from(commandCounts.entries())
      .map(([command, count]) => ({ command, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalCommands: this.commands.size,
      totalExecutions: this.commandHistory.length,
      successfulExecutions: successful,
      failedExecutions: failed,
      mostUsedCommands,
    };
  }
}
