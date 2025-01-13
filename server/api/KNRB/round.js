import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  const { tournamentId, raceId } = getQuery(event);

  if (!tournamentId || !raceId) {
    return { error: 'Both tournamentId and raceId parameters are required' };
  }

  const apiUrl = `https://api.foys.io/tournament/public/api/v1/races?tournamentId=${tournamentId}&raceId=${raceId}`;

  try {
    // Fetch specific round details
    const roundDetails = await $fetch(apiUrl);

    return roundDetails[0];
  } catch (error) {
    return { error: 'Failed to fetch data from external API', details: error.message };
  }
});
