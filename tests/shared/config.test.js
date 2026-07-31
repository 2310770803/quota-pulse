'use strict';

const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { applyLegacyEnvAliases, pidFilePath, sharedDataDir } = require('../../src/shared/config');

test('legacy Token Monitor environment names remain a compatibility alias', () => {
  const env = {
    TOKEN_MONITOR_SHARED_DIR: path.join(os.tmpdir(), 'legacy-quota-pulse'),
    QUOTA_PULSE_SECRET: 'canonical'
  };
  applyLegacyEnvAliases(env);
  assert.equal(env.QUOTA_PULSE_SHARED_DIR, env.TOKEN_MONITOR_SHARED_DIR);
  assert.equal(env.QUOTA_PULSE_SECRET, 'canonical');
});

test('sharedDataDir uses QUOTA_PULSE_SHARED_DIR override', () => {
  const previous = process.env.QUOTA_PULSE_SHARED_DIR;
  process.env.QUOTA_PULSE_SHARED_DIR = path.join(os.tmpdir(), 'quota-pulse-test');
  try {
    assert.equal(sharedDataDir(), process.env.QUOTA_PULSE_SHARED_DIR);
    assert.equal(pidFilePath(), path.join(process.env.QUOTA_PULSE_SHARED_DIR, 'agent.pid'));
  } finally {
    if (previous === undefined) delete process.env.QUOTA_PULSE_SHARED_DIR;
    else process.env.QUOTA_PULSE_SHARED_DIR = previous;
  }
});

test('sharedDataDir follows Electron userData-compatible platform paths', () => {
  const home = path.join(path.sep, 'Users', 'javis');
  assert.equal(
    sharedDataDir({ platform: 'darwin', homeDir: home, env: {} }),
    path.join(home, 'Library', 'Application Support', 'Quota Pulse')
  );
  assert.equal(
    sharedDataDir({ platform: 'win32', homeDir: home, env: { APPDATA: 'C:\\Users\\javis\\AppData\\Roaming' } }),
    path.join('C:\\Users\\javis\\AppData\\Roaming', 'Quota Pulse')
  );
  assert.equal(
    sharedDataDir({ platform: 'linux', homeDir: home, env: { XDG_CONFIG_HOME: '/tmp/config' } }),
    path.join('/tmp/config', 'Quota Pulse')
  );
});
