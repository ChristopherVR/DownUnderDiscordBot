import { Message } from 'discord.js';
import { randomUUID } from 'crypto';
import { logger } from './helpers/logger/logger.js';

const instanceId = randomUUID();
let isActive = false; // Default to inactive
let statusMessage: Message | null = null;

export function getInstanceId(): string {
  return instanceId;
}

export function isInstanceActive(): boolean {
  return isActive;
}

export function setInstanceActive(active: boolean) {
  isActive = active;
  logger.info({ instanceId, isActive }, `Instance status updated.`);
  // Update status message immediately
  updateStatusMessage();
}

export function getStatusMessage(): Message | null {
  return statusMessage;
}

export function setStatusMessage(message: Message) {
  statusMessage = message;
}

export function getStatusMessagePayload(): { content: string } {
  const status = isActive ? '✅ ACTIVE' : '⚪ INACTIVE';
  return {
    content: `${status} [${instanceId}]`,
  };
}

export function updateStatusMessage() {
  if (statusMessage) {
    const payload = getStatusMessagePayload();
    statusMessage.edit(payload).catch((error) => {
      logger.error({ err: error }, 'Failed to update status message.');
    });
  }
}
