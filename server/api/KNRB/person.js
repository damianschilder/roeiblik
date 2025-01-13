import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  const { id } = getQuery(event);

  if (!id) {
    return { error: 'Id parameter is required' };
  }

  const apiInfoUrl = `https://api.foys.io/tournament/public/api/v1/persons/${id}`;
  const apiRacesUrl = `https://api.foys.io/tournament/public/api/v1/races/person-overview-results/${id}`;

  try {
    // Fetch basic person info and race results
    const [infoResponse, racesResponse] = await Promise.all([
      $fetch(apiInfoUrl),
      $fetch(apiRacesUrl)
    ]);

    // Group raceResults by matchCode and structure them
    racesResponse.forEach(tournament => {
      if (tournament.raceResults && Array.isArray(tournament.raceResults)) {
        const groupedResults = {}; // Store races grouped by matchCode

        tournament.raceResults.forEach(race => {
          const matchCode = race.matchCode;

          if (!groupedResults[matchCode]) {
            groupedResults[matchCode] = {
              ...race, // Copy all details from the highest round
              preliminaries: [] // Add preliminaries as an array
            };
          }

          if (race.raceName && race.raceName.toLowerCase().includes('finale')) {
            // Assume "A-finale" or "B-finale" is the top race, overwrite main details
            groupedResults[matchCode] = {
              ...race,
              preliminaries: groupedResults[matchCode].preliminaries
            };
          } else {
            // Other rounds are preliminaries
            groupedResults[matchCode].preliminaries.push(race);
          }
        });

        // Replace raceResults with grouped structure
        tournament.races = Object.values(groupedResults);
        delete tournament.raceResults; // Remove the old key
      }
    });

    return {
      ...infoResponse,
      tournaments: racesResponse
    };
  } catch (error) {
    return { error: 'Failed to fetch data from external API', details: error.message };
  }
});
