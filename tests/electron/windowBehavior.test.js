'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  describeWindowBehavior,
  normalizeWindowBehavior,
  normalizeWindowBehaviorSettings
} = require('../../src/electron/windowBehavior');

test('uses a compact default widget window', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'electron', 'main.js'), 'utf8');
  assert.match(main, /const DEFAULT_WINDOW = \{ width: 340, height: 520 \}/);
  assert.match(main, /const DEFAULT_ZOOM_FACTOR = 0\.9/);
  assert.match(main, /const WINDOW_LAYOUT_VERSION = 3/);
  assert.match(main, /merged\.windowBounds = savedBounds/);
  assert.match(main, /merged\.zoomFactor = Math\.min\(clampZoom\(saved\.zoomFactor\), DEFAULT_ZOOM_FACTOR\)/);
});

test('normalizes supported window behavior modes', () => {
  assert.equal(normalizeWindowBehavior('floating'), 'floating');
  assert.equal(normalizeWindowBehavior('NORMAL'), 'normal');
  assert.equal(normalizeWindowBehavior(' desktop '), 'desktop');
  assert.equal(normalizeWindowBehavior('unknown', 'normal'), 'normal');
});

test('maps window behavior modes to window flags', () => {
  assert.deepEqual(describeWindowBehavior({ windowBehavior: 'floating' }), {
    mode: 'floating',
    alwaysOnTop: true,
    draggable: true,
    resizable: true,
    focusable: true,
    mousePassthrough: false,
    showInactive: false,
    requiresTrayControl: false,
    cssClass: ''
  });
  assert.deepEqual(describeWindowBehavior({ windowBehavior: 'normal' }), {
    mode: 'normal',
    alwaysOnTop: false,
    draggable: true,
    resizable: true,
    focusable: true,
    mousePassthrough: false,
    showInactive: false,
    requiresTrayControl: false,
    cssClass: ''
  });
  assert.deepEqual(describeWindowBehavior({ windowBehavior: 'desktop' }), {
    mode: 'desktop',
    alwaysOnTop: false,
    draggable: true,
    resizable: true,
    focusable: true,
    mousePassthrough: false,
    showInactive: false,
    requiresTrayControl: false,
    cssClass: 'desktop-mode'
  });
});

test('migrates legacy alwaysOnTop settings when no behavior is saved', () => {
  assert.equal(normalizeWindowBehaviorSettings({ alwaysOnTop: true }).windowBehavior, 'floating');
  assert.equal(normalizeWindowBehaviorSettings({ alwaysOnTop: false }).windowBehavior, 'normal');
});

test('keeps alwaysOnTop synchronized with behavior updates', () => {
  assert.deepEqual(
    normalizeWindowBehaviorSettings({ windowBehavior: 'floating', alwaysOnTop: true }, { windowBehavior: 'desktop' }),
    { windowBehavior: 'desktop', alwaysOnTop: false }
  );
  assert.deepEqual(
    normalizeWindowBehaviorSettings({ windowBehavior: 'desktop', alwaysOnTop: false }, { alwaysOnTop: true }),
    { windowBehavior: 'floating', alwaysOnTop: true }
  );
  assert.deepEqual(
    normalizeWindowBehaviorSettings({ windowBehavior: 'floating', alwaysOnTop: true }, { alwaysOnTop: false }),
    { windowBehavior: 'normal', alwaysOnTop: false }
  );
});
