import { defineEventHandler } from 'h3';
import pLimit from 'p-limit';

// Create a limit of 18 requests per second
const limit = pLimit(18);

// Wrapper function for rate-limited fetch
async function fetchWithRateLimit(url) {
  return limit(() => $fetch(url));
}

export default defineEventHandler(async (event) => {
  const { personId } = getQuery(event);

  if (!personId) {
    return { error: 'Id parameter is required' };
  }

  const apiInfoUrl = `https://api.foys.io/tournament/public/api/v1/persons/${personId}`;

  try {
    // Fetch basic person info with rate limiting
    const infoResponse = await fetchWithRateLimit(apiInfoUrl);

    return {
      ...infoResponse
    };
  } catch (error) {
    return { error: 'Failed to fetch data from external API', details: error.message };
  }
});
