// Shared esbuild-bundle step used by both build-bundle.mjs (npm-publish
// artifact, external deps) and build-sidecar.mjs (Tauri sidecar artifact,
// deps installed for real alongside it). Produces the same bundled
// index.js/locales/prisma files either way; callers synthesize their own
// package.json since the two artifacts need different shapes.
import { build } from 'esbuild';
import { cp, mkdir, rm } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const pkgRoot = path.resolve(__dirname, '..', '..');
const require = createRequire(import.meta.url);
export const pkg = require(path.join(pkgRoot, 'package.json'));

// Internal helper package required at runtime by the generated Prisma client
// (src/database/generated/) - not one of our own declared dependencies, but
// a transitive dependency of @prisma/client resolvable in node_modules for
// consumers, same as @prisma/client itself.
export const external = [
  ...Object.keys(pkg.dependencies).filter((name) => name !== 'discord-dashboard-shared'),
  '@prisma/client-runtime-utils',
];

/**
 * Bundles src/index.ts into `${outDir}/index.js` plus locales/prisma/.env
 * alongside it. Does not touch package.json - callers write their own.
 */
export async function bundleBotSource({ outDir }) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await build({
    entryPoints: [path.join(pkgRoot, 'src', 'index.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    outfile: path.join(outDir, 'index.js'),
    external,
    // Two things the banner needs to do:
    //  1. Shebang, so the bin entry is directly executable.
    //  2. A real `require` in scope - esbuild's ESM output wraps every
    //     externalized CJS `require()` call (e.g. the generated Prisma
    //     client's eager `require("@prisma/client-runtime-utils")`) in a
    //     helper that uses `require` if present in scope and otherwise
    //     throws "Dynamic require ... is not supported". Native ESM has no
    //     ambient `require`, so this needs to be provided explicitly.
    banner: {
      js: "#!/usr/bin/env node\nimport { createRequire as __createRequire } from 'node:module';\nconst require = __createRequire(import.meta.url);",
    },
  });

  // Locale JSON files: resolveI18nLoadPath() (src/helpers/localesPath.ts)
  // looks for a `locales/` directory next to its own compiled location -
  // once bundled, that's this same outDir (see the comment on that function
  // for why the offset differs from the plain tsc build).
  const localesSrc = path.resolve(pkgRoot, '..', 'shared', 'src', 'localization', 'locales');
  await cp(localesSrc, path.join(outDir, 'locales'), { recursive: true });

  // Shipped for consumer convenience (`npx prisma db push` to set up their
  // own SQLite file on first run) - NOT regenerated on install. The bundle
  // already contains the fully generated Prisma client baked in at build
  // time; queries run through @prisma/adapter-better-sqlite3 + better-sqlite3
  // (both real external deps, rebuilt for the consumer's platform by their
  // own `npm install` same as any native addon), not a native Prisma query
  // engine binary, so there's nothing platform-specific left to regenerate.
  await cp(path.join(pkgRoot, 'prisma', 'schema.prisma'), path.join(outDir, 'prisma', 'schema.prisma'));
  await cp(path.join(pkgRoot, 'prisma.config.ts'), path.join(outDir, 'prisma.config.ts'));

  await cp(path.join(pkgRoot, '.env.example'), path.join(outDir, '.env.example')).catch(() => {});
}
