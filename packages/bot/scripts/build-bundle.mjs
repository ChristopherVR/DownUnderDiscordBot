#!/usr/bin/env node
// Bundles the bot into a single self-contained, publishable artifact under
// packages/bot/publish/, ready for `npm publish` (or `pnpm publish`) from
// that directory.
//
// discord-dashboard-shared is a private workspace package (not published to
// npm) with real runtime code (i18n init), so it's inlined into the bundle
// rather than left as an external dependency - everything else in
// package.json's "dependencies" stays external and gets installed normally
// by npm/pnpm for consumers.
import { build } from 'esbuild';
import { cp, mkdir, rm, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const outDir = path.join(pkgRoot, 'publish');
const require = createRequire(import.meta.url);
const pkg = require(path.join(pkgRoot, 'package.json'));

const BIN_NAME = 'down-under-discord-bot';
const external = [
  ...Object.keys(pkg.dependencies).filter((name) => name !== 'discord-dashboard-shared'),
  // Internal helper package required at runtime by the generated Prisma
  // client (src/database/generated/) - not one of our own declared
  // dependencies, but a transitive dependency of @prisma/client that's
  // resolvable in node_modules for consumers, same as @prisma/client itself.
  '@prisma/client-runtime-utils',
];

async function main() {
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
  // once bundled, that's this same `publish/` directory (see the comment on
  // that function for why the offset differs from the plain tsc build).
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

  const publishPkg = {
    // The workspace package is internally named "discord-bot" - the
    // published npm package uses the project's public name instead.
    name: 'down-under-discord-bot',
    version: pkg.version,
    description: pkg.description ?? 'Multi-platform Discord music bot with a REST + WebSocket API.',
    license: pkg.license ?? 'MIT',
    type: 'module',
    main: 'index.js',
    bin: { [BIN_NAME]: 'index.js' },
    files: ['index.js', 'locales', 'prisma', 'prisma.config.ts', '.env.example'],
    dependencies: {
      ...Object.fromEntries(external.map((name) => [name, pkg.dependencies[name]])),
      // Only needed as a CLI for the consumer's own `npx prisma db push` -
      // not invoked automatically (see comment above `cp` of schema.prisma).
      prisma: pkg.devDependencies.prisma,
    },
    engines: pkg.engines ?? { node: '>=22' },
  };
  await writeFile(path.join(outDir, 'package.json'), JSON.stringify(publishPkg, null, 2) + '\n');

  console.log(`Bundle written to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
