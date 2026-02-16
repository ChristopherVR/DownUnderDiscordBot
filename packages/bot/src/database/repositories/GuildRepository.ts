import { getDatabase } from '../client.js';
import type { Guild } from '../generated/index.js';

export class GuildRepository {
  private get db() {
    return getDatabase();
  }

  async findOrCreate(guildId: string, name: string): Promise<Guild> {
    return this.db.guild.upsert({
      where: { id: guildId },
      create: { id: guildId, name },
      update: { name },
    });
  }

  async findById(guildId: string): Promise<Guild | null> {
    return this.db.guild.findUnique({ where: { id: guildId } });
  }

  async updateSettings(
    guildId: string,
    settings: {
      defaultVolume?: number;
      preferredLanguage?: string;
      leaveOnEmpty?: boolean;
      leaveOnEmptyCooldown?: number;
    },
  ): Promise<Guild> {
    return this.db.guild.update({
      where: { id: guildId },
      data: settings,
    });
  }
}
