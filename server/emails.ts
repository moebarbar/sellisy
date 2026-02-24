import { sendEmail } from './sendgridClient';

const BRAND_COLOR = '#6366f1';
const BRAND_NAME = 'Sellisy';

function baseLayout(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:${BRAND_COLOR};padding:24px 32px;">
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${BRAND_NAME}</h1>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
<p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Powered by ${BRAND_NAME} &mdash; Digital Product Storefronts</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function sendOrderConfirmationEmail(params: {
  buyerEmail: string;
  storeName: string;
  storeSlug: string;
  orderId: string;
  totalCents: number;
  items: { title: string; priceCents: number }[];
  downloadToken: string;
  baseUrl: string;
}) {
  const { buyerEmail, storeName, orderId, totalCents, items, downloadToken, baseUrl } = params;

  const itemRows = items.map(i =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;">${i.title}</td>
     <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;color:#374151;text-align:right;">${formatCents(i.priceCents)}</td></tr>`
  ).join('');

  const downloadUrl = `${baseUrl}/download/${downloadToken}`;

  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Order Confirmed!</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">Thank you for your purchase from <strong>${storeName}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr style="background:#f9fafb;"><th style="padding:10px;text-align:left;color:#6b7280;font-size:13px;text-transform:uppercase;">Product</th><th style="padding:10px;text-align:right;color:#6b7280;font-size:13px;text-transform:uppercase;">Price</th></tr>
      ${itemRows}
      <tr><td style="padding:12px 0;font-weight:700;color:#111827;">Total</td><td style="padding:12px 0;font-weight:700;color:#111827;text-align:right;">${formatCents(totalCents)}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${downloadUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Download Your Products</a>
    </td></tr></table>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">Order ID: ${orderId}<br>This download link expires in 7 days.</p>`;

  try {
    await sendEmail(buyerEmail, `Order Confirmed — ${storeName}`, baseLayout(content));
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
  }
}

export async function sendDownloadLinkEmail(params: {
  buyerEmail: string;
  storeName: string;
  downloadToken: string;
  baseUrl: string;
}) {
  const { buyerEmail, storeName, downloadToken, baseUrl } = params;
  const downloadUrl = `${baseUrl}/download/${downloadToken}`;

  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Download Link</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">Here's your download link for your purchase from <strong>${storeName}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${downloadUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Download Your Products</a>
    </td></tr></table>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">This download link expires in 7 days.</p>`;

  try {
    await sendEmail(buyerEmail, `Your Download — ${storeName}`, baseLayout(content));
  } catch (err) {
    console.error('Failed to send download link email:', err);
  }
}

export async function sendLeadMagnetEmail(params: {
  buyerEmail: string;
  storeName: string;
  productTitle: string;
  downloadToken: string;
  baseUrl: string;
}) {
  const { buyerEmail, storeName, productTitle, downloadToken, baseUrl } = params;
  const downloadUrl = `${baseUrl}/download/${downloadToken}`;

  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Your Free Download is Ready!</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">You've claimed <strong>${productTitle}</strong> from <strong>${storeName}</strong>. Click below to download it.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="${downloadUrl}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Download Now</a>
    </td></tr></table>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;text-align:center;">This download link expires in 7 days.</p>`;

  try {
    await sendEmail(buyerEmail, `Your Free Download — ${productTitle}`, baseLayout(content));
  } catch (err) {
    console.error('Failed to send lead magnet email:', err);
  }
}

export async function sendNewOrderNotificationEmail(params: {
  ownerEmail: string;
  storeName: string;
  buyerEmail: string;
  orderId: string;
  totalCents: number;
  items: { title: string; priceCents: number }[];
}) {
  const { ownerEmail, storeName, buyerEmail, orderId, totalCents, items } = params;

  const itemList = items.map(i => `<li style="padding:4px 0;color:#374151;">${i.title} — ${formatCents(i.priceCents)}</li>`).join('');

  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">New Sale!</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">You just made a sale on <strong>${storeName}</strong>.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#166534;font-weight:700;font-size:24px;">${formatCents(totalCents)}</p>
      <p style="margin:0;color:#15803d;font-size:14px;">from ${buyerEmail}</p>
    </div>
    <p style="margin:0 0 8px;color:#374151;font-weight:600;">Products sold:</p>
    <ul style="margin:0 0 16px;padding-left:20px;">${itemList}</ul>
    <p style="margin:0;color:#9ca3af;font-size:13px;">Order ID: ${orderId}</p>`;

  try {
    await sendEmail(ownerEmail, `New Sale on ${storeName} — ${formatCents(totalCents)}`, baseLayout(content));
  } catch (err) {
    console.error('Failed to send new order notification email:', err);
  }
}

export async function sendWelcomeEmail(params: {
  email: string;
  firstName: string;
}) {
  const { email, firstName } = params;

  const content = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Welcome to ${BRAND_NAME}, ${firstName}!</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">Your account is set up and ready to go. Here's what you can do:</p>
    <ul style="margin:0 0 24px;padding-left:20px;">
      <li style="padding:6px 0;color:#374151;">Create your own digital product storefront</li>
      <li style="padding:6px 0;color:#374151;">Import products from the library or upload your own</li>
      <li style="padding:6px 0;color:#374151;">Accept payments via Stripe or PayPal</li>
      <li style="padding:6px 0;color:#374151;">Build knowledge bases with our content creator</li>
    </ul>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <a href="#" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">Go to Dashboard</a>
    </td></tr></table>`;

  try {
    await sendEmail(email, `Welcome to ${BRAND_NAME}!`, baseLayout(content));
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}
