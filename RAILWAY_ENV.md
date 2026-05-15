# Railway Environment Variables

Required environment variables for deploying Sellisy on Railway.

## Database

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Railway provides this automatically when you add a Postgres plugin) |

## Application

| Variable | Description |
|---|---|
| `SESSION_SECRET` | Random string for Express session encryption |
| `APP_URL` | Public URL of the deployed app (e.g., `https://sellisy.up.railway.app`) |
| `PORT` | Server port (Railway sets this automatically, defaults to 5000) |
| `ADMIN_EMAIL` | Email for the platform admin account |
| `ADMIN_PASSWORD` | Password for the platform admin account |

## Auth (Clerk)

| Variable | Description |
|---|---|
| `CLERK_SECRET_KEY` | Clerk secret key (`sk_...`) |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_...`) |
| `CLERK_AUTH_DOMAIN` | Custom auth domain — defaults to `clerk.sellisy.com` |

## Stripe (Platform-level)

| Variable | Description |
|---|---|
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (**required in production** — webhook will reject events without it) |

**Webhook setup**: at https://dashboard.stripe.com/webhooks add an endpoint pointing to `{APP_URL}/api/stripe/webhook`. Subscribe to:
- `checkout.session.completed`
- `charge.refunded`
- `refund.created`
- `refund.updated`

## PayPal (Platform-level webhooks)

Store owners still configure their own PayPal credentials **per store** (for accepting payments). The platform-level credentials below are only needed for **receiving refund/chargeback webhooks**.

| Variable | Description |
|---|---|
| `PAYPAL_CLIENT_ID` | Platform-level PayPal app client ID (used to authenticate webhook verification calls) |
| `PAYPAL_CLIENT_SECRET` | Platform-level PayPal app client secret |
| `PAYPAL_WEBHOOK_ID` | Webhook resource ID from the PayPal dashboard (generated when you create the webhook below) |
| `PAYPAL_API_BASE` | Defaults to `https://api-m.paypal.com` (live). Set to `https://api-m.sandbox.paypal.com` for sandbox testing |

**Webhook setup**: at https://developer.paypal.com/dashboard/applications, open your app → Webhooks → Add. URL: `{APP_URL}/api/paypal/webhook`. Event types:
- `PAYMENT.CAPTURE.REFUNDED`
- `PAYMENT.CAPTURE.REVERSED`

Copy the generated Webhook ID into `PAYPAL_WEBHOOK_ID`.

⚠️ If `PAYPAL_WEBHOOK_ID` is unset, the webhook route fails closed (rejects every event).

## SendGrid

| Variable | Description |
|---|---|
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email address |

**Event webhook setup** (bounce / complaint / unsubscribe → suppression list): at https://app.sendgrid.com/settings/mail_settings → Event Webhook:
- HTTP POST URL: `{APP_URL}/api/sendgrid/webhook`
- Enable: **Bounced**, **Dropped**, **Spam Reports**, **Unsubscribes**, **Group Unsubscribes**
- Toggle the webhook **on**

Bounced / spam-reported addresses are automatically added to `email_suppression` and skipped on subsequent sends.

## Cloudflare R2 (Object Storage)

| Variable | Description |
|---|---|
| `R2_ACCESS_KEY_ID` | R2 API token access key ID |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret access key |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_BUCKET_NAME` | R2 bucket name (default: `sellisy-storage`) |
| `R2_PUBLIC_URL` | Public URL for the bucket (default: `https://cdn.sellisy.com`) |

## Cloudflare (Custom Domains)

| Variable | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Zone and SSL permissions |
| `CLOUDFLARE_ZONE_ID` | Zone ID for the Cloudflare domain |

## Gumroad (Optional — required only for the one-click "Connect Gumroad" import flow)

Without these set, the importer falls back to letting users paste a personal access token manually.

| Variable | Description |
|---|---|
| `GUMROAD_CLIENT_ID` | OAuth Application ID from your Gumroad app |
| `GUMROAD_CLIENT_SECRET` | OAuth Application Secret from your Gumroad app |
| `GUMROAD_OAUTH_REDIRECT_URI` | Optional override; defaults to `${APP_URL}/api/integrations/gumroad/oauth/callback` |

### Registering the Gumroad app

1. Sign in to Gumroad as the platform owner
2. Go to **Settings → Advanced → Applications** (https://app.gumroad.com/settings/advanced)
3. Click **Create application**
4. **Name:** `Sellisy` (or any name your users will see on the consent screen)
5. **Redirect URI:** `https://sellisy.com/api/integrations/gumroad/oauth/callback` — must match `GUMROAD_OAUTH_REDIRECT_URI` exactly (or `${APP_URL}/api/integrations/gumroad/oauth/callback` if you didn't set the override)
6. **Icon:** upload your logo (optional, shown on the consent screen)
7. Save → copy the **Application ID** to `GUMROAD_CLIENT_ID` and **Application Secret** to `GUMROAD_CLIENT_SECRET` in Railway
8. Restart the service so the new env vars load

## Quick Setup

1. Create a new Railway project and add a PostgreSQL plugin
2. Connect your GitHub repo
3. Add all environment variables above in the Railway dashboard
4. Railway will auto-detect the Dockerfile and deploy
5. After first deploy, set `APP_URL` to the Railway-provided URL
6. Configure third-party webhooks (Stripe, PayPal, SendGrid) per the sections above
7. Run `npm run db:push` against the production DB to apply the schema
