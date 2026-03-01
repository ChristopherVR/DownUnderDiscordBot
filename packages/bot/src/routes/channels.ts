import { Request, Response } from 'express';
import { Client, TextChannel, Message } from 'discord.js';
import { expressRouter } from '../helpers/expressRouter';
import { createLogger } from '../helpers/logger';
import { WebSocketManager } from '../helpers/websocket';

const router = expressRouter();
const channelLog = createLogger('channels-api');

let discordClient: Client | null = null;
let wsManager: WebSocketManager | null = null;

/** Serialise a single Discord message into a plain JSON-safe object. */
function serializeMessage(msg: Message) {
  return {
    id: msg.id,
    content: msg.content,
    author: {
      id: msg.author.id,
      username: msg.author.username,
      displayName: msg.author.displayName ?? msg.author.username,
      avatar: msg.author.displayAvatarURL({ size: 64 }),
      bot: msg.author.bot,
    },
    timestamp: msg.createdTimestamp,
    editedTimestamp: msg.editedTimestamp,
    attachments: msg.attachments.map((a) => ({
      id: a.id,
      url: a.url,
      proxyURL: a.proxyURL,
      name: a.name,
      contentType: a.contentType,
      size: a.size,
      width: a.width,
      height: a.height,
    })),
    embeds: msg.embeds.map((e) => ({
      title: e.title,
      description: e.description,
      url: e.url,
      color: e.color,
      timestamp: e.timestamp,
      footer: e.footer ? { text: e.footer.text, iconURL: e.footer.iconURL } : null,
      thumbnail: e.thumbnail ? { url: e.thumbnail.url, width: e.thumbnail.width, height: e.thumbnail.height } : null,
      image: e.image ? { url: e.image.url, width: e.image.width, height: e.image.height } : null,
      author: e.author ? { name: e.author.name, iconURL: e.author.iconURL, url: e.author.url } : null,
      fields: e.fields?.map((f) => ({ name: f.name, value: f.value, inline: f.inline })) ?? [],
    })),
    reactions: msg.reactions.cache.map((r) => ({
      emoji: r.emoji.toString(),
      count: r.count,
    })),
    reference: msg.reference ? { messageId: msg.reference.messageId, channelId: msg.reference.channelId } : null,
    type: msg.type,
  };
}

/**
 * GET /api/channels/:channelId/messages
 * Fetch recent messages from a text channel.
 * Query params:
 *   limit  – number of messages (default 50, max 100)
 *   before – snowflake ID for pagination
 */
router.get('/:channelId/messages', async (req: Request, res: Response) => {
  const channelId = String(req.params.channelId);
  const guildId = req.headers['x-guild-id'] as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const before = req.query.before as string | undefined;
  const log = channelLog.child({ endpoint: 'messages', channelId, guildId, limit });

  if (!discordClient) {
    log.warn('Discord client not available');
    return res.status(503).json({ success: false, error: 'Discord client not available' });
  }

  try {
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      log.warn('Channel not found or not a text channel');
      return res.status(404).json({ success: false, error: 'Text channel not found' });
    }

    const textChannel = channel as TextChannel;
    const fetchOptions: { limit: number; before?: string } = { limit };
    if (before) fetchOptions.before = before;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = await (textChannel.messages as any).fetch(fetchOptions);
    const arr: ReturnType<typeof serializeMessage>[] = [];
    for (const [, m] of messages) {
      arr.push(serializeMessage(m as Message));
    }
    const serialized = arr.reverse(); // oldest-first

    log.info({ count: serialized.length }, 'Messages fetched');
    res.json({ success: true, messages: serialized });
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch channel messages');
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/channels/:channelId/messages
 * Send a message to a text channel (as the bot).
 * Body: { content: string }
 */
router.post('/:channelId/messages', async (req: Request, res: Response) => {
  const channelId = String(req.params.channelId);
  const { content } = req.body;
  const log = channelLog.child({ endpoint: 'send-message', channelId });

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ success: false, error: 'Message content is required' });
  }

  if (!discordClient) {
    log.warn('Discord client not available');
    return res.status(503).json({ success: false, error: 'Discord client not available' });
  }

  try {
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      return res.status(404).json({ success: false, error: 'Text channel not found' });
    }

    const textChannel = channel as TextChannel;
    const sent = await textChannel.send(content.trim());
    const serialized = serializeMessage(sent);

    log.info({ messageId: sent.id }, 'Message sent');
    res.json({ success: true, message: serialized });
  } catch (error) {
    log.error({ err: error }, 'Failed to send message');
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

/**
 * Initialise the channel routes.
 * Called from index.ts with the Discord client and WS manager.
 */
export function initializeChannelRoutes(client: Client, wsManagerInstance: WebSocketManager) {
  discordClient = client;
  wsManager = wsManagerInstance;

  // Listen for new messages and broadcast to WS subscribers
  client.on('messageCreate', (message: Message) => {
    if (!wsManager) return;
    // Don't broadcast DMs
    if (!message.guild) return;

    const serialized = serializeMessage(message);
    wsManager.broadcast({
      type: 'channel_message' as 'bot_status', // type-cast to fit the existing union; runtime only
      payload: {
        channelId: message.channelId,
        guildId: message.guild.id,
        message: serialized,
      },
    } as never);
  });

  return router.getRouter();
}

export { serializeMessage };
