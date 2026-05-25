# Discord auto-role integration

Buyers who purchase a product that has a Discord guild + role configured
automatically get that role in the seller's Discord server. This doc covers
the architecture and the operator-side steps to actually turn it on.

> **Status as of this writing:** schema + product-editor UI are shipped
> (migration 0023, [products.discordGuildId / discordRoleId](shared/schema.ts),
> [customers.discordUserId](shared/schema.ts), and the "Discord auto-role"
> block in [my-products.tsx](client/src/pages/dashboard/my-products.tsx)).
> The bot worker that actually grants the role isn't built yet — see the
> "What's left to build" section below.

## Architecture

```
┌────────────┐    POST /api/checkout    ┌───────────┐
│   Buyer    │ ───────────────────────► │  Sellisy  │
└────────────┘                          └─────┬─────┘
       ▲                                      │
       │  bot grants role in seller's guild   │  webhook completes order
       │                                      ▼
┌──────┴────────┐                       ┌──────────────────┐
│ Sellisy Bot   │ ◄──── grant event ────│ webhookHandlers  │
│  (Discord)    │                       └──────────────────┘
└───────────────┘
```

Three moving pieces:
1. **Seller side:** owner enters `discordGuildId` + `discordRoleId` on each
   product that should grant a role. (Shipped.)
2. **Buyer side:** buyer links their Discord account via OAuth (Discord →
   `customers.discordUserId`). Triggered from the customer portal.
   (**Not shipped** — needs an OAuth callback handler + a "Connect Discord"
   button on `/s/:slug/portal`.)
3. **Worker side:** when `handleCheckoutCompleted` finishes, if the order
   contains products with Discord config AND the buyer has `discordUserId`,
   enqueue a `discord-grant` job. A worker picks it up and calls Discord's
   `PUT /guilds/:guild/members/:user/roles/:role` endpoint. (**Not shipped.**)

## What's already in place (this migration)

| Field | Where | Purpose |
|---|---|---|
| `products.discord_guild_id` | schema + product editor | Seller's Discord server ID |
| `products.discord_role_id`  | schema + product editor | Role to grant on purchase |
| `customers.discord_user_id` | schema | Set during buyer OAuth (not yet wired) |

The owner UI ([my-products.tsx](client/src/pages/dashboard/my-products.tsx))
exposes both product fields in the "Discord auto-role (optional)" section
of the product editor. Setting both turns the integration on for that
product; clearing them disables it.

## What's left to build

In rough dependency order:

### 1. Sellisy-owned Discord application

Operator side (you):
- Create a Discord application at <https://discord.com/developers/applications>
- Add a Bot user; copy the bot token → `DISCORD_BOT_TOKEN` on Railway
- Add OAuth2 redirect URLs:
  - `https://sellisy.com/api/discord/oauth/callback` (for buyer linking)
- Copy Client ID + Secret → `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`
- Add `bot` and `identify` to the bot's OAuth2 scopes
- Generate an installable invite URL with `Manage Roles` permission

The bot needs to be invited to each seller's Discord server individually,
since Discord doesn't allow cross-server bots without an install. Sellers
will need a "Install Sellisy bot to your Discord" button in store settings
that opens the Discord OAuth install URL with their guild pre-selected.

### 2. Buyer-side OAuth flow

- New route `GET /api/discord/oauth/start?orderId=...` → redirects to
  Discord OAuth with `identify` scope and a state token.
- New route `GET /api/discord/oauth/callback?code=...&state=...` → exchanges
  code for a token, fetches `users/@me`, writes `discord_user_id` on the
  customer record, redirects back to the buyer portal with a flash message.
- "Connect Discord" button on `/s/:slug/portal` that fires off `/start`.

### 3. Grant worker

- New BullMQ queue `discord-grants` in [server/queue/queues.ts](server/queue/queues.ts).
- Enqueue from `handleCheckoutCompleted` in
  [webhookHandlers.ts](server/webhookHandlers.ts) when the order's products
  include any with `discordGuildId + discordRoleId` AND the customer has
  `discordUserId`.
- Worker (`server/jobs/discord-grant.ts`) calls
  `PUT https://discord.com/api/v10/guilds/{guild}/members/{user}/roles/{role}`
  with `Authorization: Bot {DISCORD_BOT_TOKEN}`.
- On 4xx (missing role / user not in guild / bot kicked), audit-log and
  drop. On 5xx, BullMQ retries with backoff.

### 4. Retroactive grant on buyer linking

When a buyer connects Discord AFTER they've already bought products that
have Discord configured, the worker should backfill: query all
`COMPLETED` orders for that customer with Discord-configured products and
issue role grants. Otherwise late linkers get nothing.

## Plan-tier gating

Per [COMPETITOR_ROADMAP.md](COMPETITOR_ROADMAP.md), Discord auto-role is
positioned as a Whop wedge — high-perceived-value. Suggested gating:
**Growth tier and up** (matches the affiliate program gate). Enforce in
the product editor save handler (`server/routes/products.ts`) — reject
non-empty `discordGuildId` / `discordRoleId` for `basic` tier owners with
a clean error message.

## Env vars (when ready to ship)

| Variable | Where it's used |
|---|---|
| `DISCORD_BOT_TOKEN` | Worker, for the `Authorization: Bot` header |
| `DISCORD_CLIENT_ID` | OAuth start URL |
| `DISCORD_CLIENT_SECRET` | OAuth token exchange |

Add to [RAILWAY_ENV.md](RAILWAY_ENV.md) at the same time the worker lands.

## Manual setup steps for sellers (once the worker ships)

1. Owner: Settings → Integrations → "Install Sellisy bot in my Discord"
2. Discord redirects to the bot install flow, owner picks their server
3. Back in dashboard, the owner now sees their `guildId` auto-populated.
4. On each product, owner enters the role ID they want to grant. (Discord
   role IDs are visible in Discord with developer mode enabled, or via
   the eventual "pick role" dropdown in the product editor.)
