import type { Person, PersonResult, SearchResponse } from "~/types/KNRB";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useKNRBStore = defineStore("KNRB", () => {
  const loading = ref<boolean>(false);
  const error = ref<boolean>(false);
  const results = ref<PersonResult[]>([]);
  const person = ref<Person | {}>({});
  const currentPage = ref<number>(1);
  const calledLimitedPersons = ref<object[]>([]);

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
        // Compute statistics based on tournaments and races
        computePersonStats();
        // Automatically get the round for the first race of the first tournament, if available
        if (
          fetchedPerson.tournaments &&
          fetchedPerson.tournaments.length > 0 &&
          fetchedPerson.tournaments[0].races &&
          fetchedPerson.tournaments[0].races.length > 0
        ) {
          getRound(
            fetchedPerson.tournaments[0].races[0].tournamentId,
            fetchedPerson.tournaments[0].races[0].raceId
          );
        }
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
      
      // Get tournaments from the person object
      const tournaments = (person.value as Person).tournaments;
  
      if (!tournaments || tournaments.length === 0) {
        console.warn('No tournaments found.');
        return;
      }
  
      let raceUpdated = false;
  
      // Traverse tournaments
      for (const tournament of tournaments) {
        // Check for a match at the top level (final races)
        const mainRace = tournament.races.find(race => race.raceId === raceId);
  
        if (mainRace) {
          Object.assign(mainRace, fetchedRound);
          raceUpdated = true;
          break; // Exit early since the race is found and updated
        }
  
        // If no match is found in main races, check preliminaries
        for (const race of tournament.races) {
          if (race.preliminaries) {
            const preliminaryRace = race.preliminaries.find(prelim => prelim.raceId === raceId);
  
            if (preliminaryRace) {
              // Update only the preliminary race with the fetched round data
              Object.assign(preliminaryRace, fetchedRound);
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
  
      // Recompute statistics after race data update
      computePersonStats();
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
        outerLoop:
        for (const tournament of tournaments) {
          for (const race of tournament.races) {
            if (race.raceTeams) {
              for (const raceTeam of race.raceTeams) {
                for (const teamMember of raceTeam.teamVersion.teamMembers) {
                  if (teamMember.person.personId === personId) {
                    teamMember.person = fetchedLimitedPerson;
                    console.log(`Updated person ${personId} with limited data.`);
                    break outerLoop;
                  }
                }
              }
            }
          }
        }
      }
      // Recompute statistics after updating limited person data
      computePersonStats();
      error.value = false;
    } catch (e) {
      error.value = true;
      console.error("Failed to get limited person:", e);
    } finally {
      loading.value = false;
    }
  }
  
  // Computes statistics for the person:
  // - roleCounts: number of races participated in for each role
  // - totalWins: number of races won for each role (win = raceName is "A-finale" and position is 1)
  //
  // This function now derives the role from boolean flags:
  //   if member.isCoach is true, role = "Coach"
  //   else if member.isCox is true, role = "Cox"
  //   else role defaults to "Rower"
  function computePersonStats() {
    const roles: string[] = ["Rower", "Cox", "Coach"];
    const roleCounts: Record<string, number> = { Rower: 0, Cox: 0, Coach: 0 };
    const totalWins: Record<string, number> = { Rower: 0, Cox: 0, Coach: 0 };
  
    const currentPerson = person.value as Person;
    if (!currentPerson || !currentPerson.tournaments) return;
  
    for (const tournament of currentPerson.tournaments) {
      if (!tournament.races) continue;
      for (const race of tournament.races) {
        // Process main race participation
        if (race.raceTeams) {
          for (const team of race.raceTeams) {
            if (team.teamVersion && team.teamVersion.teamMembers) {
              for (const member of team.teamVersion.teamMembers) {
                if (member.person && member.person.personId === currentPerson.personId) {
                  // Derive the role from boolean flags
                  let role = "Rower";
                  if (member.isCoach) {
                    role = "Coach";
                  } else if (member.isCox) {
                    role = "Cox";
                  }
                  roleCounts[role] += 1;
                  if (race.raceName === "A-finale" && race.position === 1) {
                    totalWins[role] += 1;
                  }
                }
              }
            }
          }
        }
        // Process participation in preliminary races, if any
        if (race.preliminaries) {
          for (const preliminaryRace of race.preliminaries) {
            if (preliminaryRace.raceTeams) {
              for (const team of preliminaryRace.raceTeams) {
                if (team.teamVersion && team.teamVersion.teamMembers) {
                  for (const member of team.teamVersion.teamMembers) {
                    if (member.person && member.person.personId === currentPerson.personId) {
                      // Derive the role from boolean flags
                      let role = "Rower";
                      if (member.isCoach) {
                        role = "Coach";
                      } else if (member.isCox) {
                        role = "Cox";
                      }
                      roleCounts[role] += 1;
                      if (preliminaryRace.raceName === "A-finale" && preliminaryRace.position === 1) {
                        totalWins[role] += 1;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  
    (currentPerson as any).roleCounts = roleCounts;
    (currentPerson as any).totalWins = totalWins;
  }
  
  return { loading, error, results, person, search, getRower, getRound, getLimitedPerson, currentPage, calledLimitedPersons };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useKNRBStore, import.meta.hot));
}
