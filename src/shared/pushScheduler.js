'use strict';

// Push scheduler (ported from the Python main.py logic):
// - threshold alerts on window crossings (low / warning / restored)
// - periodic reports (every N hours) and optional daily report at HH:mm
// - 2-minute suppression of a periodic report right after an alert
// State is persisted as JSON so restarts don't re-fire alerts.

const fs = require('node:fs');
const path = require('node:path');

const TICK_MS = 30 * 1000;
const SUPPRESS_AFTER_ALERT_MS = 2 * 60 * 1000;

function defaultState() {
  return {
    prevRemaining: {},       // provider -> last seen remainingPercent
    lastReportAt: 0,         // ms epoch of last periodic report
    lastAlertAt: 0,          // ms epoch of last alert push
    lastDailyDate: ''        // YYYY-MM-DD of last daily report
  };
}

function loadState(statePath) {
  try {
    const raw = fs.readFileSync(statePath, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch (_) {
    return defaultState();
  }
}

function saveState(statePath, state) {
  try {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (_) { /* non-fatal */ }
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDailyTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

// config: {
//   alertLowEnabled, alertLowThreshold, alertWarningEnabled, alertWarningThreshold,
//   alertRestoredEnabled, alertRestoredThreshold,
//   reportIntervalEnabled, reportIntervalHours, reportDailyEnabled, reportDailyTime
// }
// services: { providerId: { remainingPercent } | null } (from buildQuotaReport)
// Returns { shouldSend, kind } mirroring the Python monitor_quota decision.
function evaluateAlerts(config, services, prevRemaining) {
  let shouldSend = false;
  let kind = 'quota_warning';
  for (const [provider, limit] of Object.entries(services || {})) {
    if (!limit) continue;
    const remaining = Number(limit.remainingPercent);
    if (!Number.isFinite(remaining)) continue;
    const previous = prevRemaining?.[provider];
    const previousRemaining = previous === undefined || previous === null ? null : Number(previous);

    const lowThreshold = Number(config.alertLowThreshold ?? 10);
    const warningThreshold = Number(config.alertWarningThreshold ?? 30);
    const restoredThreshold = Number(config.alertRestoredThreshold ?? 100);

    const lowTransition = Boolean(config.alertLowEnabled ?? true)
      && remaining < lowThreshold
      && (previousRemaining === null || previousRemaining >= lowThreshold);
    const warningTransition = Boolean(config.alertWarningEnabled ?? true)
      && remaining < warningThreshold
      && remaining >= lowThreshold
      && (previousRemaining === null || previousRemaining >= warningThreshold);
    const restoredTransition = Boolean(config.alertRestoredEnabled ?? true)
      && remaining >= restoredThreshold
      && previousRemaining !== null
      && previousRemaining < restoredThreshold;

    if (lowTransition || warningTransition || restoredTransition) {
      shouldSend = true;
      if (lowTransition) kind = 'low_quota';
      else if (restoredTransition) kind = 'quota_restored';
    }
  }
  return { shouldSend, kind };
}

function createPushScheduler({ statePath, getConfig, getServices, sendReport, logger = console }) {
  let timer = null;
  let state = loadState(statePath);
  let busy = false;

  async function fireReport(kind) {
    const result = await sendReport(kind);
    if (result?.ok) {
      if (kind === 'regular_report' || kind === 'daily_report') state.lastReportAt = Date.now();
      else state.lastAlertAt = Date.now();
      saveState(statePath, state);
    }
    return result;
  }

  async function tick() {
    if (busy) return;
    busy = true;
    try {
      const config = getConfig() || {};
      const services = (await getServices()) || {};

      // 1) threshold alerts (highest priority)
      const { shouldSend, kind } = evaluateAlerts(config, services, state.prevRemaining);
      for (const [provider, limit] of Object.entries(services)) {
        if (limit && Number.isFinite(Number(limit.remainingPercent))) {
          state.prevRemaining[provider] = Number(limit.remainingPercent);
        }
      }
      saveState(statePath, state);
      if (shouldSend) {
        await fireReport(kind);
        return; // an alert this tick suppresses the periodic report
      }

      // 2) periodic / daily report
      const now = new Date();
      const intervalEnabled = Boolean(config.reportIntervalEnabled ?? true);
      const intervalHours = Math.max(1, Number(config.reportIntervalHours ?? 5) || 5);
      const dailyEnabled = Boolean(config.reportDailyEnabled ?? false);
      const daily = parseDailyTime(config.reportDailyTime ?? '22:00');

      let due = null;
      if (intervalEnabled && Date.now() - (state.lastReportAt || 0) >= intervalHours * 60 * 60 * 1000) {
        due = 'regular_report';
      }
      if (dailyEnabled && daily) {
        const todayKey = dateKey(now);
        const pastTime = now.getHours() > daily.hour || (now.getHours() === daily.hour && now.getMinutes() >= daily.minute);
        if (pastTime && state.lastDailyDate !== todayKey) {
          due = 'daily_report';
          state.lastDailyDate = todayKey;
          saveState(statePath, state);
        }
      }
      if (due && Date.now() - (state.lastAlertAt || 0) >= SUPPRESS_AFTER_ALERT_MS) {
        await fireReport(due);
      }
    } catch (error) {
      logger.log?.(`[push] tick failed: ${error?.message || error}`);
    } finally {
      busy = false;
    }
  }

  return {
    start() {
      if (timer) return;
      timer = setInterval(() => { tick().catch(() => {}); }, TICK_MS);
      timer.unref?.();
      tick().catch(() => {});
    },
    stop() {
      if (timer) clearInterval(timer);
      timer = null;
    },
    tick,
    state: () => ({ ...state })
  };
}

module.exports = {
  createPushScheduler,
  evaluateAlerts,
  parseDailyTime,
  defaultState,
  loadState,
  saveState
};
