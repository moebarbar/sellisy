CREATE TYPE "public"."block_type" AS ENUM('text', 'heading1', 'heading2', 'heading3', 'image', 'video', 'link', 'bullet_list', 'numbered_list', 'todo', 'toggle', 'code', 'quote', 'divider', 'callout');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('draft', 'sent');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('PERCENT', 'FIXED');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."gumroad_import_status" AS ENUM('pending', 'importing', 'awaiting_files', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'paypal');--> statement-breakpoint
CREATE TYPE "public"."plan_tier" AS ENUM('basic', 'pro', 'max');--> statement-breakpoint
CREATE TYPE "public"."product_source" AS ENUM('PLATFORM', 'USER');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('DRAFT', 'ACTIVE');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('digital', 'software', 'template', 'ebook', 'course', 'graphics');--> statement-breakpoint
CREATE TYPE "public"."store_event_type" AS ENUM('page_view', 'product_view', 'bundle_view', 'checkout_start', 'add_to_cart');--> statement-breakpoint
CREATE TYPE "public"."strategy_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."strategy_impact" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."strategy_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "blog_blocks" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar(64) NOT NULL,
	"type" "block_type" DEFAULT 'text' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"cover_image_url" text,
	"font_family" text,
	"category" text DEFAULT 'General' NOT NULL,
	"reading_time_minutes" integer DEFAULT 1 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"author_name" text,
	"author_image_url" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundle_items" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundles" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"thumbnail_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"code" text NOT NULL,
	"discount_type" "discount_type" DEFAULT 'PERCENT' NOT NULL,
	"discount_value" integer DEFAULT 0 NOT NULL,
	"max_uses" integer,
	"current_uses" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_sessions" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "download_tokens" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(64) NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "download_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"status" "email_status" NOT NULL,
	"error" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_assets" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"storage_key" text NOT NULL,
	"original_name" text NOT NULL,
	"size_bytes" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gumroad_imports" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"owner_id" varchar(64) NOT NULL,
	"status" "gumroad_import_status" DEFAULT 'pending' NOT NULL,
	"gumroad_email" text,
	"gumroad_user_id" text,
	"access_token_encrypted" text DEFAULT '' NOT NULL,
	"products_total" integer DEFAULT 0 NOT NULL,
	"products_imported" integer DEFAULT 0 NOT NULL,
	"customers_total" integer DEFAULT 0 NOT NULL,
	"customers_imported" integer DEFAULT 0 NOT NULL,
	"sales_total" integer DEFAULT 0 NOT NULL,
	"sales_imported" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"welcome_emails_sent_at" timestamp,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "gumroad_product_shells" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_id" varchar(64) NOT NULL,
	"sellisy_product_id" varchar(64) NOT NULL,
	"gumroad_product_id" text NOT NULL,
	"gumroad_short_url" text,
	"file_status" text DEFAULT 'missing' NOT NULL,
	"file_match_hint" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gumroad_product_shells_sellisy_product_id_unique" UNIQUE("sellisy_product_id")
);
--> statement-breakpoint
CREATE TABLE "kb_blocks" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" varchar(64) NOT NULL,
	"type" "block_type" DEFAULT 'text' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_page_attachments" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_pages" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"knowledge_base_id" varchar(64) NOT NULL,
	"parent_page_id" varchar(64),
	"title" text DEFAULT 'Untitled Page' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_bases" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar(64) NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"slug" text,
	"description" text,
	"cover_image_url" text,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"font_family" text,
	"product_id" varchar(64),
	"author_name" text,
	"author_image_url" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketing_strategies" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"steps" text[] NOT NULL,
	"content" text,
	"difficulty" "strategy_difficulty" DEFAULT 'medium' NOT NULL,
	"impact" "strategy_impact" DEFAULT 'medium' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaign_blocks" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar(64) NOT NULL,
	"type" "block_type" DEFAULT 'text' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"subject" text NOT NULL,
	"status" "campaign_status" DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp,
	"recipient_count" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"buyer_email" text NOT NULL,
	"customer_id" varchar(64),
	"total_cents" integer DEFAULT 0 NOT NULL,
	"stripe_session_id" text,
	"paypal_order_id" text,
	"coupon_id" varchar(64),
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar(64),
	"source" "product_source" DEFAULT 'USER' NOT NULL,
	"title" text NOT NULL,
	"slug" text,
	"description" text,
	"tagline" text,
	"category" text DEFAULT 'templates' NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"original_price_cents" integer,
	"thumbnail_url" text,
	"file_url" text,
	"status" "product_status" DEFAULT 'DRAFT' NOT NULL,
	"required_tier" "plan_tier" DEFAULT 'basic' NOT NULL,
	"product_type" "product_type" DEFAULT 'digital' NOT NULL,
	"delivery_instructions" text,
	"access_url" text,
	"redemption_code" text,
	"tags" text[],
	"highlights" text[],
	"version" text,
	"file_size" text,
	"gumroad_product_id" text,
	"imported_from_gumroad" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_gumroad_product_id_unique" UNIQUE("gumroad_product_id")
);
--> statement-breakpoint
CREATE TABLE "store_domains" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"domain" text NOT NULL,
	"registrar" text DEFAULT 'namecheap' NOT NULL,
	"namecheap_order_id" text,
	"registration_date" timestamp,
	"expiration_date" timestamp,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_events" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"event_type" "store_event_type" NOT NULL,
	"product_id" varchar(64),
	"bundle_id" varchar(64),
	"path" text,
	"referrer" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_faqs" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_products" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"custom_price_cents" integer,
	"custom_title" text,
	"custom_description" text,
	"custom_tags" text[],
	"custom_access_url" text,
	"custom_redemption_code" text,
	"custom_delivery_instructions" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_lead_magnet" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"upsell_product_id" varchar(64),
	"upsell_bundle_id" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "store_reviews" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"customer_id" varchar(64) NOT NULL,
	"product_id" varchar(64) NOT NULL,
	"order_id" varchar(64) NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_strategy_progress" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"strategy_id" varchar(64) NOT NULL,
	"status" "strategy_status" DEFAULT 'not_started' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_testimonials" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"quote" text NOT NULL,
	"avatar_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" varchar(64) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"template_key" text DEFAULT 'neon' NOT NULL,
	"tagline" text,
	"logo_url" text,
	"accent_color" text,
	"hero_banner_url" text,
	"payment_provider" "payment_provider" DEFAULT 'stripe' NOT NULL,
	"paypal_client_id" text,
	"paypal_client_secret" text,
	"stripe_publishable_key" text,
	"stripe_secret_key" text,
	"allow_image_download" boolean DEFAULT false NOT NULL,
	"blog_enabled" boolean DEFAULT false NOT NULL,
	"announcement_text" text,
	"announcement_link" text,
	"footer_text" text,
	"social_twitter" text,
	"social_instagram" text,
	"social_youtube" text,
	"social_tiktok" text,
	"social_website" text,
	"favicon_url" text,
	"seo_title" text,
	"seo_description" text,
	"custom_domain" text,
	"domain_status" text,
	"domain_source" text,
	"domain_verified_at" timestamp,
	"cloudflare_hostname_id" text,
	"worker_route_id" text,
	"about_enabled" boolean DEFAULT false NOT NULL,
	"about_headline" text,
	"about_text" text,
	"about_image_url" text,
	"about_cta_text" text,
	"about_cta_url" text,
	"testimonials_enabled" boolean DEFAULT false NOT NULL,
	"faq_enabled" boolean DEFAULT false NOT NULL,
	"newsletter_enabled" boolean DEFAULT false NOT NULL,
	"newsletter_headline" text,
	"newsletter_subtext" text,
	"section_order" text,
	"reviews_enabled" boolean DEFAULT false NOT NULL,
	"show_ratings_on_cards" boolean DEFAULT true NOT NULL,
	"show_discount_badges" boolean DEFAULT true NOT NULL,
	"show_subscriber_count" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" varchar(64) PRIMARY KEY NOT NULL,
	"plan_tier" "plan_tier" DEFAULT 'basic' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "gumroad_imports" ADD CONSTRAINT "gumroad_imports_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gumroad_product_shells" ADD CONSTRAINT "gumroad_product_shells_import_id_gumroad_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."gumroad_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gumroad_product_shells" ADD CONSTRAINT "gumroad_product_shells_sellisy_product_id_products_id_fk" FOREIGN KEY ("sellisy_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_owner_slug_unique" ON "categories" USING btree ("owner_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_store_email_idx" ON "newsletter_subscribers" USING btree ("store_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "store_reviews_customer_product_idx" ON "store_reviews" USING btree ("customer_id","product_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");