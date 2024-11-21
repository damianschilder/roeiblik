import type { PersonResponse, SearchResponse } from "~/types/Timeteam";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useRowersStore = defineStore("rowers", () => {
  const loading = ref<boolean>(true);
  const error = ref<boolean>(false);
  const results = ref<Person[]>([]);
  const rower = ref<Object>({});

  async function searchRowers(query: string) {
    loading.value = true;
    try {
      const response: SearchResponse = await $fetch("/api/search", {
        method: "GET",
        params: { query },
      });
      results.value = response.person ? Object.values(response.person) : [];
      error.value = false;
    } catch (e) {
      error.value = true;
      console.error("Failed to fetch rowers:", e);
    } finally {
      loading.value = false;
    }
  }

  async function getRower(id: string, index: number) {
    loading.value = true;

    // Use the cached result if available
    if (results.value && results.value[index]) {
      rower.value = results.value[index];
    }

    try {
      const response: PersonResponse = await $fetch("/api/person/${id}", {
        method: "GET",
      });
      const { person, race_crew, entry, event, round } = response;

      let allRaceCrewInfo: { [key: string]: any } = {};
      let roleCounts = { Rower: 0, Coach: 0, Cox: 0, Unknown: 0 };
      let totalWins = { Rower: 0, Coach: 0, Cox: 0 };

      // Loop through all race crew entries and collect details
      for (const raceCrewId in race_crew) {
        const raceCrewEntry = race_crew[raceCrewId];
        const roundId = raceCrewEntry.round_id;
        const roundEntry = round?.[roundId];

        if (roundEntry) {
          allRaceCrewInfo[raceCrewId] = getLocationAndDetailsByRaceCrewId(
            raceCrewId,
            response
          );

          // Determine the role of the person in the race
          const personDetails = Object.values(person)[0];
          const entryId = raceCrewEntry.entry_id;
          const entryData = entryId ? response.entry?.[entryId] : null;

          if (entryData) {
            const role = determineRole(personDetails, entryData);
            roleCounts[role]++;
            allRaceCrewInfo[raceCrewId].role = role;

            // Check if the race was won
            if (
              allRaceCrewInfo[raceCrewId].adjusted_position === 1 &&
              isFinalRound(roundEntry.round_type_code)
            ) {
              totalWins[role]++;
            }
          } else {
            allRaceCrewInfo[raceCrewId].role = "Unknown";
            roleCounts.Unknown++;
          }
        }
      }

      // Sort allRaceCrewInfo by date in reverse chronological order (most recent first)
      allRaceCrewInfo = Object.entries(allRaceCrewInfo)
        .sort(([, a], [, b]) => {
          const dateA = new Date(a.date[0]);
          const dateB = new Date(b.date[0]);
          return dateB.getTime() - dateA.getTime();
        })
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      // Extract the date of the first and last entry
      const dates = Object.values(allRaceCrewInfo).map((info: any) => new Date(info.date[0]));
      const firstEntryDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : "Date not found";
      const lastEntryDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : "Date not found";

      // Prepare consolidated object
      const personDetails = Object.values(person)[0];
      rower.value = {
        id: personDetails.id,
        displayname: personDetails.displayname,
        allRaceCrewInfo,
        roleCounts,
        totalWins,
        firstEntryDate,
        lastEntryDate,
      };
      error.value = false;
    } catch (e) {
      error.value = true;
      console.error("Failed to fetch rower:", e);
    } finally {
      loading.value = false;
    }
  }

  function determineRole(personDetails: any, entryData: any): string {
    const displayName = personDetails.displayname;
    if (entryData.rowers.some((r: any) => `${r.firstname} ${r.lastname}` === displayName)) {
      return "Rower";
    }
    if (entryData.coaches.some((c: any) => `${c.firstname} ${c.lastname}` === displayName)) {
      return "Coach";
    }
    if (entryData.coxes.some((c: any) => `${c.firstname} ${c.lastname}` === displayName)) {
      return "Cox";
    }
    return "Unknown";
  }

  function isFinalRound(roundTypeCode: string): boolean {
    return roundTypeCode === "FA" || roundTypeCode === "TT" || /^[0-9]/.test(roundTypeCode);
  }

  function getLocationAndDetailsByRaceCrewId(raceCrewId: string, data: any): any {
    // Find the race crew related to the given race crew ID
    const raceCrewEntry = data.race_crew?.[raceCrewId];
    if (!raceCrewEntry) {
      return "Race crew not found for given race crew ID";
    }

    const roundId = raceCrewEntry.round_id;
    if (!roundId) {
      return "Round ID not found for given race crew ID";
    }

    const roundEntry = data.round?.[roundId];
    if (!roundEntry) {
      return "Round not found for given round ID";
    }

    // Use the round ID to find the event location
    let location = getEventLocationByRoundId(roundId, data);

    // If location is still not found, use race_id to get the venue_layout
    if (location === "Location not found") {
      const raceId = raceCrewEntry.race_id;
      if (raceId) {
        location = getEventLocationByRaceId(raceId, data);
      }
    }

    // Get the result and adjusted position from the race crew entry
    const result = raceCrewEntry.adjusted_result || "Result not found";
    const adjustedPos = raceCrewEntry.adjusted_pos || "Position not found";

    // Find the entry related to this race crew ID
    const entryId = raceCrewEntry.entry_id;
    const entryData = entryId ? data.entry?.[entryId] : null;

    // Get the club information from the race crew entry
    const club = entryData?.club || "Club not found";
    const combination = entryData?.combination || "Combination unknown";

    const rowers = entryData?.rowers
      ? entryData.rowers.map((rower: any) => ({
          name: `${rower.firstname} ${rower.lastname}`,
          position: rower.position,
        }))
      : "Rowers not found";

    const coaches = entryData?.coaches
      ? entryData.coaches.map((coach: any) => `${coach.firstname} ${coach.lastname}`)
      : "Coaches not found";

    const coxes = entryData?.coxes
      ? entryData.coxes.map((cox: any) => `${cox.firstname} ${cox.lastname}`)
      : "Coxes not found";

    const boatName =
      entryData?.boats && entryData.boats.length > 0
        ? entryData.boats[0].name || "Boat name not found"
        : "Boat name not found";

    const blades = entryData?.blades || "Blades not found";

    // Use the event data to get date, field name, and round type code
    const eventData = entryData?.event_id ? data.event?.[entryData.event_id] : null;
    const date = eventData?.regatta_days
      ? eventData.regatta_days.map((day: any) => day.day_date)
      : "Date not found";
    const fieldName = eventData?.name || "Field name not found";
    const roundTypeCode = roundEntry?.round_type_code || "Round type code not found";

    return {
      location,
      result,
      adjusted_position: adjustedPos,
      club,
      rowers,
      coaches,
      combination,
      coxes,
      boat_name: boatName,
      blades,
      date,
      field_name: fieldName,
      round_type_code: roundTypeCode,
    };
  }

  function getEventLocationByRoundId(roundId: string, data: any): string {
    const roundEntry = data.round?.[roundId];
    if (!roundEntry) {
      return "Round not found for given round ID";
    }

    const eventId = roundEntry.event_id;
    if (!eventId) {
      return "Event not found for given round ID";
    }

    for (const raceId in data.race) {
      const race = data.race[raceId];
      if (race.round_id === roundId) {
        const venueName = race.venue_layout?.name;
        if (venueName) {
          return venueName;
        }
      }
    }
    return "Location not found";
  }

  function getEventLocationByRaceId(raceId: string, data: any): string {
    const raceEntry = data.race?.[raceId];
    if (raceEntry) {
      const venueName = raceEntry.venue_layout?.name;
      if (venueName) {
        return venueName;
      }
    }
    return "Location not found";
  }

  return { loading, error, results, searchRowers, getRower, rower };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRowersStore, import.meta.hot));
}
