import type {
  TtDetailsResponse,
  TtEntry,
  TtEntryResponse,
  TtPerson,
  TtPersonResponse,
  TtProfile,
  TtRole,
  TtSearchResponse,
} from "~/types/Timeteam";
import { defineStore, acceptHMRUpdate } from "pinia";
import { computed, ref, toRaw } from "vue";
import { API_FETCH, apiErrorKind, isAbort, type ApiErrorKind } from "~/composables/apiError";

// Time-Team search and person pages. The server (server/api/time-team/*) does the merging; this
// store only fetches, guards against stale answers and remembers what it fetched this session,
// so Back from a person page shows the same list and a person seen before opens at once. What the
// person route left out for its call budget (roles, regatta names) it fills in afterwards from
// /api/time-team/details: roles in the background, regatta names when their group comes into view.

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

// /api/time-team/details does about 14 lookups per request when nothing is cached on the server
// (the Workers limit of 50 calls, Cache API calls included), so a request never asks for more.
const DETAILS_IDS = 14;
const DETAILS_IN_FLIGHT = 2;
const DETAILS_ATTEMPTS = 3; // per id, a failed request and an id sent back in `rest` both count
const DETAILS_RETRY_MS = 1000; // pause after a failed request, so a struggling server gets air

const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// "loading": a request for this entry's crew is in flight (the fill or loadCrew), so the other
// does not ask too. "missing": Time-Team has no crew for it. "error": it could not be looked up.
export type CrewState = "loading" | "missing" | "error";

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
  const crewState = ref<Record<string, CrewState>>({});
  const personCache = new Map<string, { at: number; value: TtProfile }>();
  let personController: AbortController | null = null;
  let personSeq = 0;

  async function getRower(id: string, { force = false } = {}) {
    if (!id) return;
    // Already shown, and complete. An incomplete one (a lookup failed) is asked for again.
    if (!force && personId.value === id && personStatus.value === "done" && !rower.value?.partial) {
      startFill(); // a no-op while it runs or once nothing is left
      return;
    }
    stopFill();
    dropQueuedRegattas();
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
      startFill();
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
      startFill();
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

  function fetchDetails(id: string, entries: string[], regattas: string[], signal?: AbortSignal) {
    return $fetch<TtDetailsResponse>("/api/time-team/details", {
      ...API_FETCH,
      params: {
        id,
        entries: entries.length ? entries.join(",") : undefined,
        regattas: regattas.length ? regattas.join(",") : undefined,
      },
      signal,
    });
  }

  const validDetails = (r: TtDetailsResponse | undefined): r is TtDetailsResponse =>
    Array.isArray(r?.entries) && Array.isArray(r?.regattas) && Array.isArray(r?.rest?.entries) && Array.isArray(r?.rest?.regattas);

  // --- Role fill ----------------------------------------------------------------------------
  // The person route looks up only as many crews as its call budget allows, so on a long history
  // most entries come without a role, and the totals in the header need one for every entry. As
  // soon as a profile is shown, the entries without role and crew are looked up in the background,
  // newest first, in chunks of DETAILS_IDS with at most DETAILS_IN_FLIGHT requests at once.
  // Results go onto the store's own entry objects, so the list, the table and the cached profile
  // all see them. Moving to another person stops the fill (requests aborted); coming back resumes
  // it with whatever is still open. Regatta names are not part of it: those load when in view.
  type Fill = {
    profile: TtProfile; // raw, to tell "the same profile" apart from a new answer for the same person
    personId: string;
    byId: Map<string, TtEntry[]>; // reactive entry objects per id
    queue: string[];
    asking: Set<string>; // ids in this fill's requests in flight
    running: number;
    controllers: Set<AbortController>;
    stopped: boolean;
  };
  let fill: Fill | null = null;
  const entryAttempts = new Map<string, number>(); // per session, so a resumed fill keeps counting

  // Still waiting for a crew, not settled as missing or failed, and not already asked by this fill.
  // A "loading" mark from elsewhere does not count: crewmates share entry ids, and the aborted
  // requests of the fill just stopped clear their marks only after the next fill has started, so
  // skipping on "loading" left those entries pending for good.
  const fillable = (f: Fill, id: string) => {
    const state = crewState.value[id];
    return state !== "missing" && state !== "error" && !f.asking.has(id)
      && (f.byId.get(id) ?? []).some((e) => !e.crew);
  };

  function stopFill() {
    if (!fill) return;
    fill.stopped = true;
    for (const controller of fill.controllers) controller.abort();
    fill = null;
  }

  function startFill() {
    const profile = rower.value;
    if (!profile || personStatus.value !== "done") return;
    applyKnownRegattas(); // names other people's pages already brought in
    const raw = toRaw(profile);
    if (fill && fill.profile === raw) return; // never two fills for one profile
    stopFill();
    const f: Fill = { profile: raw, personId: profile.person.id, byId: new Map(), queue: [], asking: new Set(), running: 0, controllers: new Set(), stopped: false };
    for (const group of profile.events) {
      for (const entry of group.entries) {
        if (entry.role || entry.crew !== null) continue;
        const list = f.byId.get(entry.id);
        if (list) list.push(entry);
        else {
          f.byId.set(entry.id, [entry]);
          f.queue.push(entry.id);
        }
      }
    }
    if (!f.queue.length) return;
    fill = f;
    pumpFill(f);
  }

  function pumpFill(f: Fill) {
    while (!f.stopped && f.running < DETAILS_IN_FLIGHT) {
      const ids: string[] = [];
      while (ids.length < DETAILS_IDS && f.queue.length) {
        const id = f.queue.shift() as string;
        if (fillable(f, id) && !ids.includes(id)) ids.push(id);
      }
      if (!ids.length) break;
      f.running += 1;
      void sendFill(f, ids).finally(() => {
        f.running -= 1;
        pumpFill(f);
      });
    }
    if (fill === f && !f.running && !f.queue.length) fill = null; // all settled
  }

  // Asked again, unless this was its last attempt.
  function retryEntry(f: Fill, id: string) {
    if ((entryAttempts.get(id) ?? 0) >= DETAILS_ATTEMPTS) {
      crewState.value[id] = "error";
      return;
    }
    delete crewState.value[id];
    f.queue.push(id);
  }

  async function sendFill(f: Fill, ids: string[]) {
    for (const id of ids) {
      crewState.value[id] = "loading";
      entryAttempts.set(id, (entryAttempts.get(id) ?? 0) + 1);
      f.asking.add(id);
    }
    const controller = new AbortController();
    f.controllers.add(controller);
    try {
      const response = await fetchDetails(f.personId, ids, [], controller.signal);
      if (!validDetails(response)) throw new Error("details failed");
      const settled = new Set<string>();
      for (const details of response.entries) {
        if (!ids.includes(details.id) || settled.has(details.id)) continue;
        settled.add(details.id);
        for (const entry of f.byId.get(details.id) ?? []) {
          entry.crew = details.crew;
          if (!entry.role && details.role) entry.role = details.role;
          if (details.name) entry.name = details.name;
        }
        if (details.crew) delete crewState.value[details.id];
        else crewState.value[details.id] = "missing";
      }
      for (const id of response.rest.entries) {
        if (!ids.includes(id) || settled.has(id)) continue;
        settled.add(id);
        retryEntry(f, id);
      }
      // Not this person's, as far as the server knows: nothing more will come for it.
      for (const id of ids) if (!settled.has(id)) crewState.value[id] = "missing";
    } catch (e) {
      if (f.stopped || isAbort(e)) {
        // Stopped, not failed: no attempt lost, and the next fill for this profile asks again.
        for (const id of ids) {
          if (crewState.value[id] === "loading") delete crewState.value[id];
          entryAttempts.set(id, Math.max(0, (entryAttempts.get(id) ?? 1) - 1));
        }
        return;
      }
      // Released before the pause: the other request may pump the queue meanwhile.
      for (const id of ids) f.asking.delete(id);
      for (const id of ids) retryEntry(f, id);
      await pause(DETAILS_RETRY_MS);
    } finally {
      f.controllers.delete(controller);
      for (const id of ids) f.asking.delete(id);
    }
  }

  // --- Regatta names -----------------------------------------------------------------------
  // Groups the person route reached no regatta name for ("Locatie niet aanwezig") ask for it when
  // they come into view (Races.vue calls requestRegatta). Ids arriving within REGATTA_BATCH_MS go
  // out together, DETAILS_IDS per request, at most DETAILS_IN_FLIGHT at once. What came back is
  // kept for the session, so each regatta is asked once (plus retries for `rest`), and a name
  // known from another person shows at once.
  const REGATTA_BATCH_MS = 100;
  // null: asked, and there is no name to show (Time-Team has none, or we gave up).
  const regattaInfo = new Map<string, { name: string; city?: string } | null>();
  const regattaAttempts = new Map<string, number>();
  const regattaWaiting = new Set<string>(); // queued or in flight
  let regattaQueue: string[] = [];
  let regattaTimer: ReturnType<typeof setTimeout> | null = null;
  let regattaRunning = 0;

  const groupsOf = (regattaId: string) =>
    (rower.value?.events ?? []).filter((group) => group.entries[0]?.regattaId === regattaId);

  function applyRegatta(regattaId: string) {
    const info = regattaInfo.get(regattaId);
    if (!info) return;
    for (const group of groupsOf(regattaId)) {
      if (group.regatta) continue;
      group.regatta = info.name;
      if (info.city) group.city = info.city;
    }
  }

  function applyKnownRegattas() {
    for (const group of rower.value?.events ?? []) {
      const regattaId = group.entries[0]?.regattaId;
      if (!group.regatta && regattaId) applyRegatta(regattaId);
    }
  }

  function requestRegatta(regattaId: string) {
    if (!regattaId || !PERSON_ID.test(regattaId) || personStatus.value !== "done") return;
    if (regattaInfo.has(regattaId)) {
      applyRegatta(regattaId);
      return;
    }
    if (regattaWaiting.has(regattaId)) return;
    regattaWaiting.add(regattaId);
    regattaQueue.push(regattaId);
    regattaTimer ??= setTimeout(() => {
      regattaTimer = null;
      pumpRegattas();
    }, REGATTA_BATCH_MS);
  }

  // Another person: what was only queued is for the old one's groups. Requests in flight finish
  // (their answers are true for that regatta wherever it shows up).
  function dropQueuedRegattas() {
    for (const regattaId of regattaQueue) regattaWaiting.delete(regattaId);
    regattaQueue = [];
  }

  function pumpRegattas() {
    const id = rower.value?.person.id;
    if (!id) return;
    while (regattaRunning < DETAILS_IN_FLIGHT && regattaQueue.length) {
      const ids = regattaQueue.splice(0, DETAILS_IDS);
      regattaRunning += 1;
      void sendRegattas(id, ids).finally(() => {
        regattaRunning -= 1;
        pumpRegattas();
      });
    }
  }

  function settleRegatta(regattaId: string, info: { name: string; city?: string } | null) {
    regattaWaiting.delete(regattaId);
    regattaInfo.set(regattaId, info);
    applyRegatta(regattaId);
  }

  // Asked again while a group of the shown person still needs it, unless this was the last attempt.
  function retryRegatta(regattaId: string) {
    regattaWaiting.delete(regattaId);
    if ((regattaAttempts.get(regattaId) ?? 0) >= DETAILS_ATTEMPTS) settleRegatta(regattaId, null);
    else if (groupsOf(regattaId).some((group) => !group.regatta)) requestRegatta(regattaId);
  }

  async function sendRegattas(id: string, ids: string[]) {
    for (const regattaId of ids) regattaAttempts.set(regattaId, (regattaAttempts.get(regattaId) ?? 0) + 1);
    try {
      const response = await fetchDetails(id, [], ids);
      if (!validDetails(response)) throw new Error("details failed");
      const settled = new Set<string>();
      for (const regatta of response.regattas) {
        if (!ids.includes(regatta.id) || settled.has(regatta.id)) continue;
        settled.add(regatta.id);
        settleRegatta(regatta.id, regatta.name ? { name: regatta.name, city: regatta.city } : null);
      }
      for (const regattaId of response.rest.regattas) {
        if (!ids.includes(regattaId) || settled.has(regattaId)) continue;
        settled.add(regattaId);
        retryRegatta(regattaId);
      }
      for (const regattaId of ids) if (!settled.has(regattaId)) settleRegatta(regattaId, null);
    } catch {
      await pause(DETAILS_RETRY_MS);
      for (const regattaId of ids) retryRegatta(regattaId);
    }
  }

  // A crew the person route did not look up and the fill does not either (an entry whose role is
  // already known, the stroke): fetched when the visitor opens it. An entry the fill is asking
  // for is "loading" and left to the fill.
  async function loadCrew(entry: TtEntry) {
    const person = rower.value;
    const state = crewState.value[entry.id];
    if (!person || entry.crew || state === "loading" || state === "missing") return;
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
  // "Alleen winsten" filter and the list's count all use it. An entry without a role whose crew is
  // still to come (from the role fill) is counted under "pending"; one settled without a role (no
  // crew at Time-Team, or the lookup gave up) under "unknown". So no entry or win is dropped.
  type RoleBucket = TtRole | "pending" | "unknown";
  function bucket(entry: TtEntry): RoleBucket {
    if (entry.role) return entry.role;
    const state = crewState.value[entry.id];
    return entry.crew === null && state !== "error" && state !== "missing" ? "pending" : "unknown";
  }

  const roleCounts = computed(() => {
    const counts: Record<RoleBucket, number> = { Rower: 0, Cox: 0, Coach: 0, pending: 0, unknown: 0 };
    for (const group of rower.value?.events ?? []) {
      for (const entry of group.entries) counts[bucket(entry)] += 1;
    }
    return counts;
  });

  const totalWins = computed(() => {
    const wins: Record<RoleBucket, number> = { Rower: 0, Cox: 0, Coach: 0, pending: 0, unknown: 0 };
    for (const group of rower.value?.events ?? []) {
      for (const entry of group.entries) if (entry.won) wins[bucket(entry)] += 1;
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
    requestRegatta,
    roleCounts,
    totalWins,
    anyWins,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRowersStore, import.meta.hot));
}
