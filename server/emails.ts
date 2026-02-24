import { sendEmail } from './sendgridClient';

const BRAND_COLOR = '#6366f1';
const BRAND_NAME = 'Sellisy';
const BRAND_URL = 'https://sellisy.com';

function baseLayout(content: string, preheader?: string) {
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>`
    : '';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
${preheaderHtml}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:${BRAND_COLOR};padding:24px 32px;">
<h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${BRAND_NAME}</h1>
</td></tr>
<tr><td style="padding:32px;">${content}</td></tr>
<tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
<p style="margin:0 0 4px;color:#9ca3af;font-size:12px;text-align:center;">Powered by <a href="${BRAND_URL}" style="color:${BRAND_COLOR};text-decoration:none;">${BRAND_NAME}</a> &mdash; Digital Product Storefronts</p>
<p style="margin:0;color:#c0c4cc;font-size:11px;text-align:center;">You received this email because of your activity on a ${BRAND_NAME}-powered store.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function ctaButton(label: string, url: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center">
    <a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.2px;">${label}</a>
  </td></tr></table>`;
}

function sectionHeading(text: string): string {
  return `<h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${text}</h2>`;
}

function bodyText(text: string): string {
  return `<p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">`;
}

// ─── 1. ORDER CONFIRMATION ───────────────────────────────────────────

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
    `<tr><td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">${i.title}</td>
     <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#374151;text-align:right;font-size:14px;white-space:nowrap;">${formatCents(i.priceCents)}</td></tr>`
  ).join('');

  const downloadUrl = `${baseUrl}/download/${downloadToken}`;

  const content = `
    ${sectionHeading('Your order is confirmed')}
    ${bodyText(`Thanks for your purchase from <strong>${storeName}</strong>. Your digital products are ready for download right now.`)}
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="background:#f3f4f6;">
          <th style="padding:10px 12px;text-align:left;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Product</th>
          <th style="padding:10px 12px;text-align:right;color:#6b7280;font-size:12px;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Price</th>
        </tr>
        ${itemRows}
        <tr>
          <td style="padding:14px 12px;font-weight:700;color:#111827;font-size:15px;">Total</td>
          <td style="padding:14px 12px;font-weight:700;color:#111827;text-align:right;font-size:15px;">${formatCents(totalCents)}</td>
        </tr>
      </table>
    </div>
    ${ctaButton('Download Your Products', downloadUrl)}
    ${divider()}
    <p style="margin:0 0 4px;color:#9ca3af;font-size:13px;text-align:center;">Order ID: <strong>${orderId}</strong></p>
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">This download link is valid for 7 days. If you need a new link, contact the store owner.</p>`;

  try {
    await sendEmail(
      buyerEmail,
      `Order Confirmed - ${storeName}`,
      baseLayout(content, `Your order from ${storeName} is confirmed. Download your products now.`)
    );
  } catch (err) {
    console.error('Failed to send order confirmation email:', err);
  }
}

// ─── 2. DOWNLOAD LINK ───────────────────────────────────────────────

export async function sendDownloadLinkEmail(params: {
  buyerEmail: string;
  storeName: string;
  downloadToken: string;
  baseUrl: string;
}) {
  const { buyerEmail, storeName, downloadToken, baseUrl } = params;
  const downloadUrl = `${baseUrl}/download/${downloadToken}`;

  const content = `
    ${sectionHeading('Your download is ready')}
    ${bodyText(`Here is the download link for your purchase from <strong>${storeName}</strong>. Click the button below to access your files instantly.`)}
    ${ctaButton('Download Now', downloadUrl)}
    ${divider()}
    <p style="margin:0 0 4px;color:#6b7280;font-size:13px;"><strong>Having trouble?</strong></p>
    <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Copy and paste this link into your browser:</p>
    <p style="margin:0;color:${BRAND_COLOR};font-size:12px;word-break:break-all;">${downloadUrl}</p>
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;text-align:center;">This link is valid for 7 days.</p>`;

  try {
    await sendEmail(
      buyerEmail,
      `Your Download - ${storeName}`,
      baseLayout(content, `Your download from ${storeName} is ready.`)
    );
  } catch (err) {
    console.error('Failed to send download link email:', err);
  }
}

// ─── 3. LEAD MAGNET / FREE DOWNLOAD ─────────────────────────────────

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
    ${sectionHeading('Your free download is ready')}
    ${bodyText(`Great news! You have successfully claimed <strong>${productTitle}</strong> from <strong>${storeName}</strong>. Your file is ready to download right now.`)}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:8px;text-align:center;">
      <p style="margin:0 0 4px;color:#166534;font-weight:700;font-size:16px;">${productTitle}</p>
      <p style="margin:0;color:#15803d;font-size:13px;">Free download from ${storeName}</p>
    </div>
    ${ctaButton('Download Your Free Product', downloadUrl)}
    ${divider()}
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">This download link is valid for 7 days. Enjoy your product!</p>`;

  try {
    await sendEmail(
      buyerEmail,
      `Your Free Download: ${productTitle}`,
      baseLayout(content, `Your free download of ${productTitle} from ${storeName} is ready.`)
    );
  } catch (err) {
    console.error('Failed to send lead magnet email:', err);
  }
}

// ─── 4. NEW ORDER NOTIFICATION (to store owner) ─────────────────────

export async function sendNewOrderNotificationEmail(params: {
  ownerEmail: string;
  storeName: string;
  buyerEmail: string;
  orderId: string;
  totalCents: number;
  items: { title: string; priceCents: number }[];
}) {
  const { ownerEmail, storeName, buyerEmail, orderId, totalCents, items } = params;

  const itemList = items.map(i =>
    `<li style="padding:6px 0;color:#374151;font-size:14px;">${i.title} &mdash; <span style="color:#6b7280;">${formatCents(i.priceCents)}</span></li>`
  ).join('');

  const content = `
    ${sectionHeading('You just made a sale')}
    ${bodyText(`Congratulations! A customer just purchased from <strong>${storeName}</strong>. Here are the details of the order.`)}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 2px;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Revenue</p>
      <p style="margin:0 0 8px;color:#166534;font-weight:700;font-size:28px;">${formatCents(totalCents)}</p>
      <p style="margin:0;color:#4b5563;font-size:13px;">Paid by <strong>${buyerEmail}</strong></p>
    </div>
    <p style="margin:0 0 8px;color:#374151;font-weight:600;font-size:14px;">Products sold:</p>
    <ul style="margin:0 0 20px;padding-left:20px;">${itemList}</ul>
    ${ctaButton('View in Dashboard', `${BRAND_URL}/dashboard`)}
    ${divider()}
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Order ID: <strong>${orderId}</strong></p>`;

  try {
    await sendEmail(
      ownerEmail,
      `New Sale on ${storeName} - ${formatCents(totalCents)}`,
      baseLayout(content, `You made a ${formatCents(totalCents)} sale on ${storeName}.`)
    );
  } catch (err) {
    console.error('Failed to send new order notification email:', err);
  }
}

// ─── 5. WELCOME EMAIL ───────────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  email: string;
  firstName: string;
}) {
  const { email, firstName } = params;

  const content = `
    ${sectionHeading(`Welcome to ${BRAND_NAME}, ${firstName}`)}
    ${bodyText(`Thanks for creating your account. ${BRAND_NAME} gives you everything you need to sell digital products online — storefronts, payments, content creation, and more. Here is what you can do right away:`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border-radius:8px;margin-bottom:8px;">
          <p style="margin:0 0 2px;color:#111827;font-weight:600;font-size:14px;">Create your storefront</p>
          <p style="margin:0;color:#6b7280;font-size:13px;">Set up a branded store with your own domain, logo, and color scheme in minutes.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border-radius:8px;margin-bottom:8px;">
          <p style="margin:0 0 2px;color:#111827;font-weight:600;font-size:14px;">Add your products</p>
          <p style="margin:0;color:#6b7280;font-size:13px;">Upload digital products or import from the library. Set prices, descriptions, and delivery files.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border-radius:8px;margin-bottom:8px;">
          <p style="margin:0 0 2px;color:#111827;font-weight:600;font-size:14px;">Accept payments</p>
          <p style="margin:0;color:#6b7280;font-size:13px;">Connect Stripe or PayPal and start earning from your first sale.</p>
        </td>
      </tr>
      <tr><td style="height:8px;"></td></tr>
      <tr>
        <td style="padding:12px 16px;background:#f9fafb;border-radius:8px;">
          <p style="margin:0 0 2px;color:#111827;font-weight:600;font-size:14px;">Build knowledge bases</p>
          <p style="margin:0;color:#6b7280;font-size:13px;">Create courses, guides, and SOPs with the built-in content editor and publish them for your audience.</p>
        </td>
      </tr>
    </table>
    ${ctaButton('Go to Your Dashboard', `${BRAND_URL}/dashboard`)}
    ${bodyText(`If you need help getting started, check out the Marketing Playbook inside your dashboard for step-by-step strategies to grow your business.`)}`;

  try {
    await sendEmail(
      email,
      `Welcome to ${BRAND_NAME} - Let's get started`,
      baseLayout(content, `Welcome to ${BRAND_NAME}, ${firstName}! Your account is ready.`)
    );
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

// ─── TEST UTILITY: Send all email types ─────────────────────────────

export async function sendAllTestEmails(toEmail: string, baseUrl: string) {
  const results: { type: string; status: string; error?: string }[] = [];

  const testOrder = {
    id: 'TEST-ORD-' + Date.now(),
    storeName: 'Demo Digital Store',
    storeSlug: 'demo-digital-store',
    totalCents: 4997,
    items: [
      { title: 'Ultimate Social Media Bundle', priceCents: 2997 },
      { title: 'Email Marketing Templates Pack', priceCents: 2000 },
    ],
    downloadToken: 'test-token-preview-only',
  };

  try {
    await sendOrderConfirmationEmail({
      buyerEmail: toEmail,
      storeName: testOrder.storeName,
      storeSlug: testOrder.storeSlug,
      orderId: testOrder.id,
      totalCents: testOrder.totalCents,
      items: testOrder.items,
      downloadToken: testOrder.downloadToken,
      baseUrl,
    });
    results.push({ type: 'Order Confirmation', status: 'sent' });
  } catch (err: any) {
    results.push({ type: 'Order Confirmation', status: 'failed', error: err.message });
  }

  try {
    await sendDownloadLinkEmail({
      buyerEmail: toEmail,
      storeName: testOrder.storeName,
      downloadToken: testOrder.downloadToken,
      baseUrl,
    });
    results.push({ type: 'Download Link', status: 'sent' });
  } catch (err: any) {
    results.push({ type: 'Download Link', status: 'failed', error: err.message });
  }

  try {
    await sendLeadMagnetEmail({
      buyerEmail: toEmail,
      storeName: testOrder.storeName,
      productTitle: 'Free Instagram Growth Guide',
      downloadToken: testOrder.downloadToken,
      baseUrl,
    });
    results.push({ type: 'Lead Magnet', status: 'sent' });
  } catch (err: any) {
    results.push({ type: 'Lead Magnet', status: 'failed', error: err.message });
  }

  try {
    await sendNewOrderNotificationEmail({
      ownerEmail: toEmail,
      storeName: testOrder.storeName,
      buyerEmail: 'customer@example.com',
      orderId: testOrder.id,
      totalCents: testOrder.totalCents,
      items: testOrder.items,
    });
    results.push({ type: 'New Order Notification', status: 'sent' });
  } catch (err: any) {
    results.push({ type: 'New Order Notification', status: 'failed', error: err.message });
  }

  try {
    await sendWelcomeEmail({
      email: toEmail,
      firstName: 'Moe',
    });
    results.push({ type: 'Welcome', status: 'sent' });
  } catch (err: any) {
    results.push({ type: 'Welcome', status: 'failed', error: err.message });
  }

  return results;
}
