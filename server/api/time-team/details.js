// What the person route had no calls left for, asked for by the page in small batches:
//   /api/time-team/details?id=<person id>&entries=<entry ids>&regattas=<regatta ids>
// The page asks right away for the entries whose role it does not know yet (the totals per role
// need every one of them) and for a regatta when its event comes into view.
//
// Answers { entries: [{ id, name, role?, crew }], regattas: [{ id, name?, city? }],
// rest: { entries, regattas } }. `rest` holds what was not looked up this time (out of calls or
// time, or the lookup failed): the page asks for it again. An entry with `crew: null` or a regatta
// without a name is one Time-Team does not have. Ids that are not the person's own appear in none
// of the lists: this route only looks up what is on the person's page, so it cannot be used to
// collect Time-Team's crews in bulk. Hidden people are left out of crews as everywhere else.
import { buildCrewDetails, planLookups, runLookups } from './person.js';

const API = 'https://api.beta.regatta.time-team.nl/api/1';
const MAX_IDS = 40;

// A comma-separated list of ids, at most MAX_IDS, each of the usual shape. undefined when malformed.
function idList(event, name) {
  const value = queryString(event, name);
  if (!value) return [];
  const ids = [...new Set(value.split(',').map((s) => s.trim()).filter(Boolean))];
  return ids.length <= MAX_IDS && ids.every(validId) ? ids : undefined;
}

export default defineEventHandler(async (event) => {
  const id = queryString(event, 'id');
  const entryIds = idList(event, 'entries');
  const regattaIds = idList(event, 'regattas');

  if (!validId(id) || !entryIds || !regattaIds || entryIds.length + regattaIds.length === 0) {
    return invalid(event, 'The id parameter and a list of entries or regattas are required');
  }
  if (isBlocked(event, id)) {
    return notFound(event);
  }

  const budget = callBudget();
  let raw;
  try {
    raw = await upstream(`${API}/person/${encodeURIComponent(id)}`, { budget });
  } catch (error) {
    return error?.statusCode === 404 ? notFound(event) : upstreamFailure(event, error);
  }
  if (!raw?.person || !Object.keys(raw.person).length) {
    return notFound(event);
  }

  // Only lookups the person's own page would make (every entry they raced in, every regatta of
  // those), in the order asked for.
  const { lookups: all } = planLookups(raw, id);
  const byKey = new Map(all.map((l) => [l.kind === 'regatta' ? `r:${l.regattaId}` : `e:${l.entryId}`, l]));
  const lookups = [
    ...entryIds.map((entryId) => byKey.get(`e:${entryId}`)),
    ...regattaIds.map((regattaId) => byKey.get(`r:${regattaId}`)),
  ].filter(Boolean);

  const { regattas, entries, rest, failed } = await runLookups(lookups, budget);
  const blocked = (personId) => Boolean(personId) && isBlocked(event, personId);
  const waiting = new Set(rest);

  const answer = {
    entries: lookups
      .filter((l) => l.kind === 'entry' && !waiting.has(l))
      .map((l) => buildCrewDetails(raw, id, l.entryId, entries.get(l.entryId), blocked)),
    regattas: lookups
      .filter((l) => l.kind === 'regatta' && !waiting.has(l))
      .map((l) => {
        const regatta = regattas.get(l.regattaId);
        const name = typeof regatta?.name === 'string' ? regatta.name.trim() : '';
        const city = typeof regatta?.city === 'string' ? regatta.city.trim() : '';
        return { id: l.regattaId, ...(name ? { name } : {}), ...(city ? { city } : {}) };
      }),
    rest: {
      entries: rest.filter((l) => l.kind === 'entry').map((l) => l.entryId),
      regattas: rest.filter((l) => l.kind === 'regatta').map((l) => l.regattaId),
    },
  };

  setResponseHeader(event, 'Cache-Control', failed || rest.length ? 'no-store' : 'private, max-age=300');
  return answer;
});
