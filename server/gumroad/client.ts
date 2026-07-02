import type { GumroadUser, GumroadProduct, GumroadSale, GumroadSubscriber, GumroadOfferCode } from './types';
import { GumroadAPIError } from './types';
import { safeFetch } from '../lib/safe-url';

const BASE_URL = 'https://api.gumroad.com/v2';
const MAX_RETRIES = 3;
const MIN_DELAY_MS = 1000;
// Simple concurrency + rate limiting: max 2 in-flight, 500ms between requests
let inFlight = 0;
const MAX_CONCURRENT = 2;
let lastRequestAt = 0;

async function throttle() {
  while (inFlight >= MAX_CONCURRENT) {
    await sleep(50);
  }
  const now = Date.now();
  const sinceLastRequest = now - lastRequestAt;
  if (sinceLastRequest < 500) {
    await sleep(500 - sinceLastRequest);
  }
  lastRequestAt = Date.now();
  inFlight++;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function gumroadFetch<T>(
  path: string,
  accessToken: string,
  options?: RequestInit,
): Promise<T> {
  await throttle();
  let attempt = 0;
  try {
    while (true) {
      attempt++;
      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          ...(options?.headers ?? {}),
        },
      });

      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        if (attempt > MAX_RETRIES) {
          throw new GumroadAPIError(res.status, `Gumroad API error ${res.status} after ${MAX_RETRIES} retries`);
        }
        await sleep(MIN_DELAY_MS * Math.pow(2, attempt - 1));
        continue;
      }

      if (!res.ok) {
        let msg = `Gumroad API error ${res.status}`;
        try {
          const body = await res.json() as any;
          if (body?.message) msg = body.message;
        } catch { /* ignore */ }
        throw new GumroadAPIError(res.status, msg);
      }

      const json = await res.json() as any;
      if (!json.success) {
        throw new GumroadAPIError(res.status, json.message || 'Gumroad API returned success=false');
      }
      return json as T;
    }
  } finally {
    inFlight--;
  }
}

export async function verifyToken(accessToken: string): Promise<GumroadUser> {
  const res = await gumroadFetch<{ user: GumroadUser }>('/user', accessToken);
  return res.user;
}

export async function listProducts(accessToken: string): Promise<GumroadProduct[]> {
  const res = await gumroadFetch<{ products: GumroadProduct[] }>('/products', accessToken);
  return res.products;
}

export async function getProduct(accessToken: string, id: string): Promise<GumroadProduct> {
  const res = await gumroadFetch<{ product: GumroadProduct }>(`/products/${id}`, accessToken);
  return res.product;
}

export async function* listSales(accessToken: string): AsyncGenerator<GumroadSale[]> {
  let page = 1;
  while (true) {
    const res = await gumroadFetch<{ sales: GumroadSale[] }>(
      `/sales?page=${page}`,
      accessToken,
    );
    const sales = res.sales ?? [];
    if (sales.length === 0) break;
    yield sales;
    if (sales.length < 100) break;
    page++;
  }
}

export async function listSubscribers(accessToken: string, productId: string): Promise<GumroadSubscriber[]> {
  const res = await gumroadFetch<{ subscribers: GumroadSubscriber[] }>(
    `/products/${productId}/subscribers`,
    accessToken,
  );
  return res.subscribers ?? [];
}

export async function listOfferCodes(accessToken: string, productId: string): Promise<GumroadOfferCode[]> {
  const res = await gumroadFetch<{ offer_codes: GumroadOfferCode[] }>(
    `/products/${productId}/offer_codes`,
    accessToken,
  );
  return res.offer_codes ?? [];
}

export async function fetchThumbnail(thumbnailUrl: string): Promise<Buffer> {
  const res = await safeFetch(thumbnailUrl); // SSRF guard: user-supplied URL from Gumroad payload
  if (!res.ok) throw new Error(`Failed to fetch thumbnail: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
