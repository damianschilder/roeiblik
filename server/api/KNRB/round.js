export default defineEventHandler(async (event) => {
  const tournamentId = queryString(event, 'tournamentId');
  const raceId = queryString(event, 'raceId');

  if (!validNumber(tournamentId) || !validNumber(raceId)) {
    return failure('Both tournamentId and raceId parameters are required');
  }

  try {
    const roundDetails = await upstream(`https://api.foys.io/tournament/public/api/v1/races?tournamentId=${tournamentId}&raceId=${raceId}`);
    return roundDetails[0];
  } catch {
    return failure('Failed to fetch data from external API');
  }
});
