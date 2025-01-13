import { defineEventHandler, useQuery } from 'h3';

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);

  if (!id) {
    return { error: 'Id parameter is required' };
  }

  const apiUrl = `https://api.beta.regatta.time-team.nl/api/1/person/${id}`;

  try {
    const response = await $fetch(apiUrl);
    return response;
  } catch (error) {
    return { error: 'Failed to fetch data from external API', details: error.message };
  }
});
