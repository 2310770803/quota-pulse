'use strict';

// SMTP email push (ported from the Python mail_push/qq_email.py).
// Defaults mirror QQ mail: smtp.qq.com:465 over SSL with an auth code.

const nodemailer = require('nodemailer');

function normalizeRecipientList(value) {
  return String(value || '')
    .replace(/[；;，]/g, ',')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function emailConfigured({ sender, authCode, recipients, smtpServer, smtpPort }) {
  return Boolean(
    String(sender || '').trim()
    && String(authCode || '').trim()
    && normalizeRecipientList(recipients).length > 0
    && String(smtpServer || '').trim()
    && Number(smtpPort)
  );
}

async function sendEmailMessage({ sender, authCode, recipients, smtpServer = 'smtp.qq.com', smtpPort = 465, subject = 'Quota Pulse 额度通知', text }) {
  const to = normalizeRecipientList(recipients);
  if (!emailConfigured({ sender, authCode, recipients, smtpServer, smtpPort })) {
    throw new Error('邮件：配置不完整');
  }
  const port = Number(smtpPort) || 465;
  const transport = nodemailer.createTransport({
    host: String(smtpServer || '').trim() || 'smtp.qq.com',
    port,
    secure: port === 465,
    connectionTimeout: 20000,
    auth: { user: String(sender).trim(), pass: String(authCode).trim() }
  });
  const info = await transport.sendMail({
    from: String(sender).trim(),
    to: to.join(', '),
    subject,
    text: String(text ?? '')
  });
  return { channel: 'email', recipients: to, messageId: info?.messageId || null };
}

module.exports = {
  normalizeRecipientList,
  emailConfigured,
  sendEmailMessage
};
