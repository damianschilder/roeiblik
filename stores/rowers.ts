import type {
  TtEntry,
  TtEntryResponse,
  TtPerson,
  TtPersonResponse,
  TtProfile,
  TtRole,
  TtSearchResponse,
} from "~/types/Timeteam";
import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref } from "vue";
import { API_FETCH, apiErrorKind, isAbort, type ApiErrorKind } from "~/composables/apiError";

// Time-Team search and person pages. The server (server/api/time-team/*) does the merging; this
// store only fetches, guards against stale answers and remembers what it fetched this session,
// so Back from a person page shows the same list and a person seen before opens at once.

export type SearchStatus = "idle" | "tooShort" | "loading" | "done" | "error";
// notFound: no such person, or someone who asked not to be shown (the server does not tell which).
export type PersonStatus = "idle" | "loading" | "done" | "error" | "notFound";

// The id shape the server accepts; anything else cannot be a person and is not sent.
const PERSON_ID = /^[A-Za-z0-9_-]{1,64}$/;

export const TT_ROLES: TtRole[] = ["Rower", "Cox", "Coach"];

const ROLE_LABELS: Record<TtRole, string> = { Rower: "Roeier", Cox: "Stuur", Coach: "Coach" };
export const roleLabel = (role?: TtRole): string => (role ? ROLE_LABELS[role] : "");

const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];

// "2021-10-24" -> "24 oktober 2021". Read as a calendar date: no Date object, so no time zone can
// move it a day.
export function formatRaceDate(value?: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
  if (!match) return "";
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${Number(match[3])} ${month} ${match[1]}` : "";
}

// Dutch ordinals: 1ste, 2de ... 7de, 8ste, 9de ... 19de, 20ste, 21ste ... 100ste, 102de.
export function ordinalNl(n?: number): string {
  if (!Number.isInteger(n) || (n as number) < 1) return "";
  const rest = (n as number) % 100;
  const ste = rest === 1 || rest === 8 || rest >= 20 || (rest === 0 && (n as number) >= 100);
  return `${n}${ste ? "ste" : "de"}`;
}

const CACHE_MS = 10 * 60 * 1000;
const SEARCH_CACHE_MAX = 30;
const PERSON_CACHE_MAX = 20;

function remember<T>(cache: Map<string, { at: number; value: T }>, key: string, value: T, max: number) {
  cache.delete(key);
  cache.set(key, { at: Date.now(), value });
  if (cache.size > max) cache.delete(cache.keys().next().value as string);
}

function recall<T>(cache: Map<string, { at: number; value: T }>, key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

export const useRowersStore = defineStore("rowers", () => {
  // --- Search -------------------------------------------------------------------------------
  const searchInput = ref<string>(""); // what is in the box; kept for Back
  const query = ref<string>(""); // the last query that was sent
  const results = ref<TtPerson[]>([]);
  const searchStatus = ref<SearchStatus>("idle");
  const searchError = ref<ApiErrorKind | null>(null); // why, when searchStatus is "error"
  const storeCurrentPage = ref<number>(1);
  const searchCache = new Map<string, { at: number; value: TtPerson[] }>();
  let searchController: AbortController | null = null;
  let searchSeq = 0;

  // Submit-only: one request per Enter or click. A new search cancels the one in flight, and an
  // answer that arrives after a newer search started is dropped.
  async function searchRowers(input: string) {
    const q = input.replace(/\s+/g, " ").trim();
    searchController?.abort();
    searchController = null;
    const seq = ++searchSeq;
    if (q.length < 2) {
      searchStatus.value = "tooShort";
      return;
    }
    query.value = q;
    storeCurrentPage.value = 1;

    const key = q.toLocaleLowerCase("nl");
    const cached = recall(searchCache, key);
    if (cached) {
      results.value = cached;
      searchStatus.value = "done";
      return;
    }

    const controller = new AbortController();
    searchController = controller;
    searchStatus.value = "loading";
    searchError.value = null;
    try {
      // Sorted by name on the server.
      const response = await $fetch<TtSearchResponse>("/api/time-team/search", {
        ...API_FETCH,
        params: { query: q },
        signal: controller.signal,
      });
      if (seq !== searchSeq) return;
      if (!Array.isArray(response?.person)) throw new Error("search failed");
      const list = response.person;
      remember(searchCache, key, list, SEARCH_CACHE_MAX);
      results.value = list;
      searchStatus.value = "done";
    } catch (e) {
      if (seq !== searchSeq || isAbort(e)) return;
      results.value = [];
      searchError.value = apiErrorKind(e);
      searchStatus.value = "error";
    } finally {
      if (searchController === controller) searchController = null;
    }
  }

  // --- Person -------------------------------------------------------------------------------
  const rower = ref<TtProfile | null>(null);
  const personId = ref<string>(""); // the person personStatus is about
  const personStatus = ref<PersonStatus>("idle");
  const personError = ref<ApiErrorKind | null>(null); // why, when personStatus is "error"
  const crewState = ref<Record<string, "loading" | "error">>({});
  const personCache = new Map<string, { at: number; value: TtProfile }>();
  let personController: AbortController | null = null;
  let personSeq = 0;

  async function getRower(id: string, { force = false } = {}) {
    if (!id) return;
    // Already shown, and complete. An incomplete one (a lookup failed) is asked for again.
    if (!force && personId.value === id && personStatus.value === "done" && !rower.value?.partial) return;
    personController?.abort();
    personController = null;
    const seq = ++personSeq;
    personId.value = id;
    personError.value = null;

    if (!PERSON_ID.test(id)) {
      rower.value = null;
      personStatus.value = "notFound";
      return;
    }

    const cached = force ? undefined : recall(personCache, id);
    if (cached) {
      rower.value = cached;
      personStatus.value = "done";
      return;
    }

    // Show the name from the search list while the rest loads.
    const known = results.value.find((r) => r.id === id);
    rower.value = known ? { person: { id, displayname: known.displayname }, clubs: [], events: [] } : null;
    personStatus.value = "loading";

    const controller = new AbortController();
    personController = controller;
    try {
      const response = await $fetch<TtPersonResponse>("/api/time-team/person", {
        ...API_FETCH,
        params: { id },
        signal: controller.signal,
      });
      if (seq !== personSeq) return;
      if (!response?.person?.id || !Array.isArray(response.events)) throw new Error("person failed");
      const profile = response as TtProfile;
      // An answer with a failed lookup is shown but not kept: the next visit asks again.
      if (!profile.partial) remember(personCache, id, profile, PERSON_CACHE_MAX);
      rower.value = profile;
      personStatus.value = "done";
    } catch (e) {
      if (seq !== personSeq || isAbort(e)) return;
      const kind = apiErrorKind(e);
      if (kind === "notFound" || kind === "invalid") {
        rower.value = null;
        personStatus.value = "notFound";
        return;
      }
      personError.value = kind;
      personStatus.value = "error";
    } finally {
      if (personController === controller) personController = null;
    }
  }

  // A crew the server did not look up (long histories only): fetched when the visitor opens it.
  async function loadCrew(entry: TtEntry) {
    const person = rower.value;
    if (!person || entry.crew || crewState.value[entry.id] === "loading") return;
    crewState.value[entry.id] = "loading";
    try {
      const response = await $fetch<TtEntryResponse>("/api/time-team/entry", {
        ...API_FETCH,
        params: { regatta: entry.regattaId, id: entry.id, person: person.person.id },
      });
      if (!response?.crew) throw new Error("crew failed");
      entry.crew = response.crew;
      if (!entry.role && response.role) entry.role = response.role;
      delete crewState.value[entry.id];
    } catch {
      crewState.value[entry.id] = "error";
    }
  }

  // Per role: how many entries, and how many of them were won. Whether an entry was won is decided
  // on the server (entry.won, see decide() in server/api/time-team/person.js); the table, the
  // "Alleen winsten" filter and the list's count all use it. An entry whose role is not known
  // (its crew could not be looked up) is counted under "unknown", so no entry or win is dropped.
  const roleCounts = computed(() => {
    const counts: Record<TtRole | "unknown", number> = { Rower: 0, Cox: 0, Coach: 0, unknown: 0 };
    for (const group of rower.value?.events ?? []) {
      for (const entry of group.entries) counts[entry.role ?? "unknown"] += 1;
    }
    return counts;
  });

  const totalWins = computed(() => {
    const wins: Record<TtRole | "unknown", number> = { Rower: 0, Cox: 0, Coach: 0, unknown: 0 };
    for (const group of rower.value?.events ?? []) {
      for (const entry of group.entries) if (entry.won) wins[entry.role ?? "unknown"] += 1;
    }
    return wins;
  });

  const anyWins = computed(() => (rower.value?.events ?? []).some((g) => g.entries.some((e) => e.won)));

  return {
    searchInput,
    query,
    results,
    searchStatus,
    searchError,
    storeCurrentPage,
    searchRowers,
    rower,
    personId,
    personStatus,
    personError,
    crewState,
    getRower,
    loadCrew,
    roleCounts,
    totalWins,
    anyWins,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRowersStore, import.meta.hot));
}
