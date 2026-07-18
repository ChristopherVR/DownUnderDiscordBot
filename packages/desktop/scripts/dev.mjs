import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import net from 'net';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tmpConfig = join(__dirname, '..', 'src-tauri', '.dev-config.json');

/**
 * Find an available port starting from the preferred one.
 * If the preferred port is in use, increment until a free one is found.
 *
 * Preferred defaults to a project-specific port (not Vite's universal 5173)
 * so this dev server doesn't wander into the same address range every other
 * local Vite project defaults into.
 */
async function getAvailablePort(preferred = 15173) {
  for (let port = preferred; port < preferred + 100; port++) {
    const free = await new Promise((resolve) => {
      const server = net.createServer();
      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(true));
      });
      server.on('error', () => resolve(false));
    });
    if (free) return port;
  }
  throw new Error('No available port found');
}

function cleanup() {
  if (existsSync(tmpConfig)) {
    try {
      unlinkSync(tmpConfig);
    } catch {}
  }
}

const PREFERRED_PORT = 15173;
const port = await getAvailablePort(PREFERRED_PORT);

if (port !== PREFERRED_PORT) {
  console.log(`\u26A0 Port ${PREFERRED_PORT} in use \u2014 starting on port ${port}`);
}

// Write a temp Tauri config override file (avoids shell escaping issues)
writeFileSync(
  tmpConfig,
  JSON.stringify(
    {
      build: {
        devUrl: `http://localhost:${port}`,
      },
    },
    null,
    2,
  ),
);

const tauri = spawn('pnpm', ['tauri', 'dev', '--config', tmpConfig], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_DEV_PORT: String(port) },
});

process.on('SIGINT', () => {
  cleanup();
  process.exit();
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit();
});

tauri.on('exit', (code) => {
  cleanup();
  process.exit(code ?? 1);
});
