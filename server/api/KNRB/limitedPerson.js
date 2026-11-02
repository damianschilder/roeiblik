import pLimit from 'p-limit';

// A race lineup asks for several crew members at once; at most 18 upstream calls in flight.
const limit = pLimit(18);

export default defineEventHandler(async (event) => {
  const personId = queryString(event, 'personId');

  if (!validId(personId)) {
    return failure('Id parameter is required');
  }
  if (isBlocked(personId)) {
    return failure('Not available');
  }

  try {
    const infoResponse = await limit(() => upstream(`https://api.foys.io/tournament/public/api/v1/persons/${encodeURIComponent(personId)}`));
    return { ...infoResponse };
  } catch {
    return failure('Failed to fetch data from external API');
  }
});
