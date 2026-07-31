'use strict';

// Feishu custom-bot webhook push (ported from the Python feishu/bot.py).
// Text messages only, optional HMAC-SHA256 sign key.

const crypto = require('node:crypto');

function feishuSign(timestamp, signKey) {
  const stringToSign = `${timestamp}\n${signKey}`;
  const digest = crypto.createHmac('sha256', stringToSign).digest();
  return digest.toString('base64');
}

async function sendFeishuMessage({ webhookUrl, signKey = '', text, fetchImpl, timeoutMs = 15000 }) {
  const url = String(webhookUrl || '').trim();
  if (!url) throw new Error('飞书：未配置 webhook');
  const body = { msg_type: 'text', content: { text: String(text ?? '') } };
  if (signKey) {
    const timestamp = Math.floor(Date.now() / 1000);
    body.timestamp = String(timestamp);
    body.sign = feishuSign(timestamp, signKey);
  }
  const doFetch = fetchImpl || globalThis.fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await doFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || (typeof result.code === 'number' && result.code !== 0)) {
      throw new Error(`飞书机器人发送失败：${JSON.stringify(result).slice(0, 200)}`);
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  feishuSign,
  sendFeishuMessage
};
