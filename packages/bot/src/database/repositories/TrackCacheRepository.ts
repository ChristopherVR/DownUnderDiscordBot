import { getDatabase } from '../client.js';
import type { TrackCache } from '../generated/index.js';

export interface CacheTrackInput {
  platform: string;
  platformId: string;
  title: string;
  artist?: string;
  duration: number;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
}

export class TrackCacheRepository {
  private get db() {
    return getDatabase();
  }

  async get(platform: string, platformId: string): Promise<TrackCache | null> {
    const cached = await this.db.trackCache.findUnique({
      where: { platform_platformId: { platform, platformId } },
    });

    if (cached) {
      // Update lastUsed
      await this.db.trackCache.update({
        where: { id: cached.id },
        data: { lastUsed: new Date() },
      });
    }

    return cached;
  }

  async set(input: CacheTrackInput): Promise<TrackCache> {
    return this.db.trackCache.upsert({
      where: {
        platform_platformId: { platform: input.platform, platformId: input.platformId },
      },
      create: {
        ...input,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
      update: {
        title: input.title,
        artist: input.artist,
        duration: input.duration,
        url: input.url,
        thumbnail: input.thumbnail,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        lastUsed: new Date(),
      },
    });
  }

  async cleanup(maxAgeDays = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - maxAgeDays);

    const result = await this.db.trackCache.deleteMany({
      where: { lastUsed: { lt: cutoff } },
    });

    return result.count;
  }
}
