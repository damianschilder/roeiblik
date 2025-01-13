import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  const { personId } = getQuery(event);

  if (!personId) {
    return { error: 'Id parameter is required' };
  }

  const apiInfoUrl = `https://api.foys.io/tournament/public/api/v1/persons/${personId}`;

  try {
    // Fetch basic person info
    const infoResponse = await $fetch(apiInfoUrl);

    return {
      ...infoResponse
    };
  } catch (error) {
    return { error: 'Failed to fetch data from external API', details: error.message };
  }
});
