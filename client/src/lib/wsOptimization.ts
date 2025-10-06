/**
 * WebSocket Message Optimization
 *
 * This module provides optimizations for WebSocket communication to reduce
 * bandwidth usage and improve performance.
 */

// Message compression and deduplication
export class WebSocketOptimizer {
  private messageCache = new Map<string, { type: string; payload: unknown; timestamp: number }>();
  private subscriptions = new Set<string>();
  private lastHeartbeat = 0;
  private compressionEnabled = true;

  constructor(private compressionThreshold = 1024) {}

  /**
   * Optimize outgoing messages
   */
  optimizeOutgoingMessage(
    type: string,
    payload: unknown,
  ): { type: string; payload: unknown; compressed?: boolean } | null {
    const normalizedPayload = this.normalizeSubscriptionPayload(type, payload);
    const subscriptionPayload = normalizedPayload as { type?: string };
    const eventType = subscriptionPayload?.type;

    if (type === 'subscribe') {
      if (eventType && !this.subscriptions.has(eventType)) {
        this.subscriptions.add(eventType);
      } else if (eventType && this.subscriptions.has(eventType)) {
        return null;
      }
    }

    if (type === 'unsubscribe' && eventType) {
      this.subscriptions.delete(eventType);
    }

    if (this.compressionEnabled && JSON.stringify(normalizedPayload).length > this.compressionThreshold) {
      return {
        type,
        payload: this.compressPayload(normalizedPayload),
        compressed: true,
      };
    }

    return { type, payload: normalizedPayload };
  }

  /**

  /**
   * Optimize incoming messages with deduplication
   */
  optimizeIncomingMessage(message: {
    type: string;
    payload: unknown;
    compressed?: boolean;
  }): { type: string; payload: unknown } | null {
    const { type, payload, compressed } = message;

    // Decompress if needed
    const actualPayload = compressed ? this.decompressPayload(payload as string) : payload;

    // Generate cache key for deduplication
    const cacheKey = this.generateCacheKey(type, actualPayload);

    // Skip duplicate messages (except for real-time updates)
    if (this.shouldDeduplicate(type) && this.messageCache.has(cacheKey)) {
      const cached = this.messageCache.get(cacheKey);
      if (this.isMessageDuplicate(cached, actualPayload)) {
        return null; // Skip duplicate
      }
    }

    // Cache the message
    this.messageCache.set(cacheKey, { type, payload: actualPayload, timestamp: Date.now() });

    // Clean up old cache entries
    this.cleanupCache();

    return { type, payload: actualPayload };
  }

  /**
   * Batch multiple messages for efficient transmission
   */
  batchMessages(
    messages: Array<{ type: string; payload: unknown } | null>,
  ):
    | { type: string; payload: { messages: Array<{ type: string; payload: unknown }>; timestamp: number } }
    | { type: string; payload: unknown } {
    if (messages.length === 1) {
      return messages[0];
    }

    return {
      type: 'batch',
      payload: {
        messages: messages.filter((msg) => msg !== null),
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Optimize heartbeat messages
   */
  optimizeHeartbeat(): { type: string; payload: { timestamp: number } } | null {
    const now = Date.now();

    // Only send heartbeat if enough time has passed
    if (now - this.lastHeartbeat < 30000) {
      // 30 seconds
      return null;
    }

    this.lastHeartbeat = now;
    return {
      type: 'heartbeat',
      payload: { timestamp: now },
    };
  }

  /**
   * Selective subscription management
   */
  manageSubscriptions(activeComponents: string[]): Array<{ type: string; payload: { type: string } }> {
    const messages: Array<{ type: string; payload: { type: string } }> = [];
    const requiredEvents = this.getRequiredEvents(activeComponents);

    // Subscribe to new events
    for (const event of requiredEvents) {
      if (!this.subscriptions.has(event)) {
        messages.push({
          type: 'subscribe',
          payload: { type: event },
        });
        this.subscriptions.add(event);
      }
    }

    // Unsubscribe from unused events
    for (const event of this.subscriptions) {
      if (!requiredEvents.includes(event)) {
        messages.push({
          type: 'unsubscribe',
          payload: { type: event },
        });
        this.subscriptions.delete(event);
      }
    }

    return messages;
  }

  private normalizeSubscriptionPayload(type: string, payload: unknown): unknown {
    if ((type === 'subscribe' || type === 'unsubscribe') && payload && typeof payload === 'object') {
      const subscription = payload as { type?: string; event?: string } & Record<string, unknown>;
      const eventType = typeof subscription.type === 'string' ? subscription.type : subscription.event;

      if (typeof eventType === 'string') {
        const { event: _unusedEvent, ...rest } = subscription;
        return {
          ...rest,
          type: eventType,
        };
      }

      const { event: _event, ...rest } = subscription;
      return rest;
    }

    return payload;
  }

  private compressPayload(payload: unknown): string {
    // Simple compression - in production, use a proper compression library
    const jsonString = JSON.stringify(payload);

    // Remove unnecessary whitespace and common patterns
    return jsonString.replace(/\s+/g, ' ').replace(/,\s*}/g, '}').replace(/{\s*,/g, '{').trim();
  }

  private decompressPayload(compressed: string): unknown {
    try {
      return JSON.parse(compressed);
    } catch {
      // Return empty object on decompression failure
      return {};
    }
  }

  private generateCacheKey(type: string, payload: unknown): string {
    // Create a stable cache key
    const payloadKey =
      typeof payload === 'object' ? JSON.stringify(payload, Object.keys(payload).sort()) : String(payload);

    return `${type}:${payloadKey}`;
  }

  private shouldDeduplicate(type: string): boolean {
    // Don't deduplicate real-time updates
    const realTimeTypes = ['player_state', 'bot_status', 'log_entry'];
    return !realTimeTypes.includes(type);
  }

  private isMessageDuplicate(cached: unknown, current: unknown): boolean {
    // For objects, do deep comparison of relevant fields
    if (this.isPlainObject(cached) && this.isPlainObject(current)) {
      // Skip timestamp fields for comparison
      const { timestamp: _timestamp, lastUpdated: _lastUpdated, ...cachedData } = cached;
      const { timestamp: _currentTimestamp, lastUpdated: _currentLastUpdated, ...currentData } = current;

      return JSON.stringify(cachedData) === JSON.stringify(currentData);
    }

    return cached === current;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private cleanupCache(): void {
    // Keep cache size manageable
    if (this.messageCache.size > 1000) {
      const entries = Array.from(this.messageCache.entries());
      const toKeep = entries.slice(-500); // Keep last 500 entries

      this.messageCache.clear();
      toKeep.forEach(([key, value]) => {
        this.messageCache.set(key, value);
      });
    }
  }

  private getRequiredEvents(activeComponents: string[]): string[] {
    const eventMap: Record<string, string[]> = {
      Dashboard: ['bot_status', 'player_state'],
      MusicPlayer: ['player_state', 'track_info'],
      CommandInvocation: ['command_result', 'command_history'],
      AuditLogs: ['log_entry', 'log_update'],
      BotManagement: ['bot_status', 'instance_update'],
    };

    const requiredEvents = new Set<string>();

    for (const component of activeComponents) {
      const events = eventMap[component] || [];
      events.forEach((event) => requiredEvents.add(event));
    }

    return Array.from(requiredEvents);
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      cacheSize: this.messageCache.size,
      subscriptions: this.subscriptions.size,
      compressionEnabled: this.compressionEnabled,
      lastHeartbeat: this.lastHeartbeat,
    };
  }

  /**
   * Reset optimizer state
   */
  reset(): void {
    this.messageCache.clear();
    this.subscriptions.clear();
    this.lastHeartbeat = 0;
  }
}

// Global optimizer instance
export const wsOptimizer = new WebSocketOptimizer();

// Hook for using WebSocket optimization in components
export const useWebSocketOptimization = (componentName: string) => {
  const manageSubscriptions = (isActive: boolean) => {
    if (isActive) {
      return wsOptimizer.manageSubscriptions([componentName]);
    } else {
      return wsOptimizer.manageSubscriptions([]);
    }
  };

  const optimizeMessage = (type: string, payload: unknown) => {
    return wsOptimizer.optimizeOutgoingMessage(type, payload);
  };

  const getStats = () => wsOptimizer.getStats();

  return {
    manageSubscriptions,
    optimizeMessage,
    getStats,
  };
};





