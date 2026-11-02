// Time-Team person search. Time-Team also returns matching regattas, countries and clubs, which
// Roeiblik does not use: only { person: { [id]: { id, displayname } } } goes to the browser.
export default defineEventHandler(async (event) => {
  const query = queryString(event, 'query');

  if (!validSearch(query)) {
    return failure('Query parameter is required');
  }

  try {
    const response = await upstream(`https://api.beta.regatta.time-team.nl/api/1/search?query=${encodeURIComponent(query)}`);
    const person = {};
    for (const [id, found] of Object.entries(response?.person || {})) {
      if (isBlocked(event, id) || typeof found?.displayname !== 'string') continue;
      person[id] = { id: found.id ?? id, displayname: found.displayname };
    }
    setResponseHeader(event, 'Cache-Control', 'private, max-age=300');
    return { person };
  } catch {
    return failure('Failed to fetch data from external API');
  }
});
