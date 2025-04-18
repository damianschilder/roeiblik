<template lang="pug">
  .component-wrapper
    .element-wrapper
      .element-body
        .error
        .overview
          .filters(v-if="hasAnyWins")
            UiWon(v-model="onlyWon" label="Alleen gewonnen hoogst behaalde races tonen")
  
          .header
            span {{ headerText }}
          .tournaments(v-if="displayTournaments.length > 0")
            KNRBPersoonTournamentsTournament(
              v-for="tournament in displayTournaments"
              :tournament="tournament"
              :key="tournament.tournamentId"
            )
          .no-results(v-else)
            p {{ noResultsText }}
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import { useKNRBStore } from '~/stores/knrb'; // Adjust path if needed
  // Import the types if not globally available
  import type { KNRBProcessedTournament, KNRBProcessedRace } from '~/types/knrb'; // Adjust path if needed
  // Import the child component
  // Import your custom checkbox component if you have one
  // import UiWon from '~/components/ui/UiWon.vue'; // Example path
  
  
  const KNRBStore = useKNRBStore();
  
  // State for the checkbox
  const onlyWon = ref(false); // Initialize checkbox as unchecked
  
  // Check if there are any wins across all roles (used to conditionally show the filter)
  const hasAnyWins = computed(() => {
      const wins = KNRBStore.person?.totalWins;
      return wins && (wins.Rower > 0 || wins.Cox > 0 || wins.Coach > 0);
  });
  
  
  // --- Helper to determine the highest attained race for a specific match/event ---
  // (Same helper function as before)
  const getHighestAttainedRace = (racesForEvent: KNRBProcessedRace[]): KNRBProcessedRace | null => {
    if (!racesForEvent || racesForEvent.length === 0) return null;
    if (racesForEvent.length === 1) return racesForEvent[0];
  
    const racePriority = [
      'a-finale', 'fa', 'finale', 'final', 'b-finale', 'fb', 'c-finale', 'fc', 'd-finale', 'fd',
      'halve finale', 'kwart finale', 'herkansing', 'voorwedstrijd', 'time-trial',
    ];
  
    racesForEvent.sort((a, b) => {
      const nameA = a.raceName?.toLowerCase() ?? '';
      const nameB = b.raceName?.toLowerCase() ?? '';
      const prioA = racePriority.indexOf(nameA);
      const prioB = racePriority.indexOf(nameB);
      const effectivePrioA = prioA === -1 ? racePriority.length : prioA;
      const effectivePrioB = prioB === -1 ? racePriority.length : prioB;
      return effectivePrioA - effectivePrioB;
    });
    return racesForEvent[0];
  };
  
  // --- Computed property to conditionally filter tournaments AND their races ---
  const displayTournaments = computed((): KNRBProcessedTournament[] => {
    const allTournaments = KNRBStore.person?.tournaments ?? [];
  
    // If the checkbox is NOT checked, return all tournaments as they are
    if (!onlyWon.value) {
      return allTournaments;
    }
  
    // If the checkbox IS checked, apply the filtering logic
    const processedTournaments = allTournaments.map(tournament => {
      const racesByEvent = new Map<string | null, KNRBProcessedRace[]>();
      tournament.races.forEach(mainRace => {
        const allRacesForEvent = [mainRace, ...(mainRace.preliminaries || [])];
        const key = mainRace.matchCode;
        if (!racesByEvent.has(key)) {
          racesByEvent.set(key, []);
        }
        const currentEventRaces = racesByEvent.get(key)!;
        allRacesForEvent.forEach(r => {
          if (!currentEventRaces.some(existing => existing.raceId === r.raceId)) {
            currentEventRaces.push(r);
          }
        });
      });
  
      const wonHighestRaces: KNRBProcessedRace[] = [];
      racesByEvent.forEach((eventRaces) => {
        const highestRace = getHighestAttainedRace(eventRaces);
        if (highestRace && highestRace.position === 1) {
          wonHighestRaces.push(highestRace);
        }
      });
  
      if (wonHighestRaces.length > 0) {
        return { ...tournament, races: wonHighestRaces };
      } else {
        return null;
      }
    });
  
    return processedTournaments.filter(t => t !== null) as KNRBProcessedTournament[];
  });
  
  // --- Dynamic text for header and no-results message ---
  const headerText = computed(() => {
      const count = displayTournaments.value.length;
      if (onlyWon.value) {
          return `${count} ${count === 1 ? 'wedstrijd met overwinningen' : 'wedstrijden met overwinningen'}`;
      } else {
          const totalCount = KNRBStore.person?.tournaments?.length ?? 0;
           return `${totalCount} ${totalCount === 1 ? 'wedstrijd' : 'wedstrijden'}`;
      }
  });
  
  const noResultsText = computed(() => {
      if (onlyWon.value) {
          return 'Geen wedstrijden gevonden met gewonnen hoogst behaalde races.';
      } else {
          // This case should ideally not happen if the store fetch worked, but good to have
          return 'Geen wedstrijden gevonden.';
      }
  });
  
  
  </script>
  
  <style lang="scss" scoped>
  // Your existing styles - ensure $black50 and @include mobile are defined/imported
  $black50: rgba(0, 0, 0, 0.5); // Example definition
  
  @mixin mobile { // Example mixin definition
    @media (max-width: 768px) {
      @content;
    }
  }
  
  .overview {
    padding-top: 2rem;
  }
  
  .component-wrapper {
    @include mobile {
      padding: 0 0.5rem;
    }
  }
  
  .filters {
    display: flex;
    margin-bottom: 1rem; // Add some space below the filter
    // Style your UiWon or input checkbox here
    // Example for a potential UiWon component:
    :deep(label) { // Example targeting label within UiWon
        cursor: pointer;
    }
  }
  
  .tournaments {
    display: flex;
    flex-direction: column;
    row-gap: 2rem;
    margin-top: 0.5rem; // Reduced margin slightly
  }
  
  .header {
    display: flex;
    // margin-top: 1rem; // Removed margin top from header, handled by filter spacing
    justify-content: space-between;
    color: $black50;
    font-size: 0.9rem;
    font-weight: bold;
    padding: 0 0.5rem;
    padding-bottom: 0.1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .no-results {
      padding: 1rem 0.5rem;
      color: $black50;
      font-style: italic;
  }
  </style>