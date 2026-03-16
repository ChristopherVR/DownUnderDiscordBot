import { getDatabase } from '../client.js';
import type { QueueSnapshot } from '../generated/index.js';

export interface QueueTrackData {
  title: string;
  artist?: string;
  duration: number;
  url: string;
  thumbnail?: string;
  platform: string;
}

export class QueueRepository {
  private get db() {
    return getDatabase();
  }

  async saveSnapshot(
    guildId: string,
    data: {
      currentTrackUrl?: string;
      currentPosition?: number;
      volume?: number;
      loopMode?: string;
      tracks: QueueTrackData[];
    },
  ): Promise<QueueSnapshot> {
    // Delete old snapshots for this guild (keep only latest)
    await this.db.queueSnapshot.deleteMany({ where: { guildId } });

    return this.db.queueSnapshot.create({
      data: {
        guildId,
        currentTrackUrl: data.currentTrackUrl,
        currentPosition: data.currentPosition ?? 0,
        volume: data.volume ?? 65,
        loopMode: data.loopMode ?? 'off',
        tracks: JSON.stringify(data.tracks),
      },
    });
  }

  async getLatestSnapshot(guildId: string): Promise<(QueueSnapshot & { parsedTracks: QueueTrackData[] }) | null> {
    const snapshot = await this.db.queueSnapshot.findFirst({
      where: { guildId },
      orderBy: { createdAt: 'desc' },
    });

    if (!snapshot) return null;

    return {
      ...snapshot,
      parsedTracks: JSON.parse(snapshot.tracks) as QueueTrackData[],
    };
  }

  async deleteSnapshots(guildId: string): Promise<void> {
    await this.db.queueSnapshot.deleteMany({ where: { guildId } });
  }
}
