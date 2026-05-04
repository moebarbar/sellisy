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

## Stripe (Platform-level)

| Variable | Description |
|---|---|
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (optional but recommended) |

## SendGrid

| Variable | Description |
|---|---|
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email address |

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

## PayPal (Optional)

Store owners configure their own PayPal credentials per-store. No platform-level PayPal env vars needed.

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
6. Configure Stripe webhook to point to `{APP_URL}/api/stripe/webhook`
