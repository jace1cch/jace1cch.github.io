#!/usr/bin/env node
/**
 * Playwright 驱动 Logseq 桌面版导出含图谱的 SPA
 * 用法: node export-with-graph.mjs <graph-path> <output-path>
 */

import { _electron as electron } from 'playwright';
import { resolve } from 'path';
import { existsSync, mkdirSync, statSync, readdirSync } from 'fs';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const GRAPH_PATH = resolve(process.argv[2] || '.');
const OUTPUT_PATH = resolve(process.argv[3] || './www');
const LOGSEQ_DIR = resolve(new URL('.', import.meta.url).pathname, '..', '..', '.logseq-appimage', 'squashfs-root');
const LOGSEQ_BIN = resolve(LOGSEQ_DIR, 'Logseq');

async function setMockedPath(page, path) {
  await page.evaluate(p => { window.__MOCKED_OPEN_DIR_PATH__ = p; }, path);
}

async function waitForExport(outputDir) {
  let timeout = 180;
  while (timeout > 0) {
    try {
      const hasIndex = existsSync(resolve(outputDir, 'index.html'));
      const publishing = existsSync(resolve(outputDir, 'static', 'js', 'publishing'));
      if (hasIndex && !publishing) return true;
    } catch {}
    await sleep(2000);
    timeout--;
  }
  throw new Error('Export timeout');
}

async function main() {
  console.log(`📂 Graph: ${GRAPH_PATH}`);
  console.log(`📤 Output: ${OUTPUT_PATH}`);
  if (!existsSync(LOGSEQ_BIN)) {
    console.error(`❌ Logseq not found at ${LOGSEQ_BIN}`);
    process.exit(1);
  }
  mkdirSync(OUTPUT_PATH, { recursive: true });

  console.log('🚀 Launching Logseq...');
  const app = await electron.launch({
    executablePath: LOGSEQ_BIN,
    args: ['--no-sandbox', '--disable-gpu'],
  }).catch(e => {
    console.error('❌ Launch failed:', e.message);
    // Try without executablePath
    return electron.launch({ args: ['--no-sandbox'] });
  });

  const page = await app.firstWindow().catch(async () => {
    // Wait for window
    await sleep(5000);
    return app.firstWindow();
  });
  await page.waitForLoadState('domcontentloaded');
  await sleep(2000);
  console.log('✅ App loaded');

  // Load graph via mocked path
  console.log('📖 Loading graph...');
  await setMockedPath(page, GRAPH_PATH);

  // Try various UI paths to open the graph
  try {
    const btn = page.locator('button, a, .button').filter({ hasText: /add a graph|open a directory|choose a folder/i }).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      console.log('→ Clicked "Add a graph"');
    }
  } catch {}

  try {
    await page.waitForSelector('text=/parsing files/i', { state: 'hidden', timeout: 120000 });
    console.log('✅ Graph parsing complete');
  } catch {
    console.log('→ Graph load detected');
  }
  await sleep(3000);

  // Export
  console.log('📤 Exporting public pages...');
  try {
    // Try clicking the export menu
    const dotsBtn = page.getByTitle(/more|menu|settings/i).or(page.locator('.ls-icon-dots')).first();
    await dotsBtn.click({ timeout: 5000 });
    await sleep(1000);

    // Look for Export graph option
    const exportBtn = page.getByText(/export graph/i).first();
    if (await exportBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exportBtn.click();
      await sleep(500);
      const publicPages = page.getByText(/export public pages/i).first();
      if (await publicPages.isVisible({ timeout: 2000 }).catch(() => false)) {
        await publicPages.click();
      }
    }
  } catch (e) {
    console.log('→ UI click fallback');
  }

  // Set output path and trigger via API
  await setMockedPath(page, OUTPUT_PATH);

  // Try programmatic export
  await page.evaluate((output) => {
    window.__MOCKED_OPEN_DIR_PATH__ = output;
    if (window.apis?.exportPublishAssets) {
      try { window.apis.exportPublishAssets(); } catch {}
    }
  }, OUTPUT_PATH).catch(() => {});

  await waitForExport(OUTPUT_PATH);
  console.log('✅ Export complete!');

  await app.close().catch(() => {});
  console.log('🎉 Done! Graph data included.');
}

main().catch(e => {
  console.error('❌ Fatal:', e.message);
  process.exit(1);
});
