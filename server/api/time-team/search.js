// Time-Team person search. Time-Team also returns matching regattas, countries and clubs, which
// Roeiblik does not use: only { person: [{ id, displayname }] } goes to the browser, sorted by name
// (then id, so namesakes keep their order).
const byName = (a, b) =>
  a.displayname.localeCompare(b.displayname, 'nl', { sensitivity: 'base' }) || a.id.localeCompare(b.id);

export default defineEventHandler(async (event) => {
  const query = queryString(event, 'query');

  if (!validSearch(query)) {
    return invalid(event, 'A search term of 2 to 100 characters is required');
  }

  let response;
  try {
    response = await upstream(`https://api.beta.regatta.time-team.nl/api/1/search?query=${encodeURIComponent(query)}`);
  } catch (error) {
    return upstreamFailure(event, error);
  }

  const person = [];
  for (const [key, found] of Object.entries(response?.person || {})) {
    const id = String(found?.id ?? key);
    const displayname = typeof found?.displayname === 'string' ? found.displayname.trim() : '';
    if (!displayname || isBlocked(event, key) || isBlocked(event, id)) continue;
    person.push({ id, displayname });
  }
  person.sort(byName);

  setResponseHeader(event, 'Cache-Control', 'private, max-age=300');
  return { person };
});
