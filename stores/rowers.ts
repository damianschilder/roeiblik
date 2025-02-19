import type { PersonResponse, SearchResponse } from "~/types/Timeteam";
import { defineStore, acceptHMRUpdate } from "pinia";
import { ref } from "vue";

// Helper function to format a date string in ISO format (YYYY-MM-DD).
// If the date string is not in a format that can be parsed, return it as-is.
function formatDateISO(dateStr: string): string {
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    // The date string could not be parsed, so return it unmodified.
    return dateStr;
  }
  return dateObj.toISOString().slice(0, 10);
}

export const useRowersStore = defineStore("rowers", () => {
  const loading = ref<boolean>(false);
  const error = ref<boolean>(false);
  const results = ref<Person[]>([]);
  const rower = ref<Object>({});
  const storeCurrentPage = ref<number>(1);

  async function searchRowers(query: string) {
    if (!loading.value) {
      loading.value = true;
      try {
        const response: SearchResponse = await $fetch('/api/Time-Team/search', {
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
  }

  async function getRower(id: string, index: number) {
    loading.value = true;

    if (results.value && results.value[index]) {
      rower.value = results.value[index];
    }

    try {
      const response = await $fetch(`/api/Time-Team/person`, {
        method: "GET",
        params: { id }
      });

      const { person, race_crew, entry, event, round, race } = response;

      if (!person || !race_crew || !entry || !event || !round) {
        throw new Error("Incomplete response data.");
      }

      const personDetails = Object.values(person || {})[0];
      if (!personDetails) {
        throw new Error("Person details not found.");
      }

      let allRaceCrewInfo = {};
      let totalWins = { Rower: 0, Coach: 0, Cox: 0 };
      const uniqueClubs = new Map();

      const roundTypePriority = ["FA", "FB", "FC", "FD", "FE", "FF", "FG", "HF", "KF", "R", "E", "H", "TT", undefined];

      for (const raceCrewId in race_crew) {
        const raceCrewEntry = race_crew[raceCrewId];
        const roundId = raceCrewEntry.round_id;
        const roundEntry = round?.[roundId];

        if (!roundId || !roundEntry) {
          console.warn("Skipping race crew due to missing round:", raceCrewId);
          continue;
        }

        const raceDetails = getLocationAndDetailsByRaceCrewId(raceCrewId, response);
        const entryId = raceCrewEntry.entry_id;
        const entryData = entryId ? response.entry?.[entryId] : null;

        if (entryData) {
          const role = determineRole(personDetails, entryData);
          raceDetails.role = role;

          if (
            raceDetails.adjusted_position === 1 &&
            isFinalRound(roundEntry.round_type_code)
          ) {
            totalWins[role]++;
          }

          const club = entryData.club || undefined;
          if (club && !uniqueClubs.has(club.id)) {
            uniqueClubs.set(club.id, club);
          }

          raceDetails.event_id = entryData.event_id || undefined;
          raceDetails.entry_name = entryData.name || undefined;

          const eventEntry = event?.[raceDetails.event_id];
          if (eventEntry) {
            raceDetails.event_code = eventEntry.code || undefined;
            raceDetails.event_remarks = eventEntry.remarks || undefined;
          }

          raceDetails.round_type_name = roundEntry.round_type_name || undefined;
          raceDetails.timetrial = roundEntry.timetrial || false;
          raceDetails.is_final = roundEntry.is_final || false;
          raceDetails.rules = roundEntry.rules || undefined;
          raceDetails.timing_layout = roundEntry.timing_layout || undefined;
        }

        allRaceCrewInfo[raceCrewId] = raceDetails;
      }

      allRaceCrewInfo = Object.entries(allRaceCrewInfo).reduce((acc, [key, value]) => {
        const eventId = value.event_id || undefined;
        const entryName = value.entry_name || undefined;

        if (!acc[eventId]) {
          acc[eventId] = {};
        }
        if (!acc[eventId][entryName]) {
          acc[eventId][entryName] = [];
        }

        acc[eventId][entryName].push({ id: key, ...value });
        return acc;
      }, {});

      for (const eventId in allRaceCrewInfo) {
        for (const entryName in allRaceCrewInfo[eventId]) {
          allRaceCrewInfo[eventId][entryName].sort((a, b) => {
            const roundA = roundTypePriority.indexOf(a.round_type_code) !== -1
              ? roundTypePriority.indexOf(a.round_type_code)
              : roundTypePriority.length;
            const roundB = roundTypePriority.indexOf(b.round_type_code) !== -1
              ? roundTypePriority.indexOf(b.round_type_code)
              : roundTypePriority.length;

            return roundA - roundB;
          });
        }
      }

      allRaceCrewInfo = Object.keys(allRaceCrewInfo)
        .sort((a, b) => {
          const firstRaceDateA = getFirstRaceDate(allRaceCrewInfo[a]);
          const firstRaceDateB = getFirstRaceDate(allRaceCrewInfo[b]);
          return new Date(firstRaceDateB).getTime() - new Date(firstRaceDateA).getTime();
        })
        .reduce((acc, key) => {
          acc[key] = allRaceCrewInfo[key];
          return acc;
        }, {});

      // Instead of just storing the first entry date, we now create an object containing the first race.
      const racesArray = Object.values(allRaceCrewInfo)
        .flatMap(event => Object.values(event).flatMap(entry => entry))
        .filter(race => race.date)
        .map(race => ({ ...race, date: formatDateISO(race.date) }));

      // Sort races by date in ascending order
      racesArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstRace = racesArray[0] || undefined;

      // Optionally, keep the last entry date if needed.
      const lastEntryDate = racesArray.length ? racesArray[racesArray.length - 1].date : undefined;

      rower.value = {
        id: personDetails.id,
        displayname: personDetails.displayname,
        allRaceCrewInfo,
        roleCounts: calculateRoleCounts(allRaceCrewInfo),
        totalWins,
        firstRace,  // Changed from firstEntryDate to firstRace (an object)
        lastEntryDate,
        unique_clubs: Array.from(uniqueClubs.values()),
      };
      error.value = false;
    } catch (e) {
      error.value = true;
      console.error("Failed to fetch rower:", e);
    } finally {
      loading.value = false;
    }
  }

  function calculateRoleCounts(allRaceCrewInfo) {
    let roleCounts = { Rower: 0, Coach: 0, Cox: 0, Undefined: 0 };
    for (const eventId in allRaceCrewInfo) {
      for (const entryName in allRaceCrewInfo[eventId]) {
        let hasRower = false;
        let hasCoach = false;
        let hasCox = false;
        let hasUndefined = false;

        for (const race of allRaceCrewInfo[eventId][entryName]) {
          switch (race.role) {
            case "Rower":
              hasRower = true;
              break;
            case "Coach":
              hasCoach = true;
              break;
            case "Cox":
              hasCox = true;
              break;
            case "Undefined":
              hasUndefined = true;
              break;
          }
        }

        if (hasRower) roleCounts.Rower++;
        if (hasCoach) roleCounts.Coach++;
        if (hasCox) roleCounts.Cox++;
        if (hasUndefined) roleCounts.Undefined++;
      }
    }
    return roleCounts;
  }

  function getLocationAndDetailsByRaceCrewId(raceCrewId, data) {
    const raceCrewEntry = data.race_crew?.[raceCrewId];
    if (!raceCrewEntry) {
      return undefined;
    }

    const roundId = raceCrewEntry.round_id;
    if (!roundId) {
      return undefined;
    }

    const roundEntry = data.round?.[roundId];
    if (!roundEntry) {
      return undefined;
    }

    let location = getEventLocationByRoundId(roundId, data);
    if (!location) {
      const raceId = raceCrewEntry.race_id;
      if (raceId) {
        location = getEventLocationByRaceId(raceId, data);
      }
    }

    const result = raceCrewEntry.adjusted_result || undefined;
    const adjustedPos = raceCrewEntry.adjusted_pos || undefined;

    const entryId = raceCrewEntry.entry_id;
    const entryData = entryId ? data.entry?.[entryId] : null;

    const club = entryData?.club || undefined;
    const combination = entryData?.combination || undefined;
    const entryName = entryData?.name || undefined;

    const rowers = entryData?.rowers
      ? entryData.rowers.map(rower => ({
          name: `${rower.firstname} ${rower.lastname}`,
          position: rower.position,
        }))
      : undefined;

    const coaches = entryData?.coaches
      ? entryData.coaches.map(coach => `${coach.firstname} ${coach.lastname}`)
      : undefined;

    const coxes =
      entryData?.coxes && Array.isArray(entryData.coxes)
        ? entryData.coxes.map(cox => cox && `${cox.firstname} ${cox.lastname}`)
        : undefined;

    const boatName =
      entryData?.boats && entryData.boats.length > 0
        ? entryData.boats[0].name || undefined
        : undefined;

    const blades = entryData?.blades || undefined;

    const eventData = entryData?.event_id ? data.event?.[entryData.event_id] : null;
    let date;
    if (raceCrewEntry.race_id) {
      const raceObj = data.race?.[raceCrewEntry.race_id];
      if (raceObj) {
        if (raceObj.regatta_day && raceObj.regatta_day.day_date) {
          date = formatDateISO(raceObj.regatta_day.day_date);
        } else if (raceObj.start_datetime) {
          const rawDate = raceObj.start_datetime.split(" ")[0];
          date = formatDateISO(rawDate);
        }
      }
    }
    if (!date && eventData?.regatta_days && eventData.regatta_days.length > 0) {
      date = formatDateISO(eventData.regatta_days[0].day_date);
    }

    const fieldName = eventData?.name || undefined;
    const roundTypeCode = roundEntry?.round_type_code || undefined;

    return {
      location,
      result,
      adjusted_position: adjustedPos,
      club,
      combination,
      entry_name: entryName,
      rowers,
      coaches,
      coxes,
      boat_name: boatName,
      blades,
      date, // now an ISO string in the format "YYYY-MM-DD"
      field_name: fieldName,
      round_type_code: roundTypeCode,
    };
  }

  function getEventLocationByRoundId(roundId: string, data: any): string | undefined {
    const roundEntry = data.round?.[roundId];
    if (!roundEntry) {
      return undefined;
    }

    const eventId = roundEntry.event_id;
    if (!eventId) {
      return undefined;
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
    return undefined;
  }

  function getEventLocationByRaceId(raceId: string, data: any): string | undefined {
    const raceEntry = data.race?.[raceId];
    if (raceEntry) {
      const venueName = raceEntry.venue_layout?.name;
      if (venueName) {
        return venueName;
      }
    }
    return undefined;
  }

  function getFirstRaceDate(eventData) {
    return Object.values(eventData)
      .flatMap(entry => entry)
      .map(race => race.date)
      .filter(date => date)
      .sort()[0] || undefined;
  }

  function determineRole(personDetails: any, entryData: any): string {
    const displayName = personDetails.displayname;
    if (Array.isArray(entryData.rowers) && entryData.rowers.some((r: any) => `${r.firstname} ${r.lastname}` === displayName)) {
      return "Rower";
    }
    if (Array.isArray(entryData.coaches) && entryData.coaches.some((c: any) => `${c.firstname} ${c.lastname}` === displayName)) {
      return "Coach";
    }
    if (entryData?.coxes && Array.isArray(entryData.coxes) && entryData.coxes.some((c: any) => c && `${c.firstname} ${c.lastname}` === displayName)) {
      return "Cox";
    }
    return "Undefined";
  }

  function isFinalRound(roundTypeCode: string): boolean {
    return roundTypeCode === "FA" || roundTypeCode === "2000m" || /^[0-9]/.test(roundTypeCode);
  }

  return { loading, error, results, searchRowers, getRower, rower, storeCurrentPage };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRowersStore, import.meta.hot));
}
