import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  datasource: {
    // `prisma generate` only needs a schema, not a live DB connection - a
    // hard requirement here (e.g. via prisma/config's `env()` helper, which
    // throws when the var is unset) breaks `postinstall: prisma generate`
    // on a fresh clone/install before `.env` has been configured.
    url: process.env.DATABASE_URL ?? 'file:./data/bot.db',
  },
});
