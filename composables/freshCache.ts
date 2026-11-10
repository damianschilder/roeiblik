// Age limits for the client-side caches in the stores. Five minutes in a store, on top of five on
// the server (server/utils/upstream.js) and five in the browser's HTTP cache (`private,
// max-age=300`): a new result shows within a quarter of an hour. Ages count from when the answer
// arrived. `now` is a parameter so the logic can be checked with a fake clock.

export const FRESH_MS = 5 * 60 * 1000;

export function isFresh(at: number | undefined, now = Date.now()): boolean {
  return typeof at === "number" && now - at < FRESH_MS;
}

export interface Stamped<V> {
  at: number;
  value: V;
}

// Store a value with the time it arrived. Capped at `max`, oldest out first.
export function remember<K, V>(cache: Map<K, Stamped<V>>, key: K, value: V, max: number, now = Date.now()) {
  cache.delete(key);
  cache.set(key, { at: now, value });
  if (cache.size > max) cache.delete(cache.keys().next().value as K);
}

// The value, if it is still fresh. An expired one is dropped.
export function recall<K, V>(cache: Map<K, Stamped<V>>, key: K, now = Date.now()): V | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (!isFresh(hit.at, now)) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

// Whether a race's details should be (re)asked. Loading: never twice. Failed: only when the
// visitor asks again (the retry button). Done or missing: once the answer is older than FRESH_MS.
export function roundNeedsLoad(
  entry: { status: "loading" | "done" | "error" | "missing"; at?: number } | undefined,
  retry: boolean,
  now = Date.now(),
): boolean {
  if (!entry) return true;
  if (entry.status === "loading") return false;
  if (entry.status === "error") return retry;
  return !isFresh(entry.at, now);
}
