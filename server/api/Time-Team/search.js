export default defineEventHandler(async (event) => {
  const query = queryString(event, 'query');

  if (!validSearch(query)) {
    return failure('Query parameter is required');
  }

  try {
    const response = await upstream(`https://api.beta.regatta.time-team.nl/api/1/search?query=${encodeURIComponent(query)}`);
    for (const id of Object.keys(response?.person || {})) {
      if (isBlocked(id)) delete response.person[id];
    }
    return response;
  } catch {
    return failure('Failed to fetch data from external API');
  }
});
