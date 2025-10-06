import { useEffect, useCallback } from 'react';
import { useBotStore } from '@/stores/useBotStore';
import { CommandExecution } from 'discord-dashboard-shared';

export function useCommandSync() {
  const { commandHistory, addCommandExecution } = useBotStore();

  // Listen for real-time command execution updates
  useEffect(() => {
    // The WebSocket service already handles command_result messages
    // and calls addCommandExecution through the store
  }, []);

  const getLatestExecution = useCallback(
    (commandId: string): CommandExecution | undefined => {
      return commandHistory.find((execution) => execution.id === commandId);
    },
    [commandHistory],
  );

  const getCommandHistory = useCallback(
    (filters?: { command?: string; status?: CommandExecution['status']; limit?: number }): CommandExecution[] => {
      let filtered = [...commandHistory];

      if (filters?.command) {
        filtered = filtered.filter((exec) => exec.command === filters.command);
      }

      if (filters?.status) {
        filtered = filtered.filter((exec) => exec.status === filters.status);
      }

      if (filters?.limit) {
        filtered = filtered.slice(0, filters.limit);
      }

      return filtered;
    },
    [commandHistory],
  );

  return {
    commandHistory,
    addCommandExecution,
    getLatestExecution,
    getCommandHistory,
  };
}
