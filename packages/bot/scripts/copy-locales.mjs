#!/usr/bin/env node
// Copies shared's locale JSON into dist/ so resolveI18nLoadPath()
// (src/helpers/localesPath.ts) can find it relative to the compiled output
// without depending on shared's own source tree being present alongside it.
import { cp } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');

const src = path.resolve(pkgRoot, '..', 'shared', 'src', 'localization', 'locales');
const dest = path.join(pkgRoot, 'dist', 'locales');

await cp(src, dest, { recursive: true });
