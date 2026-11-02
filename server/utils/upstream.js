// Shared guards for the routes that pass requests on to Time-Team and the KNRB (foys) API.
//
// Every value from the query string ends up in an upstream URL. Unchecked, `?id=../../x` or
// `?query=a&b=c` would let anyone use this server as a proxy for arbitrary paths on those APIs.
// So a value must be a single string of the expected shape, and it is URL-encoded on the way out.

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const NUMBER = /^\d{1,12}$/;

export function queryString(event, name) {
  const value = getQuery(event)[name];
  return typeof value === 'string' ? value.trim() : '';
}

export const validId = (value) => ID.test(value);
export const validNumber = (value) => NUMBER.test(value);
export const validSearch = (value) => value.length >= 2 && value.length <= 100;

// The frontend has always received `200 { error }` on failure; keep that shape, but never pass
// on upstream error details.
export const failure = (message) => ({ error: message });

// A small in-memory cache per worker instance: the same person or search within ten minutes
// does not hit the upstream API again. Capped, so a stream of unique queries cannot grow it
// without bound. Results are cloned, because some routes reshape what they get back.
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map();

export async function upstream(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    cache.delete(url);
    cache.set(url, hit);
    return structuredClone(hit.value);
  }
  let value;
  try {
    value = await $fetch(url, { timeout: 10_000, retry: 0 });
  } catch (error) {
    // Log host, path and status only: the query string can hold a searched name.
    const { host, pathname } = new URL(url);
    console.error(`[upstream] ${host}${pathname} failed: ${error?.statusCode ?? error?.cause?.code ?? error?.message}`);
    throw error;
  }
  cache.set(url, { at: Date.now(), value });
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  return structuredClone(value);
}

// People who asked not to be shown (privacy page): comma-separated ids in the environment
// variable NUXT_BLOCKED_PERSON_IDS, Time-Team and KNRB ids alike. On Cloudflare the variables
// reach the runtime config per request, so it needs the event.
export function isBlocked(event, id) {
  const raw = useRuntimeConfig(event).blockedPersonIds || '';
  return raw.split(',').map((s) => s.trim()).includes(String(id));
}
