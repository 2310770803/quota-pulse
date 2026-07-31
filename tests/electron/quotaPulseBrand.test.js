'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..', '..');
const packageJson = require(path.join(root, 'package.json'));
const html = fs.readFileSync(path.join(root, 'src', 'electron', 'renderer', 'index.html'), 'utf8');
const main = fs.readFileSync(path.join(root, 'src', 'electron', 'main.js'), 'utf8');
const tray = fs.readFileSync(path.join(root, 'src', 'electron', 'tray.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'electron', 'renderer', 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'src', 'electron', 'renderer', 'styles.css'), 'utf8');
const windowsChrome = fs.readFileSync(path.join(root, 'src', 'electron', 'windowsChrome.js'), 'utf8');

test('Quota Pulse is the product name across package, window, and tray surfaces', () => {
  assert.equal(packageJson.productName, 'Quota Pulse');
  assert.equal(packageJson.build.productName, 'Quota Pulse');
  assert.equal(packageJson.build.nsis.artifactName, 'Quota-Pulse-Setup-${version}.${ext}');
  assert.equal(packageJson.build.portable.artifactName, 'Quota-Pulse-${version}.${ext}');
  assert.match(html, /<title>Quota Pulse<\/title>/);
  assert.match(main, /const APP_NAME = 'Quota Pulse'/);
  assert.match(tray, /tray\.setToolTip\('Quota Pulse'\)/);
});

test('renderer uses the shared transparent brand icon and has no Sigma fallback', () => {
  assert.match(html, /assets\/brand-icon\.png/);
  assert.doesNotMatch(html, /Σ/);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'brand-icon.png')));
  assert.ok(fs.existsSync(path.join(root, '..', 'assets', 'app-icon.png')));
  assert.ok(fs.existsSync(path.join(root, '..', 'assets', 'app-icon.ico')));
});

test('compact navigation and settings use the Quota Pulse light layout states', () => {
  assert.match(styles, /\.view-switcher-menu\s*\{[\s\S]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.98\)/);
  assert.match(styles, /\.shell\.settings-open \.quota-hero,[\s\S]*\.shell\.settings-open \.footer\s*\{[\s\S]*display:\s*none !important/);
  assert.match(styles, /\.shell\.settings-open \.title-controls \.tabs,[\s\S]*\.shell\.settings-open \.utility-actions \.refresh-button\s*\{[\s\S]*display:\s*none/);
  assert.match(styles, /\.shell:not\(\.settings-open\) \.breakdown,[\s\S]*flex:\s*1 1 0;[\s\S]*max-height:\s*none/);
});

test('text-first layout removes oversized cards and keeps a visible settings return action', () => {
  assert.match(styles, /\.quota-hero\s*\{[\s\S]*border-radius:\s*0;[\s\S]*background:\s*transparent;[\s\S]*box-shadow:\s*none/);
  assert.match(styles, /\.breakdown\s*\{[\s\S]*grid-auto-rows:\s*max-content;[\s\S]*border-radius:\s*0;[\s\S]*background:\s*transparent/);
  assert.match(styles, /\.shell::after\s*\{[\s\S]*display:\s*none/);
  assert.match(styles, /\.shell\.settings-open \.settings-icon-button::before\s*\{[\s\S]*arrow-left\.svg/);
  assert.match(styles, /\.shell\.settings-open \.titlebar\s*\{[\s\S]*z-index:\s*20/);
  assert.match(fs.readFileSync(path.join(root, 'src', 'electron', 'renderer', 'app.js'), 'utf8'), /syncSettingsButtonState\(settingsOpen\)/);
});

test('primary Quota Pulse surfaces are Chinese-first with readable settings controls', () => {
  assert.match(html, /data-period="today">今日<\/button>/);
  assert.match(html, /data-period="month">本月<\/button>/);
  assert.match(html, /data-period="allTime">累计<\/button>/);
  assert.match(html, /<span>总用量<\/span>/);
  assert.match(html, /class="quota-health-label">可用额度<\/span>/);
  assert.match(html, /id="minButton"[\s\S]*title="最小化"/);
  assert.match(html, /id="closeButton"[\s\S]*title="关闭"/);
  assert.match(app, /`\$\{providerName\} 可用`/);
  assert.match(app, /'暂无重置时间'/);
  assert.match(app, /weekly:\s*'每周额度'/);
  assert.match(app, /session:\s*'会话额度'/);
  assert.match(app, /if \(window\?\.kind === 'balance'\) return '余额'/);
  assert.match(styles, /\.shell\.settings-open \.window-actions\s*\{[\s\S]*position:\s*relative;[\s\S]*opacity:\s*1;[\s\S]*pointer-events:\s*auto/);
  assert.match(styles, /--qp-muted:\s*#56617e/);
});

test('Windows chrome owns one native rounded mask while the renderer fills its edge', () => {
  assert.match(main, /applyWindowsChrome\(win, \{ round: true \}\)/);
  assert.match(windowsChrome, /const DWMWCP_DONOTROUND = 1/);
  assert.match(windowsChrome, /round \? DWMWCP_ROUND : DWMWCP_DONOTROUND/);
  assert.match(styles, /html\.is-windows:not\(\.floating-bubble-collapsed-left\):not\(\.floating-bubble-collapsed-right\)[\s\S]*border-radius:\s*0;[\s\S]*background:\s*var\(--qp-canvas\)/);
});

test('every upper-right icon action is circular and equally sized', () => {
  assert.match(styles, /\.titlebar \.utility-actions \.refresh-button,[\s\S]*\.titlebar \.utility-actions \.settings-icon-button,[\s\S]*\.titlebar \.window-actions \.icon-button\s*\{[\s\S]*width:\s*34px;[\s\S]*height:\s*34px;[\s\S]*border-radius:\s*50%/);
});

test('headline quota summary uses the same visible windows as the Home quota list', () => {
  assert.match(app, /function quotaHealthWindows\(\) \{[\s\S]*return homeLimitRows\(\)\.flatMap/);
  assert.match(app, /window\?\.showMeter !== false/);
  assert.match(app, /window\?\.remainingPercent !== null/);
  assert.match(app, /window\?\.remainingPercent !== undefined/);
});
