import type { Person, PersonResult, RaceResult, RaceTeam, Role, Round, SearchResponse } from "~/types/KNRB";
import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, shallowReactive, shallowRef } from "vue";
import { API_FETCH, apiErrorKind, type ApiErrorKind } from "~/composables/apiError";

// notfound: no such person, or someone who asked not to be shown (the server does not tell which).
export type LoadStatus = "idle" | "loading" | "done" | "error" | "notfound";

export interface RoundEntry {
  // missing: foys has no such race (404); trying again would not help, so no button is offered.
  status: "loading" | "done" | "error" | "missing";
  data: Round | null;
}

// Client-side caches: going back to a search or a person shows it at once, without a new request.
// Capped, oldest out first; a person or a round of a finished race does not change in a visit.
const SEARCH_CACHE_MAX = 30;
const PERSON_CACHE_MAX = 20;
const ROUND_CACHE_MAX = 400;

function remember<K, V>(cache: Map<K, V>, key: K, value: V, max: number) {
  cache.delete(key);
  cache.set(key, value);
  if (cache.size > max) cache.delete(cache.keys().next().value as K);
}

export const useKNRBStore = defineStore("KNRB", () => {
  // --- Search ---------------------------------------------------------------------------------
  const query = ref<string>("");
  const results = shallowRef<PersonResult[]>([]);
  const searchStatus = ref<LoadStatus>("idle");
  const searchError = ref<ApiErrorKind | null>(null); // why, when searchStatus is "error"
  const currentPage = ref<number>(1);
  const searchCache = new Map<string, PersonResult[]>();
  let searchController: AbortController | null = null;
  let searchSeq = 0;

  async function search(text: string) {
    const q = text.trim();
    if (q.length < 2) return;
    const key = q.toLowerCase();
    // The same search again while it is still running: nothing to do.
    if (searchStatus.value === "loading" && query.value.toLowerCase() === key) return;

    query.value = q;
    currentPage.value = 1;
    const seq = ++searchSeq;
    searchController?.abort();
    searchController = null;

    const cached = searchCache.get(key);
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
      const response = await $fetch<SearchResponse>("/api/knrb/search", {
        ...API_FETCH,
        params: { query: q },
        signal: controller.signal,
      });
      if (seq !== searchSeq) return; // a newer search took over
      if (!Array.isArray(response?.items)) throw new Error("search failed");
      remember(searchCache, key, response.items, SEARCH_CACHE_MAX);
      results.value = response.items;
      searchStatus.value = "done";
    } catch (e) {
      if (seq !== searchSeq) return; // aborted or superseded: not an error for this search
      results.value = [];
      searchError.value = apiErrorKind(e);
      searchStatus.value = "error";
    } finally {
      if (searchController === controller) searchController = null;
    }
  }

  // --- Person ---------------------------------------------------------------------------------
  const personId = ref<string | null>(null);
  const person = shallowRef<Person | null>(null);
  const personStatus = ref<LoadStatus>("idle");
  const personError = ref<ApiErrorKind | null>(null); // why, when personStatus is "error"
  const personCache = new Map<string, Person>();
  let personSeq = 0;

  async function loadPerson(id: string, { force = false } = {}) {
    if (!force && personId.value === id && (personStatus.value === "done" || personStatus.value === "loading")) return;
    const seq = ++personSeq;
    personId.value = id;
    personError.value = null;

    // The same shape the server accepts; anything else cannot be a person.
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      person.value = null;
      personStatus.value = "notfound";
      return;
    }

    const cached = force ? undefined : personCache.get(id);
    if (cached) {
      person.value = cached;
      personStatus.value = "done";
      return;
    }

    // Never show the previous person while the next one loads.
    person.value = null;
    personStatus.value = "loading";
    try {
      const response = await $fetch<Person>("/api/knrb/person", { ...API_FETCH, params: { id } });
      if (seq !== personSeq) return; // the visitor moved on to someone else
      if (!response?.personId || !Array.isArray(response.tournaments)) throw new Error("person failed");
      remember(personCache, id, response, PERSON_CACHE_MAX);
      person.value = response;
      personStatus.value = "done";
    } catch (e) {
      if (seq !== personSeq) return;
      const kind = apiErrorKind(e);
      // Unknown ids, bad ids and people who asked not to be shown look the same.
      if (kind === "notFound" || kind === "invalid") {
        personStatus.value = "notfound";
        return;
      }
      personError.value = kind;
      personStatus.value = "error";
    }
  }

  // --- Race details (one request per race, when it scrolls into view) --------------------------
  // Keyed by race id, shared by all people: a crew mate's page reuses what is already here.
  const rounds = shallowReactive<Record<string, RoundEntry>>({});
  const roundOrder: string[] = [];

  async function loadRound(tournamentId: number, raceId: number, { retry = false } = {}) {
    const key = String(raceId);
    const entry = rounds[key];
    // Loading, done or missing: nothing to do. Failed: only when the visitor asks again.
    if (entry && (entry.status !== "error" || !retry)) return;

    rounds[key] = { status: "loading", data: null };
    if (!roundOrder.includes(key)) roundOrder.push(key);
    while (roundOrder.length > ROUND_CACHE_MAX) delete rounds[roundOrder.shift() as string];
    try {
      const response = await $fetch<Round>("/api/knrb/round", { ...API_FETCH, params: { tournamentId, raceId } });
      if (!Array.isArray(response?.teams)) throw new Error("round failed");
      rounds[key] = { status: "done", data: response };
    } catch (e) {
      rounds[key] = { status: apiErrorKind(e) === "notFound" ? "missing" : "error", data: null };
    }
  }

  function roundFor(raceId: number): RoundEntry | undefined {
    return rounds[String(raceId)];
  }

  return {
    query,
    results,
    searchStatus,
    searchError,
    currentPage,
    search,
    personId,
    person,
    personStatus,
    personError,
    loadPerson,
    rounds,
    loadRound,
    roundFor,
  };
});

// --- Helpers for the person page -----------------------------------------------------------------

// The crews in a race that this person was part of (a coach can have more than one).
export function teamsWith(round: Round | null | undefined, id: string | null | undefined): RaceTeam[] {
  if (!round || !id) return [];
  return round.teams.filter((team) => team.members.some((m) => m.personId === id));
}

// The person's crew for this race entry: the one with the entry's team name when there are several.
export function teamFor(round: Round | null | undefined, id: string | null | undefined, race: RaceResult): RaceTeam | null {
  const teams = teamsWith(round, id);
  return teams.find((t) => t.name === race.teamName) ?? teams[0] ?? null;
}

export function roleIn(team: RaceTeam | null, id: string | null | undefined): Role | "" {
  const member = team?.members.find((m) => m.personId === id);
  if (!member) return "";
  if (member.isCoach) return "Coach";
  if (member.isCox) return "Stuur";
  return "Roeier";
}

export function formatPosition(position: number | null | undefined): string {
  if (!position) return "";
  return position + (position === 1 ? "ste" : "de");
}

// "5de, A-finale"; "Niet gestart, A-finale" when the race details say so; "A-finale" otherwise.
export function resultText(race: RaceResult, team: RaceTeam | null): string {
  let place = formatPosition(race.position);
  if (!place && team?.didNotStart) place = "Niet gestart";
  else if (!place && team?.didNotFinish) place = "Niet gefinisht";
  return place ? `${place}, ${race.raceName}` : race.raceName;
}

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKNRBStore, import.meta.hot));
}
