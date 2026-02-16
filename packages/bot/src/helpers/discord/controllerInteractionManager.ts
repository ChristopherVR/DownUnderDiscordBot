import { ButtonInteraction, Client, EmbedBuilder, Interaction, MessageFlags, TextChannel } from 'discord.js';
import { GuildQueue, Player, QueueRepeatMode, Track } from 'discord-player';
import { activeController, getControllerPayload, getCompletedControllerPayload } from './playerEventManager';
import { enhancedLogger } from '../logger/logger';
import { LogLevel } from '../../types/logging';

/* ──────────────────────────────
   Small helpers (no `any`)
────────────────────────────── */

function hasNodeMethod<K extends string>(
  queue: GuildQueue,
  method: K,
): queue is GuildQueue & { node: GuildQueue['node'] & Record<K, (...args: never[]) => unknown> } {
  // @ts-expect-error runtime guard for method presence
  return typeof queue.node?.[method] === 'function';
}

function getQueue(player: Player, guildId: string | null): GuildQueue | null {
  if (!guildId) return null;
  const q = player.nodes.get(guildId);
  return q ?? null;
}

async function ack(i: ButtonInteraction): Promise<void> {
  try {
    if (!i.deferred && !i.replied) await i.deferUpdate();
  } catch {
    // ignore
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function refreshController(queue: GuildQueue): Promise<void> {
  const msg = activeController.get(queue.guild.id);
  if (!msg) return;
  try {
    await msg.edit(getControllerPayload(queue));
  } catch {
    // message gone; playerStart will recreate when needed
  }
}

async function ephemeralInfo(i: ButtonInteraction, text: string): Promise<void> {
  try {
    if (!i.deferred && !i.replied) {
      await i.reply({ content: text, flags: MessageFlags.Ephemeral, components: [] });
    } else {
      await i.followUp({ content: text, flags: MessageFlags.Ephemeral, components: [] });
    }
  } catch {
    // swallow
  }
}

function getTextChannelFromQueue(queue: GuildQueue): TextChannel | null {
  const meta = queue.metadata as { channel?: unknown } | undefined;
  const ch = meta?.channel;
  return ch instanceof TextChannel ? ch : null;
}

/* ──────────────────────────────
   Logging helpers
────────────────────────────── */

function logButtonPress(i: ButtonInteraction, customId: string): void {
  enhancedLogger.system(LogLevel.INFO, 'Controller button pressed', {
    guildId: i.guildId ?? 'unknown',
    userId: i.user?.id ?? 'unknown',
    username: i.user?.username ?? 'unknown',
    customId,
  });
}

function logActionResult(
  i: ButtonInteraction,
  customId: string,
  result: 'success' | 'noop' | 'error',
  extra?: Record<string, unknown>,
): void {
  enhancedLogger.system(LogLevel.INFO, 'Controller action result', {
    guildId: i.guildId ?? 'unknown',
    userId: i.user?.id ?? 'unknown',
    username: i.user?.username ?? 'unknown',
    customId,
    result,
    ...(extra ?? {}),
  });
}

/* ──────────────────────────────
   Action handlers
────────────────────────────── */

async function onPauseResume(i: ButtonInteraction, queue: GuildQueue): Promise<void> {
  try {
    if (queue.node.isPaused()) {
      if (hasNodeMethod(queue, 'resume')) {
        await queue.node.resume();
        logActionResult(i, 'pause_resume', 'success', { action: 'resume' });
      } else {
        logActionResult(i, 'pause_resume', 'noop', { reason: 'resume-missing' });
      }
    } else {
      if (hasNodeMethod(queue, 'pause')) {
        await queue.node.pause();
        logActionResult(i, 'pause_resume', 'success', { action: 'pause' });
      } else {
        logActionResult(i, 'pause_resume', 'noop', { reason: 'pause-missing' });
      }
    }
  } catch (err) {
    logActionResult(i, 'pause_resume', 'error', { error: (err as Error)?.message });
  }
}

async function onSkip(i: ButtonInteraction, queue: GuildQueue): Promise<void> {
  try {
    if (hasNodeMethod(queue, 'skip')) {
      await queue.node.skip();
      await sleep(60); // allow history/now-playing to update
      logActionResult(i, 'skip', 'success', {});
    } else {
      logActionResult(i, 'skip', 'noop', { reason: 'skip-missing' });
    }
  } catch (err) {
    logActionResult(i, 'skip', 'error', { error: (err as Error)?.message });
  }
}

// REPLACE the existing onBack with this version
async function onBack(i: ButtonInteraction, queue: GuildQueue): Promise<void> {
  try {
    const prevBefore: Track | null | undefined = queue.history?.previousTrack ?? null;
    const currentBefore = queue.currentTrack ?? null;

    if (!prevBefore) {
      logActionResult(i, 'back', 'noop', { reason: 'no-previous' });
      return;
    }

    // 1) Try the history-aware method first
    if (queue.history && typeof queue.history.back === 'function') {
      await queue.history.back(true);
      await sleep(80); // let pointers and playback settle

      const currentAfter = queue.currentTrack ?? null;
      if (!currentAfter || (currentBefore && currentAfter.id === currentBefore.id)) {
        // 2) Fallback: manually start the previous track
        if (hasNodeMethod(queue, 'play')) {
          await queue.node.play(prevBefore);
          await sleep(80);
          logActionResult(i, 'back', 'success', { path: 'fallback-play', prev: prevBefore.title });
        } else {
          logActionResult(i, 'back', 'error', { error: 'node.play missing', prev: prevBefore.title });
        }
      } else {
        logActionResult(i, 'back', 'success', { path: 'history-back', newCurrent: currentAfter.title });
      }
      return;
    }

    // 3) Very old fallback path: no history API available
    if (hasNodeMethod(queue, 'play')) {
      await queue.node.play(prevBefore);
      await sleep(80);
      logActionResult(i, 'back', 'success', { path: 'legacy-play', prev: prevBefore.title });
    } else {
      logActionResult(i, 'back', 'error', { error: 'no-history-and-no-node.play' });
    }
  } catch (err) {
    logActionResult(i, 'back', 'error', { error: (err as Error)?.message });
  }
}

async function onStop(i: ButtonInteraction, queue: GuildQueue): Promise<void> {
  const guildId = queue.guild.id;
  const textChannel = getTextChannelFromQueue(queue);

  try {
    await queue.delete(); // triggers your cleanup flows
  } catch (err) {
    // still continue to tidy UI
    logActionResult(i, 'stop', 'error', { error: (err as Error)?.message });
  }

  // Remove the live controller
  const controller = activeController.get(guildId);
  if (controller) {
    try {
      await controller.delete();
    } catch {
      // ignore delete failure
    }
    activeController.delete(guildId);
  }

  // Post a "Completed" controller shell (no buttons)
  if (textChannel) {
    try {
      await textChannel.send(getCompletedControllerPayload());
      logActionResult(i, 'stop', 'success', { postedCompleted: true });
    } catch (err) {
      logActionResult(i, 'stop', 'error', { error: (err as Error)?.message, postedCompleted: false });
    }
  } else {
    logActionResult(i, 'stop', 'noop', { reason: 'no-text-channel' });
  }
}

function onVolume(i: ButtonInteraction, queue: GuildQueue, delta: number): void {
  try {
    const qn = queue.node as unknown as { volume?: number; setVolume?: (v: number) => void };
    const current = typeof qn.volume === 'number' ? qn.volume : 65;
    const next = Math.max(0, Math.min(100, current + delta));
    if (typeof qn.setVolume === 'function') {
      qn.setVolume(next);
      logActionResult(i, delta > 0 ? 'volume_up' : 'volume_down', 'success', { from: current, to: next });
    } else {
      logActionResult(i, delta > 0 ? 'volume_up' : 'volume_down', 'noop', { reason: 'setVolume-missing' });
    }
  } catch (err) {
    logActionResult(i, delta > 0 ? 'volume_up' : 'volume_down', 'error', { error: (err as Error)?.message });
  }
}

function onLoop(i: ButtonInteraction, queue: GuildQueue): void {
  try {
    const mode = queue.repeatMode;
    let next: QueueRepeatMode = QueueRepeatMode.OFF;
    if (mode === QueueRepeatMode.OFF) next = QueueRepeatMode.TRACK;
    else if (mode === QueueRepeatMode.TRACK) next = QueueRepeatMode.AUTOPLAY;
    else next = QueueRepeatMode.OFF;

    queue.setRepeatMode(next);
    const modeName =
      Object.keys(QueueRepeatMode).find((key) => (QueueRepeatMode as Record<string, unknown>)[key] === next) ??
      next.toString();
    logActionResult(i, 'loop', 'success', { newMode: modeName });
  } catch (err) {
    logActionResult(i, 'loop', 'error', { error: (err as Error)?.message });
  }
}

async function onShowQueue(i: ButtonInteraction, queue: GuildQueue): Promise<void> {
  const lines = queue.tracks
    .toArray()
    .slice(0, 10)
    .map((t, idx) => `**${idx + 1}.** ${t.title} — ${t.author}`);
  const now = queue.currentTrack;
  const embed = new EmbedBuilder()
    .setColor('Random')
    .setTitle('Queue')
    .setDescription(lines.join('\n') || '_Queue is empty_');
  if (now) embed.setAuthor({ name: `Now playing: ${now.title}` });

  await ephemeralInfo(i, '');
  try {
    await i.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral, components: [] });
    logActionResult(i, 'queue', 'success', { count: queue.tracks.size });
  } catch (err) {
    logActionResult(i, 'queue', 'error', { error: (err as Error)?.message });
  }
}

/* ──────────────────────────────
   Router
────────────────────────────── */

export function registerControllerInteractionHandlers(client: Client, player: Player): void {
  client.on('interactionCreate', async (interaction: Interaction) => {
    if (!interaction.isButton()) return;

    const i = interaction as ButtonInteraction;
    const { customId } = i;

    // Only handle our controller buttons
    const ids = new Set(['back', 'pause_resume', 'skip', 'stop', 'volume_down', 'volume_up', 'loop', 'queue']);
    if (!ids.has(customId)) return;

    logButtonPress(i, customId);

    const queue = getQueue(player, i.guildId);
    if (!queue) {
      await ack(i);
      await ephemeralInfo(i, 'There is no active player in this server.');
      logActionResult(i, customId, 'noop', { reason: 'no-queue' });
      return;
    }

    await ack(i);

    try {
      switch (customId) {
        case 'pause_resume':
          await onPauseResume(i, queue);
          break;
        case 'skip':
          await onSkip(i, queue);
          break;
        case 'back':
          await onBack(i, queue);
          break;
        case 'stop':
          await onStop(i, queue);
          // After stop, nothing to refresh (controller gone)
          return;
        case 'volume_down':
          onVolume(i, queue, -10);
          break;
        case 'volume_up':
          onVolume(i, queue, +10);
          break;
        case 'loop':
          onLoop(i, queue);
          break;
        case 'queue':
          await onShowQueue(i, queue);
          break;
      }
    } catch (err) {
      logActionResult(i, customId, 'error', { error: (err as Error)?.message });
    }

    // Refresh the single controller after any action so "Prev" toggles immediately
    await refreshController(queue);
  });
}
