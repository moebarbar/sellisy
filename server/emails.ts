import { sendEmail } from './sendgridClient';

function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n\0]/g, '');
}

function escapeHtml(value: string | undefined | null): string {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BRAND_COLOR = '#6366f1';
const BRAND_NAME = 'Sellisy';
const BRAND_URL = 'https://sellisy.com';

export function baseLayout(content: string, preheader?: string) {
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

export function ctaButton(label: string, url: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center">
    <a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:15px;letter-spacing:0.2px;">${label}</a>
  </td></tr></table>`;
}

export function sectionHeading(text: string): string {
  return `<h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${text}</h2>`;
}

export function bodyText(text: string): string {
  return `<p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">${text}</p>`;
}

export function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">`;
}

function junkFolderNote(): string {
  return `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
    <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">&#128233; <strong>Don't see this email in your inbox?</strong> Check your Spam or Junk folder. If you find it there, please move it to your inbox and mark it as "Not Spam" so you don't miss future emails from us.</p>
  </div>`;
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

  const safeStoreName = escapeHtml(storeName);

  const itemRows = items.map(i =>
    `<tr><td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#374151;font-size:14px;">${escapeHtml(i.title)}</td>
     <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#374151;text-align:right;font-size:14px;white-space:nowrap;">${formatCents(i.priceCents)}</td></tr>`
  ).join('');

  const downloadUrl = `${baseUrl}/download/${downloadToken}`;

  const content = `
    ${junkFolderNote()}
    ${sectionHeading('Your order is confirmed')}
    ${bodyText(`Thanks for your purchase from <strong>${safeStoreName}</strong>. Your digital products are ready for download right now.`)}
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
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td align="center">
      <a href="${baseUrl}/s/${encodeURIComponent(params.storeSlug)}/portal" style="display:inline-block;background:#ffffff;color:${BRAND_COLOR};text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:14px;border:2px solid ${BRAND_COLOR};">View Your Customer Portal</a>
    </td></tr></table>
    ${divider()}
    <p style="margin:0 0 4px;color:#9ca3af;font-size:13px;text-align:center;">Order ID: <strong>${escapeHtml(orderId)}</strong></p>
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">This download link is valid for 7 days. You can also access your purchases anytime from the <a href="${baseUrl}/s/${encodeURIComponent(params.storeSlug)}/portal" style="color:${BRAND_COLOR};text-decoration:none;">Customer Portal</a>.</p>`;

  try {
    await sendEmail(
      buyerEmail,
      `Order Confirmed - ${sanitizeHeader(storeName)}`,
      baseLayout(content, `Your order from ${sanitizeHeader(storeName)} is confirmed. Download your products now.`)
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
  const safeStoreName = escapeHtml(storeName);
  const downloadUrl = `${baseUrl}/download/${downloadToken}`;

  const content = `
    ${junkFolderNote()}
    ${sectionHeading('Your download is ready')}
    ${bodyText(`Here is the download link for your purchase from <strong>${safeStoreName}</strong>. Click the button below to access your files instantly.`)}
    ${ctaButton('Download Now', downloadUrl)}
    ${divider()}
    <p style="margin:0 0 4px;color:#6b7280;font-size:13px;"><strong>Having trouble?</strong></p>
    <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Copy and paste this link into your browser:</p>
    <p style="margin:0;color:${BRAND_COLOR};font-size:12px;word-break:break-all;">${downloadUrl}</p>
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;text-align:center;">This link is valid for 7 days.</p>`;

  try {
    await sendEmail(
      buyerEmail,
      `Your Download - ${sanitizeHeader(storeName)}`,
      baseLayout(content, `Your download from ${sanitizeHeader(storeName)} is ready.`)
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
  const safeStoreName = escapeHtml(storeName);
  const safeProductTitle = escapeHtml(productTitle);
  const downloadUrl = `${baseUrl}/download/${downloadToken}`;

  const content = `
    ${junkFolderNote()}
    ${sectionHeading('Your free download is ready')}
    ${bodyText(`Great news! You have successfully claimed <strong>${safeProductTitle}</strong> from <strong>${safeStoreName}</strong>. Your file is ready to download right now.`)}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:8px;text-align:center;">
      <p style="margin:0 0 4px;color:#166534;font-weight:700;font-size:16px;">${safeProductTitle}</p>
      <p style="margin:0;color:#15803d;font-size:13px;">Free download from ${safeStoreName}</p>
    </div>
    ${ctaButton('Download Your Free Product', downloadUrl)}
    ${divider()}
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">This download link is valid for 7 days. Enjoy your product!</p>`;

  try {
    await sendEmail(
      buyerEmail,
      `Your Free Download: ${sanitizeHeader(productTitle)}`,
      baseLayout(content, `Your free download of ${sanitizeHeader(productTitle)} from ${sanitizeHeader(storeName)} is ready.`)
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
  const safeStoreName = escapeHtml(storeName);
  const safeBuyerEmail = escapeHtml(buyerEmail);

  const itemList = items.map(i =>
    `<li style="padding:6px 0;color:#374151;font-size:14px;">${escapeHtml(i.title)} &mdash; <span style="color:#6b7280;">${formatCents(i.priceCents)}</span></li>`
  ).join('');

  const content = `
    ${sectionHeading('You just made a sale')}
    ${bodyText(`Congratulations! A customer just purchased from <strong>${safeStoreName}</strong>. Here are the details of the order.`)}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 2px;color:#15803d;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Revenue</p>
      <p style="margin:0 0 8px;color:#166534;font-weight:700;font-size:28px;">${formatCents(totalCents)}</p>
      <p style="margin:0;color:#4b5563;font-size:13px;">Paid by <strong>${safeBuyerEmail}</strong></p>
    </div>
    <p style="margin:0 0 8px;color:#374151;font-weight:600;font-size:14px;">Products sold:</p>
    <ul style="margin:0 0 20px;padding-left:20px;">${itemList}</ul>
    ${ctaButton('View in Dashboard', `${BRAND_URL}/dashboard`)}
    ${divider()}
    <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">Order ID: <strong>${escapeHtml(orderId)}</strong></p>`;

  try {
    await sendEmail(
      ownerEmail,
      `New Sale on ${sanitizeHeader(storeName)} - ${formatCents(totalCents)}`,
      baseLayout(content, `You made a ${formatCents(totalCents)} sale on ${sanitizeHeader(storeName)}.`)
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
  const safeFirstName = escapeHtml(firstName);

  const content = `
    ${junkFolderNote()}
    ${sectionHeading(`Welcome to ${BRAND_NAME}, ${safeFirstName}`)}
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
      baseLayout(content, `Welcome to ${BRAND_NAME}, ${safeFirstName}! Your account is ready.`)
    );
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}

// ─── AFFILIATE: APPLICATION RECEIVED (to applicant) ──────────────────

export async function sendAffiliateApplicationReceivedEmail(params: {
  applicantEmail: string;
  applicantName: string | null;
  storeName: string;
  storeSlug: string;
}) {
  const { applicantEmail, applicantName, storeName } = params;
  const greet = applicantName ? `Hi ${escapeHtml(applicantName)},` : 'Hi there,';
  const safeStore = escapeHtml(storeName);

  const content = `
    ${sectionHeading('Application received')}
    ${bodyText(`${greet} we got your application to be an affiliate for <strong>${safeStore}</strong>.`)}
    ${bodyText("The store owner will review and get back to you. You'll receive another email once your application is approved with your unique tracking link.")}
    ${divider()}
    <p style="margin:0;color:#9ca3af;font-size:12px;">If you didn't apply, you can safely ignore this email.</p>`;

  try {
    await sendEmail(
      applicantEmail,
      `Affiliate application received - ${sanitizeHeader(storeName)}`,
      baseLayout(content, `Your application to promote ${safeStore} is in review.`),
    );
  } catch (err) {
    console.error('Failed to send affiliate application email:', err);
  }
}

// ─── AFFILIATE: APPLICATION APPROVED (with link) ─────────────────────

export async function sendAffiliateApprovedEmail(params: {
  affiliateEmail: string;
  affiliateName: string | null;
  storeName: string;
  affiliateLink: string;
  commissionPercent: number;
  cookieDays: number;
}) {
  const { affiliateEmail, affiliateName, storeName, affiliateLink, commissionPercent, cookieDays } = params;
  const greet = affiliateName ? `Hi ${escapeHtml(affiliateName)},` : 'Hi there,';
  const safeStore = escapeHtml(storeName);
  const safeLink = escapeHtml(affiliateLink);

  const content = `
    ${sectionHeading("You're approved!")}
    ${bodyText(`${greet} you've been approved as an affiliate for <strong>${safeStore}</strong>. Welcome.`)}
    ${bodyText(`Your commission rate is <strong>${commissionPercent}%</strong> of every sale you refer, with a <strong>${cookieDays}-day cookie window</strong>.`)}
    ${ctaButton('Open Your Affiliate Link', affiliateLink)}
    ${bodyText('Or copy the link directly:')}
    <p style="margin:0;padding:12px 14px;background:#f3f4f6;border-radius:6px;color:${BRAND_COLOR};font-size:13px;word-break:break-all;font-family:monospace;">${safeLink}</p>
    ${divider()}
    <p style="margin:0 0 8px;color:#6b7280;font-size:13px;"><strong>How it works</strong></p>
    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">Share this link wherever you promote products — social, blog, email. When someone clicks it and buys within ${cookieDays} days, you earn ${commissionPercent}% of the sale.</p>`;

  try {
    await sendEmail(
      affiliateEmail,
      `You're an affiliate for ${sanitizeHeader(storeName)}`,
      baseLayout(content, `Your unique link for ${safeStore} is ready.`),
    );
  } catch (err) {
    console.error('Failed to send affiliate approved email:', err);
  }
}

// ─── AFFILIATE: PAYOUT SENT ──────────────────────────────────────────

export async function sendAffiliatePayoutSentEmail(params: {
  affiliateEmail: string;
  storeName: string;
  amountCents: number;
  method: string;
  externalRef: string | null;
}) {
  const { affiliateEmail, storeName, amountCents, method, externalRef } = params;
  const safeStore = escapeHtml(storeName);

  const content = `
    ${sectionHeading('Payout sent')}
    ${bodyText(`Your commissions from <strong>${safeStore}</strong> have been paid out.`)}
    <table style="width:100%;margin:24px 0;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Amount</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;text-align:right;">${formatCents(amountCents)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Method</td><td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;">${escapeHtml(method)}</td></tr>
      ${externalRef ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Reference</td><td style="padding:8px 0;color:#111827;font-size:14px;text-align:right;font-family:monospace;">${escapeHtml(externalRef)}</td></tr>` : ''}
    </table>
    ${bodyText(`Check the payment method (${escapeHtml(method)}) for the funds. If you don't see them within a few business days, reach out to the store owner directly.`)}`;

  try {
    await sendEmail(
      affiliateEmail,
      `Payout sent: ${formatCents(amountCents)} from ${sanitizeHeader(storeName)}`,
      baseLayout(content, `${formatCents(amountCents)} paid out to you.`),
    );
  } catch (err) {
    console.error('Failed to send payout email:', err);
  }
}

// ─── COURSE COMMENT: NOTIFY OWNER (buyer posted) ─────────────────────

export async function sendCourseCommentToOwnerEmail(params: {
  ownerEmail: string;
  storeName: string;
  courseTitle: string;
  lessonTitle: string;
  authorName: string;
  bodyExcerpt: string;
  dashboardUrl: string;
}) {
  const { ownerEmail, storeName, courseTitle, lessonTitle, authorName, bodyExcerpt, dashboardUrl } = params;
  const safeStore = escapeHtml(storeName);
  const safeCourse = escapeHtml(courseTitle);
  const safeLesson = escapeHtml(lessonTitle);
  const safeAuthor = escapeHtml(authorName);
  // Truncate the body in the email so a 2000-char rant doesn't blow up the layout.
  const excerpt = bodyExcerpt.length > 280 ? bodyExcerpt.slice(0, 280).trimEnd() + "…" : bodyExcerpt;

  const content = `
    ${sectionHeading("New comment on your course")}
    ${bodyText(`<strong>${safeAuthor}</strong> just posted a comment on the lesson <em>${safeLesson}</em> in <strong>${safeCourse}</strong>.`)}
    <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid ${BRAND_COLOR};background:#f9fafb;color:#374151;font-size:14px;line-height:1.55;border-radius:4px;">
      ${escapeHtml(excerpt)}
    </blockquote>
    ${ctaButton("Moderate in Dashboard", dashboardUrl)}
    ${divider()}
    <p style="margin:0;color:#9ca3af;font-size:12px;">You're receiving this because you own ${safeStore} on Sellisy.</p>`;

  try {
    await sendEmail(
      ownerEmail,
      `New comment on ${sanitizeHeader(courseTitle)}`,
      baseLayout(content, `${safeAuthor} commented on ${safeLesson}.`),
    );
  } catch (err) {
    console.error("Failed to send course-comment-to-owner email:", err);
  }
}

// ─── COURSE COMMENT: NOTIFY BUYER (instructor replied) ───────────────

export async function sendCourseCommentReplyToBuyerEmail(params: {
  buyerEmail: string;
  storeName: string;
  courseTitle: string;
  lessonTitle: string;
  bodyExcerpt: string;
  portalUrl: string;
}) {
  const { buyerEmail, storeName, courseTitle, lessonTitle, bodyExcerpt, portalUrl } = params;
  const safeStore = escapeHtml(storeName);
  const safeCourse = escapeHtml(courseTitle);
  const safeLesson = escapeHtml(lessonTitle);
  const excerpt = bodyExcerpt.length > 280 ? bodyExcerpt.slice(0, 280).trimEnd() + "…" : bodyExcerpt;

  const content = `
    ${sectionHeading("The instructor replied")}
    ${bodyText(`The instructor of <strong>${safeCourse}</strong> just posted on the lesson <em>${safeLesson}</em>.`)}
    <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid ${BRAND_COLOR};background:#f9fafb;color:#374151;font-size:14px;line-height:1.55;border-radius:4px;">
      ${escapeHtml(excerpt)}
    </blockquote>
    ${ctaButton("Open the discussion", portalUrl)}
    ${divider()}
    <p style="margin:0;color:#9ca3af;font-size:12px;">You're getting this because you've also commented on this lesson at ${safeStore}.</p>`;

  try {
    await sendEmail(
      buyerEmail,
      `Instructor replied on ${sanitizeHeader(courseTitle)}`,
      baseLayout(content, `New reply on ${safeLesson}.`),
    );
  } catch (err) {
    console.error("Failed to send course-comment-reply-to-buyer email:", err);
  }
}

// ─── 6. MAGIC LINK ───────────────────────────────────────────────────

export async function sendMagicLinkEmail(params: {
  email: string;
  magicLink: string;
  storeName?: string;
}) {
  const { email, magicLink, storeName } = params;
  const safeStoreName = storeName ? escapeHtml(storeName) : '';
  const context = safeStoreName ? ` for <strong>${safeStoreName}</strong>` : '';

  const content = `
    ${junkFolderNote()}
    ${sectionHeading('Your login link')}
    ${bodyText(`Someone requested access to the customer portal${context} using this email address. Click the button below to sign in and view your purchases.`)}
    ${ctaButton('Sign In to Your Portal', magicLink)}
    ${divider()}
    <p style="margin:0 0 4px;color:#6b7280;font-size:13px;"><strong>Having trouble?</strong></p>
    <p style="margin:0 0 4px;color:#9ca3af;font-size:12px;">Copy and paste this link into your browser:</p>
    <p style="margin:0;color:${BRAND_COLOR};font-size:12px;word-break:break-all;">${magicLink}</p>
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;text-align:center;">This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>`;

  try {
    await sendEmail(
      email,
      `Your Login Link${storeName ? ` - ${sanitizeHeader(storeName)}` : ''}`,
      baseLayout(content, `Sign in to access your purchases${safeStoreName ? ` from ${safeStoreName}` : ''}.`)
    );
  } catch (err) {
    console.error('Failed to send magic link email:', err);
  }
}

// ─── 7. GUMROAD MIGRATION WELCOME ────────────────────────────────────

export async function sendGumroadMigrationEmail(params: {
  buyerEmail: string;
  buyerName: string | null;
  storeName: string;
  storePortalUrl: string;
  products: string[];  // product titles purchased
}) {
  const { buyerEmail, buyerName, storeName, storePortalUrl, products } = params;

  const safeStoreName = escapeHtml(storeName);
  const firstName = buyerName ? escapeHtml(buyerName.split(' ')[0]) : null;
  const greeting = firstName ? `Hi ${firstName},` : 'Hi there,';
  const productList = products.length > 0
    ? `<ul style="margin:0 0 20px;padding:0 0 0 20px;">${products.map(t => `<li style="color:#4b5563;font-size:14px;line-height:1.8;">${escapeHtml(t)}</li>`).join('')}</ul>`
    : '';

  const content = `
    ${junkFolderNote()}
    ${sectionHeading(`Your ${safeStoreName} purchases are ready`)}
    ${bodyText(`${greeting} Great news — your past purchases are now available on <strong>${safeStoreName}</strong>. Everything you bought before has been migrated over so you don't lose access to anything.`)}
    ${productList ? `<p style="margin:0 0 8px;color:#374151;font-size:14px;font-weight:600;">Your purchases:</p>${productList}` : ''}
    ${bodyText(`You can access your downloads and purchase history anytime from your customer portal.`)}
    ${ctaButton('Access My Purchases', storePortalUrl)}
    ${divider()}
    ${bodyText(`If you have any questions about your purchases, reply to this email or contact the store directly. Your downloads are waiting for you.`)}`;

  await sendEmail(
    buyerEmail,
    sanitizeHeader(`Your ${storeName} purchases are now available`),
    baseLayout(content, `Your past ${safeStoreName} purchases are now ready to access.`),
  );
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
