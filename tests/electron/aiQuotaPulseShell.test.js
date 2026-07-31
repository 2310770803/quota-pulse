'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function source(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', '..', relativePath), 'utf8');
}

test('the title-bar close button hides the window while explicit quit remains available', () => {
  const renderer = source('src/electron/renderer/app.js');
  const preload = source('src/electron/preload.js');
  const main = source('src/electron/main.js');
  assert.match(renderer, /closeButton\.addEventListener\('click', \(\) => window\.quotaPulse\.close\(\)\)/);
  assert.match(preload, /close: \(\) => ipcRenderer\.send\('window:close'\)/);
  assert.match(preload, /quit: \(\) => ipcRenderer\.send\('app:quit'\)/);
  assert.match(main, /ipcMain\.on\('window:close'/);
  assert.match(main, /const action = mainWindowCloseAction\(settings/);
  assert.match(main, /action === 'hideWindow'[\s\S]*win\.hide\(\)/);
  assert.match(main, /ipcMain\.on\('app:quit', requestAppQuit\)/);
});

test('the renderer exposes only the retained core views', () => {
  const renderer = source('src/electron/renderer/app.js');
  const viewBlock = renderer.match(/const VIEW_DISPLAY_OPTIONS = \[([\s\S]*?)\n\];/)?.[1] || '';
  for (const id of ['home', 'limits', 'session', 'tool', 'model']) {
    assert.match(viewBlock, new RegExp(`id: '${id}'`));
  }
  for (const id of ['status', 'device', 'project', 'trends']) {
    assert.doesNotMatch(viewBlock, new RegExp(`id: '${id}'`));
  }
});

test('tray tooltips use the Quota Pulse product name', () => {
  const tray = source('src/electron/tray.js');
  const main = source('src/electron/main.js');
  assert.match(tray, /setToolTip\('Quota Pulse'\)/);
  assert.match(main, /setToolTip\(`Quota Pulse - \$\{tip\}`\)/);
});

test('collection and account settings expose only Codex, OpenCode, and Cursor', () => {
  const renderer = source('src/electron/renderer/app.js');
  assert.match(renderer, /CORE_CLIENT_IDS = new Set\(\['codex', 'opencode', 'cursor'\]\)/);
  assert.match(renderer, /CORE_LIMIT_PROVIDER_IDS = new Set\(\['codex', 'opencode', 'cursor'\]\)/);
  assert.match(renderer, /total: VISIBLE_LIMIT_PROVIDERS\.length/);
  assert.match(renderer, /orderedClients\(VISIBLE_CLIENTS,/);
  assert.match(renderer, /orderedLimitProviders\(VISIBLE_LIMIT_PROVIDERS,/);
});

test('desktop window mode remains draggable and resizable', () => {
  const behavior = source('src/electron/windowBehavior.js');
  const styles = source('src/electron/renderer/styles.css');
  const desktopProfile = behavior.match(/desktop: \{([\s\S]*?)\n {2}\}/)?.[1] || '';
  assert.match(desktopProfile, /draggable: true/);
  assert.match(desktopProfile, /resizable: true/);
  assert.doesNotMatch(styles, /\.shell\.desktop-mode \.titlebar\s*\{\s*-webkit-app-region:\s*no-drag/);
});

test('OpenCode receives a non-blocking limits refresh after first paint', () => {
  const renderer = source('src/electron/renderer/app.js');
  const preload = source('src/electron/preload.js');
  const main = source('src/electron/main.js');
  assert.match(renderer, /runAfterFirstPaint\(finishStartupInBackground\)/);
  assert.match(renderer, /window\.quotaPulse\.opencode\.refresh\?\.\(\)/);
  assert.match(preload, /refresh: \(\) => ipcRenderer\.invoke\('opencode:refresh'\)/);
  assert.match(main, /refreshLimits\(\{ provider: 'opencode' \}, 'startup-refresh'\)/);
});

test('startup renders before optional checks and limits tray icon work to core providers', () => {
  const renderer = source('src/electron/renderer/app.js');
  const main = source('src/electron/main.js');
  assert.match(renderer, /Promise\.allSettled\(\[\s*window\.quotaPulse\.getAppInfo\?\.\(\),\s*window\.quotaPulse\.getSettings\(\)/);
  assert.match(renderer, /runAfterFirstPaint\(finishStartupInBackground\)/);
  assert.match(renderer, /const trayIconProviderIds = new Set\(\[\s*\.\.\.CORE_CLIENT_IDS\s*\]\)/);
  assert.match(renderer, /\.\.\.VISIBLE_CLIENTS\.flatMap/);
  assert.match(renderer, /\.\.\.VISIBLE_LIMIT_PROVIDERS/);
  assert.match(main, /webContents\?\.once\('did-finish-load', start\)/);
  assert.match(main, /setTimeout\(\(\) => \{[\s\S]*?regenerateTokscalePricing\(\);[\s\S]*?startMode\(\);[\s\S]*?\}, 50\)/);
});

test('period switcher uses rounder segmented controls', () => {
  const styles = source('src/electron/renderer/styles.css');
  const tabs = styles.match(/\n\.tabs \{([\s\S]*?)\n\}/)?.[1] || '';
  const indicator = styles.match(/\n\.tab-indicator \{([\s\S]*?)\n\}/)?.[1] || '';
  const tab = styles.match(/\n\.tab \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(tabs, /border-radius: 14px/);
  assert.match(indicator, /border-radius: 11px/);
  assert.match(tab, /border-radius: 11px/);
});

test('quota health ring uses a high-DPI backing canvas', () => {
  const renderer = source('src/electron/renderer/app.js');
  assert.match(renderer, /getBoundingClientRect\(\)/);
  assert.match(renderer, /Math\.max\(2,\s*Math\.min\(4,\s*Number\(window\.devicePixelRatio\)\s*\|\|\s*1\)\)/);
  assert.match(renderer, /ctx\.scale\(pixelRatio,\s*pixelRatio\)/);
  assert.match(renderer, /ctx\.imageSmoothingQuality\s*=\s*'high'/);
});

test('compact shell uses refined typography and tabular numerals', () => {
  const styles = source('src/electron/renderer/styles.css');
  assert.match(styles, /Segoe UI Variable Text/);
  assert.match(styles, /Microsoft YaHei UI/);
  assert.match(styles, /font-synthesis:\s*none/);
  assert.match(styles, /font-variant-numeric:\s*lining-nums tabular-nums/);
});

test('narrow settings use a readable two-row navigation without visible scrollbars', () => {
  const styles = source('src/electron/renderer/styles.css');
  assert.match(styles, /\.settings-workspace::-webkit-scrollbar\s*\{[\s\S]*?display:\s*none/);
  assert.match(styles, /\.settings-workspace\s*\{[\s\S]*?scrollbar-width:\s*none/);
  assert.match(styles, /@media \(max-width:\s*439px\)[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(styles, /@media \(max-width:\s*439px\)[\s\S]*?\.settings-item-title\s*\{[\s\S]*?font-size:\s*12\.5px/);
  assert.match(styles, /@media \(max-width:\s*439px\)[\s\S]*?\.settings-item-desc,[\s\S]*?font-size:\s*11px/);
});

test('compact breakpoints preserve the settings and back action', () => {
  const styles = source('src/electron/renderer/styles.css');
  const compactBlock = styles.match(/@media \(max-width:\s*359px\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(compactBlock, /\.utility-actions \.settings-icon-button\s*\{\s*display:\s*inline-grid/);
  assert.doesNotMatch(compactBlock, /\.settings-icon-button\s*\{\s*display:\s*none/);
});

test('workspace menu uses compact rows without visible helper copy or scrollbars', () => {
  const renderer = source('src/electron/renderer/app.js');
  const styles = source('src/electron/renderer/styles.css');
  assert.doesNotMatch(renderer, /itemCopy\.append\(itemLabel,\s*itemHint\)/);
  assert.match(styles, /\.view-switcher-menu::-webkit-scrollbar\s*\{[\s\S]*?display:\s*none/);
  assert.match(styles, /\.view-switcher-menu-grid\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(styles, /\.view-switcher-menu-item\s*\{[\s\S]*?min-height:\s*42px/);
});

test('Tokscale maintenance lives in Data settings instead of General', () => {
  const markup = source('src/electron/renderer/index.html');
  const tokscaleIndex = markup.indexOf('id="tokscaleGroup"');
  const toolsIndex = markup.indexOf('id="toolsSettingsDetails"');
  const pricingIndex = markup.indexOf('id="customPricingAccountGroup"');
  assert.ok(tokscaleIndex > toolsIndex);
  assert.ok(tokscaleIndex < pricingIndex);
});

test('healthy quota state uses the semantic success token', () => {
  const renderer = source('src/electron/renderer/app.js');
  const styles = source('src/electron/renderer/styles.css');
  assert.match(renderer, /stateName === 'healthy' \? healthy : accent/);
  assert.match(styles, /\.quota-health-summary\[data-state="healthy"\] \.quota-health-percent\s*\{\s*color:\s*var\(--qp-success\)/);
});
