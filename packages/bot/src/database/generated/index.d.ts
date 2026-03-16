/**
 * Client
 **/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types; // general types
import $Public = runtime.Types.Public;
import $Utils = runtime.Types.Utils;
import $Extensions = runtime.Types.Extensions;
import $Result = runtime.Types.Result;

export type PrismaPromise<T> = $Public.PrismaPromise<T>;

/**
 * Model Guild
 *
 */
export type Guild = $Result.DefaultSelection<Prisma.$GuildPayload>;
/**
 * Model Playlist
 *
 */
export type Playlist = $Result.DefaultSelection<Prisma.$PlaylistPayload>;
/**
 * Model PlaylistTrack
 *
 */
export type PlaylistTrack = $Result.DefaultSelection<Prisma.$PlaylistTrackPayload>;
/**
 * Model PlayHistory
 *
 */
export type PlayHistory = $Result.DefaultSelection<Prisma.$PlayHistoryPayload>;
/**
 * Model QueueSnapshot
 *
 */
export type QueueSnapshot = $Result.DefaultSelection<Prisma.$QueueSnapshotPayload>;
/**
 * Model UserPreferences
 *
 */
export type UserPreferences = $Result.DefaultSelection<Prisma.$UserPreferencesPayload>;
/**
 * Model TrackCache
 *
 */
export type TrackCache = $Result.DefaultSelection<Prisma.$TrackCachePayload>;

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Guilds
 * const guilds = await prisma.guild.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions
    ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition>
      ? Prisma.GetEvents<ClientOptions['log']>
      : never
    : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] };

  /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Guilds
   * const guilds = await prisma.guild.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(
    eventType: V,
    callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void,
  ): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(
    arg: [...P],
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;

  $transaction<R>(
    fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>,
    options?: { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel },
  ): $Utils.JsPromise<R>;

  $extends: $Extensions.ExtendsHook<
    'extends',
    Prisma.TypeMapCb<ClientOptions>,
    ExtArgs,
    $Utils.Call<
      Prisma.TypeMapCb<ClientOptions>,
      {
        extArgs: ExtArgs;
      }
    >
  >;

  /**
   * `prisma.guild`: Exposes CRUD operations for the **Guild** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Guilds
   * const guilds = await prisma.guild.findMany()
   * ```
   */
  get guild(): Prisma.GuildDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.playlist`: Exposes CRUD operations for the **Playlist** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more Playlists
   * const playlists = await prisma.playlist.findMany()
   * ```
   */
  get playlist(): Prisma.PlaylistDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.playlistTrack`: Exposes CRUD operations for the **PlaylistTrack** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more PlaylistTracks
   * const playlistTracks = await prisma.playlistTrack.findMany()
   * ```
   */
  get playlistTrack(): Prisma.PlaylistTrackDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.playHistory`: Exposes CRUD operations for the **PlayHistory** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more PlayHistories
   * const playHistories = await prisma.playHistory.findMany()
   * ```
   */
  get playHistory(): Prisma.PlayHistoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.queueSnapshot`: Exposes CRUD operations for the **QueueSnapshot** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more QueueSnapshots
   * const queueSnapshots = await prisma.queueSnapshot.findMany()
   * ```
   */
  get queueSnapshot(): Prisma.QueueSnapshotDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.userPreferences`: Exposes CRUD operations for the **UserPreferences** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more UserPreferences
   * const userPreferences = await prisma.userPreferences.findMany()
   * ```
   */
  get userPreferences(): Prisma.UserPreferencesDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.trackCache`: Exposes CRUD operations for the **TrackCache** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more TrackCaches
   * const trackCaches = await prisma.trackCache.findMany()
   * ```
   */
  get trackCache(): Prisma.TrackCacheDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF;

  export type PrismaPromise<T> = $Public.PrismaPromise<T>;

  /**
   * Validator
   */
  export import validator = runtime.Public.validator;

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError;
  export import PrismaClientValidationError = runtime.PrismaClientValidationError;

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag;
  export import empty = runtime.empty;
  export import join = runtime.join;
  export import raw = runtime.raw;
  export import Sql = runtime.Sql;

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal;

  export type DecimalJsLike = runtime.DecimalJsLike;

  /**
   * Extensions
   */
  export import Extension = $Extensions.UserArgs;
  export import getExtensionContext = runtime.Extensions.getExtensionContext;
  export import Args = $Public.Args;
  export import Payload = $Public.Payload;
  export import Result = $Public.Result;
  export import Exact = $Public.Exact;

  /**
   * Prisma Client JS version: 7.5.0
   * Query Engine version: 280c870be64f457428992c43c1f6d557fab6e29e
   */
  export type PrismaVersion = {
    client: string;
    engine: string;
  };

  export const prismaVersion: PrismaVersion;

  /**
   * Utility Types
   */

  export import Bytes = runtime.Bytes;
  export import JsonObject = runtime.JsonObject;
  export import JsonArray = runtime.JsonArray;
  export import JsonValue = runtime.JsonValue;
  export import InputJsonObject = runtime.InputJsonObject;
  export import InputJsonArray = runtime.InputJsonArray;
  export import InputJsonValue = runtime.InputJsonValue;

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
     * Type of `Prisma.DbNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class DbNull {
      private DbNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.JsonNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class JsonNull {
      private JsonNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.AnyNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class AnyNull {
      private AnyNull: never;
      private constructor();
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull;

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull;

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull;

  type SelectAndInclude = {
    select: any;
    include: any;
  };

  type SelectAndOmit = {
    select: any;
    omit: any;
  };

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>;

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };

  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K;
  }[keyof T];

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K;
  };

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>;

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & (T extends SelectAndInclude
    ? 'Please either choose `select` or `include`.'
    : T extends SelectAndOmit
      ? 'Please either choose `select` or `omit`.'
      : {});

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & K;

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> = T extends object ? (U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U) : T;

  /**
   * Is T a Record?
   */
  type IsObject<T extends any> =
    T extends Array<any>
      ? False
      : T extends Date
        ? False
        : T extends Uint8Array
          ? False
          : T extends BigInt
            ? False
            : T extends object
              ? True
              : False;

  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O>; // With K possibilities
    }[K];

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;

  type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
  }[strict];

  type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown
    ? _Either<O, K, strict>
    : never;

  export type Union = any;

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
  } & {};

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
    ? I
    : never;

  export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<
    Overwrite<
      U,
      {
        [K in keyof U]-?: At<U, K>;
      }
    >
  >;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function
    ? A
    : {
        [K in keyof A]: A[K];
      } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
      ? (K extends keyof O ? { [P in K]: O[P] } & O : O) | ({ [P in keyof O as P extends K ? P : never]-?: O[P] } & O)
      : never
  >;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False;

  // /**
  // 1
  // */
  export type True = 1;

  /**
  0
  */
  export type False = 0;

  export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
  }[B];

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
      ? 1
      : 0;

  export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0;
      1: 1;
    };
    1: {
      0: 1;
      1: 1;
    };
  }[B1][B2];

  export type Keys<U extends Union> = U extends unknown ? keyof U : never;

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object
    ? {
        [P in keyof T]: P extends keyof O ? O[P] : never;
      }
    : never;

  type FieldPaths<T, U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>> = IsObject<T> extends True ? U : T;

  type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<'OR', K>, Extends<'AND', K>>, Extends<'NOT', K>> extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
        ? never
        : K;
  }[keyof T];

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;

  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;

  export const ModelName: {
    Guild: 'Guild';
    Playlist: 'Playlist';
    PlaylistTrack: 'PlaylistTrack';
    PlayHistory: 'PlayHistory';
    QueueSnapshot: 'QueueSnapshot';
    UserPreferences: 'UserPreferences';
    TrackCache: 'TrackCache';
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName];

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<
    { extArgs: $Extensions.InternalArgs },
    $Utils.Record<string, any>
  > {
    returns: Prisma.TypeMap<
      this['params']['extArgs'],
      ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}
    >;
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions;
    };
    meta: {
      modelProps:
        | 'guild'
        | 'playlist'
        | 'playlistTrack'
        | 'playHistory'
        | 'queueSnapshot'
        | 'userPreferences'
        | 'trackCache';
      txIsolationLevel: Prisma.TransactionIsolationLevel;
    };
    model: {
      Guild: {
        payload: Prisma.$GuildPayload<ExtArgs>;
        fields: Prisma.GuildFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.GuildFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.GuildFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload>;
          };
          findFirst: {
            args: Prisma.GuildFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.GuildFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload>;
          };
          findMany: {
            args: Prisma.GuildFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload>[];
          };
          create: {
            args: Prisma.GuildCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload>;
          };
          createMany: {
            args: Prisma.GuildCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.GuildCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload>[];
          };
          delete: {
            args: Prisma.GuildDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload>;
          };
          update: {
            args: Prisma.GuildUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload>;
          };
          deleteMany: {
            args: Prisma.GuildDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.GuildUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.GuildUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload>[];
          };
          upsert: {
            args: Prisma.GuildUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$GuildPayload>;
          };
          aggregate: {
            args: Prisma.GuildAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateGuild>;
          };
          groupBy: {
            args: Prisma.GuildGroupByArgs<ExtArgs>;
            result: $Utils.Optional<GuildGroupByOutputType>[];
          };
          count: {
            args: Prisma.GuildCountArgs<ExtArgs>;
            result: $Utils.Optional<GuildCountAggregateOutputType> | number;
          };
        };
      };
      Playlist: {
        payload: Prisma.$PlaylistPayload<ExtArgs>;
        fields: Prisma.PlaylistFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.PlaylistFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.PlaylistFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload>;
          };
          findFirst: {
            args: Prisma.PlaylistFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.PlaylistFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload>;
          };
          findMany: {
            args: Prisma.PlaylistFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload>[];
          };
          create: {
            args: Prisma.PlaylistCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload>;
          };
          createMany: {
            args: Prisma.PlaylistCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.PlaylistCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload>[];
          };
          delete: {
            args: Prisma.PlaylistDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload>;
          };
          update: {
            args: Prisma.PlaylistUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload>;
          };
          deleteMany: {
            args: Prisma.PlaylistDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.PlaylistUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.PlaylistUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload>[];
          };
          upsert: {
            args: Prisma.PlaylistUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistPayload>;
          };
          aggregate: {
            args: Prisma.PlaylistAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregatePlaylist>;
          };
          groupBy: {
            args: Prisma.PlaylistGroupByArgs<ExtArgs>;
            result: $Utils.Optional<PlaylistGroupByOutputType>[];
          };
          count: {
            args: Prisma.PlaylistCountArgs<ExtArgs>;
            result: $Utils.Optional<PlaylistCountAggregateOutputType> | number;
          };
        };
      };
      PlaylistTrack: {
        payload: Prisma.$PlaylistTrackPayload<ExtArgs>;
        fields: Prisma.PlaylistTrackFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.PlaylistTrackFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.PlaylistTrackFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload>;
          };
          findFirst: {
            args: Prisma.PlaylistTrackFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.PlaylistTrackFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload>;
          };
          findMany: {
            args: Prisma.PlaylistTrackFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload>[];
          };
          create: {
            args: Prisma.PlaylistTrackCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload>;
          };
          createMany: {
            args: Prisma.PlaylistTrackCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.PlaylistTrackCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload>[];
          };
          delete: {
            args: Prisma.PlaylistTrackDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload>;
          };
          update: {
            args: Prisma.PlaylistTrackUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload>;
          };
          deleteMany: {
            args: Prisma.PlaylistTrackDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.PlaylistTrackUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.PlaylistTrackUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload>[];
          };
          upsert: {
            args: Prisma.PlaylistTrackUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlaylistTrackPayload>;
          };
          aggregate: {
            args: Prisma.PlaylistTrackAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregatePlaylistTrack>;
          };
          groupBy: {
            args: Prisma.PlaylistTrackGroupByArgs<ExtArgs>;
            result: $Utils.Optional<PlaylistTrackGroupByOutputType>[];
          };
          count: {
            args: Prisma.PlaylistTrackCountArgs<ExtArgs>;
            result: $Utils.Optional<PlaylistTrackCountAggregateOutputType> | number;
          };
        };
      };
      PlayHistory: {
        payload: Prisma.$PlayHistoryPayload<ExtArgs>;
        fields: Prisma.PlayHistoryFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.PlayHistoryFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.PlayHistoryFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload>;
          };
          findFirst: {
            args: Prisma.PlayHistoryFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.PlayHistoryFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload>;
          };
          findMany: {
            args: Prisma.PlayHistoryFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload>[];
          };
          create: {
            args: Prisma.PlayHistoryCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload>;
          };
          createMany: {
            args: Prisma.PlayHistoryCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.PlayHistoryCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload>[];
          };
          delete: {
            args: Prisma.PlayHistoryDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload>;
          };
          update: {
            args: Prisma.PlayHistoryUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload>;
          };
          deleteMany: {
            args: Prisma.PlayHistoryDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.PlayHistoryUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.PlayHistoryUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload>[];
          };
          upsert: {
            args: Prisma.PlayHistoryUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$PlayHistoryPayload>;
          };
          aggregate: {
            args: Prisma.PlayHistoryAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregatePlayHistory>;
          };
          groupBy: {
            args: Prisma.PlayHistoryGroupByArgs<ExtArgs>;
            result: $Utils.Optional<PlayHistoryGroupByOutputType>[];
          };
          count: {
            args: Prisma.PlayHistoryCountArgs<ExtArgs>;
            result: $Utils.Optional<PlayHistoryCountAggregateOutputType> | number;
          };
        };
      };
      QueueSnapshot: {
        payload: Prisma.$QueueSnapshotPayload<ExtArgs>;
        fields: Prisma.QueueSnapshotFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.QueueSnapshotFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.QueueSnapshotFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload>;
          };
          findFirst: {
            args: Prisma.QueueSnapshotFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.QueueSnapshotFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload>;
          };
          findMany: {
            args: Prisma.QueueSnapshotFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload>[];
          };
          create: {
            args: Prisma.QueueSnapshotCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload>;
          };
          createMany: {
            args: Prisma.QueueSnapshotCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.QueueSnapshotCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload>[];
          };
          delete: {
            args: Prisma.QueueSnapshotDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload>;
          };
          update: {
            args: Prisma.QueueSnapshotUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload>;
          };
          deleteMany: {
            args: Prisma.QueueSnapshotDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.QueueSnapshotUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.QueueSnapshotUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload>[];
          };
          upsert: {
            args: Prisma.QueueSnapshotUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$QueueSnapshotPayload>;
          };
          aggregate: {
            args: Prisma.QueueSnapshotAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateQueueSnapshot>;
          };
          groupBy: {
            args: Prisma.QueueSnapshotGroupByArgs<ExtArgs>;
            result: $Utils.Optional<QueueSnapshotGroupByOutputType>[];
          };
          count: {
            args: Prisma.QueueSnapshotCountArgs<ExtArgs>;
            result: $Utils.Optional<QueueSnapshotCountAggregateOutputType> | number;
          };
        };
      };
      UserPreferences: {
        payload: Prisma.$UserPreferencesPayload<ExtArgs>;
        fields: Prisma.UserPreferencesFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.UserPreferencesFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.UserPreferencesFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload>;
          };
          findFirst: {
            args: Prisma.UserPreferencesFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.UserPreferencesFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload>;
          };
          findMany: {
            args: Prisma.UserPreferencesFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload>[];
          };
          create: {
            args: Prisma.UserPreferencesCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload>;
          };
          createMany: {
            args: Prisma.UserPreferencesCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.UserPreferencesCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload>[];
          };
          delete: {
            args: Prisma.UserPreferencesDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload>;
          };
          update: {
            args: Prisma.UserPreferencesUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload>;
          };
          deleteMany: {
            args: Prisma.UserPreferencesDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.UserPreferencesUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.UserPreferencesUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload>[];
          };
          upsert: {
            args: Prisma.UserPreferencesUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$UserPreferencesPayload>;
          };
          aggregate: {
            args: Prisma.UserPreferencesAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateUserPreferences>;
          };
          groupBy: {
            args: Prisma.UserPreferencesGroupByArgs<ExtArgs>;
            result: $Utils.Optional<UserPreferencesGroupByOutputType>[];
          };
          count: {
            args: Prisma.UserPreferencesCountArgs<ExtArgs>;
            result: $Utils.Optional<UserPreferencesCountAggregateOutputType> | number;
          };
        };
      };
      TrackCache: {
        payload: Prisma.$TrackCachePayload<ExtArgs>;
        fields: Prisma.TrackCacheFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.TrackCacheFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.TrackCacheFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload>;
          };
          findFirst: {
            args: Prisma.TrackCacheFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.TrackCacheFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload>;
          };
          findMany: {
            args: Prisma.TrackCacheFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload>[];
          };
          create: {
            args: Prisma.TrackCacheCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload>;
          };
          createMany: {
            args: Prisma.TrackCacheCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          createManyAndReturn: {
            args: Prisma.TrackCacheCreateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload>[];
          };
          delete: {
            args: Prisma.TrackCacheDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload>;
          };
          update: {
            args: Prisma.TrackCacheUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload>;
          };
          deleteMany: {
            args: Prisma.TrackCacheDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.TrackCacheUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateManyAndReturn: {
            args: Prisma.TrackCacheUpdateManyAndReturnArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload>[];
          };
          upsert: {
            args: Prisma.TrackCacheUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$TrackCachePayload>;
          };
          aggregate: {
            args: Prisma.TrackCacheAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateTrackCache>;
          };
          groupBy: {
            args: Prisma.TrackCacheGroupByArgs<ExtArgs>;
            result: $Utils.Optional<TrackCacheGroupByOutputType>[];
          };
          count: {
            args: Prisma.TrackCacheCountArgs<ExtArgs>;
            result: $Utils.Optional<TrackCacheCountAggregateOutputType> | number;
          };
        };
      };
    };
  } & {
    other: {
      payload: any;
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
      };
    };
  };
  export const defineExtension: $Extensions.ExtendsHook<'define', Prisma.TypeMapCb, $Extensions.DefaultArgs>;
  export type DefaultPrismaClient = PrismaClient;
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     *
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     *
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[];
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    };
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory;
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string;
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig;
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[];
  }
  export type GlobalOmitConfig = {
    guild?: GuildOmit;
    playlist?: PlaylistOmit;
    playlistTrack?: PlaylistTrackOmit;
    playHistory?: PlayHistoryOmit;
    queueSnapshot?: QueueSnapshotOmit;
    userPreferences?: UserPreferencesOmit;
    trackCache?: TrackCacheOmit;
  };

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error';
  export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
  };

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T['level'] : T>;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;

  export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
  };

  export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
  };
  /* End Types for Logging */

  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy';

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>;

  export type Datasource = {
    url?: string;
  };

  /**
   * Count Types
   */

  /**
   * Count Type GuildCountOutputType
   */

  export type GuildCountOutputType = {
    playlists: number;
    playHistory: number;
    queueSnapshots: number;
    userPreferences: number;
  };

  export type GuildCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    playlists?: boolean | GuildCountOutputTypeCountPlaylistsArgs;
    playHistory?: boolean | GuildCountOutputTypeCountPlayHistoryArgs;
    queueSnapshots?: boolean | GuildCountOutputTypeCountQueueSnapshotsArgs;
    userPreferences?: boolean | GuildCountOutputTypeCountUserPreferencesArgs;
  };

  // Custom InputTypes
  /**
   * GuildCountOutputType without action
   */
  export type GuildCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the GuildCountOutputType
     */
    select?: GuildCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * GuildCountOutputType without action
   */
  export type GuildCountOutputTypeCountPlaylistsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PlaylistWhereInput;
  };

  /**
   * GuildCountOutputType without action
   */
  export type GuildCountOutputTypeCountPlayHistoryArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PlayHistoryWhereInput;
  };

  /**
   * GuildCountOutputType without action
   */
  export type GuildCountOutputTypeCountQueueSnapshotsArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: QueueSnapshotWhereInput;
  };

  /**
   * GuildCountOutputType without action
   */
  export type GuildCountOutputTypeCountUserPreferencesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: UserPreferencesWhereInput;
  };

  /**
   * Count Type PlaylistCountOutputType
   */

  export type PlaylistCountOutputType = {
    tracks: number;
  };

  export type PlaylistCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    tracks?: boolean | PlaylistCountOutputTypeCountTracksArgs;
  };

  // Custom InputTypes
  /**
   * PlaylistCountOutputType without action
   */
  export type PlaylistCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistCountOutputType
     */
    select?: PlaylistCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * PlaylistCountOutputType without action
   */
  export type PlaylistCountOutputTypeCountTracksArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: PlaylistTrackWhereInput;
  };

  /**
   * Models
   */

  /**
   * Model Guild
   */

  export type AggregateGuild = {
    _count: GuildCountAggregateOutputType | null;
    _avg: GuildAvgAggregateOutputType | null;
    _sum: GuildSumAggregateOutputType | null;
    _min: GuildMinAggregateOutputType | null;
    _max: GuildMaxAggregateOutputType | null;
  };

  export type GuildAvgAggregateOutputType = {
    defaultVolume: number | null;
    leaveOnEmptyCooldown: number | null;
  };

  export type GuildSumAggregateOutputType = {
    defaultVolume: number | null;
    leaveOnEmptyCooldown: number | null;
  };

  export type GuildMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    preferredLanguage: string | null;
    defaultVolume: number | null;
    leaveOnEmpty: boolean | null;
    leaveOnEmptyCooldown: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type GuildMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    preferredLanguage: string | null;
    defaultVolume: number | null;
    leaveOnEmpty: boolean | null;
    leaveOnEmptyCooldown: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type GuildCountAggregateOutputType = {
    id: number;
    name: number;
    preferredLanguage: number;
    defaultVolume: number;
    leaveOnEmpty: number;
    leaveOnEmptyCooldown: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type GuildAvgAggregateInputType = {
    defaultVolume?: true;
    leaveOnEmptyCooldown?: true;
  };

  export type GuildSumAggregateInputType = {
    defaultVolume?: true;
    leaveOnEmptyCooldown?: true;
  };

  export type GuildMinAggregateInputType = {
    id?: true;
    name?: true;
    preferredLanguage?: true;
    defaultVolume?: true;
    leaveOnEmpty?: true;
    leaveOnEmptyCooldown?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type GuildMaxAggregateInputType = {
    id?: true;
    name?: true;
    preferredLanguage?: true;
    defaultVolume?: true;
    leaveOnEmpty?: true;
    leaveOnEmptyCooldown?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type GuildCountAggregateInputType = {
    id?: true;
    name?: true;
    preferredLanguage?: true;
    defaultVolume?: true;
    leaveOnEmpty?: true;
    leaveOnEmptyCooldown?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type GuildAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Guild to aggregate.
     */
    where?: GuildWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Guilds to fetch.
     */
    orderBy?: GuildOrderByWithRelationInput | GuildOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: GuildWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Guilds from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Guilds.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Guilds
     **/
    _count?: true | GuildCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: GuildAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: GuildSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: GuildMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: GuildMaxAggregateInputType;
  };

  export type GetGuildAggregateType<T extends GuildAggregateArgs> = {
    [P in keyof T & keyof AggregateGuild]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateGuild[P]>
      : GetScalarType<T[P], AggregateGuild[P]>;
  };

  export type GuildGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: GuildWhereInput;
    orderBy?: GuildOrderByWithAggregationInput | GuildOrderByWithAggregationInput[];
    by: GuildScalarFieldEnum[] | GuildScalarFieldEnum;
    having?: GuildScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: GuildCountAggregateInputType | true;
    _avg?: GuildAvgAggregateInputType;
    _sum?: GuildSumAggregateInputType;
    _min?: GuildMinAggregateInputType;
    _max?: GuildMaxAggregateInputType;
  };

  export type GuildGroupByOutputType = {
    id: string;
    name: string;
    preferredLanguage: string;
    defaultVolume: number;
    leaveOnEmpty: boolean;
    leaveOnEmptyCooldown: number;
    createdAt: Date;
    updatedAt: Date;
    _count: GuildCountAggregateOutputType | null;
    _avg: GuildAvgAggregateOutputType | null;
    _sum: GuildSumAggregateOutputType | null;
    _min: GuildMinAggregateOutputType | null;
    _max: GuildMaxAggregateOutputType | null;
  };

  type GetGuildGroupByPayload<T extends GuildGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<GuildGroupByOutputType, T['by']> & {
        [P in keyof T & keyof GuildGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], GuildGroupByOutputType[P]>
          : GetScalarType<T[P], GuildGroupByOutputType[P]>;
      }
    >
  >;

  export type GuildSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<
    {
      id?: boolean;
      name?: boolean;
      preferredLanguage?: boolean;
      defaultVolume?: boolean;
      leaveOnEmpty?: boolean;
      leaveOnEmptyCooldown?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      playlists?: boolean | Guild$playlistsArgs<ExtArgs>;
      playHistory?: boolean | Guild$playHistoryArgs<ExtArgs>;
      queueSnapshots?: boolean | Guild$queueSnapshotsArgs<ExtArgs>;
      userPreferences?: boolean | Guild$userPreferencesArgs<ExtArgs>;
      _count?: boolean | GuildCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['guild']
  >;

  export type GuildSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        name?: boolean;
        preferredLanguage?: boolean;
        defaultVolume?: boolean;
        leaveOnEmpty?: boolean;
        leaveOnEmptyCooldown?: boolean;
        createdAt?: boolean;
        updatedAt?: boolean;
      },
      ExtArgs['result']['guild']
    >;

  export type GuildSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        name?: boolean;
        preferredLanguage?: boolean;
        defaultVolume?: boolean;
        leaveOnEmpty?: boolean;
        leaveOnEmptyCooldown?: boolean;
        createdAt?: boolean;
        updatedAt?: boolean;
      },
      ExtArgs['result']['guild']
    >;

  export type GuildSelectScalar = {
    id?: boolean;
    name?: boolean;
    preferredLanguage?: boolean;
    defaultVolume?: boolean;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type GuildOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<
    | 'id'
    | 'name'
    | 'preferredLanguage'
    | 'defaultVolume'
    | 'leaveOnEmpty'
    | 'leaveOnEmptyCooldown'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['guild']
  >;
  export type GuildInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    playlists?: boolean | Guild$playlistsArgs<ExtArgs>;
    playHistory?: boolean | Guild$playHistoryArgs<ExtArgs>;
    queueSnapshots?: boolean | Guild$queueSnapshotsArgs<ExtArgs>;
    userPreferences?: boolean | Guild$userPreferencesArgs<ExtArgs>;
    _count?: boolean | GuildCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type GuildIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {};
  export type GuildIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {};

  export type $GuildPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: 'Guild';
    objects: {
      playlists: Prisma.$PlaylistPayload<ExtArgs>[];
      playHistory: Prisma.$PlayHistoryPayload<ExtArgs>[];
      queueSnapshots: Prisma.$QueueSnapshotPayload<ExtArgs>[];
      userPreferences: Prisma.$UserPreferencesPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        name: string;
        preferredLanguage: string;
        defaultVolume: number;
        leaveOnEmpty: boolean;
        leaveOnEmptyCooldown: number;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['guild']
    >;
    composites: {};
  };

  type GuildGetPayload<S extends boolean | null | undefined | GuildDefaultArgs> = $Result.GetResult<
    Prisma.$GuildPayload,
    S
  >;

  type GuildCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    GuildFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: GuildCountAggregateInputType | true;
  };

  export interface GuildDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Guild']; meta: { name: 'Guild' } };
    /**
     * Find zero or one Guild that matches the filter.
     * @param {GuildFindUniqueArgs} args - Arguments to find a Guild
     * @example
     * // Get one Guild
     * const guild = await prisma.guild.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends GuildFindUniqueArgs>(
      args: SelectSubset<T, GuildFindUniqueArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'findUnique', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Guild that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {GuildFindUniqueOrThrowArgs} args - Arguments to find a Guild
     * @example
     * // Get one Guild
     * const guild = await prisma.guild.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends GuildFindUniqueOrThrowArgs>(
      args: SelectSubset<T, GuildFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Guild that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildFindFirstArgs} args - Arguments to find a Guild
     * @example
     * // Get one Guild
     * const guild = await prisma.guild.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends GuildFindFirstArgs>(
      args?: SelectSubset<T, GuildFindFirstArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'findFirst', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Guild that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildFindFirstOrThrowArgs} args - Arguments to find a Guild
     * @example
     * // Get one Guild
     * const guild = await prisma.guild.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends GuildFindFirstOrThrowArgs>(
      args?: SelectSubset<T, GuildFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'findFirstOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Guilds that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Guilds
     * const guilds = await prisma.guild.findMany()
     *
     * // Get first 10 Guilds
     * const guilds = await prisma.guild.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const guildWithIdOnly = await prisma.guild.findMany({ select: { id: true } })
     *
     */
    findMany<T extends GuildFindManyArgs>(
      args?: SelectSubset<T, GuildFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions>>;

    /**
     * Create a Guild.
     * @param {GuildCreateArgs} args - Arguments to create a Guild.
     * @example
     * // Create one Guild
     * const Guild = await prisma.guild.create({
     *   data: {
     *     // ... data to create a Guild
     *   }
     * })
     *
     */
    create<T extends GuildCreateArgs>(
      args: SelectSubset<T, GuildCreateArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'create', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Guilds.
     * @param {GuildCreateManyArgs} args - Arguments to create many Guilds.
     * @example
     * // Create many Guilds
     * const guild = await prisma.guild.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends GuildCreateManyArgs>(
      args?: SelectSubset<T, GuildCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Guilds and returns the data saved in the database.
     * @param {GuildCreateManyAndReturnArgs} args - Arguments to create many Guilds.
     * @example
     * // Create many Guilds
     * const guild = await prisma.guild.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Guilds and only return the `id`
     * const guildWithIdOnly = await prisma.guild.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends GuildCreateManyAndReturnArgs>(
      args?: SelectSubset<T, GuildCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'createManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Delete a Guild.
     * @param {GuildDeleteArgs} args - Arguments to delete one Guild.
     * @example
     * // Delete one Guild
     * const Guild = await prisma.guild.delete({
     *   where: {
     *     // ... filter to delete one Guild
     *   }
     * })
     *
     */
    delete<T extends GuildDeleteArgs>(
      args: SelectSubset<T, GuildDeleteArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'delete', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Guild.
     * @param {GuildUpdateArgs} args - Arguments to update one Guild.
     * @example
     * // Update one Guild
     * const guild = await prisma.guild.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends GuildUpdateArgs>(
      args: SelectSubset<T, GuildUpdateArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'update', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Guilds.
     * @param {GuildDeleteManyArgs} args - Arguments to filter Guilds to delete.
     * @example
     * // Delete a few Guilds
     * const { count } = await prisma.guild.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends GuildDeleteManyArgs>(
      args?: SelectSubset<T, GuildDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Guilds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Guilds
     * const guild = await prisma.guild.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends GuildUpdateManyArgs>(
      args: SelectSubset<T, GuildUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Guilds and returns the data updated in the database.
     * @param {GuildUpdateManyAndReturnArgs} args - Arguments to update many Guilds.
     * @example
     * // Update many Guilds
     * const guild = await prisma.guild.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Guilds and only return the `id`
     * const guildWithIdOnly = await prisma.guild.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends GuildUpdateManyAndReturnArgs>(
      args: SelectSubset<T, GuildUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'updateManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Create or update one Guild.
     * @param {GuildUpsertArgs} args - Arguments to update or create a Guild.
     * @example
     * // Update or create a Guild
     * const guild = await prisma.guild.upsert({
     *   create: {
     *     // ... data to create a Guild
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Guild we want to update
     *   }
     * })
     */
    upsert<T extends GuildUpsertArgs>(
      args: SelectSubset<T, GuildUpsertArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'upsert', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Guilds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildCountArgs} args - Arguments to filter Guilds to count.
     * @example
     * // Count the number of Guilds
     * const count = await prisma.guild.count({
     *   where: {
     *     // ... the filter for the Guilds we want to count
     *   }
     * })
     **/
    count<T extends GuildCountArgs>(
      args?: Subset<T, GuildCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], GuildCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Guild.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends GuildAggregateArgs>(
      args: Subset<T, GuildAggregateArgs>,
    ): Prisma.PrismaPromise<GetGuildAggregateType<T>>;

    /**
     * Group by Guild.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {GuildGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends GuildGroupByArgs,
      HasSelectOrTake extends Or<Extends<'skip', Keys<T>>, Extends<'take', Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: GuildGroupByArgs['orderBy'] }
        : { orderBy?: GuildGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, 'Field ', P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, GuildGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetGuildGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Guild model
     */
    readonly fields: GuildFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Guild.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__GuildClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    playlists<T extends Guild$playlistsArgs<ExtArgs> = {}>(
      args?: Subset<T, Guild$playlistsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions> | Null
    >;
    playHistory<T extends Guild$playHistoryArgs<ExtArgs> = {}>(
      args?: Subset<T, Guild$playHistoryArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions> | Null
    >;
    queueSnapshots<T extends Guild$queueSnapshotsArgs<ExtArgs> = {}>(
      args?: Subset<T, Guild$queueSnapshotsArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions> | Null
    >;
    userPreferences<T extends Guild$userPreferencesArgs<ExtArgs> = {}>(
      args?: Subset<T, Guild$userPreferencesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions> | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Guild model
   */
  interface GuildFieldRefs {
    readonly id: FieldRef<'Guild', 'String'>;
    readonly name: FieldRef<'Guild', 'String'>;
    readonly preferredLanguage: FieldRef<'Guild', 'String'>;
    readonly defaultVolume: FieldRef<'Guild', 'Int'>;
    readonly leaveOnEmpty: FieldRef<'Guild', 'Boolean'>;
    readonly leaveOnEmptyCooldown: FieldRef<'Guild', 'Int'>;
    readonly createdAt: FieldRef<'Guild', 'DateTime'>;
    readonly updatedAt: FieldRef<'Guild', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * Guild findUnique
   */
  export type GuildFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    /**
     * Filter, which Guild to fetch.
     */
    where: GuildWhereUniqueInput;
  };

  /**
   * Guild findUniqueOrThrow
   */
  export type GuildFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    /**
     * Filter, which Guild to fetch.
     */
    where: GuildWhereUniqueInput;
  };

  /**
   * Guild findFirst
   */
  export type GuildFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    /**
     * Filter, which Guild to fetch.
     */
    where?: GuildWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Guilds to fetch.
     */
    orderBy?: GuildOrderByWithRelationInput | GuildOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Guilds.
     */
    cursor?: GuildWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Guilds from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Guilds.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Guilds.
     */
    distinct?: GuildScalarFieldEnum | GuildScalarFieldEnum[];
  };

  /**
   * Guild findFirstOrThrow
   */
  export type GuildFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    /**
     * Filter, which Guild to fetch.
     */
    where?: GuildWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Guilds to fetch.
     */
    orderBy?: GuildOrderByWithRelationInput | GuildOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Guilds.
     */
    cursor?: GuildWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Guilds from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Guilds.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Guilds.
     */
    distinct?: GuildScalarFieldEnum | GuildScalarFieldEnum[];
  };

  /**
   * Guild findMany
   */
  export type GuildFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    /**
     * Filter, which Guilds to fetch.
     */
    where?: GuildWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Guilds to fetch.
     */
    orderBy?: GuildOrderByWithRelationInput | GuildOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Guilds.
     */
    cursor?: GuildWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Guilds from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Guilds.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Guilds.
     */
    distinct?: GuildScalarFieldEnum | GuildScalarFieldEnum[];
  };

  /**
   * Guild create
   */
  export type GuildCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    /**
     * The data needed to create a Guild.
     */
    data: XOR<GuildCreateInput, GuildUncheckedCreateInput>;
  };

  /**
   * Guild createMany
   */
  export type GuildCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Guilds.
     */
    data: GuildCreateManyInput | GuildCreateManyInput[];
  };

  /**
   * Guild createManyAndReturn
   */
  export type GuildCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * The data used to create many Guilds.
     */
    data: GuildCreateManyInput | GuildCreateManyInput[];
  };

  /**
   * Guild update
   */
  export type GuildUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    /**
     * The data needed to update a Guild.
     */
    data: XOR<GuildUpdateInput, GuildUncheckedUpdateInput>;
    /**
     * Choose, which Guild to update.
     */
    where: GuildWhereUniqueInput;
  };

  /**
   * Guild updateMany
   */
  export type GuildUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Guilds.
     */
    data: XOR<GuildUpdateManyMutationInput, GuildUncheckedUpdateManyInput>;
    /**
     * Filter which Guilds to update
     */
    where?: GuildWhereInput;
    /**
     * Limit how many Guilds to update.
     */
    limit?: number;
  };

  /**
   * Guild updateManyAndReturn
   */
  export type GuildUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * The data used to update Guilds.
     */
    data: XOR<GuildUpdateManyMutationInput, GuildUncheckedUpdateManyInput>;
    /**
     * Filter which Guilds to update
     */
    where?: GuildWhereInput;
    /**
     * Limit how many Guilds to update.
     */
    limit?: number;
  };

  /**
   * Guild upsert
   */
  export type GuildUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    /**
     * The filter to search for the Guild to update in case it exists.
     */
    where: GuildWhereUniqueInput;
    /**
     * In case the Guild found by the `where` argument doesn't exist, create a new Guild with this data.
     */
    create: XOR<GuildCreateInput, GuildUncheckedCreateInput>;
    /**
     * In case the Guild was found with the provided `where` argument, update it with this data.
     */
    update: XOR<GuildUpdateInput, GuildUncheckedUpdateInput>;
  };

  /**
   * Guild delete
   */
  export type GuildDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    /**
     * Filter which Guild to delete.
     */
    where: GuildWhereUniqueInput;
  };

  /**
   * Guild deleteMany
   */
  export type GuildDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Guilds to delete
     */
    where?: GuildWhereInput;
    /**
     * Limit how many Guilds to delete.
     */
    limit?: number;
  };

  /**
   * Guild.playlists
   */
  export type Guild$playlistsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    where?: PlaylistWhereInput;
    orderBy?: PlaylistOrderByWithRelationInput | PlaylistOrderByWithRelationInput[];
    cursor?: PlaylistWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: PlaylistScalarFieldEnum | PlaylistScalarFieldEnum[];
  };

  /**
   * Guild.playHistory
   */
  export type Guild$playHistoryArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    where?: PlayHistoryWhereInput;
    orderBy?: PlayHistoryOrderByWithRelationInput | PlayHistoryOrderByWithRelationInput[];
    cursor?: PlayHistoryWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: PlayHistoryScalarFieldEnum | PlayHistoryScalarFieldEnum[];
  };

  /**
   * Guild.queueSnapshots
   */
  export type Guild$queueSnapshotsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    where?: QueueSnapshotWhereInput;
    orderBy?: QueueSnapshotOrderByWithRelationInput | QueueSnapshotOrderByWithRelationInput[];
    cursor?: QueueSnapshotWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: QueueSnapshotScalarFieldEnum | QueueSnapshotScalarFieldEnum[];
  };

  /**
   * Guild.userPreferences
   */
  export type Guild$userPreferencesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesInclude<ExtArgs> | null;
    where?: UserPreferencesWhereInput;
    orderBy?: UserPreferencesOrderByWithRelationInput | UserPreferencesOrderByWithRelationInput[];
    cursor?: UserPreferencesWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: UserPreferencesScalarFieldEnum | UserPreferencesScalarFieldEnum[];
  };

  /**
   * Guild without action
   */
  export type GuildDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
  };

  /**
   * Model Playlist
   */

  export type AggregatePlaylist = {
    _count: PlaylistCountAggregateOutputType | null;
    _min: PlaylistMinAggregateOutputType | null;
    _max: PlaylistMaxAggregateOutputType | null;
  };

  export type PlaylistMinAggregateOutputType = {
    id: string | null;
    guildId: string | null;
    userId: string | null;
    name: string | null;
    description: string | null;
    isPublic: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type PlaylistMaxAggregateOutputType = {
    id: string | null;
    guildId: string | null;
    userId: string | null;
    name: string | null;
    description: string | null;
    isPublic: boolean | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type PlaylistCountAggregateOutputType = {
    id: number;
    guildId: number;
    userId: number;
    name: number;
    description: number;
    isPublic: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type PlaylistMinAggregateInputType = {
    id?: true;
    guildId?: true;
    userId?: true;
    name?: true;
    description?: true;
    isPublic?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type PlaylistMaxAggregateInputType = {
    id?: true;
    guildId?: true;
    userId?: true;
    name?: true;
    description?: true;
    isPublic?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type PlaylistCountAggregateInputType = {
    id?: true;
    guildId?: true;
    userId?: true;
    name?: true;
    description?: true;
    isPublic?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type PlaylistAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Playlist to aggregate.
     */
    where?: PlaylistWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Playlists to fetch.
     */
    orderBy?: PlaylistOrderByWithRelationInput | PlaylistOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: PlaylistWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Playlists from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Playlists.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Playlists
     **/
    _count?: true | PlaylistCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: PlaylistMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: PlaylistMaxAggregateInputType;
  };

  export type GetPlaylistAggregateType<T extends PlaylistAggregateArgs> = {
    [P in keyof T & keyof AggregatePlaylist]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlaylist[P]>
      : GetScalarType<T[P], AggregatePlaylist[P]>;
  };

  export type PlaylistGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlaylistWhereInput;
    orderBy?: PlaylistOrderByWithAggregationInput | PlaylistOrderByWithAggregationInput[];
    by: PlaylistScalarFieldEnum[] | PlaylistScalarFieldEnum;
    having?: PlaylistScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PlaylistCountAggregateInputType | true;
    _min?: PlaylistMinAggregateInputType;
    _max?: PlaylistMaxAggregateInputType;
  };

  export type PlaylistGroupByOutputType = {
    id: string;
    guildId: string | null;
    userId: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: PlaylistCountAggregateOutputType | null;
    _min: PlaylistMinAggregateOutputType | null;
    _max: PlaylistMaxAggregateOutputType | null;
  };

  type GetPlaylistGroupByPayload<T extends PlaylistGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PlaylistGroupByOutputType, T['by']> & {
        [P in keyof T & keyof PlaylistGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], PlaylistGroupByOutputType[P]>
          : GetScalarType<T[P], PlaylistGroupByOutputType[P]>;
      }
    >
  >;

  export type PlaylistSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        guildId?: boolean;
        userId?: boolean;
        name?: boolean;
        description?: boolean;
        isPublic?: boolean;
        createdAt?: boolean;
        updatedAt?: boolean;
        guild?: boolean | Playlist$guildArgs<ExtArgs>;
        tracks?: boolean | Playlist$tracksArgs<ExtArgs>;
        _count?: boolean | PlaylistCountOutputTypeDefaultArgs<ExtArgs>;
      },
      ExtArgs['result']['playlist']
    >;

  export type PlaylistSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        guildId?: boolean;
        userId?: boolean;
        name?: boolean;
        description?: boolean;
        isPublic?: boolean;
        createdAt?: boolean;
        updatedAt?: boolean;
        guild?: boolean | Playlist$guildArgs<ExtArgs>;
      },
      ExtArgs['result']['playlist']
    >;

  export type PlaylistSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        guildId?: boolean;
        userId?: boolean;
        name?: boolean;
        description?: boolean;
        isPublic?: boolean;
        createdAt?: boolean;
        updatedAt?: boolean;
        guild?: boolean | Playlist$guildArgs<ExtArgs>;
      },
      ExtArgs['result']['playlist']
    >;

  export type PlaylistSelectScalar = {
    id?: boolean;
    guildId?: boolean;
    userId?: boolean;
    name?: boolean;
    description?: boolean;
    isPublic?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type PlaylistOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<
    'id' | 'guildId' | 'userId' | 'name' | 'description' | 'isPublic' | 'createdAt' | 'updatedAt',
    ExtArgs['result']['playlist']
  >;
  export type PlaylistInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    guild?: boolean | Playlist$guildArgs<ExtArgs>;
    tracks?: boolean | Playlist$tracksArgs<ExtArgs>;
    _count?: boolean | PlaylistCountOutputTypeDefaultArgs<ExtArgs>;
  };
  export type PlaylistIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    guild?: boolean | Playlist$guildArgs<ExtArgs>;
  };
  export type PlaylistIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    guild?: boolean | Playlist$guildArgs<ExtArgs>;
  };

  export type $PlaylistPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: 'Playlist';
    objects: {
      guild: Prisma.$GuildPayload<ExtArgs> | null;
      tracks: Prisma.$PlaylistTrackPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        guildId: string | null;
        userId: string;
        name: string;
        description: string | null;
        isPublic: boolean;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['playlist']
    >;
    composites: {};
  };

  type PlaylistGetPayload<S extends boolean | null | undefined | PlaylistDefaultArgs> = $Result.GetResult<
    Prisma.$PlaylistPayload,
    S
  >;

  type PlaylistCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    PlaylistFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: PlaylistCountAggregateInputType | true;
  };

  export interface PlaylistDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Playlist']; meta: { name: 'Playlist' } };
    /**
     * Find zero or one Playlist that matches the filter.
     * @param {PlaylistFindUniqueArgs} args - Arguments to find a Playlist
     * @example
     * // Get one Playlist
     * const playlist = await prisma.playlist.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlaylistFindUniqueArgs>(
      args: SelectSubset<T, PlaylistFindUniqueArgs<ExtArgs>>,
    ): Prisma__PlaylistClient<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'findUnique', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one Playlist that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlaylistFindUniqueOrThrowArgs} args - Arguments to find a Playlist
     * @example
     * // Get one Playlist
     * const playlist = await prisma.playlist.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlaylistFindUniqueOrThrowArgs>(
      args: SelectSubset<T, PlaylistFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__PlaylistClient<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Playlist that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistFindFirstArgs} args - Arguments to find a Playlist
     * @example
     * // Get one Playlist
     * const playlist = await prisma.playlist.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlaylistFindFirstArgs>(
      args?: SelectSubset<T, PlaylistFindFirstArgs<ExtArgs>>,
    ): Prisma__PlaylistClient<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'findFirst', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first Playlist that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistFindFirstOrThrowArgs} args - Arguments to find a Playlist
     * @example
     * // Get one Playlist
     * const playlist = await prisma.playlist.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlaylistFindFirstOrThrowArgs>(
      args?: SelectSubset<T, PlaylistFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__PlaylistClient<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'findFirstOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more Playlists that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Playlists
     * const playlists = await prisma.playlist.findMany()
     *
     * // Get first 10 Playlists
     * const playlists = await prisma.playlist.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const playlistWithIdOnly = await prisma.playlist.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PlaylistFindManyArgs>(
      args?: SelectSubset<T, PlaylistFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions>>;

    /**
     * Create a Playlist.
     * @param {PlaylistCreateArgs} args - Arguments to create a Playlist.
     * @example
     * // Create one Playlist
     * const Playlist = await prisma.playlist.create({
     *   data: {
     *     // ... data to create a Playlist
     *   }
     * })
     *
     */
    create<T extends PlaylistCreateArgs>(
      args: SelectSubset<T, PlaylistCreateArgs<ExtArgs>>,
    ): Prisma__PlaylistClient<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'create', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many Playlists.
     * @param {PlaylistCreateManyArgs} args - Arguments to create many Playlists.
     * @example
     * // Create many Playlists
     * const playlist = await prisma.playlist.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PlaylistCreateManyArgs>(
      args?: SelectSubset<T, PlaylistCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many Playlists and returns the data saved in the database.
     * @param {PlaylistCreateManyAndReturnArgs} args - Arguments to create many Playlists.
     * @example
     * // Create many Playlists
     * const playlist = await prisma.playlist.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Playlists and only return the `id`
     * const playlistWithIdOnly = await prisma.playlist.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PlaylistCreateManyAndReturnArgs>(
      args?: SelectSubset<T, PlaylistCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'createManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Delete a Playlist.
     * @param {PlaylistDeleteArgs} args - Arguments to delete one Playlist.
     * @example
     * // Delete one Playlist
     * const Playlist = await prisma.playlist.delete({
     *   where: {
     *     // ... filter to delete one Playlist
     *   }
     * })
     *
     */
    delete<T extends PlaylistDeleteArgs>(
      args: SelectSubset<T, PlaylistDeleteArgs<ExtArgs>>,
    ): Prisma__PlaylistClient<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'delete', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one Playlist.
     * @param {PlaylistUpdateArgs} args - Arguments to update one Playlist.
     * @example
     * // Update one Playlist
     * const playlist = await prisma.playlist.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PlaylistUpdateArgs>(
      args: SelectSubset<T, PlaylistUpdateArgs<ExtArgs>>,
    ): Prisma__PlaylistClient<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'update', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more Playlists.
     * @param {PlaylistDeleteManyArgs} args - Arguments to filter Playlists to delete.
     * @example
     * // Delete a few Playlists
     * const { count } = await prisma.playlist.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PlaylistDeleteManyArgs>(
      args?: SelectSubset<T, PlaylistDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Playlists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Playlists
     * const playlist = await prisma.playlist.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PlaylistUpdateManyArgs>(
      args: SelectSubset<T, PlaylistUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more Playlists and returns the data updated in the database.
     * @param {PlaylistUpdateManyAndReturnArgs} args - Arguments to update many Playlists.
     * @example
     * // Update many Playlists
     * const playlist = await prisma.playlist.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Playlists and only return the `id`
     * const playlistWithIdOnly = await prisma.playlist.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends PlaylistUpdateManyAndReturnArgs>(
      args: SelectSubset<T, PlaylistUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'updateManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Create or update one Playlist.
     * @param {PlaylistUpsertArgs} args - Arguments to update or create a Playlist.
     * @example
     * // Update or create a Playlist
     * const playlist = await prisma.playlist.upsert({
     *   create: {
     *     // ... data to create a Playlist
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Playlist we want to update
     *   }
     * })
     */
    upsert<T extends PlaylistUpsertArgs>(
      args: SelectSubset<T, PlaylistUpsertArgs<ExtArgs>>,
    ): Prisma__PlaylistClient<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'upsert', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of Playlists.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistCountArgs} args - Arguments to filter Playlists to count.
     * @example
     * // Count the number of Playlists
     * const count = await prisma.playlist.count({
     *   where: {
     *     // ... the filter for the Playlists we want to count
     *   }
     * })
     **/
    count<T extends PlaylistCountArgs>(
      args?: Subset<T, PlaylistCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PlaylistCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a Playlist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends PlaylistAggregateArgs>(
      args: Subset<T, PlaylistAggregateArgs>,
    ): Prisma.PrismaPromise<GetPlaylistAggregateType<T>>;

    /**
     * Group by Playlist.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends PlaylistGroupByArgs,
      HasSelectOrTake extends Or<Extends<'skip', Keys<T>>, Extends<'take', Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PlaylistGroupByArgs['orderBy'] }
        : { orderBy?: PlaylistGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, 'Field ', P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, PlaylistGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetPlaylistGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Playlist model
     */
    readonly fields: PlaylistFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Playlist.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PlaylistClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    guild<T extends Playlist$guildArgs<ExtArgs> = {}>(
      args?: Subset<T, Playlist$guildArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;
    tracks<T extends Playlist$tracksArgs<ExtArgs> = {}>(
      args?: Subset<T, Playlist$tracksArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions> | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the Playlist model
   */
  interface PlaylistFieldRefs {
    readonly id: FieldRef<'Playlist', 'String'>;
    readonly guildId: FieldRef<'Playlist', 'String'>;
    readonly userId: FieldRef<'Playlist', 'String'>;
    readonly name: FieldRef<'Playlist', 'String'>;
    readonly description: FieldRef<'Playlist', 'String'>;
    readonly isPublic: FieldRef<'Playlist', 'Boolean'>;
    readonly createdAt: FieldRef<'Playlist', 'DateTime'>;
    readonly updatedAt: FieldRef<'Playlist', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * Playlist findUnique
   */
  export type PlaylistFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    /**
     * Filter, which Playlist to fetch.
     */
    where: PlaylistWhereUniqueInput;
  };

  /**
   * Playlist findUniqueOrThrow
   */
  export type PlaylistFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    /**
     * Filter, which Playlist to fetch.
     */
    where: PlaylistWhereUniqueInput;
  };

  /**
   * Playlist findFirst
   */
  export type PlaylistFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    /**
     * Filter, which Playlist to fetch.
     */
    where?: PlaylistWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Playlists to fetch.
     */
    orderBy?: PlaylistOrderByWithRelationInput | PlaylistOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Playlists.
     */
    cursor?: PlaylistWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Playlists from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Playlists.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Playlists.
     */
    distinct?: PlaylistScalarFieldEnum | PlaylistScalarFieldEnum[];
  };

  /**
   * Playlist findFirstOrThrow
   */
  export type PlaylistFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    /**
     * Filter, which Playlist to fetch.
     */
    where?: PlaylistWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Playlists to fetch.
     */
    orderBy?: PlaylistOrderByWithRelationInput | PlaylistOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Playlists.
     */
    cursor?: PlaylistWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Playlists from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Playlists.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Playlists.
     */
    distinct?: PlaylistScalarFieldEnum | PlaylistScalarFieldEnum[];
  };

  /**
   * Playlist findMany
   */
  export type PlaylistFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    /**
     * Filter, which Playlists to fetch.
     */
    where?: PlaylistWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Playlists to fetch.
     */
    orderBy?: PlaylistOrderByWithRelationInput | PlaylistOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Playlists.
     */
    cursor?: PlaylistWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Playlists from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Playlists.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Playlists.
     */
    distinct?: PlaylistScalarFieldEnum | PlaylistScalarFieldEnum[];
  };

  /**
   * Playlist create
   */
  export type PlaylistCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    /**
     * The data needed to create a Playlist.
     */
    data: XOR<PlaylistCreateInput, PlaylistUncheckedCreateInput>;
  };

  /**
   * Playlist createMany
   */
  export type PlaylistCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Playlists.
     */
    data: PlaylistCreateManyInput | PlaylistCreateManyInput[];
  };

  /**
   * Playlist createManyAndReturn
   */
  export type PlaylistCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * The data used to create many Playlists.
     */
    data: PlaylistCreateManyInput | PlaylistCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Playlist update
   */
  export type PlaylistUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    /**
     * The data needed to update a Playlist.
     */
    data: XOR<PlaylistUpdateInput, PlaylistUncheckedUpdateInput>;
    /**
     * Choose, which Playlist to update.
     */
    where: PlaylistWhereUniqueInput;
  };

  /**
   * Playlist updateMany
   */
  export type PlaylistUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Playlists.
     */
    data: XOR<PlaylistUpdateManyMutationInput, PlaylistUncheckedUpdateManyInput>;
    /**
     * Filter which Playlists to update
     */
    where?: PlaylistWhereInput;
    /**
     * Limit how many Playlists to update.
     */
    limit?: number;
  };

  /**
   * Playlist updateManyAndReturn
   */
  export type PlaylistUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * The data used to update Playlists.
     */
    data: XOR<PlaylistUpdateManyMutationInput, PlaylistUncheckedUpdateManyInput>;
    /**
     * Filter which Playlists to update
     */
    where?: PlaylistWhereInput;
    /**
     * Limit how many Playlists to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * Playlist upsert
   */
  export type PlaylistUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    /**
     * The filter to search for the Playlist to update in case it exists.
     */
    where: PlaylistWhereUniqueInput;
    /**
     * In case the Playlist found by the `where` argument doesn't exist, create a new Playlist with this data.
     */
    create: XOR<PlaylistCreateInput, PlaylistUncheckedCreateInput>;
    /**
     * In case the Playlist was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PlaylistUpdateInput, PlaylistUncheckedUpdateInput>;
  };

  /**
   * Playlist delete
   */
  export type PlaylistDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
    /**
     * Filter which Playlist to delete.
     */
    where: PlaylistWhereUniqueInput;
  };

  /**
   * Playlist deleteMany
   */
  export type PlaylistDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Playlists to delete
     */
    where?: PlaylistWhereInput;
    /**
     * Limit how many Playlists to delete.
     */
    limit?: number;
  };

  /**
   * Playlist.guild
   */
  export type Playlist$guildArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Guild
     */
    select?: GuildSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Guild
     */
    omit?: GuildOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: GuildInclude<ExtArgs> | null;
    where?: GuildWhereInput;
  };

  /**
   * Playlist.tracks
   */
  export type Playlist$tracksArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    where?: PlaylistTrackWhereInput;
    orderBy?: PlaylistTrackOrderByWithRelationInput | PlaylistTrackOrderByWithRelationInput[];
    cursor?: PlaylistTrackWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: PlaylistTrackScalarFieldEnum | PlaylistTrackScalarFieldEnum[];
  };

  /**
   * Playlist without action
   */
  export type PlaylistDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Playlist
     */
    select?: PlaylistSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Playlist
     */
    omit?: PlaylistOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistInclude<ExtArgs> | null;
  };

  /**
   * Model PlaylistTrack
   */

  export type AggregatePlaylistTrack = {
    _count: PlaylistTrackCountAggregateOutputType | null;
    _avg: PlaylistTrackAvgAggregateOutputType | null;
    _sum: PlaylistTrackSumAggregateOutputType | null;
    _min: PlaylistTrackMinAggregateOutputType | null;
    _max: PlaylistTrackMaxAggregateOutputType | null;
  };

  export type PlaylistTrackAvgAggregateOutputType = {
    position: number | null;
    duration: number | null;
  };

  export type PlaylistTrackSumAggregateOutputType = {
    position: number | null;
    duration: number | null;
  };

  export type PlaylistTrackMinAggregateOutputType = {
    id: string | null;
    playlistId: string | null;
    position: number | null;
    title: string | null;
    artist: string | null;
    duration: number | null;
    url: string | null;
    thumbnail: string | null;
    platform: string | null;
    platformId: string | null;
    filePath: string | null;
    addedAt: Date | null;
  };

  export type PlaylistTrackMaxAggregateOutputType = {
    id: string | null;
    playlistId: string | null;
    position: number | null;
    title: string | null;
    artist: string | null;
    duration: number | null;
    url: string | null;
    thumbnail: string | null;
    platform: string | null;
    platformId: string | null;
    filePath: string | null;
    addedAt: Date | null;
  };

  export type PlaylistTrackCountAggregateOutputType = {
    id: number;
    playlistId: number;
    position: number;
    title: number;
    artist: number;
    duration: number;
    url: number;
    thumbnail: number;
    platform: number;
    platformId: number;
    filePath: number;
    addedAt: number;
    _all: number;
  };

  export type PlaylistTrackAvgAggregateInputType = {
    position?: true;
    duration?: true;
  };

  export type PlaylistTrackSumAggregateInputType = {
    position?: true;
    duration?: true;
  };

  export type PlaylistTrackMinAggregateInputType = {
    id?: true;
    playlistId?: true;
    position?: true;
    title?: true;
    artist?: true;
    duration?: true;
    url?: true;
    thumbnail?: true;
    platform?: true;
    platformId?: true;
    filePath?: true;
    addedAt?: true;
  };

  export type PlaylistTrackMaxAggregateInputType = {
    id?: true;
    playlistId?: true;
    position?: true;
    title?: true;
    artist?: true;
    duration?: true;
    url?: true;
    thumbnail?: true;
    platform?: true;
    platformId?: true;
    filePath?: true;
    addedAt?: true;
  };

  export type PlaylistTrackCountAggregateInputType = {
    id?: true;
    playlistId?: true;
    position?: true;
    title?: true;
    artist?: true;
    duration?: true;
    url?: true;
    thumbnail?: true;
    platform?: true;
    platformId?: true;
    filePath?: true;
    addedAt?: true;
    _all?: true;
  };

  export type PlaylistTrackAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PlaylistTrack to aggregate.
     */
    where?: PlaylistTrackWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlaylistTracks to fetch.
     */
    orderBy?: PlaylistTrackOrderByWithRelationInput | PlaylistTrackOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: PlaylistTrackWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlaylistTracks from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlaylistTracks.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned PlaylistTracks
     **/
    _count?: true | PlaylistTrackCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: PlaylistTrackAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: PlaylistTrackSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: PlaylistTrackMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: PlaylistTrackMaxAggregateInputType;
  };

  export type GetPlaylistTrackAggregateType<T extends PlaylistTrackAggregateArgs> = {
    [P in keyof T & keyof AggregatePlaylistTrack]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlaylistTrack[P]>
      : GetScalarType<T[P], AggregatePlaylistTrack[P]>;
  };

  export type PlaylistTrackGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlaylistTrackWhereInput;
    orderBy?: PlaylistTrackOrderByWithAggregationInput | PlaylistTrackOrderByWithAggregationInput[];
    by: PlaylistTrackScalarFieldEnum[] | PlaylistTrackScalarFieldEnum;
    having?: PlaylistTrackScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PlaylistTrackCountAggregateInputType | true;
    _avg?: PlaylistTrackAvgAggregateInputType;
    _sum?: PlaylistTrackSumAggregateInputType;
    _min?: PlaylistTrackMinAggregateInputType;
    _max?: PlaylistTrackMaxAggregateInputType;
  };

  export type PlaylistTrackGroupByOutputType = {
    id: string;
    playlistId: string;
    position: number;
    title: string;
    artist: string | null;
    duration: number;
    url: string;
    thumbnail: string | null;
    platform: string;
    platformId: string | null;
    filePath: string | null;
    addedAt: Date;
    _count: PlaylistTrackCountAggregateOutputType | null;
    _avg: PlaylistTrackAvgAggregateOutputType | null;
    _sum: PlaylistTrackSumAggregateOutputType | null;
    _min: PlaylistTrackMinAggregateOutputType | null;
    _max: PlaylistTrackMaxAggregateOutputType | null;
  };

  type GetPlaylistTrackGroupByPayload<T extends PlaylistTrackGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PlaylistTrackGroupByOutputType, T['by']> & {
        [P in keyof T & keyof PlaylistTrackGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], PlaylistTrackGroupByOutputType[P]>
          : GetScalarType<T[P], PlaylistTrackGroupByOutputType[P]>;
      }
    >
  >;

  export type PlaylistTrackSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        playlistId?: boolean;
        position?: boolean;
        title?: boolean;
        artist?: boolean;
        duration?: boolean;
        url?: boolean;
        thumbnail?: boolean;
        platform?: boolean;
        platformId?: boolean;
        filePath?: boolean;
        addedAt?: boolean;
        playlist?: boolean | PlaylistDefaultArgs<ExtArgs>;
      },
      ExtArgs['result']['playlistTrack']
    >;

  export type PlaylistTrackSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      playlistId?: boolean;
      position?: boolean;
      title?: boolean;
      artist?: boolean;
      duration?: boolean;
      url?: boolean;
      thumbnail?: boolean;
      platform?: boolean;
      platformId?: boolean;
      filePath?: boolean;
      addedAt?: boolean;
      playlist?: boolean | PlaylistDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['playlistTrack']
  >;

  export type PlaylistTrackSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      playlistId?: boolean;
      position?: boolean;
      title?: boolean;
      artist?: boolean;
      duration?: boolean;
      url?: boolean;
      thumbnail?: boolean;
      platform?: boolean;
      platformId?: boolean;
      filePath?: boolean;
      addedAt?: boolean;
      playlist?: boolean | PlaylistDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['playlistTrack']
  >;

  export type PlaylistTrackSelectScalar = {
    id?: boolean;
    playlistId?: boolean;
    position?: boolean;
    title?: boolean;
    artist?: boolean;
    duration?: boolean;
    url?: boolean;
    thumbnail?: boolean;
    platform?: boolean;
    platformId?: boolean;
    filePath?: boolean;
    addedAt?: boolean;
  };

  export type PlaylistTrackOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetOmit<
      | 'id'
      | 'playlistId'
      | 'position'
      | 'title'
      | 'artist'
      | 'duration'
      | 'url'
      | 'thumbnail'
      | 'platform'
      | 'platformId'
      | 'filePath'
      | 'addedAt',
      ExtArgs['result']['playlistTrack']
    >;
  export type PlaylistTrackInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    playlist?: boolean | PlaylistDefaultArgs<ExtArgs>;
  };
  export type PlaylistTrackIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    playlist?: boolean | PlaylistDefaultArgs<ExtArgs>;
  };
  export type PlaylistTrackIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    playlist?: boolean | PlaylistDefaultArgs<ExtArgs>;
  };

  export type $PlaylistTrackPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: 'PlaylistTrack';
    objects: {
      playlist: Prisma.$PlaylistPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        playlistId: string;
        position: number;
        title: string;
        artist: string | null;
        duration: number;
        url: string;
        thumbnail: string | null;
        platform: string;
        platformId: string | null;
        filePath: string | null;
        addedAt: Date;
      },
      ExtArgs['result']['playlistTrack']
    >;
    composites: {};
  };

  type PlaylistTrackGetPayload<S extends boolean | null | undefined | PlaylistTrackDefaultArgs> = $Result.GetResult<
    Prisma.$PlaylistTrackPayload,
    S
  >;

  type PlaylistTrackCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    PlaylistTrackFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: PlaylistTrackCountAggregateInputType | true;
  };

  export interface PlaylistTrackDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PlaylistTrack']; meta: { name: 'PlaylistTrack' } };
    /**
     * Find zero or one PlaylistTrack that matches the filter.
     * @param {PlaylistTrackFindUniqueArgs} args - Arguments to find a PlaylistTrack
     * @example
     * // Get one PlaylistTrack
     * const playlistTrack = await prisma.playlistTrack.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlaylistTrackFindUniqueArgs>(
      args: SelectSubset<T, PlaylistTrackFindUniqueArgs<ExtArgs>>,
    ): Prisma__PlaylistTrackClient<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'findUnique', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one PlaylistTrack that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlaylistTrackFindUniqueOrThrowArgs} args - Arguments to find a PlaylistTrack
     * @example
     * // Get one PlaylistTrack
     * const playlistTrack = await prisma.playlistTrack.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlaylistTrackFindUniqueOrThrowArgs>(
      args: SelectSubset<T, PlaylistTrackFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__PlaylistTrackClient<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first PlaylistTrack that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistTrackFindFirstArgs} args - Arguments to find a PlaylistTrack
     * @example
     * // Get one PlaylistTrack
     * const playlistTrack = await prisma.playlistTrack.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlaylistTrackFindFirstArgs>(
      args?: SelectSubset<T, PlaylistTrackFindFirstArgs<ExtArgs>>,
    ): Prisma__PlaylistTrackClient<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'findFirst', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first PlaylistTrack that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistTrackFindFirstOrThrowArgs} args - Arguments to find a PlaylistTrack
     * @example
     * // Get one PlaylistTrack
     * const playlistTrack = await prisma.playlistTrack.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlaylistTrackFindFirstOrThrowArgs>(
      args?: SelectSubset<T, PlaylistTrackFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__PlaylistTrackClient<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'findFirstOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more PlaylistTracks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistTrackFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PlaylistTracks
     * const playlistTracks = await prisma.playlistTrack.findMany()
     *
     * // Get first 10 PlaylistTracks
     * const playlistTracks = await prisma.playlistTrack.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const playlistTrackWithIdOnly = await prisma.playlistTrack.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PlaylistTrackFindManyArgs>(
      args?: SelectSubset<T, PlaylistTrackFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions>>;

    /**
     * Create a PlaylistTrack.
     * @param {PlaylistTrackCreateArgs} args - Arguments to create a PlaylistTrack.
     * @example
     * // Create one PlaylistTrack
     * const PlaylistTrack = await prisma.playlistTrack.create({
     *   data: {
     *     // ... data to create a PlaylistTrack
     *   }
     * })
     *
     */
    create<T extends PlaylistTrackCreateArgs>(
      args: SelectSubset<T, PlaylistTrackCreateArgs<ExtArgs>>,
    ): Prisma__PlaylistTrackClient<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'create', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many PlaylistTracks.
     * @param {PlaylistTrackCreateManyArgs} args - Arguments to create many PlaylistTracks.
     * @example
     * // Create many PlaylistTracks
     * const playlistTrack = await prisma.playlistTrack.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PlaylistTrackCreateManyArgs>(
      args?: SelectSubset<T, PlaylistTrackCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many PlaylistTracks and returns the data saved in the database.
     * @param {PlaylistTrackCreateManyAndReturnArgs} args - Arguments to create many PlaylistTracks.
     * @example
     * // Create many PlaylistTracks
     * const playlistTrack = await prisma.playlistTrack.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many PlaylistTracks and only return the `id`
     * const playlistTrackWithIdOnly = await prisma.playlistTrack.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PlaylistTrackCreateManyAndReturnArgs>(
      args?: SelectSubset<T, PlaylistTrackCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'createManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Delete a PlaylistTrack.
     * @param {PlaylistTrackDeleteArgs} args - Arguments to delete one PlaylistTrack.
     * @example
     * // Delete one PlaylistTrack
     * const PlaylistTrack = await prisma.playlistTrack.delete({
     *   where: {
     *     // ... filter to delete one PlaylistTrack
     *   }
     * })
     *
     */
    delete<T extends PlaylistTrackDeleteArgs>(
      args: SelectSubset<T, PlaylistTrackDeleteArgs<ExtArgs>>,
    ): Prisma__PlaylistTrackClient<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'delete', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one PlaylistTrack.
     * @param {PlaylistTrackUpdateArgs} args - Arguments to update one PlaylistTrack.
     * @example
     * // Update one PlaylistTrack
     * const playlistTrack = await prisma.playlistTrack.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PlaylistTrackUpdateArgs>(
      args: SelectSubset<T, PlaylistTrackUpdateArgs<ExtArgs>>,
    ): Prisma__PlaylistTrackClient<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'update', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more PlaylistTracks.
     * @param {PlaylistTrackDeleteManyArgs} args - Arguments to filter PlaylistTracks to delete.
     * @example
     * // Delete a few PlaylistTracks
     * const { count } = await prisma.playlistTrack.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PlaylistTrackDeleteManyArgs>(
      args?: SelectSubset<T, PlaylistTrackDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more PlaylistTracks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistTrackUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PlaylistTracks
     * const playlistTrack = await prisma.playlistTrack.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PlaylistTrackUpdateManyArgs>(
      args: SelectSubset<T, PlaylistTrackUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more PlaylistTracks and returns the data updated in the database.
     * @param {PlaylistTrackUpdateManyAndReturnArgs} args - Arguments to update many PlaylistTracks.
     * @example
     * // Update many PlaylistTracks
     * const playlistTrack = await prisma.playlistTrack.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more PlaylistTracks and only return the `id`
     * const playlistTrackWithIdOnly = await prisma.playlistTrack.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends PlaylistTrackUpdateManyAndReturnArgs>(
      args: SelectSubset<T, PlaylistTrackUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'updateManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Create or update one PlaylistTrack.
     * @param {PlaylistTrackUpsertArgs} args - Arguments to update or create a PlaylistTrack.
     * @example
     * // Update or create a PlaylistTrack
     * const playlistTrack = await prisma.playlistTrack.upsert({
     *   create: {
     *     // ... data to create a PlaylistTrack
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PlaylistTrack we want to update
     *   }
     * })
     */
    upsert<T extends PlaylistTrackUpsertArgs>(
      args: SelectSubset<T, PlaylistTrackUpsertArgs<ExtArgs>>,
    ): Prisma__PlaylistTrackClient<
      $Result.GetResult<Prisma.$PlaylistTrackPayload<ExtArgs>, T, 'upsert', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of PlaylistTracks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistTrackCountArgs} args - Arguments to filter PlaylistTracks to count.
     * @example
     * // Count the number of PlaylistTracks
     * const count = await prisma.playlistTrack.count({
     *   where: {
     *     // ... the filter for the PlaylistTracks we want to count
     *   }
     * })
     **/
    count<T extends PlaylistTrackCountArgs>(
      args?: Subset<T, PlaylistTrackCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PlaylistTrackCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a PlaylistTrack.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistTrackAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends PlaylistTrackAggregateArgs>(
      args: Subset<T, PlaylistTrackAggregateArgs>,
    ): Prisma.PrismaPromise<GetPlaylistTrackAggregateType<T>>;

    /**
     * Group by PlaylistTrack.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlaylistTrackGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends PlaylistTrackGroupByArgs,
      HasSelectOrTake extends Or<Extends<'skip', Keys<T>>, Extends<'take', Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PlaylistTrackGroupByArgs['orderBy'] }
        : { orderBy?: PlaylistTrackGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, 'Field ', P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, PlaylistTrackGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetPlaylistTrackGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the PlaylistTrack model
     */
    readonly fields: PlaylistTrackFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PlaylistTrack.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PlaylistTrackClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    playlist<T extends PlaylistDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, PlaylistDefaultArgs<ExtArgs>>,
    ): Prisma__PlaylistClient<
      $Result.GetResult<Prisma.$PlaylistPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the PlaylistTrack model
   */
  interface PlaylistTrackFieldRefs {
    readonly id: FieldRef<'PlaylistTrack', 'String'>;
    readonly playlistId: FieldRef<'PlaylistTrack', 'String'>;
    readonly position: FieldRef<'PlaylistTrack', 'Int'>;
    readonly title: FieldRef<'PlaylistTrack', 'String'>;
    readonly artist: FieldRef<'PlaylistTrack', 'String'>;
    readonly duration: FieldRef<'PlaylistTrack', 'Int'>;
    readonly url: FieldRef<'PlaylistTrack', 'String'>;
    readonly thumbnail: FieldRef<'PlaylistTrack', 'String'>;
    readonly platform: FieldRef<'PlaylistTrack', 'String'>;
    readonly platformId: FieldRef<'PlaylistTrack', 'String'>;
    readonly filePath: FieldRef<'PlaylistTrack', 'String'>;
    readonly addedAt: FieldRef<'PlaylistTrack', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * PlaylistTrack findUnique
   */
  export type PlaylistTrackFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    /**
     * Filter, which PlaylistTrack to fetch.
     */
    where: PlaylistTrackWhereUniqueInput;
  };

  /**
   * PlaylistTrack findUniqueOrThrow
   */
  export type PlaylistTrackFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    /**
     * Filter, which PlaylistTrack to fetch.
     */
    where: PlaylistTrackWhereUniqueInput;
  };

  /**
   * PlaylistTrack findFirst
   */
  export type PlaylistTrackFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    /**
     * Filter, which PlaylistTrack to fetch.
     */
    where?: PlaylistTrackWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlaylistTracks to fetch.
     */
    orderBy?: PlaylistTrackOrderByWithRelationInput | PlaylistTrackOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PlaylistTracks.
     */
    cursor?: PlaylistTrackWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlaylistTracks from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlaylistTracks.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PlaylistTracks.
     */
    distinct?: PlaylistTrackScalarFieldEnum | PlaylistTrackScalarFieldEnum[];
  };

  /**
   * PlaylistTrack findFirstOrThrow
   */
  export type PlaylistTrackFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    /**
     * Filter, which PlaylistTrack to fetch.
     */
    where?: PlaylistTrackWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlaylistTracks to fetch.
     */
    orderBy?: PlaylistTrackOrderByWithRelationInput | PlaylistTrackOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PlaylistTracks.
     */
    cursor?: PlaylistTrackWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlaylistTracks from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlaylistTracks.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PlaylistTracks.
     */
    distinct?: PlaylistTrackScalarFieldEnum | PlaylistTrackScalarFieldEnum[];
  };

  /**
   * PlaylistTrack findMany
   */
  export type PlaylistTrackFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    /**
     * Filter, which PlaylistTracks to fetch.
     */
    where?: PlaylistTrackWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlaylistTracks to fetch.
     */
    orderBy?: PlaylistTrackOrderByWithRelationInput | PlaylistTrackOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing PlaylistTracks.
     */
    cursor?: PlaylistTrackWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlaylistTracks from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlaylistTracks.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PlaylistTracks.
     */
    distinct?: PlaylistTrackScalarFieldEnum | PlaylistTrackScalarFieldEnum[];
  };

  /**
   * PlaylistTrack create
   */
  export type PlaylistTrackCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    /**
     * The data needed to create a PlaylistTrack.
     */
    data: XOR<PlaylistTrackCreateInput, PlaylistTrackUncheckedCreateInput>;
  };

  /**
   * PlaylistTrack createMany
   */
  export type PlaylistTrackCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PlaylistTracks.
     */
    data: PlaylistTrackCreateManyInput | PlaylistTrackCreateManyInput[];
  };

  /**
   * PlaylistTrack createManyAndReturn
   */
  export type PlaylistTrackCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the PlaylistTrack
       */
      select?: PlaylistTrackSelectCreateManyAndReturn<ExtArgs> | null;
      /**
       * Omit specific fields from the PlaylistTrack
       */
      omit?: PlaylistTrackOmit<ExtArgs> | null;
      /**
       * The data used to create many PlaylistTracks.
       */
      data: PlaylistTrackCreateManyInput | PlaylistTrackCreateManyInput[];
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: PlaylistTrackIncludeCreateManyAndReturn<ExtArgs> | null;
    };

  /**
   * PlaylistTrack update
   */
  export type PlaylistTrackUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    /**
     * The data needed to update a PlaylistTrack.
     */
    data: XOR<PlaylistTrackUpdateInput, PlaylistTrackUncheckedUpdateInput>;
    /**
     * Choose, which PlaylistTrack to update.
     */
    where: PlaylistTrackWhereUniqueInput;
  };

  /**
   * PlaylistTrack updateMany
   */
  export type PlaylistTrackUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PlaylistTracks.
     */
    data: XOR<PlaylistTrackUpdateManyMutationInput, PlaylistTrackUncheckedUpdateManyInput>;
    /**
     * Filter which PlaylistTracks to update
     */
    where?: PlaylistTrackWhereInput;
    /**
     * Limit how many PlaylistTracks to update.
     */
    limit?: number;
  };

  /**
   * PlaylistTrack updateManyAndReturn
   */
  export type PlaylistTrackUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the PlaylistTrack
       */
      select?: PlaylistTrackSelectUpdateManyAndReturn<ExtArgs> | null;
      /**
       * Omit specific fields from the PlaylistTrack
       */
      omit?: PlaylistTrackOmit<ExtArgs> | null;
      /**
       * The data used to update PlaylistTracks.
       */
      data: XOR<PlaylistTrackUpdateManyMutationInput, PlaylistTrackUncheckedUpdateManyInput>;
      /**
       * Filter which PlaylistTracks to update
       */
      where?: PlaylistTrackWhereInput;
      /**
       * Limit how many PlaylistTracks to update.
       */
      limit?: number;
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: PlaylistTrackIncludeUpdateManyAndReturn<ExtArgs> | null;
    };

  /**
   * PlaylistTrack upsert
   */
  export type PlaylistTrackUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    /**
     * The filter to search for the PlaylistTrack to update in case it exists.
     */
    where: PlaylistTrackWhereUniqueInput;
    /**
     * In case the PlaylistTrack found by the `where` argument doesn't exist, create a new PlaylistTrack with this data.
     */
    create: XOR<PlaylistTrackCreateInput, PlaylistTrackUncheckedCreateInput>;
    /**
     * In case the PlaylistTrack was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PlaylistTrackUpdateInput, PlaylistTrackUncheckedUpdateInput>;
  };

  /**
   * PlaylistTrack delete
   */
  export type PlaylistTrackDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
    /**
     * Filter which PlaylistTrack to delete.
     */
    where: PlaylistTrackWhereUniqueInput;
  };

  /**
   * PlaylistTrack deleteMany
   */
  export type PlaylistTrackDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PlaylistTracks to delete
     */
    where?: PlaylistTrackWhereInput;
    /**
     * Limit how many PlaylistTracks to delete.
     */
    limit?: number;
  };

  /**
   * PlaylistTrack without action
   */
  export type PlaylistTrackDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlaylistTrack
     */
    select?: PlaylistTrackSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlaylistTrack
     */
    omit?: PlaylistTrackOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlaylistTrackInclude<ExtArgs> | null;
  };

  /**
   * Model PlayHistory
   */

  export type AggregatePlayHistory = {
    _count: PlayHistoryCountAggregateOutputType | null;
    _avg: PlayHistoryAvgAggregateOutputType | null;
    _sum: PlayHistorySumAggregateOutputType | null;
    _min: PlayHistoryMinAggregateOutputType | null;
    _max: PlayHistoryMaxAggregateOutputType | null;
  };

  export type PlayHistoryAvgAggregateOutputType = {
    duration: number | null;
  };

  export type PlayHistorySumAggregateOutputType = {
    duration: number | null;
  };

  export type PlayHistoryMinAggregateOutputType = {
    id: string | null;
    guildId: string | null;
    userId: string | null;
    title: string | null;
    artist: string | null;
    duration: number | null;
    url: string | null;
    platform: string | null;
    platformId: string | null;
    playedAt: Date | null;
    completedAt: Date | null;
  };

  export type PlayHistoryMaxAggregateOutputType = {
    id: string | null;
    guildId: string | null;
    userId: string | null;
    title: string | null;
    artist: string | null;
    duration: number | null;
    url: string | null;
    platform: string | null;
    platformId: string | null;
    playedAt: Date | null;
    completedAt: Date | null;
  };

  export type PlayHistoryCountAggregateOutputType = {
    id: number;
    guildId: number;
    userId: number;
    title: number;
    artist: number;
    duration: number;
    url: number;
    platform: number;
    platformId: number;
    playedAt: number;
    completedAt: number;
    _all: number;
  };

  export type PlayHistoryAvgAggregateInputType = {
    duration?: true;
  };

  export type PlayHistorySumAggregateInputType = {
    duration?: true;
  };

  export type PlayHistoryMinAggregateInputType = {
    id?: true;
    guildId?: true;
    userId?: true;
    title?: true;
    artist?: true;
    duration?: true;
    url?: true;
    platform?: true;
    platformId?: true;
    playedAt?: true;
    completedAt?: true;
  };

  export type PlayHistoryMaxAggregateInputType = {
    id?: true;
    guildId?: true;
    userId?: true;
    title?: true;
    artist?: true;
    duration?: true;
    url?: true;
    platform?: true;
    platformId?: true;
    playedAt?: true;
    completedAt?: true;
  };

  export type PlayHistoryCountAggregateInputType = {
    id?: true;
    guildId?: true;
    userId?: true;
    title?: true;
    artist?: true;
    duration?: true;
    url?: true;
    platform?: true;
    platformId?: true;
    playedAt?: true;
    completedAt?: true;
    _all?: true;
  };

  export type PlayHistoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PlayHistory to aggregate.
     */
    where?: PlayHistoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlayHistories to fetch.
     */
    orderBy?: PlayHistoryOrderByWithRelationInput | PlayHistoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: PlayHistoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlayHistories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlayHistories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned PlayHistories
     **/
    _count?: true | PlayHistoryCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: PlayHistoryAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: PlayHistorySumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: PlayHistoryMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: PlayHistoryMaxAggregateInputType;
  };

  export type GetPlayHistoryAggregateType<T extends PlayHistoryAggregateArgs> = {
    [P in keyof T & keyof AggregatePlayHistory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePlayHistory[P]>
      : GetScalarType<T[P], AggregatePlayHistory[P]>;
  };

  export type PlayHistoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PlayHistoryWhereInput;
    orderBy?: PlayHistoryOrderByWithAggregationInput | PlayHistoryOrderByWithAggregationInput[];
    by: PlayHistoryScalarFieldEnum[] | PlayHistoryScalarFieldEnum;
    having?: PlayHistoryScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: PlayHistoryCountAggregateInputType | true;
    _avg?: PlayHistoryAvgAggregateInputType;
    _sum?: PlayHistorySumAggregateInputType;
    _min?: PlayHistoryMinAggregateInputType;
    _max?: PlayHistoryMaxAggregateInputType;
  };

  export type PlayHistoryGroupByOutputType = {
    id: string;
    guildId: string;
    userId: string;
    title: string;
    artist: string | null;
    duration: number;
    url: string;
    platform: string;
    platformId: string | null;
    playedAt: Date;
    completedAt: Date | null;
    _count: PlayHistoryCountAggregateOutputType | null;
    _avg: PlayHistoryAvgAggregateOutputType | null;
    _sum: PlayHistorySumAggregateOutputType | null;
    _min: PlayHistoryMinAggregateOutputType | null;
    _max: PlayHistoryMaxAggregateOutputType | null;
  };

  type GetPlayHistoryGroupByPayload<T extends PlayHistoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PlayHistoryGroupByOutputType, T['by']> & {
        [P in keyof T & keyof PlayHistoryGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], PlayHistoryGroupByOutputType[P]>
          : GetScalarType<T[P], PlayHistoryGroupByOutputType[P]>;
      }
    >
  >;

  export type PlayHistorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        guildId?: boolean;
        userId?: boolean;
        title?: boolean;
        artist?: boolean;
        duration?: boolean;
        url?: boolean;
        platform?: boolean;
        platformId?: boolean;
        playedAt?: boolean;
        completedAt?: boolean;
        guild?: boolean | GuildDefaultArgs<ExtArgs>;
      },
      ExtArgs['result']['playHistory']
    >;

  export type PlayHistorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        guildId?: boolean;
        userId?: boolean;
        title?: boolean;
        artist?: boolean;
        duration?: boolean;
        url?: boolean;
        platform?: boolean;
        platformId?: boolean;
        playedAt?: boolean;
        completedAt?: boolean;
        guild?: boolean | GuildDefaultArgs<ExtArgs>;
      },
      ExtArgs['result']['playHistory']
    >;

  export type PlayHistorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        guildId?: boolean;
        userId?: boolean;
        title?: boolean;
        artist?: boolean;
        duration?: boolean;
        url?: boolean;
        platform?: boolean;
        platformId?: boolean;
        playedAt?: boolean;
        completedAt?: boolean;
        guild?: boolean | GuildDefaultArgs<ExtArgs>;
      },
      ExtArgs['result']['playHistory']
    >;

  export type PlayHistorySelectScalar = {
    id?: boolean;
    guildId?: boolean;
    userId?: boolean;
    title?: boolean;
    artist?: boolean;
    duration?: boolean;
    url?: boolean;
    platform?: boolean;
    platformId?: boolean;
    playedAt?: boolean;
    completedAt?: boolean;
  };

  export type PlayHistoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<
    | 'id'
    | 'guildId'
    | 'userId'
    | 'title'
    | 'artist'
    | 'duration'
    | 'url'
    | 'platform'
    | 'platformId'
    | 'playedAt'
    | 'completedAt',
    ExtArgs['result']['playHistory']
  >;
  export type PlayHistoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    guild?: boolean | GuildDefaultArgs<ExtArgs>;
  };
  export type PlayHistoryIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    guild?: boolean | GuildDefaultArgs<ExtArgs>;
  };
  export type PlayHistoryIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    guild?: boolean | GuildDefaultArgs<ExtArgs>;
  };

  export type $PlayHistoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: 'PlayHistory';
    objects: {
      guild: Prisma.$GuildPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        guildId: string;
        userId: string;
        title: string;
        artist: string | null;
        duration: number;
        url: string;
        platform: string;
        platformId: string | null;
        playedAt: Date;
        completedAt: Date | null;
      },
      ExtArgs['result']['playHistory']
    >;
    composites: {};
  };

  type PlayHistoryGetPayload<S extends boolean | null | undefined | PlayHistoryDefaultArgs> = $Result.GetResult<
    Prisma.$PlayHistoryPayload,
    S
  >;

  type PlayHistoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    PlayHistoryFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: PlayHistoryCountAggregateInputType | true;
  };

  export interface PlayHistoryDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PlayHistory']; meta: { name: 'PlayHistory' } };
    /**
     * Find zero or one PlayHistory that matches the filter.
     * @param {PlayHistoryFindUniqueArgs} args - Arguments to find a PlayHistory
     * @example
     * // Get one PlayHistory
     * const playHistory = await prisma.playHistory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PlayHistoryFindUniqueArgs>(
      args: SelectSubset<T, PlayHistoryFindUniqueArgs<ExtArgs>>,
    ): Prisma__PlayHistoryClient<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'findUnique', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one PlayHistory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PlayHistoryFindUniqueOrThrowArgs} args - Arguments to find a PlayHistory
     * @example
     * // Get one PlayHistory
     * const playHistory = await prisma.playHistory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PlayHistoryFindUniqueOrThrowArgs>(
      args: SelectSubset<T, PlayHistoryFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__PlayHistoryClient<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first PlayHistory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayHistoryFindFirstArgs} args - Arguments to find a PlayHistory
     * @example
     * // Get one PlayHistory
     * const playHistory = await prisma.playHistory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PlayHistoryFindFirstArgs>(
      args?: SelectSubset<T, PlayHistoryFindFirstArgs<ExtArgs>>,
    ): Prisma__PlayHistoryClient<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'findFirst', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first PlayHistory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayHistoryFindFirstOrThrowArgs} args - Arguments to find a PlayHistory
     * @example
     * // Get one PlayHistory
     * const playHistory = await prisma.playHistory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PlayHistoryFindFirstOrThrowArgs>(
      args?: SelectSubset<T, PlayHistoryFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__PlayHistoryClient<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'findFirstOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more PlayHistories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayHistoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PlayHistories
     * const playHistories = await prisma.playHistory.findMany()
     *
     * // Get first 10 PlayHistories
     * const playHistories = await prisma.playHistory.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const playHistoryWithIdOnly = await prisma.playHistory.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PlayHistoryFindManyArgs>(
      args?: SelectSubset<T, PlayHistoryFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions>>;

    /**
     * Create a PlayHistory.
     * @param {PlayHistoryCreateArgs} args - Arguments to create a PlayHistory.
     * @example
     * // Create one PlayHistory
     * const PlayHistory = await prisma.playHistory.create({
     *   data: {
     *     // ... data to create a PlayHistory
     *   }
     * })
     *
     */
    create<T extends PlayHistoryCreateArgs>(
      args: SelectSubset<T, PlayHistoryCreateArgs<ExtArgs>>,
    ): Prisma__PlayHistoryClient<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'create', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many PlayHistories.
     * @param {PlayHistoryCreateManyArgs} args - Arguments to create many PlayHistories.
     * @example
     * // Create many PlayHistories
     * const playHistory = await prisma.playHistory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PlayHistoryCreateManyArgs>(
      args?: SelectSubset<T, PlayHistoryCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many PlayHistories and returns the data saved in the database.
     * @param {PlayHistoryCreateManyAndReturnArgs} args - Arguments to create many PlayHistories.
     * @example
     * // Create many PlayHistories
     * const playHistory = await prisma.playHistory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many PlayHistories and only return the `id`
     * const playHistoryWithIdOnly = await prisma.playHistory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PlayHistoryCreateManyAndReturnArgs>(
      args?: SelectSubset<T, PlayHistoryCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'createManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Delete a PlayHistory.
     * @param {PlayHistoryDeleteArgs} args - Arguments to delete one PlayHistory.
     * @example
     * // Delete one PlayHistory
     * const PlayHistory = await prisma.playHistory.delete({
     *   where: {
     *     // ... filter to delete one PlayHistory
     *   }
     * })
     *
     */
    delete<T extends PlayHistoryDeleteArgs>(
      args: SelectSubset<T, PlayHistoryDeleteArgs<ExtArgs>>,
    ): Prisma__PlayHistoryClient<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'delete', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one PlayHistory.
     * @param {PlayHistoryUpdateArgs} args - Arguments to update one PlayHistory.
     * @example
     * // Update one PlayHistory
     * const playHistory = await prisma.playHistory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PlayHistoryUpdateArgs>(
      args: SelectSubset<T, PlayHistoryUpdateArgs<ExtArgs>>,
    ): Prisma__PlayHistoryClient<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'update', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more PlayHistories.
     * @param {PlayHistoryDeleteManyArgs} args - Arguments to filter PlayHistories to delete.
     * @example
     * // Delete a few PlayHistories
     * const { count } = await prisma.playHistory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PlayHistoryDeleteManyArgs>(
      args?: SelectSubset<T, PlayHistoryDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more PlayHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayHistoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PlayHistories
     * const playHistory = await prisma.playHistory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PlayHistoryUpdateManyArgs>(
      args: SelectSubset<T, PlayHistoryUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more PlayHistories and returns the data updated in the database.
     * @param {PlayHistoryUpdateManyAndReturnArgs} args - Arguments to update many PlayHistories.
     * @example
     * // Update many PlayHistories
     * const playHistory = await prisma.playHistory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more PlayHistories and only return the `id`
     * const playHistoryWithIdOnly = await prisma.playHistory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends PlayHistoryUpdateManyAndReturnArgs>(
      args: SelectSubset<T, PlayHistoryUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'updateManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Create or update one PlayHistory.
     * @param {PlayHistoryUpsertArgs} args - Arguments to update or create a PlayHistory.
     * @example
     * // Update or create a PlayHistory
     * const playHistory = await prisma.playHistory.upsert({
     *   create: {
     *     // ... data to create a PlayHistory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PlayHistory we want to update
     *   }
     * })
     */
    upsert<T extends PlayHistoryUpsertArgs>(
      args: SelectSubset<T, PlayHistoryUpsertArgs<ExtArgs>>,
    ): Prisma__PlayHistoryClient<
      $Result.GetResult<Prisma.$PlayHistoryPayload<ExtArgs>, T, 'upsert', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of PlayHistories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayHistoryCountArgs} args - Arguments to filter PlayHistories to count.
     * @example
     * // Count the number of PlayHistories
     * const count = await prisma.playHistory.count({
     *   where: {
     *     // ... the filter for the PlayHistories we want to count
     *   }
     * })
     **/
    count<T extends PlayHistoryCountArgs>(
      args?: Subset<T, PlayHistoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PlayHistoryCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a PlayHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayHistoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends PlayHistoryAggregateArgs>(
      args: Subset<T, PlayHistoryAggregateArgs>,
    ): Prisma.PrismaPromise<GetPlayHistoryAggregateType<T>>;

    /**
     * Group by PlayHistory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PlayHistoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends PlayHistoryGroupByArgs,
      HasSelectOrTake extends Or<Extends<'skip', Keys<T>>, Extends<'take', Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PlayHistoryGroupByArgs['orderBy'] }
        : { orderBy?: PlayHistoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, 'Field ', P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, PlayHistoryGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetPlayHistoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the PlayHistory model
     */
    readonly fields: PlayHistoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PlayHistory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PlayHistoryClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    guild<T extends GuildDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, GuildDefaultArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the PlayHistory model
   */
  interface PlayHistoryFieldRefs {
    readonly id: FieldRef<'PlayHistory', 'String'>;
    readonly guildId: FieldRef<'PlayHistory', 'String'>;
    readonly userId: FieldRef<'PlayHistory', 'String'>;
    readonly title: FieldRef<'PlayHistory', 'String'>;
    readonly artist: FieldRef<'PlayHistory', 'String'>;
    readonly duration: FieldRef<'PlayHistory', 'Int'>;
    readonly url: FieldRef<'PlayHistory', 'String'>;
    readonly platform: FieldRef<'PlayHistory', 'String'>;
    readonly platformId: FieldRef<'PlayHistory', 'String'>;
    readonly playedAt: FieldRef<'PlayHistory', 'DateTime'>;
    readonly completedAt: FieldRef<'PlayHistory', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * PlayHistory findUnique
   */
  export type PlayHistoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    /**
     * Filter, which PlayHistory to fetch.
     */
    where: PlayHistoryWhereUniqueInput;
  };

  /**
   * PlayHistory findUniqueOrThrow
   */
  export type PlayHistoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    /**
     * Filter, which PlayHistory to fetch.
     */
    where: PlayHistoryWhereUniqueInput;
  };

  /**
   * PlayHistory findFirst
   */
  export type PlayHistoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    /**
     * Filter, which PlayHistory to fetch.
     */
    where?: PlayHistoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlayHistories to fetch.
     */
    orderBy?: PlayHistoryOrderByWithRelationInput | PlayHistoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PlayHistories.
     */
    cursor?: PlayHistoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlayHistories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlayHistories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PlayHistories.
     */
    distinct?: PlayHistoryScalarFieldEnum | PlayHistoryScalarFieldEnum[];
  };

  /**
   * PlayHistory findFirstOrThrow
   */
  export type PlayHistoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    /**
     * Filter, which PlayHistory to fetch.
     */
    where?: PlayHistoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlayHistories to fetch.
     */
    orderBy?: PlayHistoryOrderByWithRelationInput | PlayHistoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for PlayHistories.
     */
    cursor?: PlayHistoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlayHistories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlayHistories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PlayHistories.
     */
    distinct?: PlayHistoryScalarFieldEnum | PlayHistoryScalarFieldEnum[];
  };

  /**
   * PlayHistory findMany
   */
  export type PlayHistoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    /**
     * Filter, which PlayHistories to fetch.
     */
    where?: PlayHistoryWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of PlayHistories to fetch.
     */
    orderBy?: PlayHistoryOrderByWithRelationInput | PlayHistoryOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing PlayHistories.
     */
    cursor?: PlayHistoryWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` PlayHistories from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` PlayHistories.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of PlayHistories.
     */
    distinct?: PlayHistoryScalarFieldEnum | PlayHistoryScalarFieldEnum[];
  };

  /**
   * PlayHistory create
   */
  export type PlayHistoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    /**
     * The data needed to create a PlayHistory.
     */
    data: XOR<PlayHistoryCreateInput, PlayHistoryUncheckedCreateInput>;
  };

  /**
   * PlayHistory createMany
   */
  export type PlayHistoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PlayHistories.
     */
    data: PlayHistoryCreateManyInput | PlayHistoryCreateManyInput[];
  };

  /**
   * PlayHistory createManyAndReturn
   */
  export type PlayHistoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * The data used to create many PlayHistories.
     */
    data: PlayHistoryCreateManyInput | PlayHistoryCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * PlayHistory update
   */
  export type PlayHistoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    /**
     * The data needed to update a PlayHistory.
     */
    data: XOR<PlayHistoryUpdateInput, PlayHistoryUncheckedUpdateInput>;
    /**
     * Choose, which PlayHistory to update.
     */
    where: PlayHistoryWhereUniqueInput;
  };

  /**
   * PlayHistory updateMany
   */
  export type PlayHistoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PlayHistories.
     */
    data: XOR<PlayHistoryUpdateManyMutationInput, PlayHistoryUncheckedUpdateManyInput>;
    /**
     * Filter which PlayHistories to update
     */
    where?: PlayHistoryWhereInput;
    /**
     * Limit how many PlayHistories to update.
     */
    limit?: number;
  };

  /**
   * PlayHistory updateManyAndReturn
   */
  export type PlayHistoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * The data used to update PlayHistories.
     */
    data: XOR<PlayHistoryUpdateManyMutationInput, PlayHistoryUncheckedUpdateManyInput>;
    /**
     * Filter which PlayHistories to update
     */
    where?: PlayHistoryWhereInput;
    /**
     * Limit how many PlayHistories to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * PlayHistory upsert
   */
  export type PlayHistoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    /**
     * The filter to search for the PlayHistory to update in case it exists.
     */
    where: PlayHistoryWhereUniqueInput;
    /**
     * In case the PlayHistory found by the `where` argument doesn't exist, create a new PlayHistory with this data.
     */
    create: XOR<PlayHistoryCreateInput, PlayHistoryUncheckedCreateInput>;
    /**
     * In case the PlayHistory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PlayHistoryUpdateInput, PlayHistoryUncheckedUpdateInput>;
  };

  /**
   * PlayHistory delete
   */
  export type PlayHistoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
    /**
     * Filter which PlayHistory to delete.
     */
    where: PlayHistoryWhereUniqueInput;
  };

  /**
   * PlayHistory deleteMany
   */
  export type PlayHistoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PlayHistories to delete
     */
    where?: PlayHistoryWhereInput;
    /**
     * Limit how many PlayHistories to delete.
     */
    limit?: number;
  };

  /**
   * PlayHistory without action
   */
  export type PlayHistoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PlayHistory
     */
    select?: PlayHistorySelect<ExtArgs> | null;
    /**
     * Omit specific fields from the PlayHistory
     */
    omit?: PlayHistoryOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PlayHistoryInclude<ExtArgs> | null;
  };

  /**
   * Model QueueSnapshot
   */

  export type AggregateQueueSnapshot = {
    _count: QueueSnapshotCountAggregateOutputType | null;
    _avg: QueueSnapshotAvgAggregateOutputType | null;
    _sum: QueueSnapshotSumAggregateOutputType | null;
    _min: QueueSnapshotMinAggregateOutputType | null;
    _max: QueueSnapshotMaxAggregateOutputType | null;
  };

  export type QueueSnapshotAvgAggregateOutputType = {
    currentPosition: number | null;
    volume: number | null;
  };

  export type QueueSnapshotSumAggregateOutputType = {
    currentPosition: number | null;
    volume: number | null;
  };

  export type QueueSnapshotMinAggregateOutputType = {
    id: string | null;
    guildId: string | null;
    currentTrackUrl: string | null;
    currentPosition: number | null;
    volume: number | null;
    loopMode: string | null;
    tracks: string | null;
    createdAt: Date | null;
  };

  export type QueueSnapshotMaxAggregateOutputType = {
    id: string | null;
    guildId: string | null;
    currentTrackUrl: string | null;
    currentPosition: number | null;
    volume: number | null;
    loopMode: string | null;
    tracks: string | null;
    createdAt: Date | null;
  };

  export type QueueSnapshotCountAggregateOutputType = {
    id: number;
    guildId: number;
    currentTrackUrl: number;
    currentPosition: number;
    volume: number;
    loopMode: number;
    tracks: number;
    createdAt: number;
    _all: number;
  };

  export type QueueSnapshotAvgAggregateInputType = {
    currentPosition?: true;
    volume?: true;
  };

  export type QueueSnapshotSumAggregateInputType = {
    currentPosition?: true;
    volume?: true;
  };

  export type QueueSnapshotMinAggregateInputType = {
    id?: true;
    guildId?: true;
    currentTrackUrl?: true;
    currentPosition?: true;
    volume?: true;
    loopMode?: true;
    tracks?: true;
    createdAt?: true;
  };

  export type QueueSnapshotMaxAggregateInputType = {
    id?: true;
    guildId?: true;
    currentTrackUrl?: true;
    currentPosition?: true;
    volume?: true;
    loopMode?: true;
    tracks?: true;
    createdAt?: true;
  };

  export type QueueSnapshotCountAggregateInputType = {
    id?: true;
    guildId?: true;
    currentTrackUrl?: true;
    currentPosition?: true;
    volume?: true;
    loopMode?: true;
    tracks?: true;
    createdAt?: true;
    _all?: true;
  };

  export type QueueSnapshotAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QueueSnapshot to aggregate.
     */
    where?: QueueSnapshotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of QueueSnapshots to fetch.
     */
    orderBy?: QueueSnapshotOrderByWithRelationInput | QueueSnapshotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: QueueSnapshotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` QueueSnapshots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` QueueSnapshots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned QueueSnapshots
     **/
    _count?: true | QueueSnapshotCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: QueueSnapshotAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: QueueSnapshotSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: QueueSnapshotMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: QueueSnapshotMaxAggregateInputType;
  };

  export type GetQueueSnapshotAggregateType<T extends QueueSnapshotAggregateArgs> = {
    [P in keyof T & keyof AggregateQueueSnapshot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateQueueSnapshot[P]>
      : GetScalarType<T[P], AggregateQueueSnapshot[P]>;
  };

  export type QueueSnapshotGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: QueueSnapshotWhereInput;
    orderBy?: QueueSnapshotOrderByWithAggregationInput | QueueSnapshotOrderByWithAggregationInput[];
    by: QueueSnapshotScalarFieldEnum[] | QueueSnapshotScalarFieldEnum;
    having?: QueueSnapshotScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: QueueSnapshotCountAggregateInputType | true;
    _avg?: QueueSnapshotAvgAggregateInputType;
    _sum?: QueueSnapshotSumAggregateInputType;
    _min?: QueueSnapshotMinAggregateInputType;
    _max?: QueueSnapshotMaxAggregateInputType;
  };

  export type QueueSnapshotGroupByOutputType = {
    id: string;
    guildId: string;
    currentTrackUrl: string | null;
    currentPosition: number;
    volume: number;
    loopMode: string;
    tracks: string;
    createdAt: Date;
    _count: QueueSnapshotCountAggregateOutputType | null;
    _avg: QueueSnapshotAvgAggregateOutputType | null;
    _sum: QueueSnapshotSumAggregateOutputType | null;
    _min: QueueSnapshotMinAggregateOutputType | null;
    _max: QueueSnapshotMaxAggregateOutputType | null;
  };

  type GetQueueSnapshotGroupByPayload<T extends QueueSnapshotGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<QueueSnapshotGroupByOutputType, T['by']> & {
        [P in keyof T & keyof QueueSnapshotGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], QueueSnapshotGroupByOutputType[P]>
          : GetScalarType<T[P], QueueSnapshotGroupByOutputType[P]>;
      }
    >
  >;

  export type QueueSnapshotSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        guildId?: boolean;
        currentTrackUrl?: boolean;
        currentPosition?: boolean;
        volume?: boolean;
        loopMode?: boolean;
        tracks?: boolean;
        createdAt?: boolean;
        guild?: boolean | GuildDefaultArgs<ExtArgs>;
      },
      ExtArgs['result']['queueSnapshot']
    >;

  export type QueueSnapshotSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      guildId?: boolean;
      currentTrackUrl?: boolean;
      currentPosition?: boolean;
      volume?: boolean;
      loopMode?: boolean;
      tracks?: boolean;
      createdAt?: boolean;
      guild?: boolean | GuildDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['queueSnapshot']
  >;

  export type QueueSnapshotSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      guildId?: boolean;
      currentTrackUrl?: boolean;
      currentPosition?: boolean;
      volume?: boolean;
      loopMode?: boolean;
      tracks?: boolean;
      createdAt?: boolean;
      guild?: boolean | GuildDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['queueSnapshot']
  >;

  export type QueueSnapshotSelectScalar = {
    id?: boolean;
    guildId?: boolean;
    currentTrackUrl?: boolean;
    currentPosition?: boolean;
    volume?: boolean;
    loopMode?: boolean;
    tracks?: boolean;
    createdAt?: boolean;
  };

  export type QueueSnapshotOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetOmit<
      'id' | 'guildId' | 'currentTrackUrl' | 'currentPosition' | 'volume' | 'loopMode' | 'tracks' | 'createdAt',
      ExtArgs['result']['queueSnapshot']
    >;
  export type QueueSnapshotInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    guild?: boolean | GuildDefaultArgs<ExtArgs>;
  };
  export type QueueSnapshotIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    guild?: boolean | GuildDefaultArgs<ExtArgs>;
  };
  export type QueueSnapshotIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    guild?: boolean | GuildDefaultArgs<ExtArgs>;
  };

  export type $QueueSnapshotPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: 'QueueSnapshot';
    objects: {
      guild: Prisma.$GuildPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        guildId: string;
        currentTrackUrl: string | null;
        currentPosition: number;
        volume: number;
        loopMode: string;
        tracks: string;
        createdAt: Date;
      },
      ExtArgs['result']['queueSnapshot']
    >;
    composites: {};
  };

  type QueueSnapshotGetPayload<S extends boolean | null | undefined | QueueSnapshotDefaultArgs> = $Result.GetResult<
    Prisma.$QueueSnapshotPayload,
    S
  >;

  type QueueSnapshotCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    QueueSnapshotFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: QueueSnapshotCountAggregateInputType | true;
  };

  export interface QueueSnapshotDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['QueueSnapshot']; meta: { name: 'QueueSnapshot' } };
    /**
     * Find zero or one QueueSnapshot that matches the filter.
     * @param {QueueSnapshotFindUniqueArgs} args - Arguments to find a QueueSnapshot
     * @example
     * // Get one QueueSnapshot
     * const queueSnapshot = await prisma.queueSnapshot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends QueueSnapshotFindUniqueArgs>(
      args: SelectSubset<T, QueueSnapshotFindUniqueArgs<ExtArgs>>,
    ): Prisma__QueueSnapshotClient<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'findUnique', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one QueueSnapshot that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {QueueSnapshotFindUniqueOrThrowArgs} args - Arguments to find a QueueSnapshot
     * @example
     * // Get one QueueSnapshot
     * const queueSnapshot = await prisma.queueSnapshot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends QueueSnapshotFindUniqueOrThrowArgs>(
      args: SelectSubset<T, QueueSnapshotFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__QueueSnapshotClient<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first QueueSnapshot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueSnapshotFindFirstArgs} args - Arguments to find a QueueSnapshot
     * @example
     * // Get one QueueSnapshot
     * const queueSnapshot = await prisma.queueSnapshot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends QueueSnapshotFindFirstArgs>(
      args?: SelectSubset<T, QueueSnapshotFindFirstArgs<ExtArgs>>,
    ): Prisma__QueueSnapshotClient<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'findFirst', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first QueueSnapshot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueSnapshotFindFirstOrThrowArgs} args - Arguments to find a QueueSnapshot
     * @example
     * // Get one QueueSnapshot
     * const queueSnapshot = await prisma.queueSnapshot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends QueueSnapshotFindFirstOrThrowArgs>(
      args?: SelectSubset<T, QueueSnapshotFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__QueueSnapshotClient<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'findFirstOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more QueueSnapshots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueSnapshotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all QueueSnapshots
     * const queueSnapshots = await prisma.queueSnapshot.findMany()
     *
     * // Get first 10 QueueSnapshots
     * const queueSnapshots = await prisma.queueSnapshot.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const queueSnapshotWithIdOnly = await prisma.queueSnapshot.findMany({ select: { id: true } })
     *
     */
    findMany<T extends QueueSnapshotFindManyArgs>(
      args?: SelectSubset<T, QueueSnapshotFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions>>;

    /**
     * Create a QueueSnapshot.
     * @param {QueueSnapshotCreateArgs} args - Arguments to create a QueueSnapshot.
     * @example
     * // Create one QueueSnapshot
     * const QueueSnapshot = await prisma.queueSnapshot.create({
     *   data: {
     *     // ... data to create a QueueSnapshot
     *   }
     * })
     *
     */
    create<T extends QueueSnapshotCreateArgs>(
      args: SelectSubset<T, QueueSnapshotCreateArgs<ExtArgs>>,
    ): Prisma__QueueSnapshotClient<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'create', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many QueueSnapshots.
     * @param {QueueSnapshotCreateManyArgs} args - Arguments to create many QueueSnapshots.
     * @example
     * // Create many QueueSnapshots
     * const queueSnapshot = await prisma.queueSnapshot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends QueueSnapshotCreateManyArgs>(
      args?: SelectSubset<T, QueueSnapshotCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many QueueSnapshots and returns the data saved in the database.
     * @param {QueueSnapshotCreateManyAndReturnArgs} args - Arguments to create many QueueSnapshots.
     * @example
     * // Create many QueueSnapshots
     * const queueSnapshot = await prisma.queueSnapshot.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many QueueSnapshots and only return the `id`
     * const queueSnapshotWithIdOnly = await prisma.queueSnapshot.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends QueueSnapshotCreateManyAndReturnArgs>(
      args?: SelectSubset<T, QueueSnapshotCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'createManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Delete a QueueSnapshot.
     * @param {QueueSnapshotDeleteArgs} args - Arguments to delete one QueueSnapshot.
     * @example
     * // Delete one QueueSnapshot
     * const QueueSnapshot = await prisma.queueSnapshot.delete({
     *   where: {
     *     // ... filter to delete one QueueSnapshot
     *   }
     * })
     *
     */
    delete<T extends QueueSnapshotDeleteArgs>(
      args: SelectSubset<T, QueueSnapshotDeleteArgs<ExtArgs>>,
    ): Prisma__QueueSnapshotClient<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'delete', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one QueueSnapshot.
     * @param {QueueSnapshotUpdateArgs} args - Arguments to update one QueueSnapshot.
     * @example
     * // Update one QueueSnapshot
     * const queueSnapshot = await prisma.queueSnapshot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends QueueSnapshotUpdateArgs>(
      args: SelectSubset<T, QueueSnapshotUpdateArgs<ExtArgs>>,
    ): Prisma__QueueSnapshotClient<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'update', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more QueueSnapshots.
     * @param {QueueSnapshotDeleteManyArgs} args - Arguments to filter QueueSnapshots to delete.
     * @example
     * // Delete a few QueueSnapshots
     * const { count } = await prisma.queueSnapshot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends QueueSnapshotDeleteManyArgs>(
      args?: SelectSubset<T, QueueSnapshotDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more QueueSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueSnapshotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many QueueSnapshots
     * const queueSnapshot = await prisma.queueSnapshot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends QueueSnapshotUpdateManyArgs>(
      args: SelectSubset<T, QueueSnapshotUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more QueueSnapshots and returns the data updated in the database.
     * @param {QueueSnapshotUpdateManyAndReturnArgs} args - Arguments to update many QueueSnapshots.
     * @example
     * // Update many QueueSnapshots
     * const queueSnapshot = await prisma.queueSnapshot.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more QueueSnapshots and only return the `id`
     * const queueSnapshotWithIdOnly = await prisma.queueSnapshot.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends QueueSnapshotUpdateManyAndReturnArgs>(
      args: SelectSubset<T, QueueSnapshotUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'updateManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Create or update one QueueSnapshot.
     * @param {QueueSnapshotUpsertArgs} args - Arguments to update or create a QueueSnapshot.
     * @example
     * // Update or create a QueueSnapshot
     * const queueSnapshot = await prisma.queueSnapshot.upsert({
     *   create: {
     *     // ... data to create a QueueSnapshot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the QueueSnapshot we want to update
     *   }
     * })
     */
    upsert<T extends QueueSnapshotUpsertArgs>(
      args: SelectSubset<T, QueueSnapshotUpsertArgs<ExtArgs>>,
    ): Prisma__QueueSnapshotClient<
      $Result.GetResult<Prisma.$QueueSnapshotPayload<ExtArgs>, T, 'upsert', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of QueueSnapshots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueSnapshotCountArgs} args - Arguments to filter QueueSnapshots to count.
     * @example
     * // Count the number of QueueSnapshots
     * const count = await prisma.queueSnapshot.count({
     *   where: {
     *     // ... the filter for the QueueSnapshots we want to count
     *   }
     * })
     **/
    count<T extends QueueSnapshotCountArgs>(
      args?: Subset<T, QueueSnapshotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], QueueSnapshotCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a QueueSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueSnapshotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends QueueSnapshotAggregateArgs>(
      args: Subset<T, QueueSnapshotAggregateArgs>,
    ): Prisma.PrismaPromise<GetQueueSnapshotAggregateType<T>>;

    /**
     * Group by QueueSnapshot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {QueueSnapshotGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends QueueSnapshotGroupByArgs,
      HasSelectOrTake extends Or<Extends<'skip', Keys<T>>, Extends<'take', Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: QueueSnapshotGroupByArgs['orderBy'] }
        : { orderBy?: QueueSnapshotGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, 'Field ', P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, QueueSnapshotGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetQueueSnapshotGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the QueueSnapshot model
     */
    readonly fields: QueueSnapshotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for QueueSnapshot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__QueueSnapshotClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    guild<T extends GuildDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, GuildDefaultArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the QueueSnapshot model
   */
  interface QueueSnapshotFieldRefs {
    readonly id: FieldRef<'QueueSnapshot', 'String'>;
    readonly guildId: FieldRef<'QueueSnapshot', 'String'>;
    readonly currentTrackUrl: FieldRef<'QueueSnapshot', 'String'>;
    readonly currentPosition: FieldRef<'QueueSnapshot', 'Int'>;
    readonly volume: FieldRef<'QueueSnapshot', 'Int'>;
    readonly loopMode: FieldRef<'QueueSnapshot', 'String'>;
    readonly tracks: FieldRef<'QueueSnapshot', 'String'>;
    readonly createdAt: FieldRef<'QueueSnapshot', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * QueueSnapshot findUnique
   */
  export type QueueSnapshotFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which QueueSnapshot to fetch.
     */
    where: QueueSnapshotWhereUniqueInput;
  };

  /**
   * QueueSnapshot findUniqueOrThrow
   */
  export type QueueSnapshotFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which QueueSnapshot to fetch.
     */
    where: QueueSnapshotWhereUniqueInput;
  };

  /**
   * QueueSnapshot findFirst
   */
  export type QueueSnapshotFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which QueueSnapshot to fetch.
     */
    where?: QueueSnapshotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of QueueSnapshots to fetch.
     */
    orderBy?: QueueSnapshotOrderByWithRelationInput | QueueSnapshotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for QueueSnapshots.
     */
    cursor?: QueueSnapshotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` QueueSnapshots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` QueueSnapshots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of QueueSnapshots.
     */
    distinct?: QueueSnapshotScalarFieldEnum | QueueSnapshotScalarFieldEnum[];
  };

  /**
   * QueueSnapshot findFirstOrThrow
   */
  export type QueueSnapshotFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which QueueSnapshot to fetch.
     */
    where?: QueueSnapshotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of QueueSnapshots to fetch.
     */
    orderBy?: QueueSnapshotOrderByWithRelationInput | QueueSnapshotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for QueueSnapshots.
     */
    cursor?: QueueSnapshotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` QueueSnapshots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` QueueSnapshots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of QueueSnapshots.
     */
    distinct?: QueueSnapshotScalarFieldEnum | QueueSnapshotScalarFieldEnum[];
  };

  /**
   * QueueSnapshot findMany
   */
  export type QueueSnapshotFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    /**
     * Filter, which QueueSnapshots to fetch.
     */
    where?: QueueSnapshotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of QueueSnapshots to fetch.
     */
    orderBy?: QueueSnapshotOrderByWithRelationInput | QueueSnapshotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing QueueSnapshots.
     */
    cursor?: QueueSnapshotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` QueueSnapshots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` QueueSnapshots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of QueueSnapshots.
     */
    distinct?: QueueSnapshotScalarFieldEnum | QueueSnapshotScalarFieldEnum[];
  };

  /**
   * QueueSnapshot create
   */
  export type QueueSnapshotCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    /**
     * The data needed to create a QueueSnapshot.
     */
    data: XOR<QueueSnapshotCreateInput, QueueSnapshotUncheckedCreateInput>;
  };

  /**
   * QueueSnapshot createMany
   */
  export type QueueSnapshotCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many QueueSnapshots.
     */
    data: QueueSnapshotCreateManyInput | QueueSnapshotCreateManyInput[];
  };

  /**
   * QueueSnapshot createManyAndReturn
   */
  export type QueueSnapshotCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the QueueSnapshot
       */
      select?: QueueSnapshotSelectCreateManyAndReturn<ExtArgs> | null;
      /**
       * Omit specific fields from the QueueSnapshot
       */
      omit?: QueueSnapshotOmit<ExtArgs> | null;
      /**
       * The data used to create many QueueSnapshots.
       */
      data: QueueSnapshotCreateManyInput | QueueSnapshotCreateManyInput[];
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: QueueSnapshotIncludeCreateManyAndReturn<ExtArgs> | null;
    };

  /**
   * QueueSnapshot update
   */
  export type QueueSnapshotUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    /**
     * The data needed to update a QueueSnapshot.
     */
    data: XOR<QueueSnapshotUpdateInput, QueueSnapshotUncheckedUpdateInput>;
    /**
     * Choose, which QueueSnapshot to update.
     */
    where: QueueSnapshotWhereUniqueInput;
  };

  /**
   * QueueSnapshot updateMany
   */
  export type QueueSnapshotUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update QueueSnapshots.
     */
    data: XOR<QueueSnapshotUpdateManyMutationInput, QueueSnapshotUncheckedUpdateManyInput>;
    /**
     * Filter which QueueSnapshots to update
     */
    where?: QueueSnapshotWhereInput;
    /**
     * Limit how many QueueSnapshots to update.
     */
    limit?: number;
  };

  /**
   * QueueSnapshot updateManyAndReturn
   */
  export type QueueSnapshotUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the QueueSnapshot
       */
      select?: QueueSnapshotSelectUpdateManyAndReturn<ExtArgs> | null;
      /**
       * Omit specific fields from the QueueSnapshot
       */
      omit?: QueueSnapshotOmit<ExtArgs> | null;
      /**
       * The data used to update QueueSnapshots.
       */
      data: XOR<QueueSnapshotUpdateManyMutationInput, QueueSnapshotUncheckedUpdateManyInput>;
      /**
       * Filter which QueueSnapshots to update
       */
      where?: QueueSnapshotWhereInput;
      /**
       * Limit how many QueueSnapshots to update.
       */
      limit?: number;
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: QueueSnapshotIncludeUpdateManyAndReturn<ExtArgs> | null;
    };

  /**
   * QueueSnapshot upsert
   */
  export type QueueSnapshotUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    /**
     * The filter to search for the QueueSnapshot to update in case it exists.
     */
    where: QueueSnapshotWhereUniqueInput;
    /**
     * In case the QueueSnapshot found by the `where` argument doesn't exist, create a new QueueSnapshot with this data.
     */
    create: XOR<QueueSnapshotCreateInput, QueueSnapshotUncheckedCreateInput>;
    /**
     * In case the QueueSnapshot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<QueueSnapshotUpdateInput, QueueSnapshotUncheckedUpdateInput>;
  };

  /**
   * QueueSnapshot delete
   */
  export type QueueSnapshotDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
    /**
     * Filter which QueueSnapshot to delete.
     */
    where: QueueSnapshotWhereUniqueInput;
  };

  /**
   * QueueSnapshot deleteMany
   */
  export type QueueSnapshotDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which QueueSnapshots to delete
     */
    where?: QueueSnapshotWhereInput;
    /**
     * Limit how many QueueSnapshots to delete.
     */
    limit?: number;
  };

  /**
   * QueueSnapshot without action
   */
  export type QueueSnapshotDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the QueueSnapshot
     */
    select?: QueueSnapshotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the QueueSnapshot
     */
    omit?: QueueSnapshotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: QueueSnapshotInclude<ExtArgs> | null;
  };

  /**
   * Model UserPreferences
   */

  export type AggregateUserPreferences = {
    _count: UserPreferencesCountAggregateOutputType | null;
    _avg: UserPreferencesAvgAggregateOutputType | null;
    _sum: UserPreferencesSumAggregateOutputType | null;
    _min: UserPreferencesMinAggregateOutputType | null;
    _max: UserPreferencesMaxAggregateOutputType | null;
  };

  export type UserPreferencesAvgAggregateOutputType = {
    volume: number | null;
  };

  export type UserPreferencesSumAggregateOutputType = {
    volume: number | null;
  };

  export type UserPreferencesMinAggregateOutputType = {
    id: string | null;
    guildId: string | null;
    userId: string | null;
    language: string | null;
    volume: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type UserPreferencesMaxAggregateOutputType = {
    id: string | null;
    guildId: string | null;
    userId: string | null;
    language: string | null;
    volume: number | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type UserPreferencesCountAggregateOutputType = {
    id: number;
    guildId: number;
    userId: number;
    language: number;
    volume: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type UserPreferencesAvgAggregateInputType = {
    volume?: true;
  };

  export type UserPreferencesSumAggregateInputType = {
    volume?: true;
  };

  export type UserPreferencesMinAggregateInputType = {
    id?: true;
    guildId?: true;
    userId?: true;
    language?: true;
    volume?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type UserPreferencesMaxAggregateInputType = {
    id?: true;
    guildId?: true;
    userId?: true;
    language?: true;
    volume?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type UserPreferencesCountAggregateInputType = {
    id?: true;
    guildId?: true;
    userId?: true;
    language?: true;
    volume?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type UserPreferencesAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserPreferences to aggregate.
     */
    where?: UserPreferencesWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserPreferences to fetch.
     */
    orderBy?: UserPreferencesOrderByWithRelationInput | UserPreferencesOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: UserPreferencesWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserPreferences from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserPreferences.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned UserPreferences
     **/
    _count?: true | UserPreferencesCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: UserPreferencesAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: UserPreferencesSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: UserPreferencesMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: UserPreferencesMaxAggregateInputType;
  };

  export type GetUserPreferencesAggregateType<T extends UserPreferencesAggregateArgs> = {
    [P in keyof T & keyof AggregateUserPreferences]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUserPreferences[P]>
      : GetScalarType<T[P], AggregateUserPreferences[P]>;
  };

  export type UserPreferencesGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserPreferencesWhereInput;
    orderBy?: UserPreferencesOrderByWithAggregationInput | UserPreferencesOrderByWithAggregationInput[];
    by: UserPreferencesScalarFieldEnum[] | UserPreferencesScalarFieldEnum;
    having?: UserPreferencesScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: UserPreferencesCountAggregateInputType | true;
    _avg?: UserPreferencesAvgAggregateInputType;
    _sum?: UserPreferencesSumAggregateInputType;
    _min?: UserPreferencesMinAggregateInputType;
    _max?: UserPreferencesMaxAggregateInputType;
  };

  export type UserPreferencesGroupByOutputType = {
    id: string;
    guildId: string;
    userId: string;
    language: string;
    volume: number;
    createdAt: Date;
    updatedAt: Date;
    _count: UserPreferencesCountAggregateOutputType | null;
    _avg: UserPreferencesAvgAggregateOutputType | null;
    _sum: UserPreferencesSumAggregateOutputType | null;
    _min: UserPreferencesMinAggregateOutputType | null;
    _max: UserPreferencesMaxAggregateOutputType | null;
  };

  type GetUserPreferencesGroupByPayload<T extends UserPreferencesGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserPreferencesGroupByOutputType, T['by']> & {
        [P in keyof T & keyof UserPreferencesGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], UserPreferencesGroupByOutputType[P]>
          : GetScalarType<T[P], UserPreferencesGroupByOutputType[P]>;
      }
    >
  >;

  export type UserPreferencesSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        guildId?: boolean;
        userId?: boolean;
        language?: boolean;
        volume?: boolean;
        createdAt?: boolean;
        updatedAt?: boolean;
        guild?: boolean | GuildDefaultArgs<ExtArgs>;
      },
      ExtArgs['result']['userPreferences']
    >;

  export type UserPreferencesSelectCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      guildId?: boolean;
      userId?: boolean;
      language?: boolean;
      volume?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      guild?: boolean | GuildDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['userPreferences']
  >;

  export type UserPreferencesSelectUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      guildId?: boolean;
      userId?: boolean;
      language?: boolean;
      volume?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      guild?: boolean | GuildDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['userPreferences']
  >;

  export type UserPreferencesSelectScalar = {
    id?: boolean;
    guildId?: boolean;
    userId?: boolean;
    language?: boolean;
    volume?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type UserPreferencesOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetOmit<
      'id' | 'guildId' | 'userId' | 'language' | 'volume' | 'createdAt' | 'updatedAt',
      ExtArgs['result']['userPreferences']
    >;
  export type UserPreferencesInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    guild?: boolean | GuildDefaultArgs<ExtArgs>;
  };
  export type UserPreferencesIncludeCreateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    guild?: boolean | GuildDefaultArgs<ExtArgs>;
  };
  export type UserPreferencesIncludeUpdateManyAndReturn<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    guild?: boolean | GuildDefaultArgs<ExtArgs>;
  };

  export type $UserPreferencesPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: 'UserPreferences';
    objects: {
      guild: Prisma.$GuildPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        guildId: string;
        userId: string;
        language: string;
        volume: number;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['userPreferences']
    >;
    composites: {};
  };

  type UserPreferencesGetPayload<S extends boolean | null | undefined | UserPreferencesDefaultArgs> = $Result.GetResult<
    Prisma.$UserPreferencesPayload,
    S
  >;

  type UserPreferencesCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    UserPreferencesFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: UserPreferencesCountAggregateInputType | true;
  };

  export interface UserPreferencesDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UserPreferences']; meta: { name: 'UserPreferences' } };
    /**
     * Find zero or one UserPreferences that matches the filter.
     * @param {UserPreferencesFindUniqueArgs} args - Arguments to find a UserPreferences
     * @example
     * // Get one UserPreferences
     * const userPreferences = await prisma.userPreferences.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserPreferencesFindUniqueArgs>(
      args: SelectSubset<T, UserPreferencesFindUniqueArgs<ExtArgs>>,
    ): Prisma__UserPreferencesClient<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'findUnique', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one UserPreferences that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserPreferencesFindUniqueOrThrowArgs} args - Arguments to find a UserPreferences
     * @example
     * // Get one UserPreferences
     * const userPreferences = await prisma.userPreferences.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserPreferencesFindUniqueOrThrowArgs>(
      args: SelectSubset<T, UserPreferencesFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__UserPreferencesClient<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first UserPreferences that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserPreferencesFindFirstArgs} args - Arguments to find a UserPreferences
     * @example
     * // Get one UserPreferences
     * const userPreferences = await prisma.userPreferences.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserPreferencesFindFirstArgs>(
      args?: SelectSubset<T, UserPreferencesFindFirstArgs<ExtArgs>>,
    ): Prisma__UserPreferencesClient<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'findFirst', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first UserPreferences that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserPreferencesFindFirstOrThrowArgs} args - Arguments to find a UserPreferences
     * @example
     * // Get one UserPreferences
     * const userPreferences = await prisma.userPreferences.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserPreferencesFindFirstOrThrowArgs>(
      args?: SelectSubset<T, UserPreferencesFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__UserPreferencesClient<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'findFirstOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more UserPreferences that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserPreferencesFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UserPreferences
     * const userPreferences = await prisma.userPreferences.findMany()
     *
     * // Get first 10 UserPreferences
     * const userPreferences = await prisma.userPreferences.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const userPreferencesWithIdOnly = await prisma.userPreferences.findMany({ select: { id: true } })
     *
     */
    findMany<T extends UserPreferencesFindManyArgs>(
      args?: SelectSubset<T, UserPreferencesFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'findMany', GlobalOmitOptions>
    >;

    /**
     * Create a UserPreferences.
     * @param {UserPreferencesCreateArgs} args - Arguments to create a UserPreferences.
     * @example
     * // Create one UserPreferences
     * const UserPreferences = await prisma.userPreferences.create({
     *   data: {
     *     // ... data to create a UserPreferences
     *   }
     * })
     *
     */
    create<T extends UserPreferencesCreateArgs>(
      args: SelectSubset<T, UserPreferencesCreateArgs<ExtArgs>>,
    ): Prisma__UserPreferencesClient<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'create', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many UserPreferences.
     * @param {UserPreferencesCreateManyArgs} args - Arguments to create many UserPreferences.
     * @example
     * // Create many UserPreferences
     * const userPreferences = await prisma.userPreferences.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends UserPreferencesCreateManyArgs>(
      args?: SelectSubset<T, UserPreferencesCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many UserPreferences and returns the data saved in the database.
     * @param {UserPreferencesCreateManyAndReturnArgs} args - Arguments to create many UserPreferences.
     * @example
     * // Create many UserPreferences
     * const userPreferences = await prisma.userPreferences.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many UserPreferences and only return the `id`
     * const userPreferencesWithIdOnly = await prisma.userPreferences.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends UserPreferencesCreateManyAndReturnArgs>(
      args?: SelectSubset<T, UserPreferencesCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'createManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Delete a UserPreferences.
     * @param {UserPreferencesDeleteArgs} args - Arguments to delete one UserPreferences.
     * @example
     * // Delete one UserPreferences
     * const UserPreferences = await prisma.userPreferences.delete({
     *   where: {
     *     // ... filter to delete one UserPreferences
     *   }
     * })
     *
     */
    delete<T extends UserPreferencesDeleteArgs>(
      args: SelectSubset<T, UserPreferencesDeleteArgs<ExtArgs>>,
    ): Prisma__UserPreferencesClient<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'delete', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one UserPreferences.
     * @param {UserPreferencesUpdateArgs} args - Arguments to update one UserPreferences.
     * @example
     * // Update one UserPreferences
     * const userPreferences = await prisma.userPreferences.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends UserPreferencesUpdateArgs>(
      args: SelectSubset<T, UserPreferencesUpdateArgs<ExtArgs>>,
    ): Prisma__UserPreferencesClient<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'update', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more UserPreferences.
     * @param {UserPreferencesDeleteManyArgs} args - Arguments to filter UserPreferences to delete.
     * @example
     * // Delete a few UserPreferences
     * const { count } = await prisma.userPreferences.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends UserPreferencesDeleteManyArgs>(
      args?: SelectSubset<T, UserPreferencesDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more UserPreferences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserPreferencesUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UserPreferences
     * const userPreferences = await prisma.userPreferences.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends UserPreferencesUpdateManyArgs>(
      args: SelectSubset<T, UserPreferencesUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more UserPreferences and returns the data updated in the database.
     * @param {UserPreferencesUpdateManyAndReturnArgs} args - Arguments to update many UserPreferences.
     * @example
     * // Update many UserPreferences
     * const userPreferences = await prisma.userPreferences.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more UserPreferences and only return the `id`
     * const userPreferencesWithIdOnly = await prisma.userPreferences.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends UserPreferencesUpdateManyAndReturnArgs>(
      args: SelectSubset<T, UserPreferencesUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'updateManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Create or update one UserPreferences.
     * @param {UserPreferencesUpsertArgs} args - Arguments to update or create a UserPreferences.
     * @example
     * // Update or create a UserPreferences
     * const userPreferences = await prisma.userPreferences.upsert({
     *   create: {
     *     // ... data to create a UserPreferences
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UserPreferences we want to update
     *   }
     * })
     */
    upsert<T extends UserPreferencesUpsertArgs>(
      args: SelectSubset<T, UserPreferencesUpsertArgs<ExtArgs>>,
    ): Prisma__UserPreferencesClient<
      $Result.GetResult<Prisma.$UserPreferencesPayload<ExtArgs>, T, 'upsert', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of UserPreferences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserPreferencesCountArgs} args - Arguments to filter UserPreferences to count.
     * @example
     * // Count the number of UserPreferences
     * const count = await prisma.userPreferences.count({
     *   where: {
     *     // ... the filter for the UserPreferences we want to count
     *   }
     * })
     **/
    count<T extends UserPreferencesCountArgs>(
      args?: Subset<T, UserPreferencesCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserPreferencesCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a UserPreferences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserPreferencesAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends UserPreferencesAggregateArgs>(
      args: Subset<T, UserPreferencesAggregateArgs>,
    ): Prisma.PrismaPromise<GetUserPreferencesAggregateType<T>>;

    /**
     * Group by UserPreferences.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserPreferencesGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends UserPreferencesGroupByArgs,
      HasSelectOrTake extends Or<Extends<'skip', Keys<T>>, Extends<'take', Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserPreferencesGroupByArgs['orderBy'] }
        : { orderBy?: UserPreferencesGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, 'Field ', P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, UserPreferencesGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetUserPreferencesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the UserPreferences model
     */
    readonly fields: UserPreferencesFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UserPreferences.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserPreferencesClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    guild<T extends GuildDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, GuildDefaultArgs<ExtArgs>>,
    ): Prisma__GuildClient<
      $Result.GetResult<Prisma.$GuildPayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions> | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the UserPreferences model
   */
  interface UserPreferencesFieldRefs {
    readonly id: FieldRef<'UserPreferences', 'String'>;
    readonly guildId: FieldRef<'UserPreferences', 'String'>;
    readonly userId: FieldRef<'UserPreferences', 'String'>;
    readonly language: FieldRef<'UserPreferences', 'String'>;
    readonly volume: FieldRef<'UserPreferences', 'Int'>;
    readonly createdAt: FieldRef<'UserPreferences', 'DateTime'>;
    readonly updatedAt: FieldRef<'UserPreferences', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * UserPreferences findUnique
   */
  export type UserPreferencesFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesInclude<ExtArgs> | null;
    /**
     * Filter, which UserPreferences to fetch.
     */
    where: UserPreferencesWhereUniqueInput;
  };

  /**
   * UserPreferences findUniqueOrThrow
   */
  export type UserPreferencesFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the UserPreferences
       */
      select?: UserPreferencesSelect<ExtArgs> | null;
      /**
       * Omit specific fields from the UserPreferences
       */
      omit?: UserPreferencesOmit<ExtArgs> | null;
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: UserPreferencesInclude<ExtArgs> | null;
      /**
       * Filter, which UserPreferences to fetch.
       */
      where: UserPreferencesWhereUniqueInput;
    };

  /**
   * UserPreferences findFirst
   */
  export type UserPreferencesFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesInclude<ExtArgs> | null;
    /**
     * Filter, which UserPreferences to fetch.
     */
    where?: UserPreferencesWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserPreferences to fetch.
     */
    orderBy?: UserPreferencesOrderByWithRelationInput | UserPreferencesOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for UserPreferences.
     */
    cursor?: UserPreferencesWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserPreferences from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserPreferences.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of UserPreferences.
     */
    distinct?: UserPreferencesScalarFieldEnum | UserPreferencesScalarFieldEnum[];
  };

  /**
   * UserPreferences findFirstOrThrow
   */
  export type UserPreferencesFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    {
      /**
       * Select specific fields to fetch from the UserPreferences
       */
      select?: UserPreferencesSelect<ExtArgs> | null;
      /**
       * Omit specific fields from the UserPreferences
       */
      omit?: UserPreferencesOmit<ExtArgs> | null;
      /**
       * Choose, which related nodes to fetch as well
       */
      include?: UserPreferencesInclude<ExtArgs> | null;
      /**
       * Filter, which UserPreferences to fetch.
       */
      where?: UserPreferencesWhereInput;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
       *
       * Determine the order of UserPreferences to fetch.
       */
      orderBy?: UserPreferencesOrderByWithRelationInput | UserPreferencesOrderByWithRelationInput[];
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
       *
       * Sets the position for searching for UserPreferences.
       */
      cursor?: UserPreferencesWhereUniqueInput;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
       *
       * Take `±n` UserPreferences from the position of the cursor.
       */
      take?: number;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
       *
       * Skip the first `n` UserPreferences.
       */
      skip?: number;
      /**
       * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
       *
       * Filter by unique combinations of UserPreferences.
       */
      distinct?: UserPreferencesScalarFieldEnum | UserPreferencesScalarFieldEnum[];
    };

  /**
   * UserPreferences findMany
   */
  export type UserPreferencesFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesInclude<ExtArgs> | null;
    /**
     * Filter, which UserPreferences to fetch.
     */
    where?: UserPreferencesWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of UserPreferences to fetch.
     */
    orderBy?: UserPreferencesOrderByWithRelationInput | UserPreferencesOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing UserPreferences.
     */
    cursor?: UserPreferencesWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` UserPreferences from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` UserPreferences.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of UserPreferences.
     */
    distinct?: UserPreferencesScalarFieldEnum | UserPreferencesScalarFieldEnum[];
  };

  /**
   * UserPreferences create
   */
  export type UserPreferencesCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesInclude<ExtArgs> | null;
    /**
     * The data needed to create a UserPreferences.
     */
    data: XOR<UserPreferencesCreateInput, UserPreferencesUncheckedCreateInput>;
  };

  /**
   * UserPreferences createMany
   */
  export type UserPreferencesCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UserPreferences.
     */
    data: UserPreferencesCreateManyInput | UserPreferencesCreateManyInput[];
  };

  /**
   * UserPreferences createManyAndReturn
   */
  export type UserPreferencesCreateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * The data used to create many UserPreferences.
     */
    data: UserPreferencesCreateManyInput | UserPreferencesCreateManyInput[];
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesIncludeCreateManyAndReturn<ExtArgs> | null;
  };

  /**
   * UserPreferences update
   */
  export type UserPreferencesUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesInclude<ExtArgs> | null;
    /**
     * The data needed to update a UserPreferences.
     */
    data: XOR<UserPreferencesUpdateInput, UserPreferencesUncheckedUpdateInput>;
    /**
     * Choose, which UserPreferences to update.
     */
    where: UserPreferencesWhereUniqueInput;
  };

  /**
   * UserPreferences updateMany
   */
  export type UserPreferencesUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UserPreferences.
     */
    data: XOR<UserPreferencesUpdateManyMutationInput, UserPreferencesUncheckedUpdateManyInput>;
    /**
     * Filter which UserPreferences to update
     */
    where?: UserPreferencesWhereInput;
    /**
     * Limit how many UserPreferences to update.
     */
    limit?: number;
  };

  /**
   * UserPreferences updateManyAndReturn
   */
  export type UserPreferencesUpdateManyAndReturnArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * The data used to update UserPreferences.
     */
    data: XOR<UserPreferencesUpdateManyMutationInput, UserPreferencesUncheckedUpdateManyInput>;
    /**
     * Filter which UserPreferences to update
     */
    where?: UserPreferencesWhereInput;
    /**
     * Limit how many UserPreferences to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesIncludeUpdateManyAndReturn<ExtArgs> | null;
  };

  /**
   * UserPreferences upsert
   */
  export type UserPreferencesUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesInclude<ExtArgs> | null;
    /**
     * The filter to search for the UserPreferences to update in case it exists.
     */
    where: UserPreferencesWhereUniqueInput;
    /**
     * In case the UserPreferences found by the `where` argument doesn't exist, create a new UserPreferences with this data.
     */
    create: XOR<UserPreferencesCreateInput, UserPreferencesUncheckedCreateInput>;
    /**
     * In case the UserPreferences was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserPreferencesUpdateInput, UserPreferencesUncheckedUpdateInput>;
  };

  /**
   * UserPreferences delete
   */
  export type UserPreferencesDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesInclude<ExtArgs> | null;
    /**
     * Filter which UserPreferences to delete.
     */
    where: UserPreferencesWhereUniqueInput;
  };

  /**
   * UserPreferences deleteMany
   */
  export type UserPreferencesDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UserPreferences to delete
     */
    where?: UserPreferencesWhereInput;
    /**
     * Limit how many UserPreferences to delete.
     */
    limit?: number;
  };

  /**
   * UserPreferences without action
   */
  export type UserPreferencesDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserPreferences
     */
    select?: UserPreferencesSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the UserPreferences
     */
    omit?: UserPreferencesOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserPreferencesInclude<ExtArgs> | null;
  };

  /**
   * Model TrackCache
   */

  export type AggregateTrackCache = {
    _count: TrackCacheCountAggregateOutputType | null;
    _avg: TrackCacheAvgAggregateOutputType | null;
    _sum: TrackCacheSumAggregateOutputType | null;
    _min: TrackCacheMinAggregateOutputType | null;
    _max: TrackCacheMaxAggregateOutputType | null;
  };

  export type TrackCacheAvgAggregateOutputType = {
    duration: number | null;
  };

  export type TrackCacheSumAggregateOutputType = {
    duration: number | null;
  };

  export type TrackCacheMinAggregateOutputType = {
    id: string | null;
    platform: string | null;
    platformId: string | null;
    title: string | null;
    artist: string | null;
    duration: number | null;
    url: string | null;
    thumbnail: string | null;
    metadata: string | null;
    createdAt: Date | null;
    lastUsed: Date | null;
  };

  export type TrackCacheMaxAggregateOutputType = {
    id: string | null;
    platform: string | null;
    platformId: string | null;
    title: string | null;
    artist: string | null;
    duration: number | null;
    url: string | null;
    thumbnail: string | null;
    metadata: string | null;
    createdAt: Date | null;
    lastUsed: Date | null;
  };

  export type TrackCacheCountAggregateOutputType = {
    id: number;
    platform: number;
    platformId: number;
    title: number;
    artist: number;
    duration: number;
    url: number;
    thumbnail: number;
    metadata: number;
    createdAt: number;
    lastUsed: number;
    _all: number;
  };

  export type TrackCacheAvgAggregateInputType = {
    duration?: true;
  };

  export type TrackCacheSumAggregateInputType = {
    duration?: true;
  };

  export type TrackCacheMinAggregateInputType = {
    id?: true;
    platform?: true;
    platformId?: true;
    title?: true;
    artist?: true;
    duration?: true;
    url?: true;
    thumbnail?: true;
    metadata?: true;
    createdAt?: true;
    lastUsed?: true;
  };

  export type TrackCacheMaxAggregateInputType = {
    id?: true;
    platform?: true;
    platformId?: true;
    title?: true;
    artist?: true;
    duration?: true;
    url?: true;
    thumbnail?: true;
    metadata?: true;
    createdAt?: true;
    lastUsed?: true;
  };

  export type TrackCacheCountAggregateInputType = {
    id?: true;
    platform?: true;
    platformId?: true;
    title?: true;
    artist?: true;
    duration?: true;
    url?: true;
    thumbnail?: true;
    metadata?: true;
    createdAt?: true;
    lastUsed?: true;
    _all?: true;
  };

  export type TrackCacheAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrackCache to aggregate.
     */
    where?: TrackCacheWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of TrackCaches to fetch.
     */
    orderBy?: TrackCacheOrderByWithRelationInput | TrackCacheOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: TrackCacheWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` TrackCaches from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` TrackCaches.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned TrackCaches
     **/
    _count?: true | TrackCacheCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: TrackCacheAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: TrackCacheSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: TrackCacheMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: TrackCacheMaxAggregateInputType;
  };

  export type GetTrackCacheAggregateType<T extends TrackCacheAggregateArgs> = {
    [P in keyof T & keyof AggregateTrackCache]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTrackCache[P]>
      : GetScalarType<T[P], AggregateTrackCache[P]>;
  };

  export type TrackCacheGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TrackCacheWhereInput;
    orderBy?: TrackCacheOrderByWithAggregationInput | TrackCacheOrderByWithAggregationInput[];
    by: TrackCacheScalarFieldEnum[] | TrackCacheScalarFieldEnum;
    having?: TrackCacheScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: TrackCacheCountAggregateInputType | true;
    _avg?: TrackCacheAvgAggregateInputType;
    _sum?: TrackCacheSumAggregateInputType;
    _min?: TrackCacheMinAggregateInputType;
    _max?: TrackCacheMaxAggregateInputType;
  };

  export type TrackCacheGroupByOutputType = {
    id: string;
    platform: string;
    platformId: string;
    title: string;
    artist: string | null;
    duration: number;
    url: string;
    thumbnail: string | null;
    metadata: string | null;
    createdAt: Date;
    lastUsed: Date;
    _count: TrackCacheCountAggregateOutputType | null;
    _avg: TrackCacheAvgAggregateOutputType | null;
    _sum: TrackCacheSumAggregateOutputType | null;
    _min: TrackCacheMinAggregateOutputType | null;
    _max: TrackCacheMaxAggregateOutputType | null;
  };

  type GetTrackCacheGroupByPayload<T extends TrackCacheGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TrackCacheGroupByOutputType, T['by']> & {
        [P in keyof T & keyof TrackCacheGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], TrackCacheGroupByOutputType[P]>
          : GetScalarType<T[P], TrackCacheGroupByOutputType[P]>;
      }
    >
  >;

  export type TrackCacheSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        platform?: boolean;
        platformId?: boolean;
        title?: boolean;
        artist?: boolean;
        duration?: boolean;
        url?: boolean;
        thumbnail?: boolean;
        metadata?: boolean;
        createdAt?: boolean;
        lastUsed?: boolean;
      },
      ExtArgs['result']['trackCache']
    >;

  export type TrackCacheSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        platform?: boolean;
        platformId?: boolean;
        title?: boolean;
        artist?: boolean;
        duration?: boolean;
        url?: boolean;
        thumbnail?: boolean;
        metadata?: boolean;
        createdAt?: boolean;
        lastUsed?: boolean;
      },
      ExtArgs['result']['trackCache']
    >;

  export type TrackCacheSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    $Extensions.GetSelect<
      {
        id?: boolean;
        platform?: boolean;
        platformId?: boolean;
        title?: boolean;
        artist?: boolean;
        duration?: boolean;
        url?: boolean;
        thumbnail?: boolean;
        metadata?: boolean;
        createdAt?: boolean;
        lastUsed?: boolean;
      },
      ExtArgs['result']['trackCache']
    >;

  export type TrackCacheSelectScalar = {
    id?: boolean;
    platform?: boolean;
    platformId?: boolean;
    title?: boolean;
    artist?: boolean;
    duration?: boolean;
    url?: boolean;
    thumbnail?: boolean;
    metadata?: boolean;
    createdAt?: boolean;
    lastUsed?: boolean;
  };

  export type TrackCacheOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<
    | 'id'
    | 'platform'
    | 'platformId'
    | 'title'
    | 'artist'
    | 'duration'
    | 'url'
    | 'thumbnail'
    | 'metadata'
    | 'createdAt'
    | 'lastUsed',
    ExtArgs['result']['trackCache']
  >;

  export type $TrackCachePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: 'TrackCache';
    objects: {};
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        platform: string;
        platformId: string;
        title: string;
        artist: string | null;
        duration: number;
        url: string;
        thumbnail: string | null;
        metadata: string | null;
        createdAt: Date;
        lastUsed: Date;
      },
      ExtArgs['result']['trackCache']
    >;
    composites: {};
  };

  type TrackCacheGetPayload<S extends boolean | null | undefined | TrackCacheDefaultArgs> = $Result.GetResult<
    Prisma.$TrackCachePayload,
    S
  >;

  type TrackCacheCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = Omit<
    TrackCacheFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: TrackCacheCountAggregateInputType | true;
  };

  export interface TrackCacheDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TrackCache']; meta: { name: 'TrackCache' } };
    /**
     * Find zero or one TrackCache that matches the filter.
     * @param {TrackCacheFindUniqueArgs} args - Arguments to find a TrackCache
     * @example
     * // Get one TrackCache
     * const trackCache = await prisma.trackCache.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TrackCacheFindUniqueArgs>(
      args: SelectSubset<T, TrackCacheFindUniqueArgs<ExtArgs>>,
    ): Prisma__TrackCacheClient<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'findUnique', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one TrackCache that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TrackCacheFindUniqueOrThrowArgs} args - Arguments to find a TrackCache
     * @example
     * // Get one TrackCache
     * const trackCache = await prisma.trackCache.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TrackCacheFindUniqueOrThrowArgs>(
      args: SelectSubset<T, TrackCacheFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__TrackCacheClient<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'findUniqueOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first TrackCache that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackCacheFindFirstArgs} args - Arguments to find a TrackCache
     * @example
     * // Get one TrackCache
     * const trackCache = await prisma.trackCache.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TrackCacheFindFirstArgs>(
      args?: SelectSubset<T, TrackCacheFindFirstArgs<ExtArgs>>,
    ): Prisma__TrackCacheClient<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'findFirst', GlobalOmitOptions> | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first TrackCache that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackCacheFindFirstOrThrowArgs} args - Arguments to find a TrackCache
     * @example
     * // Get one TrackCache
     * const trackCache = await prisma.trackCache.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TrackCacheFindFirstOrThrowArgs>(
      args?: SelectSubset<T, TrackCacheFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__TrackCacheClient<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'findFirstOrThrow', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more TrackCaches that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackCacheFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TrackCaches
     * const trackCaches = await prisma.trackCache.findMany()
     *
     * // Get first 10 TrackCaches
     * const trackCaches = await prisma.trackCache.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const trackCacheWithIdOnly = await prisma.trackCache.findMany({ select: { id: true } })
     *
     */
    findMany<T extends TrackCacheFindManyArgs>(
      args?: SelectSubset<T, TrackCacheFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'findMany', GlobalOmitOptions>>;

    /**
     * Create a TrackCache.
     * @param {TrackCacheCreateArgs} args - Arguments to create a TrackCache.
     * @example
     * // Create one TrackCache
     * const TrackCache = await prisma.trackCache.create({
     *   data: {
     *     // ... data to create a TrackCache
     *   }
     * })
     *
     */
    create<T extends TrackCacheCreateArgs>(
      args: SelectSubset<T, TrackCacheCreateArgs<ExtArgs>>,
    ): Prisma__TrackCacheClient<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'create', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many TrackCaches.
     * @param {TrackCacheCreateManyArgs} args - Arguments to create many TrackCaches.
     * @example
     * // Create many TrackCaches
     * const trackCache = await prisma.trackCache.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends TrackCacheCreateManyArgs>(
      args?: SelectSubset<T, TrackCacheCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create many TrackCaches and returns the data saved in the database.
     * @param {TrackCacheCreateManyAndReturnArgs} args - Arguments to create many TrackCaches.
     * @example
     * // Create many TrackCaches
     * const trackCache = await prisma.trackCache.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many TrackCaches and only return the `id`
     * const trackCacheWithIdOnly = await prisma.trackCache.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends TrackCacheCreateManyAndReturnArgs>(
      args?: SelectSubset<T, TrackCacheCreateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'createManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Delete a TrackCache.
     * @param {TrackCacheDeleteArgs} args - Arguments to delete one TrackCache.
     * @example
     * // Delete one TrackCache
     * const TrackCache = await prisma.trackCache.delete({
     *   where: {
     *     // ... filter to delete one TrackCache
     *   }
     * })
     *
     */
    delete<T extends TrackCacheDeleteArgs>(
      args: SelectSubset<T, TrackCacheDeleteArgs<ExtArgs>>,
    ): Prisma__TrackCacheClient<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'delete', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one TrackCache.
     * @param {TrackCacheUpdateArgs} args - Arguments to update one TrackCache.
     * @example
     * // Update one TrackCache
     * const trackCache = await prisma.trackCache.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends TrackCacheUpdateArgs>(
      args: SelectSubset<T, TrackCacheUpdateArgs<ExtArgs>>,
    ): Prisma__TrackCacheClient<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'update', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more TrackCaches.
     * @param {TrackCacheDeleteManyArgs} args - Arguments to filter TrackCaches to delete.
     * @example
     * // Delete a few TrackCaches
     * const { count } = await prisma.trackCache.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends TrackCacheDeleteManyArgs>(
      args?: SelectSubset<T, TrackCacheDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more TrackCaches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackCacheUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TrackCaches
     * const trackCache = await prisma.trackCache.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends TrackCacheUpdateManyArgs>(
      args: SelectSubset<T, TrackCacheUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more TrackCaches and returns the data updated in the database.
     * @param {TrackCacheUpdateManyAndReturnArgs} args - Arguments to update many TrackCaches.
     * @example
     * // Update many TrackCaches
     * const trackCache = await prisma.trackCache.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more TrackCaches and only return the `id`
     * const trackCacheWithIdOnly = await prisma.trackCache.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends TrackCacheUpdateManyAndReturnArgs>(
      args: SelectSubset<T, TrackCacheUpdateManyAndReturnArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'updateManyAndReturn', GlobalOmitOptions>
    >;

    /**
     * Create or update one TrackCache.
     * @param {TrackCacheUpsertArgs} args - Arguments to update or create a TrackCache.
     * @example
     * // Update or create a TrackCache
     * const trackCache = await prisma.trackCache.upsert({
     *   create: {
     *     // ... data to create a TrackCache
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TrackCache we want to update
     *   }
     * })
     */
    upsert<T extends TrackCacheUpsertArgs>(
      args: SelectSubset<T, TrackCacheUpsertArgs<ExtArgs>>,
    ): Prisma__TrackCacheClient<
      $Result.GetResult<Prisma.$TrackCachePayload<ExtArgs>, T, 'upsert', GlobalOmitOptions>,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of TrackCaches.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackCacheCountArgs} args - Arguments to filter TrackCaches to count.
     * @example
     * // Count the number of TrackCaches
     * const count = await prisma.trackCache.count({
     *   where: {
     *     // ... the filter for the TrackCaches we want to count
     *   }
     * })
     **/
    count<T extends TrackCacheCountArgs>(
      args?: Subset<T, TrackCacheCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TrackCacheCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a TrackCache.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackCacheAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends TrackCacheAggregateArgs>(
      args: Subset<T, TrackCacheAggregateArgs>,
    ): Prisma.PrismaPromise<GetTrackCacheAggregateType<T>>;

    /**
     * Group by TrackCache.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TrackCacheGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends TrackCacheGroupByArgs,
      HasSelectOrTake extends Or<Extends<'skip', Keys<T>>, Extends<'take', Keys<T>>>,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TrackCacheGroupByArgs['orderBy'] }
        : { orderBy?: TrackCacheGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [Error, 'Field ', P, ` in "having" needs to be provided in "by"`];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, TrackCacheGroupByArgs, OrderByArg> & InputErrors,
    ): {} extends InputErrors ? GetTrackCacheGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the TrackCache model
     */
    readonly fields: TrackCacheFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TrackCache.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TrackCacheClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the TrackCache model
   */
  interface TrackCacheFieldRefs {
    readonly id: FieldRef<'TrackCache', 'String'>;
    readonly platform: FieldRef<'TrackCache', 'String'>;
    readonly platformId: FieldRef<'TrackCache', 'String'>;
    readonly title: FieldRef<'TrackCache', 'String'>;
    readonly artist: FieldRef<'TrackCache', 'String'>;
    readonly duration: FieldRef<'TrackCache', 'Int'>;
    readonly url: FieldRef<'TrackCache', 'String'>;
    readonly thumbnail: FieldRef<'TrackCache', 'String'>;
    readonly metadata: FieldRef<'TrackCache', 'String'>;
    readonly createdAt: FieldRef<'TrackCache', 'DateTime'>;
    readonly lastUsed: FieldRef<'TrackCache', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * TrackCache findUnique
   */
  export type TrackCacheFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * Filter, which TrackCache to fetch.
     */
    where: TrackCacheWhereUniqueInput;
  };

  /**
   * TrackCache findUniqueOrThrow
   */
  export type TrackCacheFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * Filter, which TrackCache to fetch.
     */
    where: TrackCacheWhereUniqueInput;
  };

  /**
   * TrackCache findFirst
   */
  export type TrackCacheFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * Filter, which TrackCache to fetch.
     */
    where?: TrackCacheWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of TrackCaches to fetch.
     */
    orderBy?: TrackCacheOrderByWithRelationInput | TrackCacheOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for TrackCaches.
     */
    cursor?: TrackCacheWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` TrackCaches from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` TrackCaches.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of TrackCaches.
     */
    distinct?: TrackCacheScalarFieldEnum | TrackCacheScalarFieldEnum[];
  };

  /**
   * TrackCache findFirstOrThrow
   */
  export type TrackCacheFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * Filter, which TrackCache to fetch.
     */
    where?: TrackCacheWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of TrackCaches to fetch.
     */
    orderBy?: TrackCacheOrderByWithRelationInput | TrackCacheOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for TrackCaches.
     */
    cursor?: TrackCacheWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` TrackCaches from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` TrackCaches.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of TrackCaches.
     */
    distinct?: TrackCacheScalarFieldEnum | TrackCacheScalarFieldEnum[];
  };

  /**
   * TrackCache findMany
   */
  export type TrackCacheFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * Filter, which TrackCaches to fetch.
     */
    where?: TrackCacheWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of TrackCaches to fetch.
     */
    orderBy?: TrackCacheOrderByWithRelationInput | TrackCacheOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing TrackCaches.
     */
    cursor?: TrackCacheWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` TrackCaches from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` TrackCaches.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of TrackCaches.
     */
    distinct?: TrackCacheScalarFieldEnum | TrackCacheScalarFieldEnum[];
  };

  /**
   * TrackCache create
   */
  export type TrackCacheCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * The data needed to create a TrackCache.
     */
    data: XOR<TrackCacheCreateInput, TrackCacheUncheckedCreateInput>;
  };

  /**
   * TrackCache createMany
   */
  export type TrackCacheCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TrackCaches.
     */
    data: TrackCacheCreateManyInput | TrackCacheCreateManyInput[];
  };

  /**
   * TrackCache createManyAndReturn
   */
  export type TrackCacheCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * The data used to create many TrackCaches.
     */
    data: TrackCacheCreateManyInput | TrackCacheCreateManyInput[];
  };

  /**
   * TrackCache update
   */
  export type TrackCacheUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * The data needed to update a TrackCache.
     */
    data: XOR<TrackCacheUpdateInput, TrackCacheUncheckedUpdateInput>;
    /**
     * Choose, which TrackCache to update.
     */
    where: TrackCacheWhereUniqueInput;
  };

  /**
   * TrackCache updateMany
   */
  export type TrackCacheUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TrackCaches.
     */
    data: XOR<TrackCacheUpdateManyMutationInput, TrackCacheUncheckedUpdateManyInput>;
    /**
     * Filter which TrackCaches to update
     */
    where?: TrackCacheWhereInput;
    /**
     * Limit how many TrackCaches to update.
     */
    limit?: number;
  };

  /**
   * TrackCache updateManyAndReturn
   */
  export type TrackCacheUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * The data used to update TrackCaches.
     */
    data: XOR<TrackCacheUpdateManyMutationInput, TrackCacheUncheckedUpdateManyInput>;
    /**
     * Filter which TrackCaches to update
     */
    where?: TrackCacheWhereInput;
    /**
     * Limit how many TrackCaches to update.
     */
    limit?: number;
  };

  /**
   * TrackCache upsert
   */
  export type TrackCacheUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * The filter to search for the TrackCache to update in case it exists.
     */
    where: TrackCacheWhereUniqueInput;
    /**
     * In case the TrackCache found by the `where` argument doesn't exist, create a new TrackCache with this data.
     */
    create: XOR<TrackCacheCreateInput, TrackCacheUncheckedCreateInput>;
    /**
     * In case the TrackCache was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TrackCacheUpdateInput, TrackCacheUncheckedUpdateInput>;
  };

  /**
   * TrackCache delete
   */
  export type TrackCacheDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
    /**
     * Filter which TrackCache to delete.
     */
    where: TrackCacheWhereUniqueInput;
  };

  /**
   * TrackCache deleteMany
   */
  export type TrackCacheDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TrackCaches to delete
     */
    where?: TrackCacheWhereInput;
    /**
     * Limit how many TrackCaches to delete.
     */
    limit?: number;
  };

  /**
   * TrackCache without action
   */
  export type TrackCacheDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TrackCache
     */
    select?: TrackCacheSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the TrackCache
     */
    omit?: TrackCacheOmit<ExtArgs> | null;
  };

  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable';
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];

  export const GuildScalarFieldEnum: {
    id: 'id';
    name: 'name';
    preferredLanguage: 'preferredLanguage';
    defaultVolume: 'defaultVolume';
    leaveOnEmpty: 'leaveOnEmpty';
    leaveOnEmptyCooldown: 'leaveOnEmptyCooldown';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type GuildScalarFieldEnum = (typeof GuildScalarFieldEnum)[keyof typeof GuildScalarFieldEnum];

  export const PlaylistScalarFieldEnum: {
    id: 'id';
    guildId: 'guildId';
    userId: 'userId';
    name: 'name';
    description: 'description';
    isPublic: 'isPublic';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type PlaylistScalarFieldEnum = (typeof PlaylistScalarFieldEnum)[keyof typeof PlaylistScalarFieldEnum];

  export const PlaylistTrackScalarFieldEnum: {
    id: 'id';
    playlistId: 'playlistId';
    position: 'position';
    title: 'title';
    artist: 'artist';
    duration: 'duration';
    url: 'url';
    thumbnail: 'thumbnail';
    platform: 'platform';
    platformId: 'platformId';
    filePath: 'filePath';
    addedAt: 'addedAt';
  };

  export type PlaylistTrackScalarFieldEnum =
    (typeof PlaylistTrackScalarFieldEnum)[keyof typeof PlaylistTrackScalarFieldEnum];

  export const PlayHistoryScalarFieldEnum: {
    id: 'id';
    guildId: 'guildId';
    userId: 'userId';
    title: 'title';
    artist: 'artist';
    duration: 'duration';
    url: 'url';
    platform: 'platform';
    platformId: 'platformId';
    playedAt: 'playedAt';
    completedAt: 'completedAt';
  };

  export type PlayHistoryScalarFieldEnum = (typeof PlayHistoryScalarFieldEnum)[keyof typeof PlayHistoryScalarFieldEnum];

  export const QueueSnapshotScalarFieldEnum: {
    id: 'id';
    guildId: 'guildId';
    currentTrackUrl: 'currentTrackUrl';
    currentPosition: 'currentPosition';
    volume: 'volume';
    loopMode: 'loopMode';
    tracks: 'tracks';
    createdAt: 'createdAt';
  };

  export type QueueSnapshotScalarFieldEnum =
    (typeof QueueSnapshotScalarFieldEnum)[keyof typeof QueueSnapshotScalarFieldEnum];

  export const UserPreferencesScalarFieldEnum: {
    id: 'id';
    guildId: 'guildId';
    userId: 'userId';
    language: 'language';
    volume: 'volume';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type UserPreferencesScalarFieldEnum =
    (typeof UserPreferencesScalarFieldEnum)[keyof typeof UserPreferencesScalarFieldEnum];

  export const TrackCacheScalarFieldEnum: {
    id: 'id';
    platform: 'platform';
    platformId: 'platformId';
    title: 'title';
    artist: 'artist';
    duration: 'duration';
    url: 'url';
    thumbnail: 'thumbnail';
    metadata: 'metadata';
    createdAt: 'createdAt';
    lastUsed: 'lastUsed';
  };

  export type TrackCacheScalarFieldEnum = (typeof TrackCacheScalarFieldEnum)[keyof typeof TrackCacheScalarFieldEnum];

  export const SortOrder: {
    asc: 'asc';
    desc: 'desc';
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

  export const NullsOrder: {
    first: 'first';
    last: 'last';
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];

  /**
   * Field references
   */

  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;

  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;

  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>;

  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;

  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;

  /**
   * Deep Input Types
   */

  export type GuildWhereInput = {
    AND?: GuildWhereInput | GuildWhereInput[];
    OR?: GuildWhereInput[];
    NOT?: GuildWhereInput | GuildWhereInput[];
    id?: StringFilter<'Guild'> | string;
    name?: StringFilter<'Guild'> | string;
    preferredLanguage?: StringFilter<'Guild'> | string;
    defaultVolume?: IntFilter<'Guild'> | number;
    leaveOnEmpty?: BoolFilter<'Guild'> | boolean;
    leaveOnEmptyCooldown?: IntFilter<'Guild'> | number;
    createdAt?: DateTimeFilter<'Guild'> | Date | string;
    updatedAt?: DateTimeFilter<'Guild'> | Date | string;
    playlists?: PlaylistListRelationFilter;
    playHistory?: PlayHistoryListRelationFilter;
    queueSnapshots?: QueueSnapshotListRelationFilter;
    userPreferences?: UserPreferencesListRelationFilter;
  };

  export type GuildOrderByWithRelationInput = {
    id?: SortOrder;
    name?: SortOrder;
    preferredLanguage?: SortOrder;
    defaultVolume?: SortOrder;
    leaveOnEmpty?: SortOrder;
    leaveOnEmptyCooldown?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    playlists?: PlaylistOrderByRelationAggregateInput;
    playHistory?: PlayHistoryOrderByRelationAggregateInput;
    queueSnapshots?: QueueSnapshotOrderByRelationAggregateInput;
    userPreferences?: UserPreferencesOrderByRelationAggregateInput;
  };

  export type GuildWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: GuildWhereInput | GuildWhereInput[];
      OR?: GuildWhereInput[];
      NOT?: GuildWhereInput | GuildWhereInput[];
      name?: StringFilter<'Guild'> | string;
      preferredLanguage?: StringFilter<'Guild'> | string;
      defaultVolume?: IntFilter<'Guild'> | number;
      leaveOnEmpty?: BoolFilter<'Guild'> | boolean;
      leaveOnEmptyCooldown?: IntFilter<'Guild'> | number;
      createdAt?: DateTimeFilter<'Guild'> | Date | string;
      updatedAt?: DateTimeFilter<'Guild'> | Date | string;
      playlists?: PlaylistListRelationFilter;
      playHistory?: PlayHistoryListRelationFilter;
      queueSnapshots?: QueueSnapshotListRelationFilter;
      userPreferences?: UserPreferencesListRelationFilter;
    },
    'id'
  >;

  export type GuildOrderByWithAggregationInput = {
    id?: SortOrder;
    name?: SortOrder;
    preferredLanguage?: SortOrder;
    defaultVolume?: SortOrder;
    leaveOnEmpty?: SortOrder;
    leaveOnEmptyCooldown?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: GuildCountOrderByAggregateInput;
    _avg?: GuildAvgOrderByAggregateInput;
    _max?: GuildMaxOrderByAggregateInput;
    _min?: GuildMinOrderByAggregateInput;
    _sum?: GuildSumOrderByAggregateInput;
  };

  export type GuildScalarWhereWithAggregatesInput = {
    AND?: GuildScalarWhereWithAggregatesInput | GuildScalarWhereWithAggregatesInput[];
    OR?: GuildScalarWhereWithAggregatesInput[];
    NOT?: GuildScalarWhereWithAggregatesInput | GuildScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'Guild'> | string;
    name?: StringWithAggregatesFilter<'Guild'> | string;
    preferredLanguage?: StringWithAggregatesFilter<'Guild'> | string;
    defaultVolume?: IntWithAggregatesFilter<'Guild'> | number;
    leaveOnEmpty?: BoolWithAggregatesFilter<'Guild'> | boolean;
    leaveOnEmptyCooldown?: IntWithAggregatesFilter<'Guild'> | number;
    createdAt?: DateTimeWithAggregatesFilter<'Guild'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'Guild'> | Date | string;
  };

  export type PlaylistWhereInput = {
    AND?: PlaylistWhereInput | PlaylistWhereInput[];
    OR?: PlaylistWhereInput[];
    NOT?: PlaylistWhereInput | PlaylistWhereInput[];
    id?: StringFilter<'Playlist'> | string;
    guildId?: StringNullableFilter<'Playlist'> | string | null;
    userId?: StringFilter<'Playlist'> | string;
    name?: StringFilter<'Playlist'> | string;
    description?: StringNullableFilter<'Playlist'> | string | null;
    isPublic?: BoolFilter<'Playlist'> | boolean;
    createdAt?: DateTimeFilter<'Playlist'> | Date | string;
    updatedAt?: DateTimeFilter<'Playlist'> | Date | string;
    guild?: XOR<GuildNullableScalarRelationFilter, GuildWhereInput> | null;
    tracks?: PlaylistTrackListRelationFilter;
  };

  export type PlaylistOrderByWithRelationInput = {
    id?: SortOrder;
    guildId?: SortOrderInput | SortOrder;
    userId?: SortOrder;
    name?: SortOrder;
    description?: SortOrderInput | SortOrder;
    isPublic?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    guild?: GuildOrderByWithRelationInput;
    tracks?: PlaylistTrackOrderByRelationAggregateInput;
  };

  export type PlaylistWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: PlaylistWhereInput | PlaylistWhereInput[];
      OR?: PlaylistWhereInput[];
      NOT?: PlaylistWhereInput | PlaylistWhereInput[];
      guildId?: StringNullableFilter<'Playlist'> | string | null;
      userId?: StringFilter<'Playlist'> | string;
      name?: StringFilter<'Playlist'> | string;
      description?: StringNullableFilter<'Playlist'> | string | null;
      isPublic?: BoolFilter<'Playlist'> | boolean;
      createdAt?: DateTimeFilter<'Playlist'> | Date | string;
      updatedAt?: DateTimeFilter<'Playlist'> | Date | string;
      guild?: XOR<GuildNullableScalarRelationFilter, GuildWhereInput> | null;
      tracks?: PlaylistTrackListRelationFilter;
    },
    'id'
  >;

  export type PlaylistOrderByWithAggregationInput = {
    id?: SortOrder;
    guildId?: SortOrderInput | SortOrder;
    userId?: SortOrder;
    name?: SortOrder;
    description?: SortOrderInput | SortOrder;
    isPublic?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: PlaylistCountOrderByAggregateInput;
    _max?: PlaylistMaxOrderByAggregateInput;
    _min?: PlaylistMinOrderByAggregateInput;
  };

  export type PlaylistScalarWhereWithAggregatesInput = {
    AND?: PlaylistScalarWhereWithAggregatesInput | PlaylistScalarWhereWithAggregatesInput[];
    OR?: PlaylistScalarWhereWithAggregatesInput[];
    NOT?: PlaylistScalarWhereWithAggregatesInput | PlaylistScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'Playlist'> | string;
    guildId?: StringNullableWithAggregatesFilter<'Playlist'> | string | null;
    userId?: StringWithAggregatesFilter<'Playlist'> | string;
    name?: StringWithAggregatesFilter<'Playlist'> | string;
    description?: StringNullableWithAggregatesFilter<'Playlist'> | string | null;
    isPublic?: BoolWithAggregatesFilter<'Playlist'> | boolean;
    createdAt?: DateTimeWithAggregatesFilter<'Playlist'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'Playlist'> | Date | string;
  };

  export type PlaylistTrackWhereInput = {
    AND?: PlaylistTrackWhereInput | PlaylistTrackWhereInput[];
    OR?: PlaylistTrackWhereInput[];
    NOT?: PlaylistTrackWhereInput | PlaylistTrackWhereInput[];
    id?: StringFilter<'PlaylistTrack'> | string;
    playlistId?: StringFilter<'PlaylistTrack'> | string;
    position?: IntFilter<'PlaylistTrack'> | number;
    title?: StringFilter<'PlaylistTrack'> | string;
    artist?: StringNullableFilter<'PlaylistTrack'> | string | null;
    duration?: IntFilter<'PlaylistTrack'> | number;
    url?: StringFilter<'PlaylistTrack'> | string;
    thumbnail?: StringNullableFilter<'PlaylistTrack'> | string | null;
    platform?: StringFilter<'PlaylistTrack'> | string;
    platformId?: StringNullableFilter<'PlaylistTrack'> | string | null;
    filePath?: StringNullableFilter<'PlaylistTrack'> | string | null;
    addedAt?: DateTimeFilter<'PlaylistTrack'> | Date | string;
    playlist?: XOR<PlaylistScalarRelationFilter, PlaylistWhereInput>;
  };

  export type PlaylistTrackOrderByWithRelationInput = {
    id?: SortOrder;
    playlistId?: SortOrder;
    position?: SortOrder;
    title?: SortOrder;
    artist?: SortOrderInput | SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrderInput | SortOrder;
    platform?: SortOrder;
    platformId?: SortOrderInput | SortOrder;
    filePath?: SortOrderInput | SortOrder;
    addedAt?: SortOrder;
    playlist?: PlaylistOrderByWithRelationInput;
  };

  export type PlaylistTrackWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      playlistId_position?: PlaylistTrackPlaylistIdPositionCompoundUniqueInput;
      AND?: PlaylistTrackWhereInput | PlaylistTrackWhereInput[];
      OR?: PlaylistTrackWhereInput[];
      NOT?: PlaylistTrackWhereInput | PlaylistTrackWhereInput[];
      playlistId?: StringFilter<'PlaylistTrack'> | string;
      position?: IntFilter<'PlaylistTrack'> | number;
      title?: StringFilter<'PlaylistTrack'> | string;
      artist?: StringNullableFilter<'PlaylistTrack'> | string | null;
      duration?: IntFilter<'PlaylistTrack'> | number;
      url?: StringFilter<'PlaylistTrack'> | string;
      thumbnail?: StringNullableFilter<'PlaylistTrack'> | string | null;
      platform?: StringFilter<'PlaylistTrack'> | string;
      platformId?: StringNullableFilter<'PlaylistTrack'> | string | null;
      filePath?: StringNullableFilter<'PlaylistTrack'> | string | null;
      addedAt?: DateTimeFilter<'PlaylistTrack'> | Date | string;
      playlist?: XOR<PlaylistScalarRelationFilter, PlaylistWhereInput>;
    },
    'id' | 'playlistId_position'
  >;

  export type PlaylistTrackOrderByWithAggregationInput = {
    id?: SortOrder;
    playlistId?: SortOrder;
    position?: SortOrder;
    title?: SortOrder;
    artist?: SortOrderInput | SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrderInput | SortOrder;
    platform?: SortOrder;
    platformId?: SortOrderInput | SortOrder;
    filePath?: SortOrderInput | SortOrder;
    addedAt?: SortOrder;
    _count?: PlaylistTrackCountOrderByAggregateInput;
    _avg?: PlaylistTrackAvgOrderByAggregateInput;
    _max?: PlaylistTrackMaxOrderByAggregateInput;
    _min?: PlaylistTrackMinOrderByAggregateInput;
    _sum?: PlaylistTrackSumOrderByAggregateInput;
  };

  export type PlaylistTrackScalarWhereWithAggregatesInput = {
    AND?: PlaylistTrackScalarWhereWithAggregatesInput | PlaylistTrackScalarWhereWithAggregatesInput[];
    OR?: PlaylistTrackScalarWhereWithAggregatesInput[];
    NOT?: PlaylistTrackScalarWhereWithAggregatesInput | PlaylistTrackScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'PlaylistTrack'> | string;
    playlistId?: StringWithAggregatesFilter<'PlaylistTrack'> | string;
    position?: IntWithAggregatesFilter<'PlaylistTrack'> | number;
    title?: StringWithAggregatesFilter<'PlaylistTrack'> | string;
    artist?: StringNullableWithAggregatesFilter<'PlaylistTrack'> | string | null;
    duration?: IntWithAggregatesFilter<'PlaylistTrack'> | number;
    url?: StringWithAggregatesFilter<'PlaylistTrack'> | string;
    thumbnail?: StringNullableWithAggregatesFilter<'PlaylistTrack'> | string | null;
    platform?: StringWithAggregatesFilter<'PlaylistTrack'> | string;
    platformId?: StringNullableWithAggregatesFilter<'PlaylistTrack'> | string | null;
    filePath?: StringNullableWithAggregatesFilter<'PlaylistTrack'> | string | null;
    addedAt?: DateTimeWithAggregatesFilter<'PlaylistTrack'> | Date | string;
  };

  export type PlayHistoryWhereInput = {
    AND?: PlayHistoryWhereInput | PlayHistoryWhereInput[];
    OR?: PlayHistoryWhereInput[];
    NOT?: PlayHistoryWhereInput | PlayHistoryWhereInput[];
    id?: StringFilter<'PlayHistory'> | string;
    guildId?: StringFilter<'PlayHistory'> | string;
    userId?: StringFilter<'PlayHistory'> | string;
    title?: StringFilter<'PlayHistory'> | string;
    artist?: StringNullableFilter<'PlayHistory'> | string | null;
    duration?: IntFilter<'PlayHistory'> | number;
    url?: StringFilter<'PlayHistory'> | string;
    platform?: StringFilter<'PlayHistory'> | string;
    platformId?: StringNullableFilter<'PlayHistory'> | string | null;
    playedAt?: DateTimeFilter<'PlayHistory'> | Date | string;
    completedAt?: DateTimeNullableFilter<'PlayHistory'> | Date | string | null;
    guild?: XOR<GuildScalarRelationFilter, GuildWhereInput>;
  };

  export type PlayHistoryOrderByWithRelationInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrderInput | SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrderInput | SortOrder;
    playedAt?: SortOrder;
    completedAt?: SortOrderInput | SortOrder;
    guild?: GuildOrderByWithRelationInput;
  };

  export type PlayHistoryWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: PlayHistoryWhereInput | PlayHistoryWhereInput[];
      OR?: PlayHistoryWhereInput[];
      NOT?: PlayHistoryWhereInput | PlayHistoryWhereInput[];
      guildId?: StringFilter<'PlayHistory'> | string;
      userId?: StringFilter<'PlayHistory'> | string;
      title?: StringFilter<'PlayHistory'> | string;
      artist?: StringNullableFilter<'PlayHistory'> | string | null;
      duration?: IntFilter<'PlayHistory'> | number;
      url?: StringFilter<'PlayHistory'> | string;
      platform?: StringFilter<'PlayHistory'> | string;
      platformId?: StringNullableFilter<'PlayHistory'> | string | null;
      playedAt?: DateTimeFilter<'PlayHistory'> | Date | string;
      completedAt?: DateTimeNullableFilter<'PlayHistory'> | Date | string | null;
      guild?: XOR<GuildScalarRelationFilter, GuildWhereInput>;
    },
    'id'
  >;

  export type PlayHistoryOrderByWithAggregationInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrderInput | SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrderInput | SortOrder;
    playedAt?: SortOrder;
    completedAt?: SortOrderInput | SortOrder;
    _count?: PlayHistoryCountOrderByAggregateInput;
    _avg?: PlayHistoryAvgOrderByAggregateInput;
    _max?: PlayHistoryMaxOrderByAggregateInput;
    _min?: PlayHistoryMinOrderByAggregateInput;
    _sum?: PlayHistorySumOrderByAggregateInput;
  };

  export type PlayHistoryScalarWhereWithAggregatesInput = {
    AND?: PlayHistoryScalarWhereWithAggregatesInput | PlayHistoryScalarWhereWithAggregatesInput[];
    OR?: PlayHistoryScalarWhereWithAggregatesInput[];
    NOT?: PlayHistoryScalarWhereWithAggregatesInput | PlayHistoryScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'PlayHistory'> | string;
    guildId?: StringWithAggregatesFilter<'PlayHistory'> | string;
    userId?: StringWithAggregatesFilter<'PlayHistory'> | string;
    title?: StringWithAggregatesFilter<'PlayHistory'> | string;
    artist?: StringNullableWithAggregatesFilter<'PlayHistory'> | string | null;
    duration?: IntWithAggregatesFilter<'PlayHistory'> | number;
    url?: StringWithAggregatesFilter<'PlayHistory'> | string;
    platform?: StringWithAggregatesFilter<'PlayHistory'> | string;
    platformId?: StringNullableWithAggregatesFilter<'PlayHistory'> | string | null;
    playedAt?: DateTimeWithAggregatesFilter<'PlayHistory'> | Date | string;
    completedAt?: DateTimeNullableWithAggregatesFilter<'PlayHistory'> | Date | string | null;
  };

  export type QueueSnapshotWhereInput = {
    AND?: QueueSnapshotWhereInput | QueueSnapshotWhereInput[];
    OR?: QueueSnapshotWhereInput[];
    NOT?: QueueSnapshotWhereInput | QueueSnapshotWhereInput[];
    id?: StringFilter<'QueueSnapshot'> | string;
    guildId?: StringFilter<'QueueSnapshot'> | string;
    currentTrackUrl?: StringNullableFilter<'QueueSnapshot'> | string | null;
    currentPosition?: IntFilter<'QueueSnapshot'> | number;
    volume?: IntFilter<'QueueSnapshot'> | number;
    loopMode?: StringFilter<'QueueSnapshot'> | string;
    tracks?: StringFilter<'QueueSnapshot'> | string;
    createdAt?: DateTimeFilter<'QueueSnapshot'> | Date | string;
    guild?: XOR<GuildScalarRelationFilter, GuildWhereInput>;
  };

  export type QueueSnapshotOrderByWithRelationInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    currentTrackUrl?: SortOrderInput | SortOrder;
    currentPosition?: SortOrder;
    volume?: SortOrder;
    loopMode?: SortOrder;
    tracks?: SortOrder;
    createdAt?: SortOrder;
    guild?: GuildOrderByWithRelationInput;
  };

  export type QueueSnapshotWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: QueueSnapshotWhereInput | QueueSnapshotWhereInput[];
      OR?: QueueSnapshotWhereInput[];
      NOT?: QueueSnapshotWhereInput | QueueSnapshotWhereInput[];
      guildId?: StringFilter<'QueueSnapshot'> | string;
      currentTrackUrl?: StringNullableFilter<'QueueSnapshot'> | string | null;
      currentPosition?: IntFilter<'QueueSnapshot'> | number;
      volume?: IntFilter<'QueueSnapshot'> | number;
      loopMode?: StringFilter<'QueueSnapshot'> | string;
      tracks?: StringFilter<'QueueSnapshot'> | string;
      createdAt?: DateTimeFilter<'QueueSnapshot'> | Date | string;
      guild?: XOR<GuildScalarRelationFilter, GuildWhereInput>;
    },
    'id'
  >;

  export type QueueSnapshotOrderByWithAggregationInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    currentTrackUrl?: SortOrderInput | SortOrder;
    currentPosition?: SortOrder;
    volume?: SortOrder;
    loopMode?: SortOrder;
    tracks?: SortOrder;
    createdAt?: SortOrder;
    _count?: QueueSnapshotCountOrderByAggregateInput;
    _avg?: QueueSnapshotAvgOrderByAggregateInput;
    _max?: QueueSnapshotMaxOrderByAggregateInput;
    _min?: QueueSnapshotMinOrderByAggregateInput;
    _sum?: QueueSnapshotSumOrderByAggregateInput;
  };

  export type QueueSnapshotScalarWhereWithAggregatesInput = {
    AND?: QueueSnapshotScalarWhereWithAggregatesInput | QueueSnapshotScalarWhereWithAggregatesInput[];
    OR?: QueueSnapshotScalarWhereWithAggregatesInput[];
    NOT?: QueueSnapshotScalarWhereWithAggregatesInput | QueueSnapshotScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'QueueSnapshot'> | string;
    guildId?: StringWithAggregatesFilter<'QueueSnapshot'> | string;
    currentTrackUrl?: StringNullableWithAggregatesFilter<'QueueSnapshot'> | string | null;
    currentPosition?: IntWithAggregatesFilter<'QueueSnapshot'> | number;
    volume?: IntWithAggregatesFilter<'QueueSnapshot'> | number;
    loopMode?: StringWithAggregatesFilter<'QueueSnapshot'> | string;
    tracks?: StringWithAggregatesFilter<'QueueSnapshot'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'QueueSnapshot'> | Date | string;
  };

  export type UserPreferencesWhereInput = {
    AND?: UserPreferencesWhereInput | UserPreferencesWhereInput[];
    OR?: UserPreferencesWhereInput[];
    NOT?: UserPreferencesWhereInput | UserPreferencesWhereInput[];
    id?: StringFilter<'UserPreferences'> | string;
    guildId?: StringFilter<'UserPreferences'> | string;
    userId?: StringFilter<'UserPreferences'> | string;
    language?: StringFilter<'UserPreferences'> | string;
    volume?: IntFilter<'UserPreferences'> | number;
    createdAt?: DateTimeFilter<'UserPreferences'> | Date | string;
    updatedAt?: DateTimeFilter<'UserPreferences'> | Date | string;
    guild?: XOR<GuildScalarRelationFilter, GuildWhereInput>;
  };

  export type UserPreferencesOrderByWithRelationInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    language?: SortOrder;
    volume?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    guild?: GuildOrderByWithRelationInput;
  };

  export type UserPreferencesWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      guildId_userId?: UserPreferencesGuildIdUserIdCompoundUniqueInput;
      AND?: UserPreferencesWhereInput | UserPreferencesWhereInput[];
      OR?: UserPreferencesWhereInput[];
      NOT?: UserPreferencesWhereInput | UserPreferencesWhereInput[];
      guildId?: StringFilter<'UserPreferences'> | string;
      userId?: StringFilter<'UserPreferences'> | string;
      language?: StringFilter<'UserPreferences'> | string;
      volume?: IntFilter<'UserPreferences'> | number;
      createdAt?: DateTimeFilter<'UserPreferences'> | Date | string;
      updatedAt?: DateTimeFilter<'UserPreferences'> | Date | string;
      guild?: XOR<GuildScalarRelationFilter, GuildWhereInput>;
    },
    'id' | 'guildId_userId'
  >;

  export type UserPreferencesOrderByWithAggregationInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    language?: SortOrder;
    volume?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: UserPreferencesCountOrderByAggregateInput;
    _avg?: UserPreferencesAvgOrderByAggregateInput;
    _max?: UserPreferencesMaxOrderByAggregateInput;
    _min?: UserPreferencesMinOrderByAggregateInput;
    _sum?: UserPreferencesSumOrderByAggregateInput;
  };

  export type UserPreferencesScalarWhereWithAggregatesInput = {
    AND?: UserPreferencesScalarWhereWithAggregatesInput | UserPreferencesScalarWhereWithAggregatesInput[];
    OR?: UserPreferencesScalarWhereWithAggregatesInput[];
    NOT?: UserPreferencesScalarWhereWithAggregatesInput | UserPreferencesScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'UserPreferences'> | string;
    guildId?: StringWithAggregatesFilter<'UserPreferences'> | string;
    userId?: StringWithAggregatesFilter<'UserPreferences'> | string;
    language?: StringWithAggregatesFilter<'UserPreferences'> | string;
    volume?: IntWithAggregatesFilter<'UserPreferences'> | number;
    createdAt?: DateTimeWithAggregatesFilter<'UserPreferences'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'UserPreferences'> | Date | string;
  };

  export type TrackCacheWhereInput = {
    AND?: TrackCacheWhereInput | TrackCacheWhereInput[];
    OR?: TrackCacheWhereInput[];
    NOT?: TrackCacheWhereInput | TrackCacheWhereInput[];
    id?: StringFilter<'TrackCache'> | string;
    platform?: StringFilter<'TrackCache'> | string;
    platformId?: StringFilter<'TrackCache'> | string;
    title?: StringFilter<'TrackCache'> | string;
    artist?: StringNullableFilter<'TrackCache'> | string | null;
    duration?: IntFilter<'TrackCache'> | number;
    url?: StringFilter<'TrackCache'> | string;
    thumbnail?: StringNullableFilter<'TrackCache'> | string | null;
    metadata?: StringNullableFilter<'TrackCache'> | string | null;
    createdAt?: DateTimeFilter<'TrackCache'> | Date | string;
    lastUsed?: DateTimeFilter<'TrackCache'> | Date | string;
  };

  export type TrackCacheOrderByWithRelationInput = {
    id?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrderInput | SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrderInput | SortOrder;
    metadata?: SortOrderInput | SortOrder;
    createdAt?: SortOrder;
    lastUsed?: SortOrder;
  };

  export type TrackCacheWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      platform_platformId?: TrackCachePlatformPlatformIdCompoundUniqueInput;
      AND?: TrackCacheWhereInput | TrackCacheWhereInput[];
      OR?: TrackCacheWhereInput[];
      NOT?: TrackCacheWhereInput | TrackCacheWhereInput[];
      platform?: StringFilter<'TrackCache'> | string;
      platformId?: StringFilter<'TrackCache'> | string;
      title?: StringFilter<'TrackCache'> | string;
      artist?: StringNullableFilter<'TrackCache'> | string | null;
      duration?: IntFilter<'TrackCache'> | number;
      url?: StringFilter<'TrackCache'> | string;
      thumbnail?: StringNullableFilter<'TrackCache'> | string | null;
      metadata?: StringNullableFilter<'TrackCache'> | string | null;
      createdAt?: DateTimeFilter<'TrackCache'> | Date | string;
      lastUsed?: DateTimeFilter<'TrackCache'> | Date | string;
    },
    'id' | 'platform_platformId'
  >;

  export type TrackCacheOrderByWithAggregationInput = {
    id?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrderInput | SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrderInput | SortOrder;
    metadata?: SortOrderInput | SortOrder;
    createdAt?: SortOrder;
    lastUsed?: SortOrder;
    _count?: TrackCacheCountOrderByAggregateInput;
    _avg?: TrackCacheAvgOrderByAggregateInput;
    _max?: TrackCacheMaxOrderByAggregateInput;
    _min?: TrackCacheMinOrderByAggregateInput;
    _sum?: TrackCacheSumOrderByAggregateInput;
  };

  export type TrackCacheScalarWhereWithAggregatesInput = {
    AND?: TrackCacheScalarWhereWithAggregatesInput | TrackCacheScalarWhereWithAggregatesInput[];
    OR?: TrackCacheScalarWhereWithAggregatesInput[];
    NOT?: TrackCacheScalarWhereWithAggregatesInput | TrackCacheScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'TrackCache'> | string;
    platform?: StringWithAggregatesFilter<'TrackCache'> | string;
    platformId?: StringWithAggregatesFilter<'TrackCache'> | string;
    title?: StringWithAggregatesFilter<'TrackCache'> | string;
    artist?: StringNullableWithAggregatesFilter<'TrackCache'> | string | null;
    duration?: IntWithAggregatesFilter<'TrackCache'> | number;
    url?: StringWithAggregatesFilter<'TrackCache'> | string;
    thumbnail?: StringNullableWithAggregatesFilter<'TrackCache'> | string | null;
    metadata?: StringNullableWithAggregatesFilter<'TrackCache'> | string | null;
    createdAt?: DateTimeWithAggregatesFilter<'TrackCache'> | Date | string;
    lastUsed?: DateTimeWithAggregatesFilter<'TrackCache'> | Date | string;
  };

  export type GuildCreateInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playlists?: PlaylistCreateNestedManyWithoutGuildInput;
    playHistory?: PlayHistoryCreateNestedManyWithoutGuildInput;
    queueSnapshots?: QueueSnapshotCreateNestedManyWithoutGuildInput;
    userPreferences?: UserPreferencesCreateNestedManyWithoutGuildInput;
  };

  export type GuildUncheckedCreateInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playlists?: PlaylistUncheckedCreateNestedManyWithoutGuildInput;
    playHistory?: PlayHistoryUncheckedCreateNestedManyWithoutGuildInput;
    queueSnapshots?: QueueSnapshotUncheckedCreateNestedManyWithoutGuildInput;
    userPreferences?: UserPreferencesUncheckedCreateNestedManyWithoutGuildInput;
  };

  export type GuildUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playlists?: PlaylistUpdateManyWithoutGuildNestedInput;
    playHistory?: PlayHistoryUpdateManyWithoutGuildNestedInput;
    queueSnapshots?: QueueSnapshotUpdateManyWithoutGuildNestedInput;
    userPreferences?: UserPreferencesUpdateManyWithoutGuildNestedInput;
  };

  export type GuildUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playlists?: PlaylistUncheckedUpdateManyWithoutGuildNestedInput;
    playHistory?: PlayHistoryUncheckedUpdateManyWithoutGuildNestedInput;
    queueSnapshots?: QueueSnapshotUncheckedUpdateManyWithoutGuildNestedInput;
    userPreferences?: UserPreferencesUncheckedUpdateManyWithoutGuildNestedInput;
  };

  export type GuildCreateManyInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type GuildUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type GuildUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlaylistCreateInput = {
    id?: string;
    userId: string;
    name: string;
    description?: string | null;
    isPublic?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    guild?: GuildCreateNestedOneWithoutPlaylistsInput;
    tracks?: PlaylistTrackCreateNestedManyWithoutPlaylistInput;
  };

  export type PlaylistUncheckedCreateInput = {
    id?: string;
    guildId?: string | null;
    userId: string;
    name: string;
    description?: string | null;
    isPublic?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tracks?: PlaylistTrackUncheckedCreateNestedManyWithoutPlaylistInput;
  };

  export type PlaylistUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    guild?: GuildUpdateOneWithoutPlaylistsNestedInput;
    tracks?: PlaylistTrackUpdateManyWithoutPlaylistNestedInput;
  };

  export type PlaylistUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    guildId?: NullableStringFieldUpdateOperationsInput | string | null;
    userId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    tracks?: PlaylistTrackUncheckedUpdateManyWithoutPlaylistNestedInput;
  };

  export type PlaylistCreateManyInput = {
    id?: string;
    guildId?: string | null;
    userId: string;
    name: string;
    description?: string | null;
    isPublic?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type PlaylistUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlaylistUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    guildId?: NullableStringFieldUpdateOperationsInput | string | null;
    userId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlaylistTrackCreateInput = {
    id?: string;
    position: number;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    thumbnail?: string | null;
    platform: string;
    platformId?: string | null;
    filePath?: string | null;
    addedAt?: Date | string;
    playlist: PlaylistCreateNestedOneWithoutTracksInput;
  };

  export type PlaylistTrackUncheckedCreateInput = {
    id?: string;
    playlistId: string;
    position: number;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    thumbnail?: string | null;
    platform: string;
    platformId?: string | null;
    filePath?: string | null;
    addedAt?: Date | string;
  };

  export type PlaylistTrackUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    position?: IntFieldUpdateOperationsInput | number;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    filePath?: NullableStringFieldUpdateOperationsInput | string | null;
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playlist?: PlaylistUpdateOneRequiredWithoutTracksNestedInput;
  };

  export type PlaylistTrackUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    playlistId?: StringFieldUpdateOperationsInput | string;
    position?: IntFieldUpdateOperationsInput | number;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    filePath?: NullableStringFieldUpdateOperationsInput | string | null;
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlaylistTrackCreateManyInput = {
    id?: string;
    playlistId: string;
    position: number;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    thumbnail?: string | null;
    platform: string;
    platformId?: string | null;
    filePath?: string | null;
    addedAt?: Date | string;
  };

  export type PlaylistTrackUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    position?: IntFieldUpdateOperationsInput | number;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    filePath?: NullableStringFieldUpdateOperationsInput | string | null;
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlaylistTrackUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    playlistId?: StringFieldUpdateOperationsInput | string;
    position?: IntFieldUpdateOperationsInput | number;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    filePath?: NullableStringFieldUpdateOperationsInput | string | null;
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlayHistoryCreateInput = {
    id?: string;
    userId: string;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    platform: string;
    platformId?: string | null;
    playedAt?: Date | string;
    completedAt?: Date | string | null;
    guild: GuildCreateNestedOneWithoutPlayHistoryInput;
  };

  export type PlayHistoryUncheckedCreateInput = {
    id?: string;
    guildId: string;
    userId: string;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    platform: string;
    platformId?: string | null;
    playedAt?: Date | string;
    completedAt?: Date | string | null;
  };

  export type PlayHistoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
    guild?: GuildUpdateOneRequiredWithoutPlayHistoryNestedInput;
  };

  export type PlayHistoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    guildId?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type PlayHistoryCreateManyInput = {
    id?: string;
    guildId: string;
    userId: string;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    platform: string;
    platformId?: string | null;
    playedAt?: Date | string;
    completedAt?: Date | string | null;
  };

  export type PlayHistoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type PlayHistoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    guildId?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type QueueSnapshotCreateInput = {
    id?: string;
    currentTrackUrl?: string | null;
    currentPosition?: number;
    volume?: number;
    loopMode?: string;
    tracks: string;
    createdAt?: Date | string;
    guild: GuildCreateNestedOneWithoutQueueSnapshotsInput;
  };

  export type QueueSnapshotUncheckedCreateInput = {
    id?: string;
    guildId: string;
    currentTrackUrl?: string | null;
    currentPosition?: number;
    volume?: number;
    loopMode?: string;
    tracks: string;
    createdAt?: Date | string;
  };

  export type QueueSnapshotUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    currentTrackUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    currentPosition?: IntFieldUpdateOperationsInput | number;
    volume?: IntFieldUpdateOperationsInput | number;
    loopMode?: StringFieldUpdateOperationsInput | string;
    tracks?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    guild?: GuildUpdateOneRequiredWithoutQueueSnapshotsNestedInput;
  };

  export type QueueSnapshotUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    guildId?: StringFieldUpdateOperationsInput | string;
    currentTrackUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    currentPosition?: IntFieldUpdateOperationsInput | number;
    volume?: IntFieldUpdateOperationsInput | number;
    loopMode?: StringFieldUpdateOperationsInput | string;
    tracks?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type QueueSnapshotCreateManyInput = {
    id?: string;
    guildId: string;
    currentTrackUrl?: string | null;
    currentPosition?: number;
    volume?: number;
    loopMode?: string;
    tracks: string;
    createdAt?: Date | string;
  };

  export type QueueSnapshotUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    currentTrackUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    currentPosition?: IntFieldUpdateOperationsInput | number;
    volume?: IntFieldUpdateOperationsInput | number;
    loopMode?: StringFieldUpdateOperationsInput | string;
    tracks?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type QueueSnapshotUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    guildId?: StringFieldUpdateOperationsInput | string;
    currentTrackUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    currentPosition?: IntFieldUpdateOperationsInput | number;
    volume?: IntFieldUpdateOperationsInput | number;
    loopMode?: StringFieldUpdateOperationsInput | string;
    tracks?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserPreferencesCreateInput = {
    id?: string;
    userId: string;
    language?: string;
    volume?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    guild: GuildCreateNestedOneWithoutUserPreferencesInput;
  };

  export type UserPreferencesUncheckedCreateInput = {
    id?: string;
    guildId: string;
    userId: string;
    language?: string;
    volume?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserPreferencesUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    language?: StringFieldUpdateOperationsInput | string;
    volume?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    guild?: GuildUpdateOneRequiredWithoutUserPreferencesNestedInput;
  };

  export type UserPreferencesUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    guildId?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    language?: StringFieldUpdateOperationsInput | string;
    volume?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserPreferencesCreateManyInput = {
    id?: string;
    guildId: string;
    userId: string;
    language?: string;
    volume?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserPreferencesUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    language?: StringFieldUpdateOperationsInput | string;
    volume?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserPreferencesUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    guildId?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    language?: StringFieldUpdateOperationsInput | string;
    volume?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type TrackCacheCreateInput = {
    id?: string;
    platform: string;
    platformId: string;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    thumbnail?: string | null;
    metadata?: string | null;
    createdAt?: Date | string;
    lastUsed?: Date | string;
  };

  export type TrackCacheUncheckedCreateInput = {
    id?: string;
    platform: string;
    platformId: string;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    thumbnail?: string | null;
    metadata?: string | null;
    createdAt?: Date | string;
    lastUsed?: Date | string;
  };

  export type TrackCacheUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type TrackCacheUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type TrackCacheCreateManyInput = {
    id?: string;
    platform: string;
    platformId: string;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    thumbnail?: string | null;
    metadata?: string | null;
    createdAt?: Date | string;
    lastUsed?: Date | string;
  };

  export type TrackCacheUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type TrackCacheUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    metadata?: NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    lastUsed?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolFilter<$PrismaModel> | boolean;
  };

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string;
  };

  export type PlaylistListRelationFilter = {
    every?: PlaylistWhereInput;
    some?: PlaylistWhereInput;
    none?: PlaylistWhereInput;
  };

  export type PlayHistoryListRelationFilter = {
    every?: PlayHistoryWhereInput;
    some?: PlayHistoryWhereInput;
    none?: PlayHistoryWhereInput;
  };

  export type QueueSnapshotListRelationFilter = {
    every?: QueueSnapshotWhereInput;
    some?: QueueSnapshotWhereInput;
    none?: QueueSnapshotWhereInput;
  };

  export type UserPreferencesListRelationFilter = {
    every?: UserPreferencesWhereInput;
    some?: UserPreferencesWhereInput;
    none?: UserPreferencesWhereInput;
  };

  export type PlaylistOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type PlayHistoryOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type QueueSnapshotOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type UserPreferencesOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type GuildCountOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    preferredLanguage?: SortOrder;
    defaultVolume?: SortOrder;
    leaveOnEmpty?: SortOrder;
    leaveOnEmptyCooldown?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type GuildAvgOrderByAggregateInput = {
    defaultVolume?: SortOrder;
    leaveOnEmptyCooldown?: SortOrder;
  };

  export type GuildMaxOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    preferredLanguage?: SortOrder;
    defaultVolume?: SortOrder;
    leaveOnEmpty?: SortOrder;
    leaveOnEmptyCooldown?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type GuildMinOrderByAggregateInput = {
    id?: SortOrder;
    name?: SortOrder;
    preferredLanguage?: SortOrder;
    defaultVolume?: SortOrder;
    leaveOnEmpty?: SortOrder;
    leaveOnEmptyCooldown?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type GuildSumOrderByAggregateInput = {
    defaultVolume?: SortOrder;
    leaveOnEmptyCooldown?: SortOrder;
  };

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedIntFilter<$PrismaModel>;
    _min?: NestedIntFilter<$PrismaModel>;
    _max?: NestedIntFilter<$PrismaModel>;
  };

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedBoolFilter<$PrismaModel>;
    _max?: NestedBoolFilter<$PrismaModel>;
  };

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedDateTimeFilter<$PrismaModel>;
    _max?: NestedDateTimeFilter<$PrismaModel>;
  };

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type GuildNullableScalarRelationFilter = {
    is?: GuildWhereInput | null;
    isNot?: GuildWhereInput | null;
  };

  export type PlaylistTrackListRelationFilter = {
    every?: PlaylistTrackWhereInput;
    some?: PlaylistTrackWhereInput;
    none?: PlaylistTrackWhereInput;
  };

  export type SortOrderInput = {
    sort: SortOrder;
    nulls?: NullsOrder;
  };

  export type PlaylistTrackOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type PlaylistCountOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    isPublic?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type PlaylistMaxOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    isPublic?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type PlaylistMinOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    name?: SortOrder;
    description?: SortOrder;
    isPublic?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type PlaylistScalarRelationFilter = {
    is?: PlaylistWhereInput;
    isNot?: PlaylistWhereInput;
  };

  export type PlaylistTrackPlaylistIdPositionCompoundUniqueInput = {
    playlistId: string;
    position: number;
  };

  export type PlaylistTrackCountOrderByAggregateInput = {
    id?: SortOrder;
    playlistId?: SortOrder;
    position?: SortOrder;
    title?: SortOrder;
    artist?: SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    filePath?: SortOrder;
    addedAt?: SortOrder;
  };

  export type PlaylistTrackAvgOrderByAggregateInput = {
    position?: SortOrder;
    duration?: SortOrder;
  };

  export type PlaylistTrackMaxOrderByAggregateInput = {
    id?: SortOrder;
    playlistId?: SortOrder;
    position?: SortOrder;
    title?: SortOrder;
    artist?: SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    filePath?: SortOrder;
    addedAt?: SortOrder;
  };

  export type PlaylistTrackMinOrderByAggregateInput = {
    id?: SortOrder;
    playlistId?: SortOrder;
    position?: SortOrder;
    title?: SortOrder;
    artist?: SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    filePath?: SortOrder;
    addedAt?: SortOrder;
  };

  export type PlaylistTrackSumOrderByAggregateInput = {
    position?: SortOrder;
    duration?: SortOrder;
  };

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
  };

  export type GuildScalarRelationFilter = {
    is?: GuildWhereInput;
    isNot?: GuildWhereInput;
  };

  export type PlayHistoryCountOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    playedAt?: SortOrder;
    completedAt?: SortOrder;
  };

  export type PlayHistoryAvgOrderByAggregateInput = {
    duration?: SortOrder;
  };

  export type PlayHistoryMaxOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    playedAt?: SortOrder;
    completedAt?: SortOrder;
  };

  export type PlayHistoryMinOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    playedAt?: SortOrder;
    completedAt?: SortOrder;
  };

  export type PlayHistorySumOrderByAggregateInput = {
    duration?: SortOrder;
  };

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: NestedDateTimeNullableFilter<$PrismaModel>;
  };

  export type QueueSnapshotCountOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    currentTrackUrl?: SortOrder;
    currentPosition?: SortOrder;
    volume?: SortOrder;
    loopMode?: SortOrder;
    tracks?: SortOrder;
    createdAt?: SortOrder;
  };

  export type QueueSnapshotAvgOrderByAggregateInput = {
    currentPosition?: SortOrder;
    volume?: SortOrder;
  };

  export type QueueSnapshotMaxOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    currentTrackUrl?: SortOrder;
    currentPosition?: SortOrder;
    volume?: SortOrder;
    loopMode?: SortOrder;
    tracks?: SortOrder;
    createdAt?: SortOrder;
  };

  export type QueueSnapshotMinOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    currentTrackUrl?: SortOrder;
    currentPosition?: SortOrder;
    volume?: SortOrder;
    loopMode?: SortOrder;
    tracks?: SortOrder;
    createdAt?: SortOrder;
  };

  export type QueueSnapshotSumOrderByAggregateInput = {
    currentPosition?: SortOrder;
    volume?: SortOrder;
  };

  export type UserPreferencesGuildIdUserIdCompoundUniqueInput = {
    guildId: string;
    userId: string;
  };

  export type UserPreferencesCountOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    language?: SortOrder;
    volume?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type UserPreferencesAvgOrderByAggregateInput = {
    volume?: SortOrder;
  };

  export type UserPreferencesMaxOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    language?: SortOrder;
    volume?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type UserPreferencesMinOrderByAggregateInput = {
    id?: SortOrder;
    guildId?: SortOrder;
    userId?: SortOrder;
    language?: SortOrder;
    volume?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type UserPreferencesSumOrderByAggregateInput = {
    volume?: SortOrder;
  };

  export type TrackCachePlatformPlatformIdCompoundUniqueInput = {
    platform: string;
    platformId: string;
  };

  export type TrackCacheCountOrderByAggregateInput = {
    id?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrder;
    metadata?: SortOrder;
    createdAt?: SortOrder;
    lastUsed?: SortOrder;
  };

  export type TrackCacheAvgOrderByAggregateInput = {
    duration?: SortOrder;
  };

  export type TrackCacheMaxOrderByAggregateInput = {
    id?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrder;
    metadata?: SortOrder;
    createdAt?: SortOrder;
    lastUsed?: SortOrder;
  };

  export type TrackCacheMinOrderByAggregateInput = {
    id?: SortOrder;
    platform?: SortOrder;
    platformId?: SortOrder;
    title?: SortOrder;
    artist?: SortOrder;
    duration?: SortOrder;
    url?: SortOrder;
    thumbnail?: SortOrder;
    metadata?: SortOrder;
    createdAt?: SortOrder;
    lastUsed?: SortOrder;
  };

  export type TrackCacheSumOrderByAggregateInput = {
    duration?: SortOrder;
  };

  export type PlaylistCreateNestedManyWithoutGuildInput = {
    create?:
      | XOR<PlaylistCreateWithoutGuildInput, PlaylistUncheckedCreateWithoutGuildInput>
      | PlaylistCreateWithoutGuildInput[]
      | PlaylistUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: PlaylistCreateOrConnectWithoutGuildInput | PlaylistCreateOrConnectWithoutGuildInput[];
    createMany?: PlaylistCreateManyGuildInputEnvelope;
    connect?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
  };

  export type PlayHistoryCreateNestedManyWithoutGuildInput = {
    create?:
      | XOR<PlayHistoryCreateWithoutGuildInput, PlayHistoryUncheckedCreateWithoutGuildInput>
      | PlayHistoryCreateWithoutGuildInput[]
      | PlayHistoryUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: PlayHistoryCreateOrConnectWithoutGuildInput | PlayHistoryCreateOrConnectWithoutGuildInput[];
    createMany?: PlayHistoryCreateManyGuildInputEnvelope;
    connect?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
  };

  export type QueueSnapshotCreateNestedManyWithoutGuildInput = {
    create?:
      | XOR<QueueSnapshotCreateWithoutGuildInput, QueueSnapshotUncheckedCreateWithoutGuildInput>
      | QueueSnapshotCreateWithoutGuildInput[]
      | QueueSnapshotUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: QueueSnapshotCreateOrConnectWithoutGuildInput | QueueSnapshotCreateOrConnectWithoutGuildInput[];
    createMany?: QueueSnapshotCreateManyGuildInputEnvelope;
    connect?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
  };

  export type UserPreferencesCreateNestedManyWithoutGuildInput = {
    create?:
      | XOR<UserPreferencesCreateWithoutGuildInput, UserPreferencesUncheckedCreateWithoutGuildInput>
      | UserPreferencesCreateWithoutGuildInput[]
      | UserPreferencesUncheckedCreateWithoutGuildInput[];
    connectOrCreate?:
      | UserPreferencesCreateOrConnectWithoutGuildInput
      | UserPreferencesCreateOrConnectWithoutGuildInput[];
    createMany?: UserPreferencesCreateManyGuildInputEnvelope;
    connect?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
  };

  export type PlaylistUncheckedCreateNestedManyWithoutGuildInput = {
    create?:
      | XOR<PlaylistCreateWithoutGuildInput, PlaylistUncheckedCreateWithoutGuildInput>
      | PlaylistCreateWithoutGuildInput[]
      | PlaylistUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: PlaylistCreateOrConnectWithoutGuildInput | PlaylistCreateOrConnectWithoutGuildInput[];
    createMany?: PlaylistCreateManyGuildInputEnvelope;
    connect?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
  };

  export type PlayHistoryUncheckedCreateNestedManyWithoutGuildInput = {
    create?:
      | XOR<PlayHistoryCreateWithoutGuildInput, PlayHistoryUncheckedCreateWithoutGuildInput>
      | PlayHistoryCreateWithoutGuildInput[]
      | PlayHistoryUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: PlayHistoryCreateOrConnectWithoutGuildInput | PlayHistoryCreateOrConnectWithoutGuildInput[];
    createMany?: PlayHistoryCreateManyGuildInputEnvelope;
    connect?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
  };

  export type QueueSnapshotUncheckedCreateNestedManyWithoutGuildInput = {
    create?:
      | XOR<QueueSnapshotCreateWithoutGuildInput, QueueSnapshotUncheckedCreateWithoutGuildInput>
      | QueueSnapshotCreateWithoutGuildInput[]
      | QueueSnapshotUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: QueueSnapshotCreateOrConnectWithoutGuildInput | QueueSnapshotCreateOrConnectWithoutGuildInput[];
    createMany?: QueueSnapshotCreateManyGuildInputEnvelope;
    connect?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
  };

  export type UserPreferencesUncheckedCreateNestedManyWithoutGuildInput = {
    create?:
      | XOR<UserPreferencesCreateWithoutGuildInput, UserPreferencesUncheckedCreateWithoutGuildInput>
      | UserPreferencesCreateWithoutGuildInput[]
      | UserPreferencesUncheckedCreateWithoutGuildInput[];
    connectOrCreate?:
      | UserPreferencesCreateOrConnectWithoutGuildInput
      | UserPreferencesCreateOrConnectWithoutGuildInput[];
    createMany?: UserPreferencesCreateManyGuildInputEnvelope;
    connect?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
  };

  export type StringFieldUpdateOperationsInput = {
    set?: string;
  };

  export type IntFieldUpdateOperationsInput = {
    set?: number;
    increment?: number;
    decrement?: number;
    multiply?: number;
    divide?: number;
  };

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
  };

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
  };

  export type PlaylistUpdateManyWithoutGuildNestedInput = {
    create?:
      | XOR<PlaylistCreateWithoutGuildInput, PlaylistUncheckedCreateWithoutGuildInput>
      | PlaylistCreateWithoutGuildInput[]
      | PlaylistUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: PlaylistCreateOrConnectWithoutGuildInput | PlaylistCreateOrConnectWithoutGuildInput[];
    upsert?: PlaylistUpsertWithWhereUniqueWithoutGuildInput | PlaylistUpsertWithWhereUniqueWithoutGuildInput[];
    createMany?: PlaylistCreateManyGuildInputEnvelope;
    set?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
    disconnect?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
    delete?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
    connect?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
    update?: PlaylistUpdateWithWhereUniqueWithoutGuildInput | PlaylistUpdateWithWhereUniqueWithoutGuildInput[];
    updateMany?: PlaylistUpdateManyWithWhereWithoutGuildInput | PlaylistUpdateManyWithWhereWithoutGuildInput[];
    deleteMany?: PlaylistScalarWhereInput | PlaylistScalarWhereInput[];
  };

  export type PlayHistoryUpdateManyWithoutGuildNestedInput = {
    create?:
      | XOR<PlayHistoryCreateWithoutGuildInput, PlayHistoryUncheckedCreateWithoutGuildInput>
      | PlayHistoryCreateWithoutGuildInput[]
      | PlayHistoryUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: PlayHistoryCreateOrConnectWithoutGuildInput | PlayHistoryCreateOrConnectWithoutGuildInput[];
    upsert?: PlayHistoryUpsertWithWhereUniqueWithoutGuildInput | PlayHistoryUpsertWithWhereUniqueWithoutGuildInput[];
    createMany?: PlayHistoryCreateManyGuildInputEnvelope;
    set?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
    disconnect?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
    delete?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
    connect?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
    update?: PlayHistoryUpdateWithWhereUniqueWithoutGuildInput | PlayHistoryUpdateWithWhereUniqueWithoutGuildInput[];
    updateMany?: PlayHistoryUpdateManyWithWhereWithoutGuildInput | PlayHistoryUpdateManyWithWhereWithoutGuildInput[];
    deleteMany?: PlayHistoryScalarWhereInput | PlayHistoryScalarWhereInput[];
  };

  export type QueueSnapshotUpdateManyWithoutGuildNestedInput = {
    create?:
      | XOR<QueueSnapshotCreateWithoutGuildInput, QueueSnapshotUncheckedCreateWithoutGuildInput>
      | QueueSnapshotCreateWithoutGuildInput[]
      | QueueSnapshotUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: QueueSnapshotCreateOrConnectWithoutGuildInput | QueueSnapshotCreateOrConnectWithoutGuildInput[];
    upsert?:
      | QueueSnapshotUpsertWithWhereUniqueWithoutGuildInput
      | QueueSnapshotUpsertWithWhereUniqueWithoutGuildInput[];
    createMany?: QueueSnapshotCreateManyGuildInputEnvelope;
    set?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
    disconnect?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
    delete?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
    connect?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
    update?:
      | QueueSnapshotUpdateWithWhereUniqueWithoutGuildInput
      | QueueSnapshotUpdateWithWhereUniqueWithoutGuildInput[];
    updateMany?:
      | QueueSnapshotUpdateManyWithWhereWithoutGuildInput
      | QueueSnapshotUpdateManyWithWhereWithoutGuildInput[];
    deleteMany?: QueueSnapshotScalarWhereInput | QueueSnapshotScalarWhereInput[];
  };

  export type UserPreferencesUpdateManyWithoutGuildNestedInput = {
    create?:
      | XOR<UserPreferencesCreateWithoutGuildInput, UserPreferencesUncheckedCreateWithoutGuildInput>
      | UserPreferencesCreateWithoutGuildInput[]
      | UserPreferencesUncheckedCreateWithoutGuildInput[];
    connectOrCreate?:
      | UserPreferencesCreateOrConnectWithoutGuildInput
      | UserPreferencesCreateOrConnectWithoutGuildInput[];
    upsert?:
      | UserPreferencesUpsertWithWhereUniqueWithoutGuildInput
      | UserPreferencesUpsertWithWhereUniqueWithoutGuildInput[];
    createMany?: UserPreferencesCreateManyGuildInputEnvelope;
    set?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
    disconnect?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
    delete?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
    connect?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
    update?:
      | UserPreferencesUpdateWithWhereUniqueWithoutGuildInput
      | UserPreferencesUpdateWithWhereUniqueWithoutGuildInput[];
    updateMany?:
      | UserPreferencesUpdateManyWithWhereWithoutGuildInput
      | UserPreferencesUpdateManyWithWhereWithoutGuildInput[];
    deleteMany?: UserPreferencesScalarWhereInput | UserPreferencesScalarWhereInput[];
  };

  export type PlaylistUncheckedUpdateManyWithoutGuildNestedInput = {
    create?:
      | XOR<PlaylistCreateWithoutGuildInput, PlaylistUncheckedCreateWithoutGuildInput>
      | PlaylistCreateWithoutGuildInput[]
      | PlaylistUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: PlaylistCreateOrConnectWithoutGuildInput | PlaylistCreateOrConnectWithoutGuildInput[];
    upsert?: PlaylistUpsertWithWhereUniqueWithoutGuildInput | PlaylistUpsertWithWhereUniqueWithoutGuildInput[];
    createMany?: PlaylistCreateManyGuildInputEnvelope;
    set?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
    disconnect?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
    delete?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
    connect?: PlaylistWhereUniqueInput | PlaylistWhereUniqueInput[];
    update?: PlaylistUpdateWithWhereUniqueWithoutGuildInput | PlaylistUpdateWithWhereUniqueWithoutGuildInput[];
    updateMany?: PlaylistUpdateManyWithWhereWithoutGuildInput | PlaylistUpdateManyWithWhereWithoutGuildInput[];
    deleteMany?: PlaylistScalarWhereInput | PlaylistScalarWhereInput[];
  };

  export type PlayHistoryUncheckedUpdateManyWithoutGuildNestedInput = {
    create?:
      | XOR<PlayHistoryCreateWithoutGuildInput, PlayHistoryUncheckedCreateWithoutGuildInput>
      | PlayHistoryCreateWithoutGuildInput[]
      | PlayHistoryUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: PlayHistoryCreateOrConnectWithoutGuildInput | PlayHistoryCreateOrConnectWithoutGuildInput[];
    upsert?: PlayHistoryUpsertWithWhereUniqueWithoutGuildInput | PlayHistoryUpsertWithWhereUniqueWithoutGuildInput[];
    createMany?: PlayHistoryCreateManyGuildInputEnvelope;
    set?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
    disconnect?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
    delete?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
    connect?: PlayHistoryWhereUniqueInput | PlayHistoryWhereUniqueInput[];
    update?: PlayHistoryUpdateWithWhereUniqueWithoutGuildInput | PlayHistoryUpdateWithWhereUniqueWithoutGuildInput[];
    updateMany?: PlayHistoryUpdateManyWithWhereWithoutGuildInput | PlayHistoryUpdateManyWithWhereWithoutGuildInput[];
    deleteMany?: PlayHistoryScalarWhereInput | PlayHistoryScalarWhereInput[];
  };

  export type QueueSnapshotUncheckedUpdateManyWithoutGuildNestedInput = {
    create?:
      | XOR<QueueSnapshotCreateWithoutGuildInput, QueueSnapshotUncheckedCreateWithoutGuildInput>
      | QueueSnapshotCreateWithoutGuildInput[]
      | QueueSnapshotUncheckedCreateWithoutGuildInput[];
    connectOrCreate?: QueueSnapshotCreateOrConnectWithoutGuildInput | QueueSnapshotCreateOrConnectWithoutGuildInput[];
    upsert?:
      | QueueSnapshotUpsertWithWhereUniqueWithoutGuildInput
      | QueueSnapshotUpsertWithWhereUniqueWithoutGuildInput[];
    createMany?: QueueSnapshotCreateManyGuildInputEnvelope;
    set?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
    disconnect?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
    delete?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
    connect?: QueueSnapshotWhereUniqueInput | QueueSnapshotWhereUniqueInput[];
    update?:
      | QueueSnapshotUpdateWithWhereUniqueWithoutGuildInput
      | QueueSnapshotUpdateWithWhereUniqueWithoutGuildInput[];
    updateMany?:
      | QueueSnapshotUpdateManyWithWhereWithoutGuildInput
      | QueueSnapshotUpdateManyWithWhereWithoutGuildInput[];
    deleteMany?: QueueSnapshotScalarWhereInput | QueueSnapshotScalarWhereInput[];
  };

  export type UserPreferencesUncheckedUpdateManyWithoutGuildNestedInput = {
    create?:
      | XOR<UserPreferencesCreateWithoutGuildInput, UserPreferencesUncheckedCreateWithoutGuildInput>
      | UserPreferencesCreateWithoutGuildInput[]
      | UserPreferencesUncheckedCreateWithoutGuildInput[];
    connectOrCreate?:
      | UserPreferencesCreateOrConnectWithoutGuildInput
      | UserPreferencesCreateOrConnectWithoutGuildInput[];
    upsert?:
      | UserPreferencesUpsertWithWhereUniqueWithoutGuildInput
      | UserPreferencesUpsertWithWhereUniqueWithoutGuildInput[];
    createMany?: UserPreferencesCreateManyGuildInputEnvelope;
    set?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
    disconnect?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
    delete?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
    connect?: UserPreferencesWhereUniqueInput | UserPreferencesWhereUniqueInput[];
    update?:
      | UserPreferencesUpdateWithWhereUniqueWithoutGuildInput
      | UserPreferencesUpdateWithWhereUniqueWithoutGuildInput[];
    updateMany?:
      | UserPreferencesUpdateManyWithWhereWithoutGuildInput
      | UserPreferencesUpdateManyWithWhereWithoutGuildInput[];
    deleteMany?: UserPreferencesScalarWhereInput | UserPreferencesScalarWhereInput[];
  };

  export type GuildCreateNestedOneWithoutPlaylistsInput = {
    create?: XOR<GuildCreateWithoutPlaylistsInput, GuildUncheckedCreateWithoutPlaylistsInput>;
    connectOrCreate?: GuildCreateOrConnectWithoutPlaylistsInput;
    connect?: GuildWhereUniqueInput;
  };

  export type PlaylistTrackCreateNestedManyWithoutPlaylistInput = {
    create?:
      | XOR<PlaylistTrackCreateWithoutPlaylistInput, PlaylistTrackUncheckedCreateWithoutPlaylistInput>
      | PlaylistTrackCreateWithoutPlaylistInput[]
      | PlaylistTrackUncheckedCreateWithoutPlaylistInput[];
    connectOrCreate?:
      | PlaylistTrackCreateOrConnectWithoutPlaylistInput
      | PlaylistTrackCreateOrConnectWithoutPlaylistInput[];
    createMany?: PlaylistTrackCreateManyPlaylistInputEnvelope;
    connect?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
  };

  export type PlaylistTrackUncheckedCreateNestedManyWithoutPlaylistInput = {
    create?:
      | XOR<PlaylistTrackCreateWithoutPlaylistInput, PlaylistTrackUncheckedCreateWithoutPlaylistInput>
      | PlaylistTrackCreateWithoutPlaylistInput[]
      | PlaylistTrackUncheckedCreateWithoutPlaylistInput[];
    connectOrCreate?:
      | PlaylistTrackCreateOrConnectWithoutPlaylistInput
      | PlaylistTrackCreateOrConnectWithoutPlaylistInput[];
    createMany?: PlaylistTrackCreateManyPlaylistInputEnvelope;
    connect?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
  };

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
  };

  export type GuildUpdateOneWithoutPlaylistsNestedInput = {
    create?: XOR<GuildCreateWithoutPlaylistsInput, GuildUncheckedCreateWithoutPlaylistsInput>;
    connectOrCreate?: GuildCreateOrConnectWithoutPlaylistsInput;
    upsert?: GuildUpsertWithoutPlaylistsInput;
    disconnect?: GuildWhereInput | boolean;
    delete?: GuildWhereInput | boolean;
    connect?: GuildWhereUniqueInput;
    update?: XOR<
      XOR<GuildUpdateToOneWithWhereWithoutPlaylistsInput, GuildUpdateWithoutPlaylistsInput>,
      GuildUncheckedUpdateWithoutPlaylistsInput
    >;
  };

  export type PlaylistTrackUpdateManyWithoutPlaylistNestedInput = {
    create?:
      | XOR<PlaylistTrackCreateWithoutPlaylistInput, PlaylistTrackUncheckedCreateWithoutPlaylistInput>
      | PlaylistTrackCreateWithoutPlaylistInput[]
      | PlaylistTrackUncheckedCreateWithoutPlaylistInput[];
    connectOrCreate?:
      | PlaylistTrackCreateOrConnectWithoutPlaylistInput
      | PlaylistTrackCreateOrConnectWithoutPlaylistInput[];
    upsert?:
      | PlaylistTrackUpsertWithWhereUniqueWithoutPlaylistInput
      | PlaylistTrackUpsertWithWhereUniqueWithoutPlaylistInput[];
    createMany?: PlaylistTrackCreateManyPlaylistInputEnvelope;
    set?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
    disconnect?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
    delete?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
    connect?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
    update?:
      | PlaylistTrackUpdateWithWhereUniqueWithoutPlaylistInput
      | PlaylistTrackUpdateWithWhereUniqueWithoutPlaylistInput[];
    updateMany?:
      | PlaylistTrackUpdateManyWithWhereWithoutPlaylistInput
      | PlaylistTrackUpdateManyWithWhereWithoutPlaylistInput[];
    deleteMany?: PlaylistTrackScalarWhereInput | PlaylistTrackScalarWhereInput[];
  };

  export type PlaylistTrackUncheckedUpdateManyWithoutPlaylistNestedInput = {
    create?:
      | XOR<PlaylistTrackCreateWithoutPlaylistInput, PlaylistTrackUncheckedCreateWithoutPlaylistInput>
      | PlaylistTrackCreateWithoutPlaylistInput[]
      | PlaylistTrackUncheckedCreateWithoutPlaylistInput[];
    connectOrCreate?:
      | PlaylistTrackCreateOrConnectWithoutPlaylistInput
      | PlaylistTrackCreateOrConnectWithoutPlaylistInput[];
    upsert?:
      | PlaylistTrackUpsertWithWhereUniqueWithoutPlaylistInput
      | PlaylistTrackUpsertWithWhereUniqueWithoutPlaylistInput[];
    createMany?: PlaylistTrackCreateManyPlaylistInputEnvelope;
    set?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
    disconnect?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
    delete?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
    connect?: PlaylistTrackWhereUniqueInput | PlaylistTrackWhereUniqueInput[];
    update?:
      | PlaylistTrackUpdateWithWhereUniqueWithoutPlaylistInput
      | PlaylistTrackUpdateWithWhereUniqueWithoutPlaylistInput[];
    updateMany?:
      | PlaylistTrackUpdateManyWithWhereWithoutPlaylistInput
      | PlaylistTrackUpdateManyWithWhereWithoutPlaylistInput[];
    deleteMany?: PlaylistTrackScalarWhereInput | PlaylistTrackScalarWhereInput[];
  };

  export type PlaylistCreateNestedOneWithoutTracksInput = {
    create?: XOR<PlaylistCreateWithoutTracksInput, PlaylistUncheckedCreateWithoutTracksInput>;
    connectOrCreate?: PlaylistCreateOrConnectWithoutTracksInput;
    connect?: PlaylistWhereUniqueInput;
  };

  export type PlaylistUpdateOneRequiredWithoutTracksNestedInput = {
    create?: XOR<PlaylistCreateWithoutTracksInput, PlaylistUncheckedCreateWithoutTracksInput>;
    connectOrCreate?: PlaylistCreateOrConnectWithoutTracksInput;
    upsert?: PlaylistUpsertWithoutTracksInput;
    connect?: PlaylistWhereUniqueInput;
    update?: XOR<
      XOR<PlaylistUpdateToOneWithWhereWithoutTracksInput, PlaylistUpdateWithoutTracksInput>,
      PlaylistUncheckedUpdateWithoutTracksInput
    >;
  };

  export type GuildCreateNestedOneWithoutPlayHistoryInput = {
    create?: XOR<GuildCreateWithoutPlayHistoryInput, GuildUncheckedCreateWithoutPlayHistoryInput>;
    connectOrCreate?: GuildCreateOrConnectWithoutPlayHistoryInput;
    connect?: GuildWhereUniqueInput;
  };

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
  };

  export type GuildUpdateOneRequiredWithoutPlayHistoryNestedInput = {
    create?: XOR<GuildCreateWithoutPlayHistoryInput, GuildUncheckedCreateWithoutPlayHistoryInput>;
    connectOrCreate?: GuildCreateOrConnectWithoutPlayHistoryInput;
    upsert?: GuildUpsertWithoutPlayHistoryInput;
    connect?: GuildWhereUniqueInput;
    update?: XOR<
      XOR<GuildUpdateToOneWithWhereWithoutPlayHistoryInput, GuildUpdateWithoutPlayHistoryInput>,
      GuildUncheckedUpdateWithoutPlayHistoryInput
    >;
  };

  export type GuildCreateNestedOneWithoutQueueSnapshotsInput = {
    create?: XOR<GuildCreateWithoutQueueSnapshotsInput, GuildUncheckedCreateWithoutQueueSnapshotsInput>;
    connectOrCreate?: GuildCreateOrConnectWithoutQueueSnapshotsInput;
    connect?: GuildWhereUniqueInput;
  };

  export type GuildUpdateOneRequiredWithoutQueueSnapshotsNestedInput = {
    create?: XOR<GuildCreateWithoutQueueSnapshotsInput, GuildUncheckedCreateWithoutQueueSnapshotsInput>;
    connectOrCreate?: GuildCreateOrConnectWithoutQueueSnapshotsInput;
    upsert?: GuildUpsertWithoutQueueSnapshotsInput;
    connect?: GuildWhereUniqueInput;
    update?: XOR<
      XOR<GuildUpdateToOneWithWhereWithoutQueueSnapshotsInput, GuildUpdateWithoutQueueSnapshotsInput>,
      GuildUncheckedUpdateWithoutQueueSnapshotsInput
    >;
  };

  export type GuildCreateNestedOneWithoutUserPreferencesInput = {
    create?: XOR<GuildCreateWithoutUserPreferencesInput, GuildUncheckedCreateWithoutUserPreferencesInput>;
    connectOrCreate?: GuildCreateOrConnectWithoutUserPreferencesInput;
    connect?: GuildWhereUniqueInput;
  };

  export type GuildUpdateOneRequiredWithoutUserPreferencesNestedInput = {
    create?: XOR<GuildCreateWithoutUserPreferencesInput, GuildUncheckedCreateWithoutUserPreferencesInput>;
    connectOrCreate?: GuildCreateOrConnectWithoutUserPreferencesInput;
    upsert?: GuildUpsertWithoutUserPreferencesInput;
    connect?: GuildWhereUniqueInput;
    update?: XOR<
      XOR<GuildUpdateToOneWithWhereWithoutUserPreferencesInput, GuildUpdateWithoutUserPreferencesInput>,
      GuildUncheckedUpdateWithoutUserPreferencesInput
    >;
  };

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolFilter<$PrismaModel> | boolean;
  };

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string;
  };

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedFloatFilter<$PrismaModel>;
    _sum?: NestedIntFilter<$PrismaModel>;
    _min?: NestedIntFilter<$PrismaModel>;
    _max?: NestedIntFilter<$PrismaModel>;
  };

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | FloatFieldRefInput<$PrismaModel>;
    lte?: number | FloatFieldRefInput<$PrismaModel>;
    gt?: number | FloatFieldRefInput<$PrismaModel>;
    gte?: number | FloatFieldRefInput<$PrismaModel>;
    not?: NestedFloatFilter<$PrismaModel> | number;
  };

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedBoolFilter<$PrismaModel>;
    _max?: NestedBoolFilter<$PrismaModel>;
  };

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedDateTimeFilter<$PrismaModel>;
    _max?: NestedDateTimeFilter<$PrismaModel>;
  };

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | null;
    notIn?: number[] | null;
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntNullableFilter<$PrismaModel> | number | null;
  };

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
  };

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: NestedDateTimeNullableFilter<$PrismaModel>;
  };

  export type PlaylistCreateWithoutGuildInput = {
    id?: string;
    userId: string;
    name: string;
    description?: string | null;
    isPublic?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tracks?: PlaylistTrackCreateNestedManyWithoutPlaylistInput;
  };

  export type PlaylistUncheckedCreateWithoutGuildInput = {
    id?: string;
    userId: string;
    name: string;
    description?: string | null;
    isPublic?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    tracks?: PlaylistTrackUncheckedCreateNestedManyWithoutPlaylistInput;
  };

  export type PlaylistCreateOrConnectWithoutGuildInput = {
    where: PlaylistWhereUniqueInput;
    create: XOR<PlaylistCreateWithoutGuildInput, PlaylistUncheckedCreateWithoutGuildInput>;
  };

  export type PlaylistCreateManyGuildInputEnvelope = {
    data: PlaylistCreateManyGuildInput | PlaylistCreateManyGuildInput[];
  };

  export type PlayHistoryCreateWithoutGuildInput = {
    id?: string;
    userId: string;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    platform: string;
    platformId?: string | null;
    playedAt?: Date | string;
    completedAt?: Date | string | null;
  };

  export type PlayHistoryUncheckedCreateWithoutGuildInput = {
    id?: string;
    userId: string;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    platform: string;
    platformId?: string | null;
    playedAt?: Date | string;
    completedAt?: Date | string | null;
  };

  export type PlayHistoryCreateOrConnectWithoutGuildInput = {
    where: PlayHistoryWhereUniqueInput;
    create: XOR<PlayHistoryCreateWithoutGuildInput, PlayHistoryUncheckedCreateWithoutGuildInput>;
  };

  export type PlayHistoryCreateManyGuildInputEnvelope = {
    data: PlayHistoryCreateManyGuildInput | PlayHistoryCreateManyGuildInput[];
  };

  export type QueueSnapshotCreateWithoutGuildInput = {
    id?: string;
    currentTrackUrl?: string | null;
    currentPosition?: number;
    volume?: number;
    loopMode?: string;
    tracks: string;
    createdAt?: Date | string;
  };

  export type QueueSnapshotUncheckedCreateWithoutGuildInput = {
    id?: string;
    currentTrackUrl?: string | null;
    currentPosition?: number;
    volume?: number;
    loopMode?: string;
    tracks: string;
    createdAt?: Date | string;
  };

  export type QueueSnapshotCreateOrConnectWithoutGuildInput = {
    where: QueueSnapshotWhereUniqueInput;
    create: XOR<QueueSnapshotCreateWithoutGuildInput, QueueSnapshotUncheckedCreateWithoutGuildInput>;
  };

  export type QueueSnapshotCreateManyGuildInputEnvelope = {
    data: QueueSnapshotCreateManyGuildInput | QueueSnapshotCreateManyGuildInput[];
  };

  export type UserPreferencesCreateWithoutGuildInput = {
    id?: string;
    userId: string;
    language?: string;
    volume?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserPreferencesUncheckedCreateWithoutGuildInput = {
    id?: string;
    userId: string;
    language?: string;
    volume?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type UserPreferencesCreateOrConnectWithoutGuildInput = {
    where: UserPreferencesWhereUniqueInput;
    create: XOR<UserPreferencesCreateWithoutGuildInput, UserPreferencesUncheckedCreateWithoutGuildInput>;
  };

  export type UserPreferencesCreateManyGuildInputEnvelope = {
    data: UserPreferencesCreateManyGuildInput | UserPreferencesCreateManyGuildInput[];
  };

  export type PlaylistUpsertWithWhereUniqueWithoutGuildInput = {
    where: PlaylistWhereUniqueInput;
    update: XOR<PlaylistUpdateWithoutGuildInput, PlaylistUncheckedUpdateWithoutGuildInput>;
    create: XOR<PlaylistCreateWithoutGuildInput, PlaylistUncheckedCreateWithoutGuildInput>;
  };

  export type PlaylistUpdateWithWhereUniqueWithoutGuildInput = {
    where: PlaylistWhereUniqueInput;
    data: XOR<PlaylistUpdateWithoutGuildInput, PlaylistUncheckedUpdateWithoutGuildInput>;
  };

  export type PlaylistUpdateManyWithWhereWithoutGuildInput = {
    where: PlaylistScalarWhereInput;
    data: XOR<PlaylistUpdateManyMutationInput, PlaylistUncheckedUpdateManyWithoutGuildInput>;
  };

  export type PlaylistScalarWhereInput = {
    AND?: PlaylistScalarWhereInput | PlaylistScalarWhereInput[];
    OR?: PlaylistScalarWhereInput[];
    NOT?: PlaylistScalarWhereInput | PlaylistScalarWhereInput[];
    id?: StringFilter<'Playlist'> | string;
    guildId?: StringNullableFilter<'Playlist'> | string | null;
    userId?: StringFilter<'Playlist'> | string;
    name?: StringFilter<'Playlist'> | string;
    description?: StringNullableFilter<'Playlist'> | string | null;
    isPublic?: BoolFilter<'Playlist'> | boolean;
    createdAt?: DateTimeFilter<'Playlist'> | Date | string;
    updatedAt?: DateTimeFilter<'Playlist'> | Date | string;
  };

  export type PlayHistoryUpsertWithWhereUniqueWithoutGuildInput = {
    where: PlayHistoryWhereUniqueInput;
    update: XOR<PlayHistoryUpdateWithoutGuildInput, PlayHistoryUncheckedUpdateWithoutGuildInput>;
    create: XOR<PlayHistoryCreateWithoutGuildInput, PlayHistoryUncheckedCreateWithoutGuildInput>;
  };

  export type PlayHistoryUpdateWithWhereUniqueWithoutGuildInput = {
    where: PlayHistoryWhereUniqueInput;
    data: XOR<PlayHistoryUpdateWithoutGuildInput, PlayHistoryUncheckedUpdateWithoutGuildInput>;
  };

  export type PlayHistoryUpdateManyWithWhereWithoutGuildInput = {
    where: PlayHistoryScalarWhereInput;
    data: XOR<PlayHistoryUpdateManyMutationInput, PlayHistoryUncheckedUpdateManyWithoutGuildInput>;
  };

  export type PlayHistoryScalarWhereInput = {
    AND?: PlayHistoryScalarWhereInput | PlayHistoryScalarWhereInput[];
    OR?: PlayHistoryScalarWhereInput[];
    NOT?: PlayHistoryScalarWhereInput | PlayHistoryScalarWhereInput[];
    id?: StringFilter<'PlayHistory'> | string;
    guildId?: StringFilter<'PlayHistory'> | string;
    userId?: StringFilter<'PlayHistory'> | string;
    title?: StringFilter<'PlayHistory'> | string;
    artist?: StringNullableFilter<'PlayHistory'> | string | null;
    duration?: IntFilter<'PlayHistory'> | number;
    url?: StringFilter<'PlayHistory'> | string;
    platform?: StringFilter<'PlayHistory'> | string;
    platformId?: StringNullableFilter<'PlayHistory'> | string | null;
    playedAt?: DateTimeFilter<'PlayHistory'> | Date | string;
    completedAt?: DateTimeNullableFilter<'PlayHistory'> | Date | string | null;
  };

  export type QueueSnapshotUpsertWithWhereUniqueWithoutGuildInput = {
    where: QueueSnapshotWhereUniqueInput;
    update: XOR<QueueSnapshotUpdateWithoutGuildInput, QueueSnapshotUncheckedUpdateWithoutGuildInput>;
    create: XOR<QueueSnapshotCreateWithoutGuildInput, QueueSnapshotUncheckedCreateWithoutGuildInput>;
  };

  export type QueueSnapshotUpdateWithWhereUniqueWithoutGuildInput = {
    where: QueueSnapshotWhereUniqueInput;
    data: XOR<QueueSnapshotUpdateWithoutGuildInput, QueueSnapshotUncheckedUpdateWithoutGuildInput>;
  };

  export type QueueSnapshotUpdateManyWithWhereWithoutGuildInput = {
    where: QueueSnapshotScalarWhereInput;
    data: XOR<QueueSnapshotUpdateManyMutationInput, QueueSnapshotUncheckedUpdateManyWithoutGuildInput>;
  };

  export type QueueSnapshotScalarWhereInput = {
    AND?: QueueSnapshotScalarWhereInput | QueueSnapshotScalarWhereInput[];
    OR?: QueueSnapshotScalarWhereInput[];
    NOT?: QueueSnapshotScalarWhereInput | QueueSnapshotScalarWhereInput[];
    id?: StringFilter<'QueueSnapshot'> | string;
    guildId?: StringFilter<'QueueSnapshot'> | string;
    currentTrackUrl?: StringNullableFilter<'QueueSnapshot'> | string | null;
    currentPosition?: IntFilter<'QueueSnapshot'> | number;
    volume?: IntFilter<'QueueSnapshot'> | number;
    loopMode?: StringFilter<'QueueSnapshot'> | string;
    tracks?: StringFilter<'QueueSnapshot'> | string;
    createdAt?: DateTimeFilter<'QueueSnapshot'> | Date | string;
  };

  export type UserPreferencesUpsertWithWhereUniqueWithoutGuildInput = {
    where: UserPreferencesWhereUniqueInput;
    update: XOR<UserPreferencesUpdateWithoutGuildInput, UserPreferencesUncheckedUpdateWithoutGuildInput>;
    create: XOR<UserPreferencesCreateWithoutGuildInput, UserPreferencesUncheckedCreateWithoutGuildInput>;
  };

  export type UserPreferencesUpdateWithWhereUniqueWithoutGuildInput = {
    where: UserPreferencesWhereUniqueInput;
    data: XOR<UserPreferencesUpdateWithoutGuildInput, UserPreferencesUncheckedUpdateWithoutGuildInput>;
  };

  export type UserPreferencesUpdateManyWithWhereWithoutGuildInput = {
    where: UserPreferencesScalarWhereInput;
    data: XOR<UserPreferencesUpdateManyMutationInput, UserPreferencesUncheckedUpdateManyWithoutGuildInput>;
  };

  export type UserPreferencesScalarWhereInput = {
    AND?: UserPreferencesScalarWhereInput | UserPreferencesScalarWhereInput[];
    OR?: UserPreferencesScalarWhereInput[];
    NOT?: UserPreferencesScalarWhereInput | UserPreferencesScalarWhereInput[];
    id?: StringFilter<'UserPreferences'> | string;
    guildId?: StringFilter<'UserPreferences'> | string;
    userId?: StringFilter<'UserPreferences'> | string;
    language?: StringFilter<'UserPreferences'> | string;
    volume?: IntFilter<'UserPreferences'> | number;
    createdAt?: DateTimeFilter<'UserPreferences'> | Date | string;
    updatedAt?: DateTimeFilter<'UserPreferences'> | Date | string;
  };

  export type GuildCreateWithoutPlaylistsInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playHistory?: PlayHistoryCreateNestedManyWithoutGuildInput;
    queueSnapshots?: QueueSnapshotCreateNestedManyWithoutGuildInput;
    userPreferences?: UserPreferencesCreateNestedManyWithoutGuildInput;
  };

  export type GuildUncheckedCreateWithoutPlaylistsInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playHistory?: PlayHistoryUncheckedCreateNestedManyWithoutGuildInput;
    queueSnapshots?: QueueSnapshotUncheckedCreateNestedManyWithoutGuildInput;
    userPreferences?: UserPreferencesUncheckedCreateNestedManyWithoutGuildInput;
  };

  export type GuildCreateOrConnectWithoutPlaylistsInput = {
    where: GuildWhereUniqueInput;
    create: XOR<GuildCreateWithoutPlaylistsInput, GuildUncheckedCreateWithoutPlaylistsInput>;
  };

  export type PlaylistTrackCreateWithoutPlaylistInput = {
    id?: string;
    position: number;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    thumbnail?: string | null;
    platform: string;
    platformId?: string | null;
    filePath?: string | null;
    addedAt?: Date | string;
  };

  export type PlaylistTrackUncheckedCreateWithoutPlaylistInput = {
    id?: string;
    position: number;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    thumbnail?: string | null;
    platform: string;
    platformId?: string | null;
    filePath?: string | null;
    addedAt?: Date | string;
  };

  export type PlaylistTrackCreateOrConnectWithoutPlaylistInput = {
    where: PlaylistTrackWhereUniqueInput;
    create: XOR<PlaylistTrackCreateWithoutPlaylistInput, PlaylistTrackUncheckedCreateWithoutPlaylistInput>;
  };

  export type PlaylistTrackCreateManyPlaylistInputEnvelope = {
    data: PlaylistTrackCreateManyPlaylistInput | PlaylistTrackCreateManyPlaylistInput[];
  };

  export type GuildUpsertWithoutPlaylistsInput = {
    update: XOR<GuildUpdateWithoutPlaylistsInput, GuildUncheckedUpdateWithoutPlaylistsInput>;
    create: XOR<GuildCreateWithoutPlaylistsInput, GuildUncheckedCreateWithoutPlaylistsInput>;
    where?: GuildWhereInput;
  };

  export type GuildUpdateToOneWithWhereWithoutPlaylistsInput = {
    where?: GuildWhereInput;
    data: XOR<GuildUpdateWithoutPlaylistsInput, GuildUncheckedUpdateWithoutPlaylistsInput>;
  };

  export type GuildUpdateWithoutPlaylistsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playHistory?: PlayHistoryUpdateManyWithoutGuildNestedInput;
    queueSnapshots?: QueueSnapshotUpdateManyWithoutGuildNestedInput;
    userPreferences?: UserPreferencesUpdateManyWithoutGuildNestedInput;
  };

  export type GuildUncheckedUpdateWithoutPlaylistsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playHistory?: PlayHistoryUncheckedUpdateManyWithoutGuildNestedInput;
    queueSnapshots?: QueueSnapshotUncheckedUpdateManyWithoutGuildNestedInput;
    userPreferences?: UserPreferencesUncheckedUpdateManyWithoutGuildNestedInput;
  };

  export type PlaylistTrackUpsertWithWhereUniqueWithoutPlaylistInput = {
    where: PlaylistTrackWhereUniqueInput;
    update: XOR<PlaylistTrackUpdateWithoutPlaylistInput, PlaylistTrackUncheckedUpdateWithoutPlaylistInput>;
    create: XOR<PlaylistTrackCreateWithoutPlaylistInput, PlaylistTrackUncheckedCreateWithoutPlaylistInput>;
  };

  export type PlaylistTrackUpdateWithWhereUniqueWithoutPlaylistInput = {
    where: PlaylistTrackWhereUniqueInput;
    data: XOR<PlaylistTrackUpdateWithoutPlaylistInput, PlaylistTrackUncheckedUpdateWithoutPlaylistInput>;
  };

  export type PlaylistTrackUpdateManyWithWhereWithoutPlaylistInput = {
    where: PlaylistTrackScalarWhereInput;
    data: XOR<PlaylistTrackUpdateManyMutationInput, PlaylistTrackUncheckedUpdateManyWithoutPlaylistInput>;
  };

  export type PlaylistTrackScalarWhereInput = {
    AND?: PlaylistTrackScalarWhereInput | PlaylistTrackScalarWhereInput[];
    OR?: PlaylistTrackScalarWhereInput[];
    NOT?: PlaylistTrackScalarWhereInput | PlaylistTrackScalarWhereInput[];
    id?: StringFilter<'PlaylistTrack'> | string;
    playlistId?: StringFilter<'PlaylistTrack'> | string;
    position?: IntFilter<'PlaylistTrack'> | number;
    title?: StringFilter<'PlaylistTrack'> | string;
    artist?: StringNullableFilter<'PlaylistTrack'> | string | null;
    duration?: IntFilter<'PlaylistTrack'> | number;
    url?: StringFilter<'PlaylistTrack'> | string;
    thumbnail?: StringNullableFilter<'PlaylistTrack'> | string | null;
    platform?: StringFilter<'PlaylistTrack'> | string;
    platformId?: StringNullableFilter<'PlaylistTrack'> | string | null;
    filePath?: StringNullableFilter<'PlaylistTrack'> | string | null;
    addedAt?: DateTimeFilter<'PlaylistTrack'> | Date | string;
  };

  export type PlaylistCreateWithoutTracksInput = {
    id?: string;
    userId: string;
    name: string;
    description?: string | null;
    isPublic?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    guild?: GuildCreateNestedOneWithoutPlaylistsInput;
  };

  export type PlaylistUncheckedCreateWithoutTracksInput = {
    id?: string;
    guildId?: string | null;
    userId: string;
    name: string;
    description?: string | null;
    isPublic?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type PlaylistCreateOrConnectWithoutTracksInput = {
    where: PlaylistWhereUniqueInput;
    create: XOR<PlaylistCreateWithoutTracksInput, PlaylistUncheckedCreateWithoutTracksInput>;
  };

  export type PlaylistUpsertWithoutTracksInput = {
    update: XOR<PlaylistUpdateWithoutTracksInput, PlaylistUncheckedUpdateWithoutTracksInput>;
    create: XOR<PlaylistCreateWithoutTracksInput, PlaylistUncheckedCreateWithoutTracksInput>;
    where?: PlaylistWhereInput;
  };

  export type PlaylistUpdateToOneWithWhereWithoutTracksInput = {
    where?: PlaylistWhereInput;
    data: XOR<PlaylistUpdateWithoutTracksInput, PlaylistUncheckedUpdateWithoutTracksInput>;
  };

  export type PlaylistUpdateWithoutTracksInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    guild?: GuildUpdateOneWithoutPlaylistsNestedInput;
  };

  export type PlaylistUncheckedUpdateWithoutTracksInput = {
    id?: StringFieldUpdateOperationsInput | string;
    guildId?: NullableStringFieldUpdateOperationsInput | string | null;
    userId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type GuildCreateWithoutPlayHistoryInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playlists?: PlaylistCreateNestedManyWithoutGuildInput;
    queueSnapshots?: QueueSnapshotCreateNestedManyWithoutGuildInput;
    userPreferences?: UserPreferencesCreateNestedManyWithoutGuildInput;
  };

  export type GuildUncheckedCreateWithoutPlayHistoryInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playlists?: PlaylistUncheckedCreateNestedManyWithoutGuildInput;
    queueSnapshots?: QueueSnapshotUncheckedCreateNestedManyWithoutGuildInput;
    userPreferences?: UserPreferencesUncheckedCreateNestedManyWithoutGuildInput;
  };

  export type GuildCreateOrConnectWithoutPlayHistoryInput = {
    where: GuildWhereUniqueInput;
    create: XOR<GuildCreateWithoutPlayHistoryInput, GuildUncheckedCreateWithoutPlayHistoryInput>;
  };

  export type GuildUpsertWithoutPlayHistoryInput = {
    update: XOR<GuildUpdateWithoutPlayHistoryInput, GuildUncheckedUpdateWithoutPlayHistoryInput>;
    create: XOR<GuildCreateWithoutPlayHistoryInput, GuildUncheckedCreateWithoutPlayHistoryInput>;
    where?: GuildWhereInput;
  };

  export type GuildUpdateToOneWithWhereWithoutPlayHistoryInput = {
    where?: GuildWhereInput;
    data: XOR<GuildUpdateWithoutPlayHistoryInput, GuildUncheckedUpdateWithoutPlayHistoryInput>;
  };

  export type GuildUpdateWithoutPlayHistoryInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playlists?: PlaylistUpdateManyWithoutGuildNestedInput;
    queueSnapshots?: QueueSnapshotUpdateManyWithoutGuildNestedInput;
    userPreferences?: UserPreferencesUpdateManyWithoutGuildNestedInput;
  };

  export type GuildUncheckedUpdateWithoutPlayHistoryInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playlists?: PlaylistUncheckedUpdateManyWithoutGuildNestedInput;
    queueSnapshots?: QueueSnapshotUncheckedUpdateManyWithoutGuildNestedInput;
    userPreferences?: UserPreferencesUncheckedUpdateManyWithoutGuildNestedInput;
  };

  export type GuildCreateWithoutQueueSnapshotsInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playlists?: PlaylistCreateNestedManyWithoutGuildInput;
    playHistory?: PlayHistoryCreateNestedManyWithoutGuildInput;
    userPreferences?: UserPreferencesCreateNestedManyWithoutGuildInput;
  };

  export type GuildUncheckedCreateWithoutQueueSnapshotsInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playlists?: PlaylistUncheckedCreateNestedManyWithoutGuildInput;
    playHistory?: PlayHistoryUncheckedCreateNestedManyWithoutGuildInput;
    userPreferences?: UserPreferencesUncheckedCreateNestedManyWithoutGuildInput;
  };

  export type GuildCreateOrConnectWithoutQueueSnapshotsInput = {
    where: GuildWhereUniqueInput;
    create: XOR<GuildCreateWithoutQueueSnapshotsInput, GuildUncheckedCreateWithoutQueueSnapshotsInput>;
  };

  export type GuildUpsertWithoutQueueSnapshotsInput = {
    update: XOR<GuildUpdateWithoutQueueSnapshotsInput, GuildUncheckedUpdateWithoutQueueSnapshotsInput>;
    create: XOR<GuildCreateWithoutQueueSnapshotsInput, GuildUncheckedCreateWithoutQueueSnapshotsInput>;
    where?: GuildWhereInput;
  };

  export type GuildUpdateToOneWithWhereWithoutQueueSnapshotsInput = {
    where?: GuildWhereInput;
    data: XOR<GuildUpdateWithoutQueueSnapshotsInput, GuildUncheckedUpdateWithoutQueueSnapshotsInput>;
  };

  export type GuildUpdateWithoutQueueSnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playlists?: PlaylistUpdateManyWithoutGuildNestedInput;
    playHistory?: PlayHistoryUpdateManyWithoutGuildNestedInput;
    userPreferences?: UserPreferencesUpdateManyWithoutGuildNestedInput;
  };

  export type GuildUncheckedUpdateWithoutQueueSnapshotsInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playlists?: PlaylistUncheckedUpdateManyWithoutGuildNestedInput;
    playHistory?: PlayHistoryUncheckedUpdateManyWithoutGuildNestedInput;
    userPreferences?: UserPreferencesUncheckedUpdateManyWithoutGuildNestedInput;
  };

  export type GuildCreateWithoutUserPreferencesInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playlists?: PlaylistCreateNestedManyWithoutGuildInput;
    playHistory?: PlayHistoryCreateNestedManyWithoutGuildInput;
    queueSnapshots?: QueueSnapshotCreateNestedManyWithoutGuildInput;
  };

  export type GuildUncheckedCreateWithoutUserPreferencesInput = {
    id: string;
    name: string;
    preferredLanguage?: string;
    defaultVolume?: number;
    leaveOnEmpty?: boolean;
    leaveOnEmptyCooldown?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    playlists?: PlaylistUncheckedCreateNestedManyWithoutGuildInput;
    playHistory?: PlayHistoryUncheckedCreateNestedManyWithoutGuildInput;
    queueSnapshots?: QueueSnapshotUncheckedCreateNestedManyWithoutGuildInput;
  };

  export type GuildCreateOrConnectWithoutUserPreferencesInput = {
    where: GuildWhereUniqueInput;
    create: XOR<GuildCreateWithoutUserPreferencesInput, GuildUncheckedCreateWithoutUserPreferencesInput>;
  };

  export type GuildUpsertWithoutUserPreferencesInput = {
    update: XOR<GuildUpdateWithoutUserPreferencesInput, GuildUncheckedUpdateWithoutUserPreferencesInput>;
    create: XOR<GuildCreateWithoutUserPreferencesInput, GuildUncheckedCreateWithoutUserPreferencesInput>;
    where?: GuildWhereInput;
  };

  export type GuildUpdateToOneWithWhereWithoutUserPreferencesInput = {
    where?: GuildWhereInput;
    data: XOR<GuildUpdateWithoutUserPreferencesInput, GuildUncheckedUpdateWithoutUserPreferencesInput>;
  };

  export type GuildUpdateWithoutUserPreferencesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playlists?: PlaylistUpdateManyWithoutGuildNestedInput;
    playHistory?: PlayHistoryUpdateManyWithoutGuildNestedInput;
    queueSnapshots?: QueueSnapshotUpdateManyWithoutGuildNestedInput;
  };

  export type GuildUncheckedUpdateWithoutUserPreferencesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    preferredLanguage?: StringFieldUpdateOperationsInput | string;
    defaultVolume?: IntFieldUpdateOperationsInput | number;
    leaveOnEmpty?: BoolFieldUpdateOperationsInput | boolean;
    leaveOnEmptyCooldown?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    playlists?: PlaylistUncheckedUpdateManyWithoutGuildNestedInput;
    playHistory?: PlayHistoryUncheckedUpdateManyWithoutGuildNestedInput;
    queueSnapshots?: QueueSnapshotUncheckedUpdateManyWithoutGuildNestedInput;
  };

  export type PlaylistCreateManyGuildInput = {
    id?: string;
    userId: string;
    name: string;
    description?: string | null;
    isPublic?: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type PlayHistoryCreateManyGuildInput = {
    id?: string;
    userId: string;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    platform: string;
    platformId?: string | null;
    playedAt?: Date | string;
    completedAt?: Date | string | null;
  };

  export type QueueSnapshotCreateManyGuildInput = {
    id?: string;
    currentTrackUrl?: string | null;
    currentPosition?: number;
    volume?: number;
    loopMode?: string;
    tracks: string;
    createdAt?: Date | string;
  };

  export type UserPreferencesCreateManyGuildInput = {
    id?: string;
    userId: string;
    language?: string;
    volume?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type PlaylistUpdateWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    tracks?: PlaylistTrackUpdateManyWithoutPlaylistNestedInput;
  };

  export type PlaylistUncheckedUpdateWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    tracks?: PlaylistTrackUncheckedUpdateManyWithoutPlaylistNestedInput;
  };

  export type PlaylistUncheckedUpdateManyWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    name?: StringFieldUpdateOperationsInput | string;
    description?: NullableStringFieldUpdateOperationsInput | string | null;
    isPublic?: BoolFieldUpdateOperationsInput | boolean;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlayHistoryUpdateWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type PlayHistoryUncheckedUpdateWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type PlayHistoryUncheckedUpdateManyWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    playedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    completedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null;
  };

  export type QueueSnapshotUpdateWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    currentTrackUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    currentPosition?: IntFieldUpdateOperationsInput | number;
    volume?: IntFieldUpdateOperationsInput | number;
    loopMode?: StringFieldUpdateOperationsInput | string;
    tracks?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type QueueSnapshotUncheckedUpdateWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    currentTrackUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    currentPosition?: IntFieldUpdateOperationsInput | number;
    volume?: IntFieldUpdateOperationsInput | number;
    loopMode?: StringFieldUpdateOperationsInput | string;
    tracks?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type QueueSnapshotUncheckedUpdateManyWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    currentTrackUrl?: NullableStringFieldUpdateOperationsInput | string | null;
    currentPosition?: IntFieldUpdateOperationsInput | number;
    volume?: IntFieldUpdateOperationsInput | number;
    loopMode?: StringFieldUpdateOperationsInput | string;
    tracks?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserPreferencesUpdateWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    language?: StringFieldUpdateOperationsInput | string;
    volume?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserPreferencesUncheckedUpdateWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    language?: StringFieldUpdateOperationsInput | string;
    volume?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type UserPreferencesUncheckedUpdateManyWithoutGuildInput = {
    id?: StringFieldUpdateOperationsInput | string;
    userId?: StringFieldUpdateOperationsInput | string;
    language?: StringFieldUpdateOperationsInput | string;
    volume?: IntFieldUpdateOperationsInput | number;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlaylistTrackCreateManyPlaylistInput = {
    id?: string;
    position: number;
    title: string;
    artist?: string | null;
    duration: number;
    url: string;
    thumbnail?: string | null;
    platform: string;
    platformId?: string | null;
    filePath?: string | null;
    addedAt?: Date | string;
  };

  export type PlaylistTrackUpdateWithoutPlaylistInput = {
    id?: StringFieldUpdateOperationsInput | string;
    position?: IntFieldUpdateOperationsInput | number;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    filePath?: NullableStringFieldUpdateOperationsInput | string | null;
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlaylistTrackUncheckedUpdateWithoutPlaylistInput = {
    id?: StringFieldUpdateOperationsInput | string;
    position?: IntFieldUpdateOperationsInput | number;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    filePath?: NullableStringFieldUpdateOperationsInput | string | null;
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type PlaylistTrackUncheckedUpdateManyWithoutPlaylistInput = {
    id?: StringFieldUpdateOperationsInput | string;
    position?: IntFieldUpdateOperationsInput | number;
    title?: StringFieldUpdateOperationsInput | string;
    artist?: NullableStringFieldUpdateOperationsInput | string | null;
    duration?: IntFieldUpdateOperationsInput | number;
    url?: StringFieldUpdateOperationsInput | string;
    thumbnail?: NullableStringFieldUpdateOperationsInput | string | null;
    platform?: StringFieldUpdateOperationsInput | string;
    platformId?: NullableStringFieldUpdateOperationsInput | string | null;
    filePath?: NullableStringFieldUpdateOperationsInput | string | null;
    addedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number;
  };

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF;
}
