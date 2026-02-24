import sgMail from '@sendgrid/mail';
import { convert } from 'html-to-text';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

export async function getUncachableSendGridClient() {
  const { apiKey, email } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
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

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const { client, fromEmail } = await getUncachableSendGridClient();

  const plainText = htmlToPlainText(html);

  const msg = {
    to,
    from: { email: fromEmail, name: 'Sellisy' },
    replyTo: { email: fromEmail, name: 'Sellisy Support' },
    subject,
    html,
    text: plainText,
    headers: {
      'X-Priority': '3',
      'X-Mailer': 'Sellisy Platform',
      'List-Unsubscribe': `<mailto:${fromEmail}?subject=Unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    trackingSettings: {
      clickTracking: { enable: false },
      openTracking: { enable: false },
      subscriptionTracking: { enable: false },
    },
  };

  let lastError: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await client.send(msg);
      await logEmailSend(to, subject, 'sent');
      return;
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.code || err?.response?.statusCode;
      if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        await logEmailSend(to, subject, 'failed', `${err.message || err}`);
        throw err;
      }
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`Email send attempt ${attempt} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  await logEmailSend(to, subject, 'failed', `${lastError?.message || lastError}`);
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
