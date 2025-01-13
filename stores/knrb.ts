import type { Person, PersonResult, SearchResponse } from "~/types/KNRB";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useKNRBStore = defineStore("KNRB", () => {
  const loading = ref<boolean>(false);
  const error = ref<boolean>(false);
  const results = ref<PersonResult[]>([]);
  const person = ref<Person | {}>({});
  const currentPage = ref<number>(1);

  async function search(query: string) {
    if (!loading.value) {
      loading.value = true;
      try {
        const response: SearchResponse = await $fetch('/api/KNRB/search', {
          method: "GET",
          params: { query },
        });
        results.value = response.items ? Object.values(response.items) : [];
        error.value = false;
      } catch (e) {
        error.value = true;
        console.error("Failed to search for persons:", e);
      } finally {
        loading.value = false;
      }
    }
  }
  
  async function getRower(id: string) {
    if (!loading.value) {
      loading.value = true;
      try {
        const fetchedPerson = await $fetch('/api/KNRB/person', {
          method: "GET",
          params: { id },
        });
        person.value = fetchedPerson;
        getRound(fetchedPerson.tournaments[0].races[0].tournamentId, fetchedPerson.tournaments[0].races[0].raceId);
        error.value = false;
      } catch (e) {
        error.value = true;
        console.error("Failed to fetch rower:", e);
      } finally {
        loading.value = false;
      }
    }
  }

  async function getRound(tournamentId: number, raceId: number) {
    loading.value = true;
    try {
      // Fetch the round data from the API
      const fetchedRound = await $fetch('/api/KNRB/round', {
        method: "GET",
        params: { tournamentId, raceId },
      });
      
      // console.log('Fetched Round:', fetchedRound);
  
      // Get tournaments from the person object
      const tournaments = (person.value as Person).tournaments;
  
      if (!tournaments || tournaments.length === 0) {
        console.warn('No tournaments found.');
        return;
      }
  
      let raceUpdated = false;
  
      // Traverse tournaments
      for (const tournament of tournaments) {
        // Check for a match at the top level (main races)
        const mainRace = tournament.races.find(race => race.raceId === raceId);
  
        if (mainRace) {
          // Update the main race
          Object.assign(mainRace, fetchedRound);
          // console.log('Main race updated:', mainRace);
          raceUpdated = true;
          break; // Exit early since the race is found and updated
        }
  
        // If no match is found in main races, check preliminaries
        for (const race of tournament.races) {
          if (race.preliminaries) {
            const preliminaryRace = race.preliminaries.find(prelim => prelim.raceId === raceId);
  
            if (preliminaryRace) {
              // Update the preliminary race
              Object.assign(preliminaryRace, fetchedRound);
              // console.log('Preliminary race updated:', preliminaryRace);
  
              // Update the parent race (main race) with fetched data if needed
              Object.assign(race, fetchedRound);
              // console.log('Parent race updated:', race);
  
              raceUpdated = true;
              break; // Exit inner loop
            }
          }
        }
  
        if (raceUpdated) break; // Exit outer loop if race is updated
      }
  
      if (!raceUpdated) {
        console.warn('No race or preliminary race found with the provided raceId:', raceId);
      }
  
      error.value = false; // Reset error state on success
    } catch (e) {
      error.value = true; // Set error state on failure
      console.error('Failed to get round:', e);
    } finally {
      loading.value = false; // Ensure loading state is reset
    }
  }
  
  
  
  

  async function getLimitedPerson(personId: string) {
      loading.value = true;
      try {
        // Fetch the limited person data
        const fetchedLimitedPerson = await $fetch('/api/KNRB/limitedPerson', {
          method: "GET",
          params: { personId },
        });
  
        // Locate the relevant person in the raceTeams
        const tournaments = (person.value as Person).tournaments;
        if (tournaments) {
          for (const tournament of tournaments) {
            for (const race of tournament.races) {
              // Check if raceTeams exists before accessing it
              if (race.raceTeams) {
                for (const raceTeam of race.raceTeams) {
                  for (const teamMember of raceTeam.teamVersion.teamMembers) {
                    if (teamMember.person.personId === personId) {
                      // Replace the "person" key with the fetched data
                      teamMember.person = fetchedLimitedPerson;
                      console.log(`Updated person ${personId} with limited data.`);
                      break;
                    }
                  }
                }
              }
            }
          }
        }
  
        error.value = false;
      } catch (e) {
        error.value = true;
        console.error("Failed to get limited person:", e);
      } finally {
        loading.value = false;
      }
  }
  
  
  return { loading, error, results, person, search, getRower, getRound, getLimitedPerson, currentPage };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKNRBStore, import.meta.hot));
}
