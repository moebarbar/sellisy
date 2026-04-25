export type GumroadUser = {
  id: string;
  name: string;
  email: string;
  url: string;
  bio: string | null;
  twitter_handle: string | null;
  user_id: string;
};

export type GumroadProduct = {
  id: string;
  name: string;
  description: string;
  customizable_price: boolean | null;
  custom_permalink: string | null;
  custom_receipt: string | null;
  custom_summary: string | null;
  custom_fields: Array<{ name: string; required: boolean }>;
  deleted: boolean;
  max_purchase_count: number | null;
  preview_url: string | null;
  require_shipping: boolean;
  subscription_duration: 'monthly' | 'yearly' | null;
  published: boolean;
  url: string;
  price: number;
  purchasing_power_parity_prices: Record<string, number>;
  currency: string;
  short_url: string;
  thumbnail_url: string | null;
  tags: string[];
  formatted_price: string;
  file_info: Record<string, unknown>;
};

export type GumroadSale = {
  id: string;
  product_id: string;
  product_name: string;
  email: string;
  purchase_email: string;
  full_name: string | null;
  order_number: number;
  price_cents: number;
  currency: string;
  created_at: string;
  license_key: string | null;
  refunded: boolean;
  chargebacked: boolean;
};

export type GumroadSubscriber = {
  id: string;
  product_id: string;
  email: string;
  status: string;
  created_at: string;
};

export type GumroadOfferCode = {
  id: string;
  name: string;
  amount_off: number;
  offer_type: 'cents' | 'percent';
  max_purchase_count: number | null;
  times_used: number;
  universal: boolean;
};

export class GumroadAPIError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'GumroadAPIError';
  }
}
