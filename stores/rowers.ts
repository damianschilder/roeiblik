import type { PersonResponse, SearchResponse } from "~/types/Timeteam";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useRowersStore = defineStore("rowers", () => {
  const loading = ref<boolean>(false);
  const error = ref<boolean>(false);
  const results = ref<Person[]>([]);
  const rower = ref<Object>({});

  async function searchRowers(query: string) {
    if (!loading.value) {
      loading.value = true;
      try {
        const response: SearchResponse = await $fetch('/api/proxy/search', {
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

  async function getRower(id, index) {
    loading.value = true;
  
    if (results.value && results.value[index]) {
      rower.value = results.value[index];
    }
  
    try {
      const response = await $fetch(`/api/proxy/person/${id}`, {
        method: "GET",
      });
  
      const { person, race_crew, entry, event, round } = response;
  
      if (!person || !race_crew || !entry || !event || !round) {
        throw new Error("Incomplete response data.");
      }
  
      const personDetails = Object.values(person || {})[0];
      if (!personDetails) {
        throw new Error("Person details not found.");
      }
  
      let allRaceCrewInfo = {};
      let roleCounts = { Rower: 0, Coach: 0, Cox: 0, Unknown: 0 };
      let totalWins = { Rower: 0, Coach: 0, Cox: 0 };
      const uniqueClubs = new Map();
  
      const roundTypePriority = ["FA", "FB", "FC", "FD", "FE", "FF", "FG", "HF", "KF", "E", "TT", "Unknown"];
  
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
  
          if (roundEntry.round_type_code !== "E") {
            roleCounts[role]++;
          }
  
          if (
            raceDetails.adjusted_position === 1 &&
            isFinalRound(roundEntry.round_type_code)
          ) {
            totalWins[role]++;
          }
  
          const club = entryData.club || { id: "unknown", name: "Unknown" };
          if (!uniqueClubs.has(club.id)) {
            uniqueClubs.set(club.id, club);
          }
  
          raceDetails.event_id = entryData.event_id || "Unknown";
          raceDetails.entry_name = entryData.name || "Unknown";
  
          const eventEntry = event?.[raceDetails.event_id];
          if (eventEntry) {
            raceDetails.event_code = eventEntry.code || "Unknown";
            raceDetails.event_remarks = eventEntry.remarks || "No remarks";
          }
  
          raceDetails.round_type_name = roundEntry.round_type_name || "Unknown";
          raceDetails.timetrial = roundEntry.timetrial || false;
          raceDetails.is_final = roundEntry.is_final || false;
          raceDetails.rules = roundEntry.rules || {};
          raceDetails.timing_layout = roundEntry.timing_layout || {};
        }
  
        allRaceCrewInfo[raceCrewId] = raceDetails;
      }
  
      allRaceCrewInfo = Object.entries(allRaceCrewInfo).reduce((acc, [key, value]) => {
        const eventId = value.event_id || "Unknown";
        const entryName = value.entry_name || "Unknown";
  
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
  
      const firstEntryDate = Object.values(allRaceCrewInfo)
        .flatMap(event => Object.values(event).flatMap(entry => entry))
        .map(race => new Date(race.date?.[0]))
        .filter(date => !isNaN(date.getTime()))
        .sort()[0]?.toISOString() || "Date not found";
  
      const lastEntryDate = Object.values(allRaceCrewInfo)
        .flatMap(event => Object.values(event).flatMap(entry => entry))
        .map(race => new Date(race.date?.[0]))
        .filter(date => !isNaN(date.getTime()))
        .sort()
        .reverse()[0]?.toISOString() || "Date not found";
  
      rower.value = {
        id: personDetails.id,
        displayname: personDetails.displayname,
        allRaceCrewInfo,
        roleCounts,
        totalWins,
        firstEntryDate,
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

  function getFirstRaceDate(eventData) {
    return Object.values(eventData)
      .flatMap(entry => entry)
      .map(race => race.date?.[0])
      .filter(date => date !== "Date not found")
      .sort()[0] || "Date not found";
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
    return "Unknown";
  }

  function isFinalRound(roundTypeCode: string): boolean {
    return roundTypeCode === "FA" || roundTypeCode === "2000m" || /^[0-9]/.test(roundTypeCode);
  }

  function getLocationAndDetailsByRaceCrewId(raceCrewId, data) {
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
  
    let location = getEventLocationByRoundId(roundId, data);
  
    if (location === "Location not found") {
      const raceId = raceCrewEntry.race_id;
      if (raceId) {
        location = getEventLocationByRaceId(raceId, data);
      }
    }
  
    const result = raceCrewEntry.adjusted_result || "Result not found";
    const adjustedPos = raceCrewEntry.adjusted_pos || "Position not found";
  
    const entryId = raceCrewEntry.entry_id;
    const entryData = entryId ? data.entry?.[entryId] : null;
  
    const club = entryData?.club || "Club not found";
    const combination = entryData?.combination || "Combination unknown";
    const entryName = entryData?.name || "Name not found";
  
    const rowers = entryData?.rowers
      ? entryData.rowers.map(rower => ({
          name: `${rower.firstname} ${rower.lastname}`,
          position: rower.position,
        }))
      : "Rowers not found";
  
    const coaches = entryData?.coaches
      ? entryData.coaches.map(coach => `${coach.firstname} ${coach.lastname}`)
      : "Coaches not found";
  
    const coxes = entryData?.coxes && Array.isArray(entryData.coxes)
      ? entryData.coxes.map(cox => cox && `${cox.firstname} ${cox.lastname}`)
      : "Coxes not found";
  
    const boatName =
      entryData?.boats && entryData.boats.length > 0
        ? entryData.boats[0].name || "Boat name not found"
        : "Boat name not found";
  
    const blades = entryData?.blades || "Blades not found";
  
    const eventData = entryData?.event_id ? data.event?.[entryData.event_id] : null;
    const date = eventData?.regatta_days
      ? eventData.regatta_days.map(day => day.day_date)
      : "Date not found";
    const fieldName = eventData?.name || "Field name not found";
    const roundTypeCode = roundEntry?.round_type_code || "Round type code not found";
  
    return {
      location,
      result,
      adjusted_position: adjustedPos,
      club,
      combination,
      entry_name: entryName, // Added entry name
      rowers,
      coaches,
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
