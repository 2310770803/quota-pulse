'use strict';

// Quota Pulse tracks only the three clients the user actually uses.
const DEFAULT_CLIENTS = 'opencode,codex,cursor';

// Every wired client id. Display-preference normalization (hide/pin/reorder)
// keys off this list. Mirror the renderer's KNOWN_CLIENTS.
const KNOWN_CLIENTS = DEFAULT_CLIENTS;

function normalizeClientsCsv(value) {
  return String(value ?? '').split(',').map((client) => client.trim().toLowerCase()).filter(Boolean).join(',');
}

function clientsCsvForSetting(value, fallback = DEFAULT_CLIENTS) {
  if (value === undefined || value === null) return normalizeClientsCsv(fallback);
  return normalizeClientsCsv(value);
}

module.exports = {
  DEFAULT_CLIENTS,
  KNOWN_CLIENTS,
  clientsCsvForSetting,
  normalizeClientsCsv
};
