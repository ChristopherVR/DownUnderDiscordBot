import { Request, Response } from 'express';
import { CommandRegistry } from '../helpers/commands/CommandRegistry';
import { DiscordBotIntegration, registerDiscordIntegration } from '../helpers/commands/DiscordBotIntegration';
import { WebSocketManager } from '../helpers/websocket';
import { CommandExecution, CommandDefinition, CommandOption } from 'discord-dashboard-shared';
import { Client, Events, ApplicationCommandOptionType, ApplicationCommandType, ApplicationCommandData, ApplicationCommandOptionData, ChatInputApplicationCommandData } from 'discord.js';
import { ValidationError } from '../helpers/errorHandler';
import { expressRouter } from '../helpers/expressRouter';
import { tErrors } from 'discord-dashboard-shared/localization';
import { Logger } from 'pino';
import { createLogger } from '../helpers/logger';

const router = expressRouter();
const commandLog = createLogger('commands-api');
const requestLogBase = commandLog.child({ layer: 'commands-router' });
const resolveRequestLog = (req: Request): Logger => (req as Request & { log?: Logger }).log ?? requestLogBase;

// Global instances
let commandRegistry: CommandRegistry;
let discordIntegration: DiscordBotIntegration;
type CommandBroadcast = Pick<WebSocketManager, 'broadcastCommandResult'>;
let wsManager: CommandBroadcast | null = null;
let registryReady: Promise<void> | null = null;
let commandsRegistered = false;

const buildSlashOption = (option: CommandOption): ApplicationCommandOptionData => {
  switch (option.type) {
    case 'integer': {
      const choices = option.choices?.map((choice) => ({
        name: choice.name,
        value: typeof choice.value === 'number' ? choice.value : Number(choice.value),
      }));
      return {
        type: ApplicationCommandOptionType.Integer,
        name: option.name,
        description: option.description,
        required: option.required ?? false,
        choices,
        min_value: option.min,
        max_value: option.max,
      };
    }
    case 'boolean':
      return {
        type: ApplicationCommandOptionType.Boolean,
        name: option.name,
        description: option.description,
        required: option.required ?? false,
      };
    case 'file':
      return {
        type: ApplicationCommandOptionType.Attachment,
        name: option.name,
        description: option.description,
        required: option.required ?? false,
      };
    default: {
      const choices = option.choices?.map((choice) => ({
        name: choice.name,
        value: typeof choice.value === 'string' ? choice.value : String(choice.value),
      }));
      return {
        type: ApplicationCommandOptionType.String,
        name: option.name,
        description: option.description,
        required: option.required ?? false,
        choices,
      };
    }
  }
};

const waitForClientReady = async (client: Client): Promise<void> => {
  const isReady = (client as unknown as { isReady?: () => boolean }).isReady;
  if (typeof isReady === 'function' && isReady.call(client)) {
    return;
  }
  if ((client as { readyAt: Date | null }).readyAt) {
    return;
  }

  await new Promise<void>((resolve) => {
    const onReady = () => {
      client.off(Events.ClientReady, onReady);
      resolve();
    };
    client.once(Events.ClientReady, onReady);
  });
};

const registerSlashCommandsWithDiscord = async (client: Client, registry: CommandRegistry): Promise<boolean> => {
  try {
    await waitForClientReady(client);

    const definitions = registry.getCommandDefinitions();
    if (!definitions.length) {
      commandLog.info('No command definitions found for registration');
      return true;
    }

    const slashCommands: ApplicationCommandData[] = definitions.map((definition) => {
      const commandData: ChatInputApplicationCommandData = {
        type: ApplicationCommandType.ChatInput,
        name: definition.name,
        description: definition.description,
      };

      const options = definition.options?.map((option) => buildSlashOption(option));
      if (options && options.length > 0) {
        commandData.options = options;
      }

      return commandData;
    });

    const guildId = process.env.GUILD_ID;
    if (guildId) {
      const guild = await client.guilds.fetch(guildId);
      await guild.commands.set(slashCommands);
      commandLog.info({ guildId, count: slashCommands.length }, 'Registered guild slash commands');
    } else if (client.application) {
      await client.application.commands.set(slashCommands);
      commandLog.info({ count: slashCommands.length }, 'Registered global slash commands');
    } else {
      commandLog.warn('Discord application instance unavailable; could not register slash commands');
      return false;
    }

    return true;
  } catch (error) {
    commandLog.error({ err: error }, 'Failed to register slash commands');
    return false;
  }
};

const ensureSlashCommandsRegistered = async (client?: Client): Promise<void> => {
  if (!client || commandsRegistered || !commandRegistry) {
    return;
  }

  if (registryReady) {
    try {
      await registryReady;
    } catch {
      return;
    }
  }

  const registered = await registerSlashCommandsWithDiscord(client, commandRegistry);
  if (registered) {
    commandsRegistered = true;
  }
};


export function initializeCommandRoutes(wsManagerInstance: CommandBroadcast, discordClient?: Client) {
  commandLog.info({ hasDiscordClient: Boolean(discordClient) }, 'Initializing command routes');
  commandRegistry = new CommandRegistry();
  discordIntegration = new DiscordBotIntegration(commandRegistry);
  registerDiscordIntegration(discordIntegration);
  wsManager = wsManagerInstance;

  // Set Discord client if provided
  if (discordClient) {
    discordIntegration.setClient(discordClient);
  }

  // Load known commands asynchronously
  registryReady = commandRegistry
    .loadKnownCommands()
    .then(async () => {
      if (discordClient) {
        await ensureSlashCommandsRegistered(discordClient);
      }
    })
    .catch((error) => {
      commandLog.error({ err: error }, 'Failed to load commands');
    });

  if (discordClient) {
    void ensureSlashCommandsRegistered(discordClient);
  }

  return router.getRouter();
}

export function setDiscordClient(client: Client): void {
  commandLog.debug('Discord client updated on command integration');
  if (discordIntegration) {
    discordIntegration.setClient(client);
  }
  void ensureSlashCommandsRegistered(client);
}

/**
 * GET /api/commands/registry
 * Returns all available commands with their definitions
 */
router.get('/registry', (req: Request, res: Response) => {
  const log = resolveRequestLog(req).child({ endpoint: 'registry' });
  const commands = commandRegistry.getCommandDefinitions();
  log.debug({ count: commands.length }, 'Returning command registry');
  res.json({
    success: true,
    commands,
    count: commands.length,
  });
});

/**
 * POST /api/commands/execute
 * Executes a command with the provided arguments
 */
interface ExecuteCommandRequest {
  command: string;
  arguments?: Record<string, unknown>;
  guildId?: string;
  channelId?: string;
  userId?: string;
}

router.post('/execute', async (req: Request, res: Response) => {
  if (registryReady) {
    try {
      await registryReady;
    } catch {
      // Continue even if command loading failed; validation will handle missing commands
    }
  }

  const { command, arguments: args = {}, guildId, channelId, userId }: ExecuteCommandRequest = req.body;
  const requestLog = resolveRequestLog(req).child({ endpoint: 'execute', command });
  requestLog.info({ command, guildId, channelId, userId, argKeys: Object.keys(args) }, 'Command execution requested');

  if (!command || typeof command !== 'string') {
    requestLog.warn('Command name is missing or invalid');
    throw new ValidationError('errors.command.validation.required', {
      component: 'CommandExecutor',
      action: 'execute',
    });
  }

  // Validate command execution context
  const validation = await discordIntegration.validateCommandExecution(command, guildId, channelId);
  if (!validation.valid) {
    requestLog.warn({ guildId, channelId }, 'Command validation failed');
    throw new ValidationError('errors.command.invalid', {
      component: 'CommandExecutor',
      action: 'execute',
      guildId,
    });
  }

  // Execute the command through Discord integration
  const execution = await discordIntegration.executeCommand(command, args, guildId, channelId, userId);
  requestLog.info({ executionId: execution.id, status: execution.status }, 'Command execution completed');

  // Broadcast the result via WebSocket
  if (wsManager) {
    wsManager.broadcastCommandResult(execution);
    requestLog.debug({ executionId: execution.id }, 'Command result broadcasted');
  }

  // Return the execution result
  res.json({
    success: true,
    execution,
  });
});

/**
 * GET /api/commands/history
 * Returns command execution history with optional filtering
 */
router.get('/history', (req: Request, res: Response) => {
  const log = resolveRequestLog(req).child({ endpoint: 'history' });
  const { limit = 50, command, status, since } = req.query;
  log.debug({ limit, command, status, since }, 'Command history requested');

  const options: { limit?: number; command?: string; status?: CommandExecution['status']; since?: number } = {};

  if (limit) {
    options.limit = parseInt(limit as string, 10);
  }

  if (command) {
    options.command = command as string;
  }

  if (status && ['success', 'error', 'pending'].includes(status as string)) {
    options.status = status as CommandExecution['status'];
  }

  if (since) {
    options.since = parseInt(since as string, 10);
  }

  const history = commandRegistry.getCommandHistory(options);
  log.info({ count: history.length }, 'Command history retrieved');

  res.json({
    success: true,
    history,
    count: history.length,
  });
});

/**
 * GET /api/commands/history/:executionId
 * Returns a specific command execution by ID
 */
router.get('/history/:executionId', (req: Request, res: Response) => {
  const { executionId } = req.params;
  const log = resolveRequestLog(req).child({ endpoint: 'history:execution', executionId });
  log.debug('Command execution lookup requested');
  const execution = commandRegistry.getCommandExecution(executionId);

  if (!execution) {
    log.warn({ executionId }, 'Command execution not found');
    return res.status(404).json({
      success: false,
      error: tErrors('command.notFound'),
    });
  }

  res.json({
    success: true,
    execution,
  });
});

/**
 * DELETE /api/commands/history
 * Clears command execution history
 */
router.delete('/history', (req: Request, res: Response) => {
  const log = resolveRequestLog(req).child({ endpoint: 'history:clear' });
  commandRegistry.clearHistory();
  log.warn('Command history cleared');

  res.json({
    success: true,
    message: 'Command history cleared',
  });
});

/**
 * GET /api/commands/stats
 * Returns command usage statistics
 */
router.get('/stats', (req: Request, res: Response) => {
  const log = resolveRequestLog(req).child({ endpoint: 'stats' });
  log.debug('Command stats requested');
  const stats = commandRegistry.getStats();
  log.info({ stats }, 'Command stats calculated');

  res.json({
    success: true,
    stats,
  });
});

/**
 * POST /api/commands/validate
 * Validates command arguments without executing the command
 */
router.post('/validate', (req: Request, res: Response) => {
  const { command, arguments: args = {} } = req.body;
  const log = resolveRequestLog(req).child({ endpoint: 'validate', command });
  log.debug({ command, argKeys: Object.keys(args) }, 'Command validation requested');

  if (!command || typeof command !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Command name is required and must be a string',
    });
  }

  const validation = commandRegistry.validateArguments(command, args);
  log.info({ valid: validation.valid }, 'Command validation result computed');

  res.json({
    success: true,
    validation,
  });
});

/**
 * GET /api/commands/guilds
 * Returns available Discord guilds for command execution
 */
router.get('/guilds', async (req: Request, res: Response) => {
  const log = resolveRequestLog(req).child({ endpoint: 'guilds' });
  log.debug('Guild list requested');
  const guilds = await discordIntegration.getAvailableGuilds();
  log.info({ guildCount: guilds.length }, 'Guild list retrieved');

  res.json({
    success: true,
    guilds,
  });
});

/**
 * GET /api/commands/guilds/:guildId/channels
 * Returns available channels for a specific guild
 */
router.get('/guilds/:guildId/channels', async (req: Request, res: Response) => {
  const { guildId } = req.params;
  const log = resolveRequestLog(req).child({ endpoint: 'guild-channels', guildId });
  log.debug('Guild channel list requested');
  const channels = await discordIntegration.getAvailableChannels(guildId);
  log.info({ channelCount: channels.length, guildId }, 'Guild channels retrieved');

  res.json({
    success: true,
    channels,
  });
});

/**
 * POST /api/commands/validate-context
 * Validates that a command can be executed in the given Discord context
 */
router.post('/validate-context', async (req: Request, res: Response) => {
  const { command, guildId, channelId } = req.body;
  const log = resolveRequestLog(req).child({ endpoint: 'validate-context', command, guildId, channelId });
  log.debug('Context validation requested');

  if (!command || typeof command !== 'string') {
    log.warn('Context validation rejected - missing command name');
    return res.status(400).json({
      success: false,
      error: 'Command name is required and must be a string',
    });
  }

  const validation = await discordIntegration.validateCommandExecution(command, guildId, channelId);
  log.info({ valid: validation.valid }, 'Context validation completed');

  res.json({
    success: true,
    validation,
  });
});

export default router.getRouter();











