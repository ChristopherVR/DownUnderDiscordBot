import { getDatabase } from '../client.js';
import type { CommandExecution } from 'discord-dashboard-shared';

const MAX_HISTORY_SIZE = 1000;

export interface CommandHistoryFilters {
  limit?: number;
  command?: string;
  status?: CommandExecution['status'];
  since?: number;
}

export interface CommandStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  mostUsedCommands: Array<{ command: string; count: number }>;
}

function toCommandExecution(row: {
  id: string;
  command: string;
  arguments: string;
  status: string;
  error: string | null;
  result: string | null;
  timestamp: Date;
}): CommandExecution {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(row.arguments) as Record<string, unknown>;
  } catch {
    /* malformed - fall back to empty args rather than throwing on read */
  }

  let result: unknown;
  if (row.result !== null) {
    try {
      result = JSON.parse(row.result);
    } catch {
      result = row.result;
    }
  }

  return {
    id: row.id,
    command: row.command,
    arguments: args,
    status: row.status as CommandExecution['status'],
    error: row.error ?? undefined,
    result,
    timestamp: row.timestamp.getTime(),
  };
}

export class CommandExecutionRepository {
  private get db() {
    return getDatabase();
  }

  async record(execution: CommandExecution): Promise<void> {
    await this.db.commandExecution.create({
      data: {
        id: execution.id,
        command: execution.command,
        arguments: JSON.stringify(execution.arguments),
        status: execution.status,
        error: execution.error,
        result: execution.result !== undefined ? JSON.stringify(execution.result) : null,
        timestamp: new Date(execution.timestamp),
      },
    });

    // Keep the table bounded - this mirrors the previous in-memory cap so
    // command history can't grow forever, while now surviving restarts.
    const total = await this.db.commandExecution.count();
    if (total > MAX_HISTORY_SIZE) {
      const excess = total - MAX_HISTORY_SIZE;
      const oldest = await this.db.commandExecution.findMany({
        orderBy: { timestamp: 'asc' },
        take: excess,
        select: { id: true },
      });
      await this.db.commandExecution.deleteMany({ where: { id: { in: oldest.map((o) => o.id) } } });
    }
  }

  async getHistory(filters: CommandHistoryFilters = {}): Promise<CommandExecution[]> {
    const rows = await this.db.commandExecution.findMany({
      where: {
        ...(filters.command ? { command: filters.command } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.since ? { timestamp: { gte: new Date(filters.since) } } : {}),
      },
      orderBy: { timestamp: 'desc' },
      ...(filters.limit ? { take: filters.limit } : {}),
    });
    return rows.map(toCommandExecution);
  }

  async getExecution(executionId: string): Promise<CommandExecution | undefined> {
    const row = await this.db.commandExecution.findUnique({ where: { id: executionId } });
    return row ? toCommandExecution(row) : undefined;
  }

  async clearHistory(): Promise<void> {
    await this.db.commandExecution.deleteMany({});
  }

  async getStats(): Promise<CommandStats> {
    const [totalExecutions, successfulExecutions, failedExecutions, mostUsedRaw] = await Promise.all([
      this.db.commandExecution.count(),
      this.db.commandExecution.count({ where: { status: 'success' } }),
      this.db.commandExecution.count({ where: { status: 'error' } }),
      // Prisma's groupBy doesn't play well with this SQLite adapter setup
      // (see HistoryRepository.getMostPlayed) - raw query instead.
      this.db.$queryRaw<Array<{ command: string; count: number }>>`
        SELECT command, COUNT(*) as count
        FROM CommandExecution
        GROUP BY command
        ORDER BY count DESC
        LIMIT 10
      `,
    ]);

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      mostUsedCommands: mostUsedRaw.map((r) => ({ command: r.command, count: Number(r.count) })),
    };
  }
}
