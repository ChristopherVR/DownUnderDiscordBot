// import { Request, Response } from 'express';
import type { LogMessage } from '../types';
import { expressRouter } from '../helpers/expressRouter';

export function createLogsRouter(auditLogs: LogMessage[], commandLogs: LogMessage[]) {
  const router = expressRouter();

  // Get logs with advanced filtering and sorting
  router.get('/', (req, res) => {
    const {
      type = 'audit',
      q = '',
      level,
      category,
      limit = '300',
      offset = '0',
      sortBy = 'timestamp',
      sortOrder = 'desc',
    } = req.query as {
      type?: string;
      q?: string;
      level?: string;
      category?: string;
      limit?: string;
      offset?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    let list = type === 'command' ? commandLogs : auditLogs;

    // If category is specified, filter across all logs
    if (category) {
      list = [...auditLogs, ...commandLogs].filter((l) => l.category === category);
    }

    const filtered = list.filter((l) => {
      const matchText = q
        ? l.message.toLowerCase().includes(String(q).toLowerCase()) ||
          l.category.toLowerCase().includes(String(q).toLowerCase()) ||
          l.level.toLowerCase().includes(String(q).toLowerCase()) ||
          (l.source && l.source.toLowerCase().includes(String(q).toLowerCase()))
        : true;
      const matchLevel = level ? l.level === level : true;
      return matchText && matchLevel;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'timestamp':
          aValue = a.ts;
          bValue = b.ts;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        case 'message':
          aValue = a.message;
          bValue = b.message;
          break;
        default:
          aValue = a.ts;
          bValue = b.ts;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = filtered.slice(startIndex, endIndex);

    res.json({
      items: paginatedItems,
      total: filtered.length,
      hasMore: endIndex < filtered.length,
      offset: startIndex,
      limit: parseInt(limit),
    });
  });

  // Get log statistics
  router.get('/stats', (req, res) => {
    const allLogs = [...auditLogs, ...commandLogs];

    const stats = {
      total: allLogs.length,
      byCategory: {
        audit: auditLogs.length,
        command: commandLogs.length,
        system: allLogs.filter((l) => l.category === 'system').length,
      },
      byLevel: {
        info: allLogs.filter((l) => l.level === 'info').length,
        warn: allLogs.filter((l) => l.level === 'warn').length,
        error: allLogs.filter((l) => l.level === 'error').length,
        debug: allLogs.filter((l) => l.level === 'debug').length,
      },
      recent: {
        lastHour: allLogs.filter((l) => l.ts > Date.now() - 3600000).length,
        lastDay: allLogs.filter((l) => l.ts > Date.now() - 86400000).length,
      },
    };

    res.json(stats);
  });

  // Clear logs (with optional filters)
  router.delete('/', (req, res) => {
    const { type, level, category } = req.query as {
      type?: string;
      level?: string;
      category?: string;
    };

    let clearedCount = 0;

    if (type === 'command' || category === 'command') {
      if (level) {
        // Remove only logs with specific level
        for (let i = commandLogs.length - 1; i >= 0; i--) {
          if (commandLogs[i].level === level) {
            commandLogs.splice(i, 1);
            clearedCount++;
          }
        }
      } else {
        // Clear all command logs
        clearedCount += commandLogs.length;
        commandLogs.length = 0;
      }
    }

    if (type === 'audit' || category === 'audit' || !type) {
      if (level) {
        // Remove only logs with specific level
        for (let i = auditLogs.length - 1; i >= 0; i--) {
          if (auditLogs[i].level === level) {
            auditLogs.splice(i, 1);
            clearedCount++;
          }
        }
      } else if (!type || type === 'audit') {
        // Clear all audit logs
        clearedCount += auditLogs.length;
        auditLogs.length = 0;
      }
    }

    res.json({
      success: true,
      message: `Cleared ${clearedCount} log entries`,
      clearedCount,
    });
  });

  return router.getRouter();
}
