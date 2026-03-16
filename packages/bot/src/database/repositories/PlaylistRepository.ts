import { getDatabase } from '../client.js';
import type { Playlist, PlaylistTrack } from '../generated/index.js';

export interface CreatePlaylistInput {
  guildId?: string;
  userId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
}

export interface AddTrackInput {
  title: string;
  artist?: string;
  duration: number;
  url: string;
  thumbnail?: string;
  platform: string;
  platformId?: string;
  filePath?: string;
}

export class PlaylistRepository {
  private get db() {
    return getDatabase();
  }

  async create(input: CreatePlaylistInput): Promise<Playlist> {
    return this.db.playlist.create({ data: input });
  }

  async findById(id: string): Promise<(Playlist & { tracks: PlaylistTrack[] }) | null> {
    return this.db.playlist.findUnique({
      where: { id },
      include: { tracks: { orderBy: { position: 'asc' } } },
    });
  }

  async findAll(userId?: string): Promise<Playlist[]> {
    return this.db.playlist.findMany({
      where: userId ? { OR: [{ userId }, { isPublic: true }] } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByGuild(guildId: string, userId?: string): Promise<Playlist[]> {
    return this.db.playlist.findMany({
      where: {
        guildId,
        ...(userId ? { OR: [{ userId }, { isPublic: true }] } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async addTrack(playlistId: string, track: AddTrackInput): Promise<PlaylistTrack> {
    const maxPosition = await this.db.playlistTrack.aggregate({
      where: { playlistId },
      _max: { position: true },
    });
    const position = (maxPosition._max.position ?? -1) + 1;

    return this.db.playlistTrack.create({
      data: { playlistId, position, ...track },
    });
  }

  async removeTrack(playlistId: string, trackId: string): Promise<void> {
    const track = await this.db.playlistTrack.findUnique({ where: { id: trackId } });
    if (!track || track.playlistId !== playlistId) return;

    await this.db.$transaction([
      this.db.playlistTrack.delete({ where: { id: trackId } }),
      this.db.playlistTrack.updateMany({
        where: { playlistId, position: { gt: track.position } },
        data: { position: { decrement: 1 } },
      }),
    ]);
  }

  async reorderTrack(playlistId: string, trackId: string, newPosition: number): Promise<void> {
    const track = await this.db.playlistTrack.findUnique({ where: { id: trackId } });
    if (!track || track.playlistId !== playlistId) return;

    const oldPosition = track.position;
    if (oldPosition === newPosition) return;

    await this.db.$transaction(async (tx) => {
      // Temporarily move the track out of the way
      await tx.playlistTrack.update({
        where: { id: trackId },
        data: { position: -1 },
      });

      if (newPosition > oldPosition) {
        await tx.playlistTrack.updateMany({
          where: {
            playlistId,
            position: { gt: oldPosition, lte: newPosition },
          },
          data: { position: { decrement: 1 } },
        });
      } else {
        await tx.playlistTrack.updateMany({
          where: {
            playlistId,
            position: { gte: newPosition, lt: oldPosition },
          },
          data: { position: { increment: 1 } },
        });
      }

      await tx.playlistTrack.update({
        where: { id: trackId },
        data: { position: newPosition },
      });
    });
  }

  async update(
    playlistId: string,
    data: Partial<Pick<Playlist, 'name' | 'description' | 'isPublic'>>,
  ): Promise<Playlist> {
    return this.db.playlist.update({
      where: { id: playlistId },
      data,
    });
  }

  async delete(playlistId: string): Promise<void> {
    await this.db.playlist.delete({ where: { id: playlistId } });
  }
}
