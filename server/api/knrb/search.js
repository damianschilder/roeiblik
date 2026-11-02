// Search KNRB people by name. foys returns every match at once (735 for "de Vries", 101 kB), with
// a membership number per person that the page never shows; only id, name and club go out.

export default defineEventHandler(async (event) => {
  const query = queryString(event, 'query');

  if (!validSearch(query)) {
    return invalid(event, 'A search term of 2 to 100 characters is required');
  }

  let response;
  try {
    response = await upstream(`https://api.foys.io/tournament/public/api/v1/persons/search?searchString=${encodeURIComponent(query)}`);
  } catch (error) {
    return upstreamFailure(event, error);
  }

  const items = (Array.isArray(response?.items) ? response.items : [])
    .filter((item) => item?.personId && !isBlocked(event, item.personId))
    .map((item) => ({
      personId: String(item.personId),
      fullName: typeof item.fullName === 'string' ? item.fullName.trim() : '',
      clubName: typeof item.clubName === 'string' && item.clubName.trim() ? item.clubName.trim() : null,
    }))
    // By name, then id (as the page always sorted): the same order every time, also for namesakes.
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'nl', { sensitivity: 'base' })
      || a.personId.localeCompare(b.personId));

  setResponseHeader(event, 'Cache-Control', 'private, max-age=300');
  return { items };
});
