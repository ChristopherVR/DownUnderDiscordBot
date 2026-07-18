#!/usr/bin/env node
// Packages the bot as a Tauri sidecar for packages/desktop: a bundled JS
// entry point plus a REAL node_modules (native addons like better-sqlite3
// and mediaplex installed for whatever OS/arch this script runs on), a
// static ffmpeg binary, and a copy of the Node.js binary that ran this very
// script (so its ABI matches the native addons `npm install` just fetched).
//
// Intentionally run natively per-platform in CI (not cross-compiled) - see
// release-desktop.yml's matrix, which already covers windows/mac/linux.
import { execFileSync, spawnSync } from 'child_process';
import { chmod, cp, mkdir, rm, writeFile } from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import { bundleBotSource, external, pkg, pkgRoot } from './lib/bundle-core.mjs';

const require = createRequire(import.meta.url);
const isWindows = process.platform === 'win32';
const exeSuffix = isWindows ? '.exe' : '';

const desktopRoot = path.resolve(pkgRoot, '..', 'desktop', 'src-tauri');
const sidecarOutDir = path.join(pkgRoot, 'publish-sidecar');
const resourcesBotDir = path.join(desktopRoot, 'resources', 'bot');
const binariesDir = path.join(desktopRoot, 'binaries');

function getTargetTriple() {
  return execFileSync('rustc', ['--print', 'host-tuple'], { encoding: 'utf8' }).trim();
}

async function chmodExecutable(filePath) {
  if (isWindows) return;
  await chmod(filePath, 0o755);
}

async function main() {
  const targetTriple = getTargetTriple();
  console.log(`Building bot sidecar for ${targetTriple}`);

  await bundleBotSource({ outDir: sidecarOutDir });

  // Same real dependencies as the npm-publish bundle, but this package.json
  // is never published - it only exists so `npm install` can materialize a
  // real node_modules alongside index.js.
  const sidecarPkg = {
    name: 'down-under-discord-bot-sidecar',
    version: pkg.version,
    private: true,
    type: 'module',
    dependencies: Object.fromEntries(external.map((name) => [name, pkg.dependencies[name]])),
  };
  await writeFile(path.join(sidecarOutDir, 'package.json'), JSON.stringify(sidecarPkg, null, 2) + '\n');

  console.log('Installing sidecar dependencies (npm install --omit=dev)...');
  // A single command string (not an argv array) with shell:true - npm ships
  // as a .cmd/.sh shim, not a directly-executable binary, so it needs the
  // shell to resolve it. Passing an argv array alongside shell:true is what
  // Node's DEP0190 warns about (unescaped argument concatenation); a single
  // literal string with no interpolated input sidesteps that.
  const install = spawnSync('npm install --omit=dev --no-audit --no-fund', {
    cwd: sidecarOutDir,
    stdio: 'inherit',
    shell: true,
  });
  if (install.status !== 0) {
    throw new Error(`npm install failed in ${sidecarOutDir}`);
  }

  // ffmpeg: static per-platform binary, shipped as a Tauri resource (not a
  // sidecar - it's spawned by the bot's own child process, never by Tauri
  // directly). FFMPEG_PATH is pointed at this file when the bot is started.
  const ffmpegSrc = require('ffmpeg-static');
  const ffmpegDestDir = path.join(desktopRoot, 'resources', 'ffmpeg', targetTriple);
  await rm(ffmpegDestDir, { recursive: true, force: true });
  await mkdir(ffmpegDestDir, { recursive: true });
  const ffmpegDest = path.join(ffmpegDestDir, `ffmpeg${exeSuffix}`);
  await cp(ffmpegSrc, ffmpegDest);
  await chmodExecutable(ffmpegDest);

  // The Node binary that just ran `npm install` above - reusing it (instead
  // of a separately downloaded Node build) keeps it ABI-matched with the
  // native addons that install just fetched/built.
  await mkdir(binariesDir, { recursive: true });
  const nodeDest = path.join(binariesDir, `bot-node-${targetTriple}${exeSuffix}`);
  await cp(process.execPath, nodeDest);
  await chmodExecutable(nodeDest);

  // Bundled JS + real node_modules + prisma/locales, as a Tauri resource.
  await rm(resourcesBotDir, { recursive: true, force: true });
  await mkdir(resourcesBotDir, { recursive: true });
  for (const entry of ['index.js', 'node_modules', 'prisma', 'locales', '.env.example']) {
    await cp(path.join(sidecarOutDir, entry), path.join(resourcesBotDir, entry), { recursive: true }).catch(() => {});
  }

  console.log(`Sidecar Node binary: ${nodeDest}`);
  console.log(`Sidecar ffmpeg binary: ${ffmpegDest}`);
  console.log(`Sidecar bot resources: ${resourcesBotDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
