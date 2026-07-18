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
import { writeFile } from 'fs/promises';
import path from 'path';
import { bundleBotSource, external, pkg, pkgRoot } from './lib/bundle-core.mjs';

const BIN_NAME = 'down-under-discord-bot';
const outDir = path.join(pkgRoot, 'publish');

async function main() {
  await bundleBotSource({ outDir });

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
      // not invoked automatically (see comment above `cp` of schema.prisma
      // in bundle-core.mjs).
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
