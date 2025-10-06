import { describe, it, expect } from 'vitest';
import path from 'path';
import { promises as fs } from 'fs';
import process from 'node:process';

const namespaces = ['common', 'ui', 'errors', 'commands'] as const;
const localesDir = path.resolve(process.cwd(), '..', 'shared', 'src', 'localization', 'locales');

describe('i18n localization bundles', () => {
  it('exposes translation files for each namespace', async () => {
    await Promise.all(
      namespaces.map(async (namespace) => {
        const filePath = path.resolve(localesDir, 'en', `${namespace}.json`);
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        expect(Object.keys(parsed).length).toBeGreaterThan(0);
      }),
    );
  });

  it('contains dashboard labels required for the Spotify layout', async () => {
    const filePath = path.resolve(localesDir, 'en', 'ui.json');
    const raw = await fs.readFile(filePath, 'utf-8');
    interface UiMetricsTranslations {
      guilds?: unknown;
      instances?: unknown;
      online?: unknown;
      active?: unknown;
    }

    interface UiDashboardTranslations {
      metrics?: UiMetricsTranslations;
      guildManagement?: { title?: unknown };
      emptyState?: { title?: unknown };
    }

    interface UiTranslations {
      app?: { version?: string };
      dashboard?: UiDashboardTranslations;
    }

    const parsed = JSON.parse(raw) as UiTranslations;

    expect(parsed.app?.version).toBe('v3 - React + shadcn');
    expect(parsed.dashboard?.metrics?.guilds).toBeTruthy();
    expect(parsed.dashboard?.metrics?.instances).toBeTruthy();
    expect(parsed.dashboard?.metrics?.online).toBeTruthy();
    expect(parsed.dashboard?.metrics?.active).toBeTruthy();
    expect(parsed.dashboard?.guildManagement?.title).toBeTruthy();
    expect(parsed.dashboard?.emptyState?.title).toBeTruthy();
  });
});
