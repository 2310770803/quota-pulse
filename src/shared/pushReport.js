'use strict';

// Quota report formatting + monitor-window selection (ported from the Python
// feishu/bot.py format_quota_report_multi). Works on the normalized limits
// entries produced by src/shared/limits.js.

const PROVIDER_LABELS = {
  opencode: 'OpenCode',
  codex: 'Codex',
  cursor: 'Cursor'
};

const WINDOW_PRIORITY = ['weekly', 'monthly', 'session'];

function providerLabel(providerId) {
  return PROVIDER_LABELS[providerId] || providerId;
}

// Pick the window we alert/report on: weekly first (matches the Python
// get_weekly_limit behaviour), then monthly, then the 5h session window.
function pickMonitorWindow(entry) {
  const windows = Array.isArray(entry?.windows) ? entry.windows.filter((w) => w && w.remainingPercent !== null && w.remainingPercent !== undefined) : [];
  if (windows.length === 0) return null;
  for (const kind of WINDOW_PRIORITY) {
    const hit = windows.find((w) => w.kind === kind);
    if (hit) return hit;
  }
  return windows[0];
}

function round1(value) {
  return Math.round(Number(value) * 10) / 10;
}

function formatResetDate(resetsAt) {
  if (!resetsAt) return '';
  const date = new Date(resetsAt);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatCheckedAt(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日  ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// entries: array of normalized limits entries ({ provider, status, windows, ... })
// Returns { text, services: { providerId: { remainingPercent, usedPercent, resetsAt } | null } }
function buildQuotaReport(entries, now = new Date()) {
  const lines = ['[AI] ----', ''];
  const services = {};
  for (const entry of entries || []) {
    const provider = entry?.provider || '';
    const label = providerLabel(provider);
    const win = pickMonitorWindow(entry);
    const ok = win && entry?.status !== 'error' && entry?.status !== 'unavailable';
    if (!ok) {
      lines.push(`${label}：读取失败`);
      services[provider] = null;
      continue;
    }
    const remaining = round1(win.remainingPercent);
    const used = round1(win.usedPercent);
    const resetText = formatResetDate(win.resetsAt);
    lines.push(`${label}：剩余 ${remaining}%  （已用 ${used}%${resetText ? `，重置 ${resetText}` : ''}）`);
    services[provider] = {
      remainingPercent: remaining,
      usedPercent: used,
      resetsAt: win.resetsAt || null,
      windowKind: win.kind
    };
  }
  lines.push('');
  lines.push(`检测时间：${formatCheckedAt(now)}`);
  return { text: lines.join('\n'), services };
}

module.exports = {
  PROVIDER_LABELS,
  providerLabel,
  pickMonitorWindow,
  buildQuotaReport,
  formatCheckedAt
};
