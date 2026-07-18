import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Resolve the i18next `loadPath` for server-side translations.
 *
 * `discord-dashboard-shared`'s own default heuristic locates its locale JSON
 * files relative to its own compiled module location - that only works when
 * shared's `dist/` sits next to its `src/` (true in the monorepo, false once
 * bundled: the published bot inlines shared's code into a single file via
 * esbuild, so every `import.meta.url` in that bundle collapses to the
 * bundle's own file, not `discord-dashboard-shared`'s original location).
 *
 * Resolve it from the bot's own entry point instead, checking a couple of
 * plausible offsets for a `locales/` directory copied there by the build:
 *  - Bundled (`scripts/build-bundle.mjs`): the single output file sits at
 *    the package root, with `locales/` copied alongside it (0 levels up).
 *  - tsc dist build (`scripts/copy-locales.mjs`): this module compiles to
 *    `dist/helpers/localesPath.js`, with `locales/` copied to `dist/`
 *    (1 level up) - `import.meta.url` reflects *this* file's own location
 *    regardless of which module calls the function.
 * Falls back to the monorepo-relative `packages/shared/src/localization/locales`
 * for `tsx`-run dev/e2e, where no build has copied anything yet.
 */
export function resolveI18nLoadPath(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  for (const offset of [[], ['..']]) {
    const candidate = path.resolve(__dirname, ...offset, 'locales');
    if (existsSync(candidate)) {
      return path.join(candidate, '{{lng}}', '{{ns}}.json');
    }
  }

  // helpers → src|dist → bot → packages → project root
  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const monorepoLocalesDir = path.resolve(projectRoot, 'packages', 'shared', 'src', 'localization', 'locales');
  return path.join(monorepoLocalesDir, '{{lng}}', '{{ns}}.json');
}
