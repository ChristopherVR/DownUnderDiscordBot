#!/usr/bin/env node
// Regenerates src/database/schema.ts (the SCHEMA_STATEMENTS array run at startup
// by ensureSchema()) from prisma/schema.prisma. Run this after changing the
// Prisma schema so the runtime bootstrap stays faithful to it:
//
//   node scripts/generate-schema-sql.mjs
//
// It shells out to `prisma migrate diff` to get the canonical CREATE script for
// an empty database, splits it into statements, and rewrites each CREATE ... to
// be idempotent (IF NOT EXISTS) so it is safe to run on an already-migrated DB.
import { execFileSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(pkgRoot, 'prisma', 'schema.prisma');
const outFile = path.join(pkgRoot, 'src', 'database', 'schema.ts');

const raw = execFileSync(
  'npx',
  ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema', schemaPath, '--script'],
  { cwd: pkgRoot, encoding: 'utf-8', shell: process.platform === 'win32' },
);

// Split on the `-- CreateTable` / `-- CreateIndex` comment markers, dropping the
// comments, and normalize each statement into an idempotent form.
const statements = raw
  .split(/^--\s.*$/m)
  .map((chunk) => chunk.trim())
  .filter(Boolean)
  .map((stmt) => stmt.replace(/;\s*$/, ''))
  .map((stmt) =>
    stmt
      .replace(/^CREATE TABLE /i, 'CREATE TABLE IF NOT EXISTS ')
      .replace(/^CREATE INDEX /i, 'CREATE INDEX IF NOT EXISTS ')
      .replace(/^CREATE UNIQUE INDEX /i, 'CREATE UNIQUE INDEX IF NOT EXISTS '),
  );

if (statements.length === 0) {
  throw new Error('prisma migrate diff produced no statements; aborting');
}

const body = statements.map((stmt) => '  `' + stmt + '`,').join('\n');

const file = `// Idempotent DDL that mirrors prisma/schema.prisma. The bot connects to SQLite
// through @prisma/adapter-better-sqlite3, which never creates tables on its own -
// in dev that is handled by \`pnpm db:push\`, but a bundled/standalone bot points
// at a fresh empty database with no CLI available to push the schema. Running
// these statements at startup guarantees the tables exist before any query runs.
//
// GENERATED - do not hand-edit the statements. Regenerate after changing
// schema.prisma with: \`node scripts/generate-schema-sql.mjs\`
// (it re-derives this list from \`prisma migrate diff\` and re-adds IF NOT EXISTS).
export const SCHEMA_STATEMENTS: string[] = [
${body}
];
`;

writeFileSync(outFile, file);
console.log(`Wrote ${statements.length} statements to ${path.relative(pkgRoot, outFile)}`);
