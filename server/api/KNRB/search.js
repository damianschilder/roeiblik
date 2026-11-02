export default defineEventHandler(async (event) => {
  const query = queryString(event, 'query');

  if (!validSearch(query)) {
    return failure('Query parameter is required');
  }

  try {
    const response = await upstream(`https://api.foys.io/tournament/public/api/v1/persons/search?searchString=${encodeURIComponent(query)}`);
    if (Array.isArray(response?.items)) {
      response.items = response.items.filter((item) => !isBlocked(event, item.personId));
    }
    return response;
  } catch {
    return failure('Failed to fetch data from external API');
  }
});
