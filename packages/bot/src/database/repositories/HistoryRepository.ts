import { getDatabase } from '../client.js';
import type { PlayHistory } from '../generated/index.js';

export interface RecordPlayInput {
  guildId: string;
  userId: string;
  title: string;
  artist?: string;
  duration: number;
  url: string;
  platform: string;
  platformId?: string;
}

export class HistoryRepository {
  private get db() {
    return getDatabase();
  }

  async recordPlay(input: RecordPlayInput): Promise<PlayHistory> {
    return this.db.playHistory.create({ data: input });
  }

  async markCompleted(id: string): Promise<void> {
    await this.db.playHistory.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  }

  async getHistory(
    guildId: string,
    options: { limit?: number; offset?: number; userId?: string } = {},
  ): Promise<PlayHistory[]> {
    const { limit = 50, offset = 0, userId } = options;
    return this.db.playHistory.findMany({
      where: { guildId, ...(userId ? { userId } : {}) },
      orderBy: { playedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getRecentlyPlayed(guildId: string, limit = 10): Promise<PlayHistory[]> {
    return this.db.playHistory.findMany({
      where: { guildId },
      orderBy: { playedAt: 'desc' },
      take: limit,
      distinct: ['url'],
    });
  }

  async getMostPlayed(guildId: string, limit = 10) {
    // SQLite doesn't support groupBy well via Prisma, so we use raw query
    const results = await this.db.$queryRaw<
      Array<{ url: string; title: string; artist: string | null; platform: string; play_count: number }>
    >`
      SELECT url, title, artist, platform, COUNT(*) as play_count
      FROM PlayHistory
      WHERE guildId = ${guildId}
      GROUP BY url
      ORDER BY play_count DESC
      LIMIT ${limit}
    `;
    return results;
  }
}
