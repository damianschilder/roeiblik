import { defineEventHandler, useQuery } from 'h3';

export default defineEventHandler(async (event) => {
  const { query } = getQuery(event);

  if (!query) {
    return { error: 'Query parameter is required' };
  }

  const apiUrl = `https://api.foys.io/tournament/public/api/v1/persons/search?searchString=${query}`;
  try {
    const response = await $fetch(apiUrl);
    return response;
  } catch (error) {
    return { error: 'Failed to fetch data from external API', details: error.message };
  }
});
