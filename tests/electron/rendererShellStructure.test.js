'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const html = fs.readFileSync(
  path.join(__dirname, '..', '..', 'src', 'electron', 'renderer', 'index.html'),
  'utf8'
);

test('the hidden settings panel does not contain the main quota interface', () => {
  const settingsStart = html.indexOf('<section id="settingsPanel"');
  const totalStart = html.indexOf('<section class="total-panel quota-hero">');
  assert.ok(settingsStart >= 0);
  assert.ok(totalStart > settingsStart);

  const settingsMarkup = html.slice(settingsStart, totalStart);
  const sectionOpens = (settingsMarkup.match(/<section(?:\s|>)/g) || []).length;
  const sectionCloses = (settingsMarkup.match(/<\/section>/g) || []).length;
  assert.equal(sectionCloses, sectionOpens);
  assert.doesNotMatch(settingsMarkup, /id="(?:totalTokens|breakdown|viewSwitcher)"/);
});
