<template lang="pug">
  .component-wrapper
    .element-wrapper
      .element-body
        .error
        .overview
          .filters
            //- UiWon( v-model="onlyWon" v-if="totalWins > 0")
            UiWon( v-model="onlyWon")
          .header
            span {{ Object.keys(tournaments).length }} {{ Object.keys(tournaments).length === 1 ? 'wedstrijd' : 'wedstrijden' }}
          .tournaments
            KNRBPersoonTournamentsTournament(
              v-if="filteredTournaments.length" 
              v-for="tournament in filteredTournaments" 
              :tournament="tournament" 
              :onlyWon="onlyWon" 
              :key="tournament.tournamentId"
            )
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { Person } from '~/types/KNRB'
  
  const props = defineProps<{
    tournaments: Person['tournaments']
  }>()
  
  // Reactive flag to filter on only won tournaments.
  const onlyWon = ref(false)
  
  // A tournament is considered won if it has at least one race where
  // raceName equals 'A-finale' and position equals 1.
  const filteredTournaments = computed(() => {
    if (!onlyWon.value) {
      return props.tournaments
    }
    return props.tournaments.filter(tournament => {
      return tournament.races && tournament.races.some(race => race.raceName === 'A-finale' && race.position === 1)
    })
  })
  </script>
  
  <style lang="scss" scoped>
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
  }
  
  .tournaments {
    display: flex;
    flex-direction: column;
    row-gap: 2rem;
  }

  .header {
    display: flex;
    margin-top: 1rem;
    justify-content: space-between;
    color: $black50;
    font-size: 0.9rem;
    font-weight: bold;
    padding-bottom: 0.1rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  </style>
  