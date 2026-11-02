export default defineEventHandler(async (event) => {
  const id = queryString(event, 'id');

  if (!validId(id)) {
    return failure('Id parameter is required');
  }
  if (isBlocked(event, id)) {
    return failure('Not available');
  }

  try {
    return await upstream(`https://api.beta.regatta.time-team.nl/api/1/person/${encodeURIComponent(id)}`);
  } catch {
    return failure('Failed to fetch data from external API');
  }
});
