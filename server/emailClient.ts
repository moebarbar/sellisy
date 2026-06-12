// Transactional email transport — Brevo (formerly Sendinblue) HTTP API.
// Replaces the previous SendGrid client with the SAME surface so call sites
// don't care about the provider:
//
//   setSuppressionCheck(fn)  — wired from routes.ts; consulted before every send
//   setEmailLogger(fn)       — wired from routes.ts; writes email_logs rows
//   sendEmail(to, subject, html, extraHeaders?)
//   sendEmailStaggered(emails[])
//
// Env: BREVO_API_KEY + BREVO_FROM_EMAIL.
// Inbound events (bounce/spam/unsubscribe) arrive at /api/email/webhook/:token
// in server/index.ts and feed the email_suppression table.

import { convert } from 'html-to-text';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

let _isSuppressedFn: ((email: string) => Promise<boolean>) | null = null;

/**
 * Wire up a suppression-check function. Called at the top of sendEmail; if
 * it returns true, the send is skipped and logged as 'failed' with reason
 * 'suppressed'. Set from server/index.ts during route registration.
 */
export function setSuppressionCheck(fn: (email: string) => Promise<boolean>) {
  _isSuppressedFn = fn;
}

function getCredentials(): { apiKey: string; email: string } {
  const apiKey = process.env.BREVO_API_KEY;
  const email = process.env.BREVO_FROM_EMAIL;
  if (apiKey && email) return { apiKey, email };
  throw new Error('Brevo credentials not available (set BREVO_API_KEY and BREVO_FROM_EMAIL)');
}

function htmlToPlainText(html: string): string {
  return convert(html, {
    wordwrap: 80,
    selectors: [
      { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
      { selector: 'img', format: 'skip' },
      { selector: 'table', format: 'dataTable' },
    ],
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  extraHeaders?: Record<string, string>,
): Promise<void> {
  if (_isSuppressedFn) {
    try {
      if (await _isSuppressedFn(to)) {
        await logEmailSend(to, subject, 'failed', 'suppressed: address is on the bounce/complaint list');
        return;
      }
    } catch (err) {
      console.error('Failed to check suppression list:', err);
    }
  }

  const { apiKey, email: fromEmail } = getCredentials();
  const plainText = htmlToPlainText(html);

  // Per-message extraHeaders win over the defaults — e.g. a transactional
  // email with a personalized one-click unsubscribe URL overrides the
  // generic mailto:unsubscribe fallback.
  const payload = {
    sender: { email: fromEmail, name: 'Sellisy' },
    replyTo: { email: fromEmail, name: 'Sellisy Support' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: plainText,
    headers: {
      'X-Priority': '3',
      'X-Mailer': 'Sellisy Platform',
      'List-Unsubscribe': `<mailto:${fromEmail}?subject=Unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      ...(extraHeaders ?? {}),
    },
  };

  let lastError: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await logEmailSend(to, subject, 'sent');
        return;
      }

      const body = await res.text().then(t => t.slice(0, 500)).catch(() => '');
      lastError = new Error(`Brevo ${res.status}: ${body}`);
      // 4xx (except 429) won't succeed on retry — fail fast.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        await logEmailSend(to, subject, 'failed', lastError.message);
        throw lastError;
      }
    } catch (err: any) {
      if (err === lastError) throw err; // the fail-fast above
      lastError = err;
    }
    if (attempt < MAX_RETRIES) {
      const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(`Email send attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  await logEmailSend(to, subject, 'failed', lastError?.message ?? 'unknown error');
  throw lastError;
}

export async function sendEmailStaggered(emails: Array<{ to: string; subject: string; html: string }>) {
  for (let i = 0; i < emails.length; i++) {
    try {
      await sendEmail(emails[i].to, emails[i].subject, emails[i].html);
    } catch (err) {
      console.error(`Staggered email ${i + 1} failed:`, err);
    }
    if (i < emails.length - 1) {
      await sleep(1500);
    }
  }
}

let _logEmailSendFn: ((to: string, subject: string, status: string, error?: string) => Promise<void>) | null = null;

export function setEmailLogger(fn: (to: string, subject: string, status: string, error?: string) => Promise<void>) {
  _logEmailSendFn = fn;
}

async function logEmailSend(to: string, subject: string, status: string, error?: string) {
  if (_logEmailSendFn) {
    try {
      await _logEmailSendFn(to, subject, status, error);
    } catch (err) {
      console.error('Failed to log email send:', err);
    }
  }
  const emoji = status === 'sent' ? '[OK]' : '[FAIL]';
  console.log(`${emoji} Email ${status}: to=${to} subject="${subject}"${error ? ` error=${error}` : ''}`);
}
