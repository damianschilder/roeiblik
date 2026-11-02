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

// ---------------------------------------------------------------------------------------------
// upstream(url, { ttl }): GET a JSON document from Time-Team or foys, with three layers that keep
// the upstream APIs (and the visitor) from waiting on the same answer twice:
//
//  1. Memory: an LRU per server instance, capped by size as well as count (one Time-Team person
//     is ~110 kB, and a Worker isolate has 128 MB in total).
//  2. Edge: the Cloudflare Cache API (`caches.default`), shared by every isolate in the same data
//     centre. On Workers the memory layer rarely hits, because each request may land in a fresh
//     isolate; the edge layer is what makes a second visit fast. Elsewhere (the node-server build,
//     `nuxt dev`) there is no `caches.default` and only the memory layer is used.
//  3. In flight: identical requests that arrive while the first is still on its way share it.
//
// What is cached is the RAW upstream answer. Removal requests (isBlocked) are applied by the
// routes on every request, after upstream() returns, so a newly blocked person disappears as soon
// as the variable is set: no cached copy is ever served without passing that filter. Never cache
// a route's filtered output instead.
//
// Freshness: Time-Team sends `max-age=30` (it serves live regattas); foys sends no caching
// headers. Roeiblik shows results after the fact, so a few minutes is fine: five for Time-Team,
// ten for foys. Nothing is kept longer than ten minutes (the privacy page says so).
// `opts.ttl` (seconds) overrides it; `ttl: 0` skips both caches but still shares requests in flight.
// Every call returns its own copy: routes may reshape what they get.
// ---------------------------------------------------------------------------------------------

const TIMEOUT_MS = 10_000;
const TTL_BY_HOST = {
  'api.beta.regatta.time-team.nl': 5 * 60,
  'api.foys.io': 10 * 60,
};
const DEFAULT_TTL = 5 * 60;
const MAX_TTL = 10 * 60;

const MEMORY_MAX_ENTRIES = 500;
const MEMORY_MAX_CHARS = 8_000_000; // the cached JSON text, in characters
const ENTRY_MAX_CHARS = 1_000_000; // bigger answers go to the edge cache only

const memory = new Map(); // url -> { text, expires }
let memoryChars = 0;
const inflight = new Map(); // url -> Promise<string>

export async function upstream(url, opts = {}) {
  const ttl = ttlFor(url, opts.ttl);
  const hit = ttl > 0 ? memory.get(url) : undefined;
  if (hit) {
    forget(url);
    if (hit.expires > Date.now()) {
      keep(url, hit.text, hit.expires); // move to the most recently used end
      return JSON.parse(hit.text);
    }
  }
  let pending = inflight.get(url);
  if (!pending) {
    pending = load(url, ttl).finally(() => inflight.delete(url));
    inflight.set(url, pending);
  }
  return JSON.parse(await withTimeout(pending));
}

function ttlFor(url, requested) {
  if (requested !== undefined) return Math.min(MAX_TTL, Math.max(0, Math.floor(Number(requested) || 0)));
  try {
    return TTL_BY_HOST[new URL(url).host] ?? DEFAULT_TTL;
  } catch {
    return DEFAULT_TTL;
  }
}

async function load(url, ttl) {
  const edge = ttl > 0 ? edgeCache() : null;
  if (edge) {
    try {
      const cached = await edge.match(url);
      if (cached) {
        const text = await cached.text();
        // Keep the original expiry, so a copy taken from the edge never outlives the TTL.
        const expires = Number(cached.headers.get('x-roeiblik-expires')) || 0;
        if (expires > Date.now()) {
          keep(url, text, expires);
          return text;
        }
      }
    } catch {
      // The edge cache is an optimisation; a failure there falls through to the API.
    }
  }

  const text = await fetchJsonText(url);
  if (ttl > 0) {
    const expires = Date.now() + ttl * 1000;
    keep(url, text, expires);
    if (edge) {
      try {
        await edge.put(url, new Response(text, {
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': `public, max-age=${ttl}`,
            'x-roeiblik-expires': String(expires),
          },
        }));
      } catch {
        // Not stored: the next request fetches again.
      }
    }
  }
  return text;
}

async function fetchJsonText(url) {
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw httpError(response.status);
    const text = await response.text();
    JSON.parse(text); // only valid JSON is cached
    return text;
  } catch (error) {
    // Log host, a masked path and a reason only: ids in the path and the query string (a searched
    // name) are personal data, and so is the body a parse error would quote.
    console.error(`[upstream] ${maskedTarget(url)} failed: ${reason(error)}`);
    throw error;
  }
}

// Callers that join a request in flight wait at most as long as its own timeout, with a timer of
// their own: on Workers the request that started it may be cancelled (its visitor left).
function withTimeout(pending) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(httpError(504, 'TimeoutError')), TIMEOUT_MS + 2_000);
  });
  return Promise.race([pending, timeout]).finally(() => clearTimeout(timer));
}

function keep(url, text, expires) {
  if (text.length > ENTRY_MAX_CHARS) return;
  forget(url);
  memory.set(url, { text, expires });
  memoryChars += text.length;
  for (const oldest of memory.keys()) {
    if (memory.size <= MEMORY_MAX_ENTRIES && memoryChars <= MEMORY_MAX_CHARS) break;
    forget(oldest);
  }
}

function forget(url) {
  const entry = memory.get(url);
  if (!entry) return;
  memory.delete(url);
  memoryChars -= entry.text.length;
}

function edgeCache() {
  // `caches.default` exists only on Cloudflare Workers.
  return typeof caches !== 'undefined' && caches?.default ? caches.default : null;
}

function httpError(statusCode, name = 'HTTPError') {
  return Object.assign(new Error(`${name} ${statusCode}`), { name, statusCode });
}

function reason(error) {
  if (error?.statusCode) return error.statusCode;
  if (error?.name === 'TimeoutError' || error?.name === 'AbortError') return 'timeout';
  if (error instanceof SyntaxError) return 'invalid JSON';
  return error?.cause?.code ?? error?.name ?? 'error';
}

// /tournament/public/api/v1/persons/b54a11b0-... -> /tournament/public/api/v1/persons/:id
// A segment that looks like an identifier (a uuid, or four or more characters with a digit in
// them) is masked; the fixed words of the API paths (`api`, `1`, `v1`, `persons`) stay readable.
const looksLikeId = (segment) =>
  !/^v\d+$/.test(segment) && ((segment.length >= 4 && /\d/.test(segment)) || /^[0-9a-f]{8}-/i.test(segment));

export function maskedTarget(url) {
  try {
    const { host, pathname } = new URL(url);
    return host + pathname.split('/').map((s) => (looksLikeId(s) ? ':id' : s)).join('/');
  } catch {
    return '(invalid url)';
  }
}

// ---------------------------------------------------------------------------------------------
// People who asked not to be shown (privacy page): comma-separated ids in the environment
// variable NUXT_BLOCKED_PERSON_IDS, Time-Team and KNRB ids alike. On Cloudflare the variables
// reach the runtime config per request, so it needs the event. Both APIs use uuids; they are
// compared without regard to case or spaces, so an id pasted in capitals still hides the person.
// ---------------------------------------------------------------------------------------------

let blockedRaw;
let blockedSet = new Set();

export function blockedIds(event) {
  const raw = String(useRuntimeConfig(event).blockedPersonIds || '');
  if (raw !== blockedRaw) {
    blockedRaw = raw;
    blockedSet = new Set(raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean));
  }
  return blockedSet;
}

export function isBlocked(event, id) {
  if (id === undefined || id === null || id === '') return false;
  return blockedIds(event).has(String(id).trim().toLowerCase());
}
