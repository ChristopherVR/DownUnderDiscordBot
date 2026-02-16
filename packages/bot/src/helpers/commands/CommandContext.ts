import {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  GuildBasedChannel,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  MessageFlags,
  User,
} from 'discord.js';

export interface CommandReplyOptions extends InteractionReplyOptions {
  flags?: number;
}

export interface CommandEditReplyOptions extends InteractionEditReplyOptions {
  flags?: number;
}

export interface CommandResponse {
  kind: 'reply' | 'followUp' | 'editReply';
  options: CommandReplyOptions | CommandEditReplyOptions;
}

export interface CommandContext {
  readonly type: 'interaction' | 'dashboard';
  readonly interaction?: ChatInputCommandInteraction;
  readonly guild?: Guild | null;
  readonly channel?: GuildBasedChannel | null;
  readonly guildId: string | null;
  readonly channelId: string | null;
  readonly user?: User | null;
  readonly userId?: string | null;
  readonly username?: string | null;
  readonly member?: GuildMember | null;
  readonly locale: string;
  readonly deferred: boolean;
  readonly replied: boolean;

  getString(name: string): string | null;
  getInteger(name: string): number | null;
  getBoolean(name: string): boolean | null;

  deferReply(): Promise<void>;
  reply(options: CommandReplyOptions): Promise<void>;
  followUp(options: CommandReplyOptions): Promise<void>;
  editReply(options: CommandEditReplyOptions): Promise<void>;
}

export class InteractionCommandContext implements CommandContext {
  public readonly type = 'interaction' as const;

  constructor(private readonly _interaction: ChatInputCommandInteraction) {}

  get interactionInstance(): ChatInputCommandInteraction {
    return this._interaction;
  }

  get interaction(): ChatInputCommandInteraction {
    return this._interaction;
  }

  get guild(): Guild | null {
    return this._interaction.guild ?? null;
  }

  get channel(): GuildBasedChannel | null {
    return (this._interaction.channel as GuildBasedChannel | null) ?? null;
  }

  get guildId(): string | null {
    return this._interaction.guildId;
  }

  get channelId(): string | null {
    return this._interaction.channelId ?? null;
  }

  get user(): User | null {
    return this._interaction.user ?? null;
  }

  get userId(): string | null {
    return this._interaction.user?.id ?? null;
  }

  get username(): string | null {
    return this._interaction.user?.username ?? null;
  }

  get member(): GuildMember | null {
    const member = this._interaction.member;
    return member && 'roles' in member ? (member as GuildMember) : null;
  }

  get locale(): string {
    return this._interaction.locale ?? 'en-US';
  }

  get deferred(): boolean {
    return this._interaction.deferred;
  }

  get replied(): boolean {
    return this._interaction.replied;
  }

  getString(name: string): string | null {
    return this._interaction.options.getString(name);
  }

  getInteger(name: string): number | null {
    return this._interaction.options.getInteger(name);
  }

  getBoolean(name: string): boolean | null {
    return this._interaction.options.getBoolean(name);
  }

  async deferReply(): Promise<void> {
    await this._interaction.deferReply();
  }

  async reply(options: CommandReplyOptions): Promise<void> {
    await this._interaction.reply(this.normalizeReply(options));
  }

  async followUp(options: CommandReplyOptions): Promise<void> {
    await this._interaction.followUp(this.normalizeReply(options));
  }

  async editReply(options: CommandEditReplyOptions): Promise<void> {
    await this._interaction.editReply(this.normalizeReply(options));
  }

  private normalizeReply<T extends InteractionReplyOptions | InteractionEditReplyOptions>(options: T): T {
    if ('flags' in options && options.flags !== undefined) {
      const flags = options.flags;
      if (typeof flags === 'number' && flags === MessageFlags.Ephemeral) {
        return { ...options, ephemeral: true };
      }
    }
    return options;
  }
}

export interface DashboardCommandContextOptions {
  guild?: Guild | null;
  channel?: GuildBasedChannel | null;
  user?: User | null;
  member?: GuildMember | null;
  locale?: string;
  args?: Record<string, unknown>;
}

export class DashboardCommandContext implements CommandContext {
  public readonly type = 'dashboard' as const;
  private readonly args: Record<string, unknown>;
  private readonly responses: CommandResponse[] = [];
  private _deferred = false;
  private _replied = false;

  constructor(private readonly options: DashboardCommandContextOptions = {}) {
    this.args = options.args ?? {};
  }

  get interaction(): undefined {
    return undefined;
  }

  get guild(): Guild | null {
    return this.options.guild ?? null;
  }

  get channel(): GuildBasedChannel | null {
    return this.options.channel ?? null;
  }

  get guildId(): string | null {
    return this.options.guild?.id ?? null;
  }

  get channelId(): string | null {
    return this.options.channel?.id ?? null;
  }

  get user(): User | null {
    return this.options.user ?? null;
  }

  get userId(): string | null {
    return this.options.user?.id ?? null;
  }

  get username(): string | null {
    return this.options.user?.username ?? null;
  }

  get member(): GuildMember | null {
    return this.options.member ?? null;
  }

  get locale(): string {
    return this.options.locale ?? 'en-US';
  }

  get deferred(): boolean {
    return this._deferred;
  }

  get replied(): boolean {
    return this._replied;
  }

  getString(name: string): string | null {
    const value = this.args[name];
    return typeof value === 'string' ? value : value != null ? String(value) : null;
  }

  getInteger(name: string): number | null {
    const value = this.args[name];
    if (typeof value === 'number') return Math.floor(value);
    if (value == null) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.floor(parsed) : null;
  }

  getBoolean(name: string): boolean | null {
    const value = this.args[name];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return null;
  }

  async deferReply(): Promise<void> {
    this._deferred = true;
  }

  async reply(options: CommandReplyOptions): Promise<void> {
    this._replied = true;
    this.responses.push({ kind: 'reply', options });
  }

  async followUp(options: CommandReplyOptions): Promise<void> {
    this.responses.push({ kind: 'followUp', options });
  }

  async editReply(options: CommandEditReplyOptions): Promise<void> {
    this.responses.push({ kind: 'editReply', options });
  }

  public getResponses(): CommandResponse[] {
    return [...this.responses];
  }
}
